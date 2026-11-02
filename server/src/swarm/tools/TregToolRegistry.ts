/**
 * TregToolRegistry.ts — Sovereign Tool Registry & Universal Tool Router
 * Inspired by: superdesigndev/treg (https://treg.to)
 * Target: src/swarm/tools/TregToolRegistry.ts & server/src/swarm/tools/TregToolRegistry.ts
 *
 * "OpenRouter, but for agent tools instead of models."
 * Point an agent at one interface: search by task/intent ("find work email", "backlinks", "weather"),
 * read the params, and call it.
 *
 * Implements the 3-step Credential Ladder:
 * 1. Team's Own Key (BYOK from virtualKeyVault) -> Injected server-side, free of balance.
 * 2. Verified Public Route -> No key required, completely free.
 * 3. Treg Relay (https://treg.to/call/ or server proxy) -> Auth injected server-side, caller never holds keys.
 */

import { virtualKeyVault } from '../../security/SecretSanitizer'
import { VERIFIED_PUBLIC_ENDPOINTS, executeQueryPublicService } from './publicApiDirectory'
import { executeHeadlessWebResearch } from './webResearchEngine'

export interface TregToolDefinition {
  id: string
  name: string
  category: 'web' | 'enrichment' | 'seo' | 'social' | 'finance' | 'audio' | 'general'
  description: string
  intentKeywords: string[]
  baseUrl: string
  method: 'GET' | 'POST'
  authShape: 'none' | 'bearer' | 'header' | 'query'
  authHeaderName?: string
  provider: string
  exampleQuery: Record<string, any>
  priceDescription: string
}

export const TREG_CATALOG: TregToolDefinition[] = [
  // 1. Web Search & Extract (Routed capabilities)
  {
    id: 'treg.web.search',
    name: 'Universal Web Search',
    category: 'web',
    description: 'Search the live web across search engines without maintaining search API subscriptions.',
    intentKeywords: ['search', 'google search', 'find articles', 'web query', 'lookup info'],
    baseUrl: 'https://api.duckduckgo.com',
    method: 'GET',
    authShape: 'none',
    provider: 'duckduckgo',
    exampleQuery: { q: 'artificial intelligence news', format: 'json' },
    priceDescription: 'Free (Public Route)'
  },
  {
    id: 'treg.web.extract',
    name: 'Universal Headless Web Scraper & Distiller',
    category: 'web',
    description: 'Extract clean, readable markdown from any public webpage with SSRF boundary security.',
    intentKeywords: ['scrape', 'read webpage', 'extract text', 'crawl', 'read site'],
    baseUrl: 'internal://headless_web_research',
    method: 'GET',
    authShape: 'none',
    provider: 'lightpanda',
    exampleQuery: { url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
    priceDescription: 'Free (Internal Sandbox)'
  },

  // 2. People & Company Enrichment
  {
    id: 'treg.people.email.find',
    name: 'Email & Contact Finder',
    category: 'enrichment',
    description: 'Find verified corporate and executive email addresses given a full name and domain.',
    intentKeywords: ['find email', 'work email', 'contact info', 'lead email', 'email lookup'],
    baseUrl: 'https://api.hunter.io/v2/email-finder',
    method: 'GET',
    authShape: 'query',
    authHeaderName: 'api_key',
    provider: 'hunter',
    exampleQuery: { domain: 'github.com', first_name: 'Satya', last_name: 'Nadella' },
    priceDescription: '$0.01 / lookup (or BYOK Hunter.io)'
  },
  {
    id: 'treg.company.enrich',
    name: 'Company Profile & Tech Stack Enrichment',
    category: 'enrichment',
    description: 'Enrich domain with firmographics, employee size, funding, and detected technology stack.',
    intentKeywords: ['company info', 'tech stack', 'firmographics', 'funding data', 'company size'],
    baseUrl: 'https://company.clearbit.com/v2/companies/find',
    method: 'GET',
    authShape: 'bearer',
    provider: 'clearbit',
    exampleQuery: { domain: 'shopify.com' },
    priceDescription: '$0.02 / call (or BYOK Clearbit)'
  },

  // 3. SEO & Backlinks
  {
    id: 'treg.seo.backlinks',
    name: 'Domain Backlinks & Authority Inspector',
    category: 'seo',
    description: 'Inspect domain authority, referring domains, backlink distribution, and page rank.',
    intentKeywords: ['backlinks', 'domain rank', 'seo audit', 'referring domains', 'moz rank'],
    baseUrl: 'https://api.semrush.com/backlinks',
    method: 'GET',
    authShape: 'query',
    authHeaderName: 'key',
    provider: 'semrush',
    exampleQuery: { target: 'standardroofs.com', type: 'root_domain' },
    priceDescription: '$0.05 / call (or BYOK Semrush / Moz)'
  },

  // 4. Social & Trends
  {
    id: 'treg.social.profile',
    name: 'Social Media User Profile & Metrics',
    category: 'social',
    description: 'Inspect public social media profiles (TikTok, X, YouTube, Instagram) for metrics and engagement.',
    intentKeywords: ['social profile', 'tiktok profile', 'instagram stats', 'influencer metrics', 'youtube channel'],
    baseUrl: 'https://api.tikhub.io/v1/tiktok/user/profile',
    method: 'GET',
    authShape: 'header',
    authHeaderName: 'Authorization',
    provider: 'tikhub',
    exampleQuery: { uniqueId: 'openai' },
    priceDescription: '$0.005 / call (or BYOK TikHub)'
  },

  // 5. Financial & Crypto (Verified Zero-Cost Public Route)
  {
    id: 'treg.finance.fx',
    name: 'Global Currency & Exchange Rates',
    category: 'finance',
    description: 'Real-time global currency exchange rates across 160+ fiat currencies.',
    intentKeywords: ['currency', 'exchange rate', 'usd to inr', 'forex', 'eur rate'],
    baseUrl: 'https://open.er-api.com/v6/latest/USD',
    method: 'GET',
    authShape: 'none',
    provider: 'open-er-api',
    exampleQuery: {},
    priceDescription: 'Free (Public Route)'
  },
  {
    id: 'treg.finance.crypto',
    name: 'Crypto Asset Price Ticker & Market Cap',
    category: 'finance',
    description: 'Real-time cryptocurrency valuation, 24h change, and market cap for Bitcoin, Ethereum, Solana.',
    intentKeywords: ['crypto price', 'bitcoin price', 'solana', 'ethereum', 'crypto market'],
    baseUrl: 'https://api.coingecko.com/api/v3/simple/price',
    method: 'GET',
    authShape: 'none',
    provider: 'coingecko',
    exampleQuery: { ids: 'bitcoin,ethereum,solana', vs_currencies: 'usd,inr' },
    priceDescription: 'Free (Public Route)'
  },

  // 6. Speech & Audio (Fish Audio S2.1 Pro / ElevenLabs)
  {
    id: 'treg.audio.tts',
    name: 'High-Fidelity Neural Speech Synthesis',
    category: 'audio',
    description: 'Generate high-fidelity voice audio stream (Fish Audio S2.1 Pro / ElevenLabs Aura).',
    intentKeywords: ['tts', 'speech', 'voice generator', 'clone voice', 'text to speech'],
    baseUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
    method: 'POST',
    authShape: 'header',
    authHeaderName: 'xi-api-key',
    provider: 'elevenlabs',
    exampleQuery: { text: 'Welcome Master Sri', voice_id: '21m00Tcm4TlvDq8ikWAM' },
    priceDescription: 'Free Tier / Prepaid'
  }
]

export class TregToolRegistry {
  private static instance: TregToolRegistry

  public static getInstance(): TregToolRegistry {
    if (!TregToolRegistry.instance) {
      TregToolRegistry.instance = new TregToolRegistry()
    }
    return TregToolRegistry.instance
  }

  /**
   * Search tools by intent ("Ask for the task, not the tool")
   * Ranks by semantic relevance and intent keyword precision.
   */
  public searchCatalog(query: string, category?: string): TregToolDefinition[] {
    const q = query.toLowerCase().trim()
    const tokens = q.split(/\s+/).filter(Boolean)
    const stopWords = new Set(['for', 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'and'])
    const meaningfulTokens = tokens.filter(t => !stopWords.has(t))
    const searchTokens = meaningfulTokens.length ? meaningfulTokens : tokens

    const scored = TREG_CATALOG
      .filter(tool => !category || tool.category === category)
      .map(tool => {
        let score = 0
        const idLower = tool.id.toLowerCase()
        const nameLower = tool.name.toLowerCase()
        const descLower = tool.description.toLowerCase()

        // 1. Direct query substring in ID or name
        if (idLower.includes(q) || nameLower.includes(q)) score += 50

        // 2. Exact keyword / phrase match in intentKeywords
        for (const kw of tool.intentKeywords) {
          const kwLower = kw.toLowerCase()
          if (q.includes(kwLower)) score += 35
          else if (kwLower.includes(q)) score += 20
        }

        // 3. Token matches in identifier, keywords, name, and description
        for (const token of searchTokens) {
          if (idLower.includes(token)) score += 12
          if (nameLower.includes(token)) score += 6
          for (const kw of tool.intentKeywords) {
            if (kw.toLowerCase().includes(token)) score += 8
          }
          if (descLower.includes(token)) score += 2
        }

        return { tool, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.map(item => item.tool)
  }

  /**
   * Get specific tool by ID
   */
  public getTool(id: string): TregToolDefinition | undefined {
    return TREG_CATALOG.find(t => t.id === id || t.name.toLowerCase() === id.toLowerCase())
  }

  /**
   * Faithful Relay Executor: Resolves Credential Ladder and dispatches call
   */
  public async callTool(toolId: string, params: Record<string, any> = {}): Promise<any> {
    const tool = this.getTool(toolId)
    if (!tool) {
      throw new Error(`Tool "${toolId}" not found in Treg Catalog. Use treg_catalog_search to discover capabilities.`)
    }

    // Special handler: Internal Headless Web Research
    if (tool.baseUrl === 'internal://headless_web_research') {
      return await executeHeadlessWebResearch({
        url: params.url || 'https://example.com',
        extract_markdown: params.extract_markdown !== false
      })
    }

    // Step 1 & 2: Credential Ladder
    // Check if team stored its own key (BYOK)
    const byokKey = virtualKeyVault.getActiveKey(tool.provider)
    const tregToken = process.env.TREG_TOKEN || process.env.TREG_API_KEY

    // If verified public endpoint (none required)
    if (tool.authShape === 'none') {
      const parsed = new URL(tool.baseUrl)
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          parsed.searchParams.set(k, String(v))
        }
      }

      const res = await fetch(parsed.toString(), {
        method: tool.method,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'JARVIS-TregRegistry/2.0'
        },
        signal: AbortSignal.timeout(6000)
      })

      if (!res.ok) {
        throw new Error(`Tool "${tool.id}" returned HTTP ${res.status}: ${res.statusText}`)
      }

      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        return { status: 'SUCCESS', content: text.slice(0, 4000) }
      }
    }

    // If BYOK key is available, inject server-side
    if (byokKey) {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'JARVIS-TregRegistry/2.0 (BYOK)'
      }

      const parsed = new URL(tool.baseUrl)

      if (tool.authShape === 'bearer') {
        headers['Authorization'] = `Bearer ${byokKey}`
      } else if (tool.authShape === 'header' && tool.authHeaderName) {
        headers[tool.authHeaderName] = byokKey
      } else if (tool.authShape === 'query' && tool.authHeaderName) {
        parsed.searchParams.set(tool.authHeaderName, byokKey)
      }

      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          parsed.searchParams.set(k, String(v))
        }
      }

      const res = await fetch(parsed.toString(), {
        method: tool.method,
        headers,
        signal: AbortSignal.timeout(6000)
      })

      if (!res.ok) {
        throw new Error(`BYOK Upstream returned HTTP ${res.status}: ${await res.text()}`)
      }

      return await res.json().catch(() => ({ status: 'SUCCESS', message: 'Executed via BYOK' }))
    }

    // Step 3: Treg Proxy Relay (https://treg.to/call/<url>)
    if (tregToken) {
      const proxyUrl = `https://treg.to/call/${encodeURIComponent(tool.baseUrl)}`
      const res = await fetch(proxyUrl, {
        method: tool.method,
        headers: {
          'X-Treg-Token': tregToken,
          'Content-Type': 'application/json'
        },
        body: tool.method === 'POST' ? JSON.stringify(params) : undefined,
        signal: AbortSignal.timeout(8000)
      })

      if (!res.ok) {
        throw new Error(`Treg Relay returned HTTP ${res.status}: ${await res.text()}`)
      }

      return await res.json()
    }

    // If neither BYOK nor Treg Token is present for a paid tool, provide clean prescriptive guidance
    return {
      status: 'SIMULATED_PREVIEW',
      toolId: tool.id,
      provider: tool.provider,
      pricing: tool.priceDescription,
      message: `Tool "${tool.id}" requires a registered key or Treg balance. Connect your own ${tool.provider} key into virtualKeyVault or add TREG_TOKEN to .env.`,
      previewData: {
        queriedParams: params,
        simulatedResponse: `Verified interface contract for ${tool.name}. Live call ready once key is registered.`
      }
    }
  }
}

export const tregToolRegistry = TregToolRegistry.getInstance()
