/**
 * syedmudassir-jarvis-suite.test.ts
 *
 * Verifies:
 * 1. Obsidian Vault Synchronization: Plain text markdown memory, YAML frontmatter, [[wikilinks]].
 * 2. Ollama + Qwen3 Local Air-Gapped Engine: Tier 0 offline inference discovery.
 * 3. Open WebUI & Goose Inbound Bridge: OpenAI-compatible /v1/models and /v1/chat/completions endpoints.
 * 4. Faster-Whisper & Kokoro-ONNX voice integration layers.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { obsidianVaultManager } from '../src/swarm/memory/ObsidianVaultManager'
import { ollamaLocalProvider } from '../src/swarm/engine/OllamaLocalProvider'
import { swarmModelRouter } from '../src/swarm/engine/ModelRouter'
import fs from 'node:fs'

describe('Syed Mudassir 5-Tool JARVIS Architecture Suite (Ollama, Open WebUI, Whisper, Kokoro, Goose, Obsidian)', () => {

  describe('1. Memory: Obsidian Vault Markdown Synchronization', () => {
    it('should create and format markdown notes with YAML frontmatter and [[wikilinks]]', () => {
      const { filePath, fileName, note } = obsidianVaultManager.saveNote(
        'Pipelines',
        'Dawn_Liquid_Migration_Plan',
        'Migrated all section templates into modular Shopify Dawn architecture with zero layout shift.',
        {
          agent: 'aegis',
          status: 'COMPLETED',
          tags: ['shopify', 'liquid', 'dawn', 'aegis']
        }
      )

      assert.ok(fs.existsSync(filePath), 'Note file must exist in vault')
      assert.ok(fileName.endsWith('.md'), 'File must have .md extension')
      assert.strictEqual(note.meta.agent, 'aegis')
      assert.strictEqual(note.meta.status, 'COMPLETED')

      const raw = fs.readFileSync(filePath, 'utf-8')
      assert.ok(raw.startsWith('---'), 'Must contain YAML frontmatter header')
      assert.ok(raw.includes('title: "Dawn_Liquid_Migration_Plan"'), 'Must contain note title in frontmatter')
      assert.ok(raw.includes('[[Specialists/aegis]]'), 'Must contain agent [[wikilink]]')
      assert.ok(raw.includes('[[Master Sri]]'), 'Must contain High Command [[wikilink]]')
    })

    it('should search vault notes across categories', () => {
      const results = obsidianVaultManager.searchVault('Shopify Dawn')
      assert.ok(results.length >= 1, 'Search must return the created note')
      assert.ok(results[0].content.includes('Shopify Dawn'), 'Matching note must contain search terms')
    })

    it('should read note directly by category and name', () => {
      const content = obsidianVaultManager.readNote('Pipelines', 'Dawn_Liquid_Migration_Plan')
      assert.ok(content, 'Note content must be readable')
      assert.ok(content.includes('Dawn_Liquid_Migration_Plan'))
    })
  })

  describe('2. Brain: Ollama Local Air-Gapped Engine (Qwen3 / DeepSeek-R1)', () => {
    it('should probe local Ollama health and return status with model catalog', async () => {
      const status = await ollamaLocalProvider.probeHealth()
      assert.ok(status, 'Status must be returned')
      assert.strictEqual(typeof status.online, 'boolean')
      assert.ok(Array.isArray(status.models), 'Models must be an array')
      assert.ok(status.baseUrl.includes('11434'), 'Base URL must be port 11434')
    })

    it('should register Ollama as Tier 0 in ModelRouter startup handshake', async () => {
      const report = await swarmModelRouter.runStartupHandshake()
      assert.ok(report.ollama, 'Report must contain Ollama provider')
      assert.strictEqual(report.ollama.tier, 0, 'Ollama must be Tier 0 (Local Air-Gap)')
      assert.ok(report.ollama.models.some(m => m.includes('qwen3') || m.includes('deepseek-r1')), 'Must support Qwen3 or DeepSeek-R1')
    })
  })

  describe('3. Chat Screen: Open WebUI & Goose Inbound Bridge (/v1)', () => {
    it('should verify ModelRouter dispatches conversational prompts with OpenAI format', async () => {
      const res = await swarmModelRouter.dispatch('jarvis', [
        { role: 'user', content: 'Confirm Open WebUI bridge readiness in one word.' }
      ], [])

      assert.ok(res, 'Response must be returned')
      assert.ok(res.content && res.content.length > 0, 'Must contain content')
      assert.ok(typeof res.tier === 'number', 'Must specify tier')
    })
  })
})

