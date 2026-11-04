import { describe, it } from 'node:test'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { taskAuditService } from '../server/src/services/taskAuditService'
import { virtualKeyVault } from '../server/src/security/SecretSanitizer'
import { executeAutonomousReAct } from '../server/src/swarm/engine/AutonomousAgentLoop'
import { swarmModelRouter } from '../server/src/swarm/engine/ModelRouter'

describe('Database UUID Task Syntax & 429 Lockup Prevention Suite', () => {
  describe('Criterion 1: Enforce RFC 4122 UUID Format Across All Tasks', () => {
    it('should validate and enforce RFC 4122 UUID format in taskAuditService', async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      // Standard UUID
      const testUuid = randomUUID()
      assert.strictEqual(taskAuditService.isValidUUID(testUuid), true)
      assert.strictEqual(taskAuditService.ensureValidUUID(testUuid), testUuid)

      // Legacy string ID must map to valid UUID
      const legacyId = `task_${Date.now()}_abc12345`
      assert.strictEqual(taskAuditService.isValidUUID(legacyId), false)
      const mappedUuid = taskAuditService.ensureValidUUID(legacyId)
      assert.ok(uuidRegex.test(mappedUuid))
      // Deterministic mapping for subsequent tool execution logs
      assert.strictEqual(taskAuditService.ensureValidUUID(legacyId), mappedUuid)
    })

    it('should assign a valid RFC 4122 UUID to autonomous tasks in AutonomousAgentLoop', async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      const taskId = await taskAuditService.createTask('Verify UUID format', 'jarvis')
      assert.ok(uuidRegex.test(taskId))

      await taskAuditService.logToolExecution(
        taskId,
        'terminal_run_command',
        { command: 'echo hello' },
        { stdout: 'hello\n' },
        'SUCCESS',
        25
      )

      await taskAuditService.completeTask(taskId, 'COMPLETED', 'All checks passed')

      const task = taskAuditService.getTask(taskId)
      assert.ok(task)
      assert.strictEqual(task.status, 'COMPLETED')
      assert.strictEqual(task.id, taskId)
    })
  })

  describe('Criterion 2: Stop 429 Infinite Retry Loop in ModelRouter', () => {
    it('should return null from getActiveKey when all provider keys are throttled', () => {
      const provider = 'mock_throttled_provider'
      const key = 'mock_key_12345'
      virtualKeyVault.registerKey(provider, key)

      // Initially active
      assert.strictEqual(virtualKeyVault.getActiveKey(provider), key)
      assert.strictEqual(virtualKeyVault.isProviderThrottled(provider), false)

      // Throttled on 429
      virtualKeyVault.markRateLimited(provider, key, 30000)

      // Must be marked throttled
      assert.strictEqual(virtualKeyVault.isProviderThrottled(provider), true)
      // Must NOT return the throttled key (prevents 429 infinite retry loop)
      assert.strictEqual(virtualKeyVault.getActiveKey(provider), null)
    })

    it('should route seamlessly to active tier when primary tier is throttled', async () => {
      // Mark Groq as throttled
      const activeGroqKey = process.env.GROQ_API_KEY || 'dummy_groq_key'
      virtualKeyVault.registerKey('groq', activeGroqKey)
      virtualKeyVault.markRateLimited('groq', activeGroqKey, 30000)

      assert.strictEqual(virtualKeyVault.isProviderThrottled('groq'), true)

      // Dispatch should bypass Groq immediately and fall back to Gemini or sandbox
      const completion = await swarmModelRouter.dispatch('jarvis', [{ role: 'user', content: 'health check' }], [])
      assert.ok(completion)
      assert.notStrictEqual(completion.provider, 'groq-cloud')
      assert.ok(completion.tier >= 3)
    })
  })
})

