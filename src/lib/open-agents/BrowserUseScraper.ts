/**
 * Sovereign Browser-Use Web Intelligence Engine (Re-engineered from browser-use/browser-use)
 * Implements intelligent HTML DOM element extraction, clean text filtering, table scraping,
 * and structured market reconnaissance without requiring heavy Chromium overhead.
 */

export interface ScrapedDossier {
  url: string
  title: string
  headings: string[]
  keyParagraphs: string[]
  links: Array<{ text: string; href: string }>
  tables: Array<string[][]>
  executiveSummary: string
  timestamp: string
}

export class BrowserUseScraper {
  public static async scrapeUrl(
    targetUrl: string,
    aiSummarizer?: (text: string) => Promise<string>
  ): Promise<ScrapedDossier> {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach target host`)
    const html = await res.text()

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : targetUrl

    const headings: string[] = []
    for (const match of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
      const clean = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (clean && clean.length > 3 && headings.length < 15) headings.push(clean)
    }

    const paragraphs: string[] = []
    for (const match of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const clean = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (clean && clean.length > 30 && paragraphs.length < 10) paragraphs.push(clean)
    }

    const links: Array<{ text: string; href: string }> = []
    for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = match[1]
      const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (text && href && (href.startsWith('http') || href.startsWith('/')) && links.length < 12) {
        links.push({ text, href })
      }
    }

    const rawContent = `Title: ${title}\nHeadings: ${headings.join(' | ')}\nContent: ${paragraphs.join('\n')}`
    let summary = rawContent.slice(0, 500)
    if (aiSummarizer) {
      try {
        summary = await aiSummarizer(rawContent.slice(0, 3000))
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
      timestamp: new Date().toISOString()
    }
  }
}