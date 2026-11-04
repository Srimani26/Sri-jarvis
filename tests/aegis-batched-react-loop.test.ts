import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AEGIS_SYSTEM_PROMPT, getAegisSystemPrompt } from '../server/src/swarm/specialists/AegisSpecialist'
import { executeAutonomousReAct } from '../server/src/swarm/engine/AutonomousAgentLoop'
import { dispatchToolCall } from '../server/src/swarm/tools/toolRegistry'

describe('Aegis Batched ReAct Loop & Auto-Completion Gate Suite', () => {
  describe('Criterion 1: Enforce Batched Writing in Aegis Directive', () => {
    it('should include batched writing instructions in Aegis system prompt', () => {
      const prompt = getAegisSystemPrompt()
      assert.ok(prompt.includes('Do NOT call exploratory read/search tools across multiple turns'))
      assert.ok(prompt.includes("Turn 1: Write 'index.html'"))
      assert.ok(prompt.includes("Turn 2: Write 'app.js'"))
      assert.ok(prompt.includes("Turn 3: Call 'finish_task' (or 'complete_task') with the live preview mount path"))
      assert.ok(prompt.includes('NEVER exceed 5 tool calls for standard single-page applications'))
    })
  })

  describe('Criterion 2: Step Headroom & Dynamic Coding Step Allocation', () => {
    it('should allocate 35 maxSteps headroom for coding tasks', async () => {
      const result = await executeAutonomousReAct('Build a responsive currency converter widget web app', {
        maxSteps: 35,
        deliverableType: 'web_app',
        requireVerification: false
      })

      assert.ok(result.taskId)
      assert.strictEqual(result.specialist, 'aegis')
      assert.strictEqual(result.success, true)
      assert.ok(result.stepsExecuted <= 35)
    })
  })

  describe('Criterion 3: Tool Support for complete_task & Auto-Completion Gate', () => {
    it('should support complete_task as an explicit finish alias', async () => {
      const res = await dispatchToolCall('complete_task', {
        summary: 'Web dashboard scaffolded and verified.',
        previewUrl: '/preview/test_dashboard'
      })

      assert.strictEqual(res.completed, true)
      assert.strictEqual(res.summary, 'Web dashboard scaffolded and verified.')
      assert.ok(Array.isArray(res.artifacts))
      assert.ok(res.artifacts.includes('/preview/test_dashboard'))
    })

    it('should auto-complete web app execution when scaffold and deploy tool finishes', async () => {
      const result = await executeAutonomousReAct('Scaffold crypto ticker dashboard', {
        specialist: 'aegis',
        deliverableType: 'web_app',
        requireVerification: false
      })

      assert.strictEqual(result.success, true)
      assert.ok(result.stepsExecuted <= 5, `Expected <= 5 steps for single-page app, got ${result.stepsExecuted}`)
    })
  })
})

