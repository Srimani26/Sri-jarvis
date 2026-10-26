/**
 * J.A.R.V.I.S. Distributed PC Worker Executor
 * Enforces strict capability validation, filesystem sandboxing, and policy checks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { WorkerCapabilityToken, WorkerTaskPayload, WorkerTaskResult } from './types.js';

export class WorkerExecutor {
  private allowedCapabilities: Set<WorkerCapabilityToken>;
  private workspacePath: string;

  constructor(capabilities: WorkerCapabilityToken[], workspacePath: string) {
    this.allowedCapabilities = new Set(capabilities);
    this.workspacePath = path.resolve(workspacePath);
  }

  public async executeTask(payload: WorkerTaskPayload): Promise<WorkerTaskResult> {
    const startTime = Date.now();

    // 1. Verify capability permission
    if (!this.allowedCapabilities.has(payload.capabilityRequired)) {
      return {
        taskId: payload.taskId,
        success: false,
        error: `CAPABILITY_DENIED: Worker lacks token [${payload.capabilityRequired}]`,
        durationMs: Date.now() - startTime,
      };
    }

    try {
      let output: any = null;

      switch (payload.action) {
        case 'OLLAMA_CHAT': {
          const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
          const res = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: payload.params.model || 'llama3',
              messages: payload.params.messages || [],
              stream: false,
            }),
            signal: AbortSignal.timeout(60000),
          });
          if (!res.ok) throw new Error(`Ollama failed (${res.status}): ${await res.text()}`);
          output = await res.json();
          break;
        }

        case 'FS_READ': {
          const target = this.resolveSafePath(payload.params.filepath);
          output = fs.readFileSync(target, 'utf8');
          break;
        }

        case 'FS_WRITE': {
          const target = this.resolveSafePath(payload.params.filepath);
          fs.writeFileSync(target, payload.params.content || '', 'utf8');
          output = { writtenBytes: (payload.params.content || '').length };
          break;
        }

        case 'BROWSER_NAVIGATE': {
          const targetUrl = payload.params.url;
          if (!targetUrl) throw new Error('URL is required for BROWSER_NAVIGATE');

          const exeCandidates = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            process.env.CHROME_BIN,
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
          ];
          const browserExe = exeCandidates.find((c) => c && fs.existsSync(c));

          if (browserExe) {
            try {
              const puppeteer = (await import('puppeteer-core')).default;
              const browser = await puppeteer.launch({
                executablePath: browserExe,
                headless: true,
                args: ['--no-sandbox', '--disable-gpu'],
              });
              const page = await browser.newPage();
              await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
              const title = await page.title();
              const textSample = await page.evaluate(() => document.body?.innerText?.slice(0, 1000) || '');
              await browser.close();

              output = {
                url: targetUrl,
                title,
                engine: 'PUPPETEER_CHROME',
                browserExe,
                preview: textSample,
                status: 200,
              };
              break;
            } catch (pErr: any) {
              console.warn('[Worker] Puppeteer launch fallback:', pErr?.message);
            }
          }

          // Fallback HTTP fetch
          const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
          const html = await res.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          output = {
            url: targetUrl,
            title: titleMatch ? titleMatch[1].trim() : targetUrl,
            engine: 'HTTP_FETCH_FALLBACK',
            status: res.status,
          };
          break;
        }

        default:
          throw new Error(`UNKNOWN_ACTION: ${payload.action}`);
      }

      return {
        taskId: payload.taskId,
        success: true,
        output,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        taskId: payload.taskId,
        success: false,
        error: err?.message || String(err),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Ensure filesystem access stays strictly inside the designated workspace.
   * Prevents directory traversal attacks and access to system credentials.
   */
  public resolveSafePath(userPath: string): string {
    if (!userPath) throw new Error('EMPTY_PATH: Filepath is required');
    const resolved = path.resolve(this.workspacePath, userPath);
    if (!resolved.startsWith(this.workspacePath)) {
      throw new Error(`SANDBOX_VIOLATION: Path escapes workspace root: ${userPath}`);
    }
    return resolved;
  }
}
