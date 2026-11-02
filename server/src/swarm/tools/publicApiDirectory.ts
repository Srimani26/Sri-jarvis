/**
 * publicApiDirectory.ts — Dynamic Public API Hub & Zero-Auth Tool Discovery
 * Target: server/src/swarm/tools/publicApiDirectory.ts & src/swarm/tools/publicApiDirectory.ts
 *
 * Implements architectural patterns from:
 * 1. public-apis/public-apis & engrshuvodas/open-free-api-directory
 * Provides verified free, no-auth public endpoints for real-time telemetry,
 * currency exchange (Midas), weather & geo (Friday), and knowledge search.
 */

export interface PublicEndpointDefinition {
  id: string
  name: string
  category: 'weather' | 'currency' | 'crypto' | 'geolocation' | 'knowledge' | 'network'
  baseUrl: string
  description: string
  exampleParams: Record<string, any>
}

export const VERIFIED_PUBLIC_ENDPOINTS: PublicEndpointDefinition[] = [
  {
    id: 'weather_open_meteo',
    name: 'Open-Meteo Weather Forecast',
    category: 'weather',
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    description: 'High-resolution real-time global weather and hourly forecasts without API key.',
    exampleParams: { latitude: '12.9716', longitude: '77.5946', current_weather: 'true' }
  },
  {
    id: 'weather_wttr',
    name: 'wttr.in Weather Report',
    category: 'weather',
    baseUrl: 'https://wttr.in',
    description: 'Instant JSON weather telemetry for any city.',
    exampleParams: { format: 'j1' }
  },
  {
    id: 'fx_rates',
    name: 'Open Exchange Rates (Free Tier)',
    category: 'currency',
    baseUrl: 'https://open.er-api.com/v6/latest/USD',
    description: 'Real-time global currency exchange rates across 160+ fiat currencies.',
    exampleParams: {}
  },
  {
    id: 'crypto_coingecko',
    name: 'CoinGecko Price Ticker',
    category: 'crypto',
    baseUrl: 'https://api.coingecko.com/api/v3/simple/price',
    description: 'Real-time cryptocurrency valuation and market caps.',
    exampleParams: { ids: 'bitcoin,ethereum,solana', vs_currencies: 'usd,inr' }
  },
  {
    id: 'geo_ipapi',
    name: 'IPApi Geolocation',
    category: 'geolocation',
    baseUrl: 'https://ipapi.co/json/',
    description: 'IP-based autonomous geolocation, timezone, and network telemetry.',
    exampleParams: {}
  },
  {
    id: 'wiki_summary',
    name: 'Wikipedia Knowledge Summary',
    category: 'knowledge',
    baseUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary',
    description: 'Instant encyclopedic summary extracts on scientific, historical, or corporate topics.',
    exampleParams: {}
  },
  {
    id: 'dns_google',
    name: 'Google Public DNS-over-HTTPS',
    category: 'network',
    baseUrl: 'https://dns.google/resolve',
    description: 'Query DNS records (A, AAAA, MX, TXT) for cybersecurity reconnaissance.',
    exampleParams: { name: 'google.com', type: 'A' }
  }
]

// SSRF Protection: Allowlist of permitted external domains
const ALLOWED_PUBLIC_DOMAINS = [
  'api.open-meteo.com',
  'wttr.in',
  'open.er-api.com',
  'api.coingecko.com',
  'ipapi.co',
  'en.wikipedia.org',
  'dns.google',
  'api.github.com'
]

/**
 * Execute query to verified public free service
 */
export async function executeQueryPublicService(
  category: string,
  endpoint: string,
  queryParams: Record<string, any> = {}
): Promise<any> {
  let targetUrl = endpoint

  // If endpoint is a registered ID, look up base URL
  const registered = VERIFIED_PUBLIC_ENDPOINTS.find(e => e.id === endpoint || e.name === endpoint)
  if (registered) {
    targetUrl = registered.baseUrl
  }

  // Validate URL protocol and hostname against allowlist
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    throw new Error(`Invalid URL endpoint: ${targetUrl}`)
  }

  const hostname = parsed.hostname.toLowerCase()
  const isAllowed = ALLOWED_PUBLIC_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  if (!isAllowed) {
    throw new Error(`Security Exception: Hostname "${hostname}" is not in the Sovereign Verified Public API Allowlist.`)
  }

  // Append query parameters
  for (const [key, value] of Object.entries(queryParams || {})) {
    if (value !== undefined && value !== null) {
      parsed.searchParams.set(key, String(value))
    }
  }

  // Execute with 5000ms timeout
  const res = await fetch(parsed.toString(), {
    method: 'GET',
    headers: {
      'User-Agent': 'JARVIS-Sovereign-PublicHub/2.0',
      'Accept': 'application/json, text/plain, */*'
    },
    signal: AbortSignal.timeout(5000)
  })

  if (!res.ok) {
    throw new Error(`Public API returned HTTP ${res.status}: ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await res.json()
    return {
      status: 'SUCCESS',
      endpoint: parsed.origin + parsed.pathname,
      data
    }
  }

  const text = await res.text()
  return {
    status: 'SUCCESS',
    endpoint: parsed.origin + parsed.pathname,
    text: text.slice(0, 4000)
  }
}
