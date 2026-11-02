/**
 * webResearchEngine.ts — Headless Research Scraper & Content Distiller
 * Inspired by: lightpanda-io/browser & Free-APIs/Free-APIs.github.io
 * Target: src/swarm/tools/webResearchEngine.ts & server/src/swarm/tools/webResearchEngine.ts
 *
 * Provides fast, low-memory DOM extraction with SSRF security boundaries,
 * converting raw web documents into token-efficient markdown for LLM consumption.
 */

export interface WebResearchOptions {
  url: string
  selector?: string
  extract_markdown?: boolean
  timeoutMs?: number
}

export interface WebResearchResult {
  status: 'SUCCESS' | 'ERROR'
  url: string
  title?: string
  markdown?: string
  rawText?: string
  contentLength: number
  latencyMs: number
}

// SSRF blocklist
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./, // AWS / Cloud metadata
  /^0\.0\.0\.0$/,
  /^::1$/,
  /\.local$/i,
  /\.internal$/i
]

export function validateSafeUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`Invalid URL format: ${rawUrl}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Prohibited protocol: ${parsed.protocol}. Only http and https are allowed.`)
  }

  const hostname = parsed.hostname.toLowerCase()
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Security Violation (SSRF Protection): Target host "${hostname}" is prohibited.`)
    }
  }

  return parsed
}

export function htmlToCleanMarkdown(html: string): { title?: string; markdown: string } {
  let clean = html
    // Strip scripts, styles, iframes, svgs, comments
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Extract title
  const titleMatch = clean.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : undefined

  // Replace common tags with markdown equivalents
  clean = clean
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n* $1')
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')

  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Normalize whitespace
  clean = clean
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n')

  return { title, markdown: clean.slice(0, 8000) }
}

/**
 * Headless Web Research tool execution
 */
export async function executeHeadlessWebResearch(options: WebResearchOptions): Promise<WebResearchResult> {
  const start = Date.now()
  const parsedUrl = validateSafeUrl(options.url)
  const timeoutMs = options.timeoutMs || 5000

  const res = await fetch(parsedUrl.toString(), {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) J.A.R.V.I.S. Research Scraper/2.0',
      'Accept': 'text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(timeoutMs)
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText} when fetching ${parsedUrl.origin}`)
  }

  const rawHtml = await res.text()
  const { title, markdown } = htmlToCleanMarkdown(rawHtml)
  const latencyMs = Date.now() - start

  return {
    status: 'SUCCESS',
    url: parsedUrl.toString(),
    title,
    markdown: options.extract_markdown !== false ? markdown : undefined,
    rawText: options.extract_markdown === false ? markdown.replace(/[#*\[\]\(\)]/g, '') : undefined,
    contentLength: markdown.length,
    latencyMs
  }
}
