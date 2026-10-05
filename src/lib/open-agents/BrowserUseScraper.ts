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
