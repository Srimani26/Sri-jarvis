/**
 * J.A.R.V.I.S. MARK-V Autonomous Browser Engine
 * Real browser automation engine with DOM node indexing, interactive element actions,
 * prompt injection defense, and kernel event telemetry.
 */

import { BrowserActionRequest, BrowserActionResult, BrowserPageSnapshot, InteractiveElement } from './types';
import { SecurityShield } from './SecurityShield';
import { TaskStore } from '../kernel/TaskStore';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import puppeteer, { Browser, Page } from 'puppeteer-core';

export class BrowserEngine {
  private currentUrl = 'about:blank';
  private currentTitle = 'Blank Page';
  private currentHtml = '';
  private interactiveElements: InteractiveElement[] = [];
  private activeBrowser: Browser | null = null;
  private activePage: Page | null = null;

  /**
   * Locate system Chrome or Edge binary on host machine
   */
  public static getSystemBrowserBinary(): string | null {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.CHROME_BIN,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    for (const c of candidates) {
      if (c && existsSync(c)) return c;
    }
    return null;
  }

  /**
   * Detect real browser runtime (Playwright / Puppeteer Chrome) vs Headless DOM Emulator
   */
  public static detectBrowserRuntime(): {
    hasPlaywright: boolean;
    hasPuppeteer: boolean;
    runtimeMode: 'PLAYWRIGHT_CHROMIUM' | 'PUPPETEER_CHROME' | 'HEADLESS_DOM_EMULATOR';
    binaryPath?: string | null;
    capabilityWarning?: string;
  } {
    const binaryPath = this.getSystemBrowserBinary();
    const hasPuppeteer = true;
    let hasPlaywright = false;
    try {
      require.resolve('playwright');
      hasPlaywright = true;
    } catch {
      hasPlaywright = false;
    }

    const runtimeMode = binaryPath ? 'PUPPETEER_CHROME' : (hasPlaywright ? 'PLAYWRIGHT_CHROMIUM' : 'HEADLESS_DOM_EMULATOR');
    const capabilityWarning = runtimeMode === 'HEADLESS_DOM_EMULATOR'
      ? 'BROWSER_RUNTIME_UNAVAILABLE: Operating in high-speed sandboxed DOM/HTTP emulator mode (No Chromium binary)'
      : undefined;

    return { hasPlaywright, hasPuppeteer, runtimeMode, binaryPath, capabilityWarning };
  }

  /**
   * Parse HTML string into structured interactive elements
   */
  private parseInteractiveElements(html: string): InteractiveElement[] {
    const elements: InteractiveElement[] = [];
    let idx = 0;

    // 1. Inputs
    const inputRegex = /<input\b([^>]*)>/gi;
    let match: RegExpExecArray | null;
    while ((match = inputRegex.exec(html)) !== null) {
      idx++;
      const attrs = match[1];
      const type = (attrs.match(/type=["']([^"']*)["']/i) || [])[1] || 'text';
      const id = (attrs.match(/id=["']([^"']*)["']/i) || [])[1] || `input_${idx}`;
      const name = (attrs.match(/name=["']([^"']*)["']/i) || [])[1];
      const placeholder = (attrs.match(/placeholder=["']([^"']*)["']/i) || [])[1];
      const value = (attrs.match(/value=["']([^"']*)["']/i) || [])[1];

      elements.push({
        id,
        tag: 'input',
        type,
        name,
        placeholder,
        value,
        selector: id ? `#${id}` : name ? `input[name="${name}"]` : `input:nth-of-type(${idx})`,
      });
    }

    // 2. Buttons
    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    while ((match = buttonRegex.exec(html)) !== null) {
      idx++;
      const attrs = match[1];
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      const id = (attrs.match(/id=["']([^"']*)["']/i) || [])[1] || `btn_${idx}`;

      elements.push({
        id,
        tag: 'button',
        text,
        selector: id ? `#${id}` : `button:has-text("${text}")`,
      });
    }

    // 3. Links
    const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      idx++;
      const attrs = match[1];
      const href = (attrs.match(/href=["']([^"']*)["']/i) || [])[1];
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      const id = (attrs.match(/id=["']([^"']*)["']/i) || [])[1] || `link_${idx}`;

      if (href) {
        elements.push({
          id,
          tag: 'a',
          href,
          text,
          selector: id ? `#${id}` : `a[href="${href}"]`,
        });
      }
    }

    return elements;
  }

  /**
   * Take comprehensive snapshot of current page state
   */
  public getSnapshot(): BrowserPageSnapshot {
    const rawText = this.currentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const defense = SecurityShield.sanitizeWebText(rawText);

    const links = this.interactiveElements
      .filter((e) => e.tag === 'a' && e.href)
      .map((e) => ({ text: e.text || '', href: e.href! }));

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      statusCode: 200,
      interactiveElements: this.interactiveElements,
      visibleText: defense.sanitized,
      forms: [],
      links,
      untrustedWarning: defense.hasInjectionAttempt
        ? `Adversarial prompt injection pattern detected: ${defense.detectedPatterns.join(', ')}`
        : undefined,
    };
  }

  /**
   * Execute browser step within a task context
   */
  public async executeAction(taskId: string, request: BrowserActionRequest): Promise<BrowserActionResult> {
    const startTime = Date.now();
    const { action, url, selector, value } = request;

    await TaskStore.emitEvent(taskId, 'BROWSER_STARTED', `Browser action requested: ${action}`, {
      action,
      url,
      selector,
    });

    try {
      switch (action) {
        case 'navigate': {
          if (!url) throw new Error('URL required for navigation');
          this.currentUrl = url;

          const binaryPath = BrowserEngine.getSystemBrowserBinary();
          if ((url.startsWith('http://') || url.startsWith('https://')) && binaryPath) {
            try {
              if (this.activeBrowser) {
                await this.activeBrowser.close().catch(() => {});
                this.activeBrowser = null;
                this.activePage = null;
              }
              const browser = await puppeteer.launch({
                executablePath: binaryPath,
                headless: true,
                args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
              });
              this.activeBrowser = browser;
              const page = await browser.newPage();
              this.activePage = page;
              await page.goto(url, { waitUntil: 'domcontentloaded', timeout: request.timeoutMs || 25_000 });

              this.currentTitle = await page.title();
              this.currentHtml = await page.content();

              // Extract real DOM interactive elements via evaluate
              const domElements = await page.evaluate(() => {
                const results: Array<{ id: string; tag: string; text?: string; href?: string; value?: string; selector: string }> = [];
                let i = 0;
                document.querySelectorAll('input, button, a, textarea, select').forEach((node) => {
                  i++;
                  const el = node as HTMLElement;
                  const tag = el.tagName.toLowerCase();
                  const id = el.id || `node_${i}`;
                  const text = el.innerText?.trim() || el.getAttribute('placeholder') || '';
                  const href = (el as HTMLAnchorElement).href || undefined;
                  const value = (el as HTMLInputElement).value || undefined;
                  const selector = el.id ? `#${el.id}` : `${tag}:nth-of-type(${i})`;
                  results.push({ id, tag, text, href, value, selector });
                });
                return results.slice(0, 100);
              });

              this.interactiveElements = domElements;
            } catch (chromeErr: any) {
              console.warn('[BrowserEngine] Chrome execution fallback to HTTP fetch:', chromeErr?.message || chromeErr);
              const res = await fetch(url, {
                headers: { 'User-Agent': 'JARVIS-Autonomous-Browser-Agent/5.0' },
                signal: AbortSignal.timeout(request.timeoutMs || 15_000),
              });
              const text = await res.text();
              this.currentHtml = SecurityShield.sanitizeHtml(text);
              const titleMatch = this.currentHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              this.currentTitle = titleMatch ? titleMatch[1].trim() : url;
              this.interactiveElements = this.parseInteractiveElements(this.currentHtml);
            }
          } else if (url.startsWith('http://') || url.startsWith('https://')) {
            const res = await fetch(url, {
              headers: { 'User-Agent': 'JARVIS-Autonomous-Browser-Agent/5.0' },
              signal: AbortSignal.timeout(request.timeoutMs || 15_000),
            });
            const text = await res.text();
            this.currentHtml = SecurityShield.sanitizeHtml(text);
            const titleMatch = this.currentHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            this.currentTitle = titleMatch ? titleMatch[1].trim() : url;
            this.interactiveElements = this.parseInteractiveElements(this.currentHtml);
          } else {
            // Local / mock HTML navigation for testing
            this.currentHtml = url.startsWith('html:')
              ? SecurityShield.sanitizeHtml(url.replace(/^html:/, ''))
              : `<html><title>${url}</title><body><h1>Page: ${url}</h1></body></html>`;
            const titleMatch = this.currentHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            this.currentTitle = titleMatch ? titleMatch[1].trim() : url;
            this.interactiveElements = this.parseInteractiveElements(this.currentHtml);
          }

          await TaskStore.emitEvent(taskId, 'BROWSER_ACTION', `Navigated to ${this.currentUrl} (${this.currentTitle})`, {
            url: this.currentUrl,
            elementsFound: this.interactiveElements.length,
            runtimeMode: binaryPath ? 'PUPPETEER_CHROME' : 'HEADLESS_DOM_EMULATOR',
          });

          break;
        }

        case 'click': {
          if (!selector) throw new Error('Selector required for click action');
          if (this.activePage) {
            await this.activePage.click(selector).catch(async () => {
              await this.activePage?.evaluate((sel) => {
                const el = document.querySelector(sel) as HTMLElement;
                if (el) el.click();
              }, selector);
            });
          }

          const element = this.interactiveElements.find(
            (e) => e.selector === selector || e.id === selector.replace(/^#/, '')
          );

          await TaskStore.emitEvent(taskId, 'BROWSER_ACTION', `Clicked element: ${selector}`, {
            selector,
            tag: element?.tag || 'unknown',
          });

          if (element && element.tag === 'a' && element.href) {
            this.currentUrl = element.href;
          }
          break;
        }

        case 'type': {
          if (!selector) throw new Error('Selector required for type action');
          if (this.activePage) {
            await this.activePage.type(selector, value || '').catch(() => {});
          }

          const element = this.interactiveElements.find(
            (e) => e.selector === selector || e.id === selector.replace(/^#/, '')
          );
          if (element) {
            element.value = value || '';
          }

          await TaskStore.emitEvent(taskId, 'BROWSER_ACTION', `Typed into ${selector}: "${value}"`, {
            selector,
            value,
          });
          break;
        }

        case 'screenshot': {
          if (this.activePage) {
            const ssDir = path.resolve(process.cwd(), 'artifacts', 'screenshots');
            if (!existsSync(ssDir)) mkdirSync(ssDir, { recursive: true });
            const ssPath = path.join(ssDir, `shot_${Date.now()}.png`);
            await this.activePage.screenshot({ path: ssPath });
            await TaskStore.emitEvent(taskId, 'BROWSER_ACTION', `Captured screenshot to ${ssPath}`, { path: ssPath });
          }
          break;
        }

        case 'extract':
          break;

        default:
          throw new Error(`Unsupported browser action: ${action}`);
      }

      const snapshot = this.getSnapshot();
      const durationMs = Date.now() - startTime;

      await TaskStore.emitEvent(taskId, 'BROWSER_COMPLETED', `Browser action ${action} completed in ${durationMs}ms`, {
        action,
        url: this.currentUrl,
        durationMs,
      });

      return {
        action,
        success: true,
        url: this.currentUrl,
        snapshot,
        durationMs,
      };

    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', `Browser action ${action} failed: ${err.message}`, {
        action,
        error: err.message,
      });

      return {
        action,
        success: false,
        url: this.currentUrl,
        error: err.message,
        durationMs,
      };
    }
  }
}
