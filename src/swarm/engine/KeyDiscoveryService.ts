/**
 * KeyDiscoveryService.ts — Automated Key Harvesting & Mock Purge Engine
 * Target: src/swarm/engine/KeyDiscoveryService.ts & server/src/swarm/engine/KeyDiscoveryService.ts
 *
 * Scans workspace files (.env*, config/*.json, process.env) for genuine, active API keys.
 * Filters out synthetic/mock placeholder strings completely.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

export interface DiscoveredKey {
  provider: 'groq' | 'gemini' | 'github' | 'openrouter' | 'deepseek' | 'deepgram' | 'elevenlabs' | 'telegram' | 'openai'
  key: string
  source: string
  healthy?: boolean
  verifiedAt?: number
}

// Strictly reject synthetic / mock dummy patterns
const MOCK_PATTERNS = [
  /^sk-abcdef/i,
  /^sk-1234/i,
  /^sk-test/i,
  /placeholder/i,
  /dummy/i,
  /mock/i,
  /^vkey_/i
]

export function isMockKey(key: string): boolean {
  if (!key || key.length < 15) return true
  for (const pat of MOCK_PATTERNS) {
    if (pat.test(key.trim())) return true
  }
  return false
}

export class KeyDiscoveryService {
  private static instance: KeyDiscoveryService
  private discoveredKeys: DiscoveredKey[] = []

  public static getInstance(): KeyDiscoveryService {
    if (!KeyDiscoveryService.instance) {
      KeyDiscoveryService.instance = new KeyDiscoveryService()
    }
    return KeyDiscoveryService.instance
  }

  /**
   * Scans workspace for genuine API credentials
   */
  public harvestKeys(workspaceRoot = process.cwd()): DiscoveredKey[] {
    const keysMap = new Map<string, DiscoveredKey>()

    // 1. Process environment variables
    this.scanProcessEnv(keysMap)

    // 2. Scan .env files
    const envFileCandidates = ['.env', '.env.local', '.env.production', '.env.development']
    for (const f of envFileCandidates) {
      const fullPath = resolve(workspaceRoot, f)
      if (existsSync(fullPath)) {
        this.parseEnvFile(fullPath, keysMap)
      }
    }

    // 3. Scan config directory if present
    const configDir = resolve(workspaceRoot, 'config')
    if (existsSync(configDir)) {
      try {
        const files = readdirSync(configDir)
        for (const file of files) {
          if (file.endsWith('.json')) {
            this.parseJsonFile(join(configDir, file), keysMap)
          }
        }
      } catch {
        // Ignore unreadable config files
      }
    }

    // Filter out mock keys
    this.discoveredKeys = Array.from(keysMap.values()).filter(k => !isMockKey(k.key))
    return this.discoveredKeys
  }

  private scanProcessEnv(keysMap: Map<string, DiscoveredKey>): void {
    const mappings: Array<{ envVar: string; provider: DiscoveredKey['provider'] }> = [
      { envVar: 'GROQ_API_KEY', provider: 'groq' },
      { envVar: 'GEMINI_API_KEY', provider: 'gemini' },
      { envVar: 'GITHUB_TOKEN', provider: 'github' },
      { envVar: 'OPENROUTER_API_KEY', provider: 'openrouter' },
      { envVar: 'DEEPSEEK_API_KEY', provider: 'deepseek' },
      { envVar: 'DEEPGRAM_API_KEY', provider: 'deepgram' },
      { envVar: 'ELEVENLABS_API_KEY', provider: 'elevenlabs' },
      { envVar: 'TELEGRAM_BOT_TOKEN', provider: 'telegram' },
      { envVar: 'OPENAI_API_KEY', provider: 'openai' }
    ]

    for (const { envVar, provider } of mappings) {
      const val = process.env[envVar]
      if (val && !isMockKey(val)) {
        keysMap.set(`${provider}:${val}`, {
          provider,
          key: val.trim(),
          source: `process.env.${envVar}`
        })
      }
    }
  }

  private parseEnvFile(filePath: string, keysMap: Map<string, DiscoveredKey>): void {
    try {
      const content = readFileSync(filePath, 'utf8')
      const lines = content.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

        const idx = trimmed.indexOf('=')
        const keyName = trimmed.substring(0, idx).trim().toUpperCase()
        const rawVal = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '')

        if (!rawVal || isMockKey(rawVal)) continue

        let provider: DiscoveredKey['provider'] | null = null

        if (keyName.includes('GROQ') || rawVal.startsWith('gsk_')) provider = 'groq'
        else if (keyName.includes('GEMINI') || rawVal.startsWith('AIza')) provider = 'gemini'
        else if (keyName.includes('GITHUB') || rawVal.startsWith('ghp_') || rawVal.startsWith('github_pat_')) provider = 'github'
        else if (keyName.includes('OPENROUTER') || rawVal.startsWith('sk-or-v1-')) provider = 'openrouter'
        else if (keyName.includes('DEEPSEEK')) provider = 'deepseek'
        else if (keyName.includes('DEEPGRAM')) provider = 'deepgram'
        else if (keyName.includes('ELEVENLABS') || rawVal.startsWith('sk_')) provider = 'elevenlabs'
        else if (keyName.includes('TELEGRAM')) provider = 'telegram'
        else if (keyName.includes('OPENAI') || rawVal.startsWith('sk-proj-')) provider = 'openai'

        if (provider) {
          keysMap.set(`${provider}:${rawVal}`, {
            provider,
            key: rawVal,
            source: filePath
          })
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  private parseJsonFile(filePath: string, keysMap: Map<string, DiscoveredKey>): void {
    try {
      const content = readFileSync(filePath, 'utf8')
      const json = JSON.parse(content)

      const inspect = (obj: any) => {
        if (!obj || typeof obj !== 'object') return
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            const val = v.trim()
            if (isMockKey(val)) continue
            if (val.startsWith('gsk_')) keysMap.set(`groq:${val}`, { provider: 'groq', key: val, source: filePath })
            if (val.startsWith('AIza')) keysMap.set(`gemini:${val}`, { provider: 'gemini', key: val, source: filePath })
            if (val.startsWith('ghp_')) keysMap.set(`github:${val}`, { provider: 'github', key: val, source: filePath })
          } else if (typeof v === 'object') {
            inspect(v)
          }
        }
      }

      inspect(json)
    } catch {
      // Ignore JSON parse errors
    }
  }

  public getKeysForProvider(provider: DiscoveredKey['provider']): DiscoveredKey[] {
    return this.discoveredKeys.filter(k => k.provider === provider)
  }

  public getAllDiscoveredKeys(): DiscoveredKey[] {
    return this.discoveredKeys
  }
}

export const keyDiscoveryService = KeyDiscoveryService.getInstance()

