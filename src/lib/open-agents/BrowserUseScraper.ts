import fs from 'node:fs';
import path from 'node:path';

export interface ScrapedDossier {
  url: string;
  title: string;
  headings: string[];
  keyParagraphs: string[];
  links: Array<{ text: string; href: string }>;
  tables: Array<string[][]>;
  screenshotPath?: string;
  renderedHtmlSnippet?: string;
  executiveSummary: string;
  timestamp: string;
}

export interface BrowserInteractionAction {
  type: 'click' | 'type' | 'wait_for_selector' | 'screenshot' | 'scroll';
  selector?: string;
  text?: string;
  delayMs?: number;
}

export class BrowserUseScraper {
  private static findBrowserExecutable(): string | null {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  /**
   * Real Headless Chrome Visual Automation:
   * Launches actual Chrome, renders dynamic JavaScript/SPAs, executes clicks/inputs, and captures screenshots
   */
  public static async executeVisualAutomation(params: {
    url: string;
    actions?: BrowserInteractionAction[];
    takeScreenshot?: boolean;
    screenshotName?: string;
  }): Promise<{
    url: string;
    title: string;
    renderedText: string;
    screenshotPath?: string;
    actionsCompleted: string[];
  }> {
    const chromePath = this.findBrowserExecutable();
    if (!chromePath) {
      throw new Error('No local Chrome/Edge executable found on system.');
    }

    const { default: puppeteer } = await import('puppeteer-core');
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    });

    const actionsCompleted: string[] = [];
    let screenshotPath: string | undefined;

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(params.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      actionsCompleted.push(`Navigated to ${params.url}`);

      // Execute interactive actions if requested
      if (params.actions && params.actions.length > 0) {
        for (const act of params.actions) {
          if (act.type === 'click' && act.selector) {
            await page.waitForSelector(act.selector, { timeout: 5000 });
            await page.click(act.selector);
            actionsCompleted.push(`Clicked element: ${act.selector}`);
          } else if (act.type === 'type' && act.selector && act.text) {
            await page.waitForSelector(act.selector, { timeout: 5000 });
            await page.type(act.selector, act.text);
            actionsCompleted.push(`Typed text into: ${act.selector}`);
          } else if (act.type === 'wait_for_selector' && act.selector) {
            await page.waitForSelector(act.selector, { timeout: 10000 });
            actionsCompleted.push(`Waited for selector: ${act.selector}`);
          } else if (act.type === 'scroll') {
            await page.evaluate(() => window.scrollBy(0, 500));
            actionsCompleted.push(`Scrolled viewport down 500px`);
          }
          if (act.delayMs) {
            await new Promise((r) => setTimeout(r, act.delayMs));
          }
        }
      }

      // Capture screenshot if requested
      if (params.takeScreenshot !== false) {
        const screenshotsDir = path.resolve(process.cwd(), 'artifacts', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        const filename = params.screenshotName || `screen_${Date.now()}.png`;
        const diskPath = path.join(screenshotsDir, filename);
        await page.screenshot({ path: diskPath, fullPage: false });
        screenshotPath = path.relative(process.cwd(), diskPath);
        actionsCompleted.push(`Captured screenshot: ${screenshotPath}`);
      }

      const title = await page.title();
      const renderedText = await page.evaluate(() => document.body?.innerText?.slice(0, 5000) || '');

      return {
        url: params.url,
        title,
        renderedText,
        screenshotPath,
        actionsCompleted,
      };
    } finally {
      await browser.close();
    }
  }

  public static async scrapeUrl(
    targetUrl: string,
    aiSummarizer?: (text: string) => Promise<string>
  ): Promise<ScrapedDossier> {
    // 1. Attempt real headless Chrome rendering first
    const chromePath = this.findBrowserExecutable();
    if (chromePath) {
      try {
        const visual = await this.executeVisualAutomation({
          url: targetUrl,
          takeScreenshot: true,
          screenshotName: `scrape_${Date.now()}.png`,
        });

        const rawContent = `Title: ${visual.title}\nRendered Text:\n${visual.renderedText.slice(0, 3000)}`;
        let summary = rawContent.slice(0, 500);
        if (aiSummarizer) {
          try {
            summary = await aiSummarizer(rawContent);
          } catch {}
        }

        return {
          url: targetUrl,
          title: visual.title,
          headings: [],
          keyParagraphs: visual.renderedText.split('\n').filter((l) => l.trim().length > 30).slice(0, 10),
          links: [],
          tables: [],
          screenshotPath: visual.screenshotPath,
          renderedHtmlSnippet: visual.renderedText.slice(0, 1000),
          executiveSummary: summary,
          timestamp: new Date().toISOString(),
        };
      } catch (chromeErr) {
        console.warn('[BrowserUse] Real Chrome headless execution fallback:', chromeErr);
      }
    }

    // 2. HTTP Fetch Fallback
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach target host`);
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : targetUrl;

    const headings: string[] = [];
    for (const match of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
      const clean = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (clean && clean.length > 3 && headings.length < 15) headings.push(clean);
    }

    const paragraphs: string[] = [];
    for (const match of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const clean = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (clean && clean.length > 30 && paragraphs.length < 10) paragraphs.push(clean);
    }

    const links: Array<{ text: string; href: string }> = [];
    for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = match[1];
      const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text && href && (href.startsWith('http') || href.startsWith('/')) && links.length < 12) {
        links.push({ text, href });
      }
    }

    const rawContent = `Title: ${title}\nHeadings: ${headings.join(' | ')}\nContent: ${paragraphs.join('\n')}`;
    let summary = rawContent.slice(0, 500);
    if (aiSummarizer) {
      try {
        summary = await aiSummarizer(rawContent.slice(0, 3000));
      } catch {}
    }

    return {
      url: targetUrl,
      title,
      headings,
      keyParagraphs: paragraphs,
      links,
      tables: [],
      executiveSummary: summary,
      timestamp: new Date().toISOString(),
    };
  }

  public static async searchWeb(
    query: string,
    aiSummarizer?: (text: string) => Promise<string>
  ): Promise<{ query: string; results: Array<{ title: string; url: string; snippet: string }>; summary: string }> {
    const results: Array<{ title: string; url: string; snippet: string }> = []
    
    // 1. Tavily API if configured
    const tavilyKey = process.env.TAVILY_API_KEY
    if (tavilyKey) {
      try {
        const tRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: tavilyKey, query, max_results: 5, search_depth: 'advanced' }),
          signal: AbortSignal.timeout(10000)
        })
        if (tRes.ok) {
          const tData: any = await tRes.json()
          if (Array.isArray(tData.results)) {
            for (const r of tData.results) {
              results.push({ title: r.title || 'Web Result', url: r.url, snippet: r.content || '' })
            }
          }
        }
      } catch (e) {
        console.warn('Tavily search fallback:', e)
      }
    }

    // 2. DuckDuckGo Zero-Cost Live Web Search Fallback
    if (results.length === 0) {
      try {
        const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(9000)
        })
        if (ddgRes.ok) {
          const html = await ddgRes.text()
          const snippetRegex = /<a[^>]+class=["']result__snippet["'][^>]*>([\s\S]*?)<\/a>/gi
          const urlRegex = /<a[^>]+class=["']result__url["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
          
          const snippets: string[] = []
          let sMatch
          while ((sMatch = snippetRegex.exec(html)) && snippets.length < 5) {
            snippets.push(sMatch[1].replace(/<[^>]+>/g, '').trim())
          }

          const links: Array<{ url: string; title: string }> = []
          let lMatch
          while ((lMatch = urlRegex.exec(html)) && links.length < 5) {
            links.push({
              url: lMatch[1].trim(),
              title: lMatch[2].replace(/<[^>]+>/g, '').trim()
            })
          }

          for (let i = 0; i < Math.max(links.length, snippets.length); i++) {
            results.push({
              title: links[i]?.title || `Web Insight ${i + 1}`,
              url: links[i]?.url || '',
              snippet: snippets[i] || ''
            })
          }
        }
      } catch (err) {
        console.error('DuckDuckGo search fallback error:', err)
      }
    }

    let summary = `Master Sri, retrieved ${results.length} live web sources for: "${query}".`
    if (aiSummarizer && results.length > 0) {
      try {
        const rawContext = results.map((r, i) => `[${i+1}] ${r.title} (${r.url}):\n${r.snippet}`).join('\n\n')
        summary = await aiSummarizer(`Synthesize an executive intelligence summary for Master Sri on query "${query}" based on live web findings:\n\n${rawContext}`)
      } catch (e) {
        // preserve base summary
      }
    }

    return { query, results, summary }
  }

}
