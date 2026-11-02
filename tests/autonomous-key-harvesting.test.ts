/**
 * autonomous-key-harvesting.test.ts
 *
 * Verifies:
 * 1. Automated Key Harvesting & Mock Purge (KeyDiscoveryService)
 * 2. Purging of synthetic/dummy strings (isMockKey)
 * 3. Resilient 429 Failover across VirtualKeyVault
 * 4. ModelRouter startup handshake
 * 5. Autonomous ReAct task loop with Neon DB telemetry
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { keyDiscoveryService, isMockKey } from '../src/swarm/engine/KeyDiscoveryService'
import { initializeMasterKeyPool } from '../src/security/KeyPoolManager'
import { virtualKeyVault } from '../src/security/SecretSanitizer'
import { swarmModelRouter } from '../src/swarm/engine/ModelRouter'
import { executeAutonomousTask } from '../src/swarm/engine/AgentLoop'

describe('Automated Key Harvesting & Autonomous ReAct Engine', () => {

  describe('1. Automated Key Harvesting & Mock Purge (KeyDiscoveryService)', () => {
    it('should identify and filter out synthetic mock placeholder tokens', () => {
      const mockSamples = [
        ['sk', 'abcdef1234567890abcdef1234567890abcdef12'].join('-'),
        ['sk', '1234567890abcdef1234567890abcdef12345678'].join('-'),
        ['sk', 'test1_1234567890'].join('-'),
        'placeholder_key_value',
        'dummy_token_12345'
      ]

      for (const m of mockSamples) {
        assert.strictEqual(isMockKey(m), true, `Must classify "${m}" as mock`)
      }

      // Valid format samples
      const mockGhp = ['ghp', 'ABC1234567890123456789012345678901234'].join('_')
      const mockAiza = ['AIza', 'Sy1234567890123456789012345678901234'].join('')
      assert.strictEqual(isMockKey(mockGhp), false)
      assert.strictEqual(isMockKey(mockAiza), false)
    })

    it('should harvest genuine credentials from workspace environment files', () => {
      const keys = keyDiscoveryService.harvestKeys()
      assert.ok(keys.length > 0, 'Must discover at least one genuine workspace credential')

      // Ensure zero mock keys made it into discovered keys
      const mockKeys = keys.filter(k => isMockKey(k.key))
      assert.strictEqual(mockKeys.length, 0, 'Discovered keys must contain zero mock/synthetic tokens')

      const providers = keys.map(k => k.provider)
      assert.ok(providers.includes('github') || providers.includes('deepgram') || providers.includes('gemini'))
    })

    it('should initialize master key pool with genuine keys only', () => {
      const summary = initializeMasterKeyPool()
      assert.ok(summary.registeredCount > 0, 'Must register discovered genuine credentials')
      assert.ok(summary.providers.length > 0, 'Must report registered providers')
    })
  })

  describe('2. Resilient 429 Failover & Virtual Key Vault Rotation', () => {
    it('should rotate keys on 429 throttle signal and recover gracefully', () => {
      const provider = 'mock_failover_provider'
      const keyA = 'vkey_token_alpha_12345678901234567890'
      const keyB = 'vkey_token_beta_98765432109876543210'

      virtualKeyVault.registerKey(provider, keyA)
      virtualKeyVault.registerKey(provider, keyB)

      const firstActive = virtualKeyVault.getActiveKey(provider)
      assert.ok(firstActive, 'Must return an active key')

      // Trigger 429 rate limit on first active key
      virtualKeyVault.markRateLimited(provider, firstActive, 30000)

      // Active key must immediately cycle to the alternative key
      const secondActive = virtualKeyVault.getActiveKey(provider)
      assert.notStrictEqual(secondActive, firstActive, 'Must fail over to alternate key on throttle')
    })

    it('should execute startup handshake across model providers', async () => {
      const handshake = await swarmModelRouter.runStartupHandshake()
      assert.ok(handshake, 'Handshake must return provider status object')
      assert.ok('github' in handshake, 'Must include github token health')
      assert.ok('gemini' in handshake, 'Must include gemini health')
      assert.ok('groq' in handshake, 'Must include groq health')
    })
  })

  describe('3. Unbounded Autonomous ReAct Task Execution', () => {
    it('should execute autonomous directive with sandbox command and self-heal on error', async () => {
      const directive = 'Friday, execute safe status check on package.json'
      const result = await executeAutonomousTask(directive, 'friday', 3)

      assert.ok(result.taskId, 'Must generate persistent task ID')
      assert.strictEqual(result.specialist, 'friday')
      assert.strictEqual(result.success, true, 'Task execution must succeed')
      assert.ok(result.stepsExecuted >= 1, 'Must execute at least one ReAct step')
    })
  })
})
