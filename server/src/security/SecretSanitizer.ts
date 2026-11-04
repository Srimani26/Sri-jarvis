/**
 * SecretSanitizer.ts — Zero-Trust Secret Redaction & Virtual Key Governance
 * Target: server/src/security/SecretSanitizer.ts & src/security/SecretSanitizer.ts
 *
 * Implements architectural patterns from:
 * 1. keyhunter & keyFinder (regex & entropy secret scanning)
 * 2. unkey, hexclave & ZeroKey (zero-trust in-memory virtual key vault and quota rotator)
 */

import { createHash } from 'node:crypto'

export const SECRET_PATTERNS = [
  { type: 'GITHUB_TOKEN', regex: /ghp_[a-zA-Z0-9]{20,}/g },
  { type: 'GITHUB_FINE_GRAINED', regex: /github_pat_[a-zA-Z0-9_]{20,}/g },
  { type: 'GROQ_KEY', regex: /gsk_[a-zA-Z0-9]{20,}/g },
  { type: 'GOOGLE_KEY', regex: /AIza[0-9A-Za-z-_]{20,}/g },
  { type: 'OPENAI_KEY', regex: /sk-[a-zA-Z0-9]{20,}/g },
  { type: 'ANTHROPIC_KEY', regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g },
  { type: 'POSTGRES_URL', regex: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s:@]+@[^\s"']+/gi },
  { type: 'BEARER_AUTH', regex: /Bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi },
  { type: 'TELEGRAM_TOKEN', regex: /\d{9,10}:[a-zA-Z0-9_-]{35}/g },
  { type: 'DEEPGRAM_KEY', regex: /[a-f0-9]{40}/g }
]

export const REDACTED_MARKER = '[REDACTED_SECRET]'

/**
 * Scan a text string for known API credentials or database connection strings
 */
export function scanForSecrets(text: string): Array<{ type: string; match: string; index: number }> {
  if (typeof text !== 'string') return []
  const detected: Array<{ type: string; match: string; index: number }> = []

  for (const { type, regex } of SECRET_PATTERNS) {
    const rx = new RegExp(regex.source, regex.flags)
    let m: RegExpExecArray | null
    while ((m = rx.exec(text)) !== null) {
      detected.push({
        type,
        match: m[0],
        index: m.index
      })
    }
  }

  return detected
}

/**
 * Redact all secret patterns from a string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input
  let cleaned = input

  for (const { regex } of SECRET_PATTERNS) {
    cleaned = cleaned.replace(regex, REDACTED_MARKER)
  }

  return cleaned
}

/**
 * Recursively sanitize an entire data structure (objects, arrays, strings)
 */
export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload
  }

  if (typeof payload === 'string') {
    return sanitizeString(payload) as unknown as T
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item)) as unknown as T
  }

  if (typeof payload === 'object') {
    const sanitizedObj: Record<string, any> = {}
    for (const [key, value] of Object.entries(payload)) {
      // Sensitive field name masking
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key')
      ) {
        if (typeof value === 'string' && value.length > 0) {
          sanitizedObj[key] = REDACTED_MARKER
          continue
        }
      }
      sanitizedObj[key] = sanitizePayload(value)
    }
    return sanitizedObj as T
  }

  return payload
}

/**
 * Virtual Key Vault & Rate-Limit Rotator (ZeroKey / Unkey pattern)
 * Stores keys in memory, hashes keys with SHA-256, and cycles active keys on 429
 */
export interface VirtualKeyEntry {
  virtualId: string
  rawKey: string
  provider: string
  rateLimitedUntil: number
  usageCount: number
}

export class VirtualKeyVault {
  private static instance: VirtualKeyVault
  private keyPools: Map<string, VirtualKeyEntry[]> = new Map()

  public static getInstance(): VirtualKeyVault {
    if (!VirtualKeyVault.instance) {
      VirtualKeyVault.instance = new VirtualKeyVault()
    }
    return VirtualKeyVault.instance
  }

  public registerKey(provider: string, rawKey: string): string {
    const trimmed = rawKey.trim()
    if (!trimmed) return ''

    const virtualId = `vkey_${createHash('sha256').update(trimmed).digest('hex').substring(0, 12)}`
    const pool = this.keyPools.get(provider) || []

    const existing = pool.find(k => k.rawKey === trimmed)
    if (existing) return existing.virtualId

    pool.push({
      virtualId,
      rawKey: trimmed,
      provider,
      rateLimitedUntil: 0,
      usageCount: 0
    })

    this.keyPools.set(provider, pool)
    return virtualId
  }

  public registerKeys(provider: string, keys: string[]): number {
    let added = 0
    for (const k of keys) {
      if (k && k.trim()) {
        this.registerKey(provider, k)
        added++
      }
    }
    return added
  }

  public getActiveKey(provider: string): string | null {
    const pool = this.keyPools.get(provider)
    if (!pool || pool.length === 0) return null

    const now = Date.now()
    // Find keys not currently throttled
    const healthyKeys = pool.filter(k => k.rateLimitedUntil <= now)
    if (healthyKeys.length === 0) {
      // If all keys in pool are throttled, do NOT return a rate-limited key to prevent 429 infinite loops
      return null
    }

    // Round-robin selection based on lowest usage count
    healthyKeys.sort((a, b) => a.usageCount - b.usageCount)
    const selected = healthyKeys[0]
    selected.usageCount += 1
    return selected.rawKey
  }

  public isProviderThrottled(provider: string): boolean {
    const pool = this.keyPools.get(provider)
    if (!pool || pool.length === 0) return false
    const now = Date.now()
    return pool.every(k => k.rateLimitedUntil > now)
  }

  public markRateLimited(provider: string, rawKey: string, cooldownMs = 60000): void {
    const pool = this.keyPools.get(provider)
    if (!pool) return

    const keyEntry = pool.find(k => k.rawKey === rawKey)
    if (keyEntry) {
      keyEntry.rateLimitedUntil = Date.now() + cooldownMs
      console.warn(`🔒 [VirtualKeyVault] Key ${keyEntry.virtualId} throttled. Cooling down for ${cooldownMs / 1000}s.`)
    }
  }

  public getPoolStats(provider: string): { total: number; healthy: number; throttled: number } {
    const pool = this.keyPools.get(provider) || []
    const now = Date.now()
    const healthy = pool.filter(k => k.rateLimitedUntil <= now).length
    return {
      total: pool.length,
      healthy,
      throttled: pool.length - healthy
    }
  }
}

export const virtualKeyVault = VirtualKeyVault.getInstance()

// Auto-seed key vault from active environment
if (process.env.GROQ_API_KEY) virtualKeyVault.registerKey('groq', process.env.GROQ_API_KEY)
if (process.env.GEMINI_API_KEY) virtualKeyVault.registerKey('gemini', process.env.GEMINI_API_KEY)
if (process.env.OPENROUTER_API_KEY) virtualKeyVault.registerKey('openrouter', process.env.OPENROUTER_API_KEY)
