/**
 * KeyPoolManager.ts — Sovereign Multi-Key Ingestion & Zero-Trust Pool Vault
 * Target: src/security/KeyPoolManager.ts & server/src/security/KeyPoolManager.ts
 *
 * Discovers and registers only genuine, non-synthetic API credentials.
 * Mock/placeholder strings are purged completely.
 */

import { virtualKeyVault } from './SecretSanitizer'
import { keyDiscoveryService, DiscoveredKey } from '../swarm/engine/KeyDiscoveryService'

export interface KeyPoolSummary {
  registeredCount: number
  providers: string[]
  details: Record<string, number>
}

/**
 * Harvests and registers genuine workspace credentials into VirtualKeyVault
 */
export function initializeMasterKeyPool(workspaceRoot = process.cwd()): KeyPoolSummary {
  const discovered = keyDiscoveryService.harvestKeys(workspaceRoot)
  const details: Record<string, number> = {}

  for (const item of discovered) {
    if (item.key && item.key.trim()) {
      virtualKeyVault.registerKey(item.provider, item.key.trim())
      details[item.provider] = (details[item.provider] || 0) + 1
    }
  }

  const providers = Object.keys(details)
  const total = Object.values(details).reduce((a, b) => a + b, 0)

  return {
    registeredCount: total,
    providers,
    details
  }
}

// Auto-register genuine keys on load
initializeMasterKeyPool()
