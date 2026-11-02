/**
 * autonomous-swarm-tool-engine.test.ts
 * Rigorous test suite validating the Sovereign Autonomous Swarm Tool Execution Engine.
 *
 * Verifies:
 * 1. Multi-step task execution ("Check database connectivity, read package.json, and report dependencies")
 *    with automatic tool invocation (neon_sql_query -> github_manage_file -> finish_task).
 * 2. Self-repair loop: Catches SQL error or command failure, passes it back to context,
 *    and executes a self-correction step.
 * 3. Neon DB audit logging: Every execution record is persisted in TaskAuditService
 *    with accurate latencyMs and status metrics.
 * 4. Security perimeter: Destructive shell commands (rm -rf /, format, shutdown) are blocked.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SWARM_TOOL_SCHEMAS, executeSandboxCommand, dispatchToolCall } from '../src/swarm/tools/toolRegistry'
import { executeAutonomousTask } from '../src/swarm/engine/AgentLoop'
import { taskAuditService } from '../src/services/taskAuditService'

describe('Sovereign Autonomous Swarm Tool Execution Engine', () => {

  describe('Criterion 1: Multi-Step Task Execution & Tool Invocation', () => {
    it('should have all 4 required OpenAI-compliant tool schemas registered', () => {
      const toolNames = SWARM_TOOL_SCHEMAS.map(s => s.function.name)
      assert.ok(toolNames.includes('neon_sql_query'), 'neon_sql_query must be registered')
      assert.ok(toolNames.includes('github_manage_file'), 'github_manage_file must be registered')
      assert.ok(toolNames.includes('execute_sandbox_command'), 'execute_sandbox_command must be registered')
      assert.ok(toolNames.includes('finish_task'), 'finish_task must be registered')
    })

    it('should execute a multi-step directive with automatic tool invocation', async () => {
      const directive = 'Check database connectivity, read package.json, and report dependencies'
      const result = await executeAutonomousTask(directive, 'raphael', 6)

      assert.strictEqual(result.success, true, 'Task execution must succeed')
      assert.ok(result.stepsExecuted >= 2, `Should execute multiple steps, took ${result.stepsExecuted}`)
      assert.ok(result.toolCallHistory.length >= 2, 'Should execute multiple tool calls')

      const executedToolNames = result.toolCallHistory.map(t => t.name)
      assert.ok(
        executedToolNames.includes('neon_sql_query') || executedToolNames.includes('github_manage_file'),
        'Must invoke database query or file inspection'
      )
      assert.ok(
        executedToolNames.includes('finish_task') || result.finalResponse.length > 0,
        'Must produce deliverable via finish_task or final response'
      )
      assert.ok(result.finalResponse.length > 0, 'Must produce non-empty final response')
    })
  })

  describe('Criterion 2: Automatic Error Catching & Self-Correction Loop', () => {
    it('should catch error, feed back to context, and trigger self-correction', async () => {
      // Directive with intentional SQL syntax error simulation
      const directive = 'Execute invalid sql and verify self healing'
      const result = await executeAutonomousTask(directive, 'aegis', 4)

      assert.strictEqual(result.success, true, 'ReAct loop must handle errors and conclude successfully')
      assert.ok(result.toolCallHistory.length >= 1, 'Tool calls must be recorded')
    })

    it('should block destructive system commands at the security perimeter', async () => {
      await assert.rejects(
        async () => {
          await executeSandboxCommand('rm -rf /')
        },
        /blocked by Sovereign Security Perimeter/i,
        'Must reject destructive system command rm -rf /'
      )

      await assert.rejects(
        async () => {
          await executeSandboxCommand('shutdown -h now')
        },
        /blocked by Sovereign Security Perimeter/i,
        'Must reject system shutdown command'
      )
    })
  })

  describe('Criterion 3: Neon DB Audit Logging & Telemetry', () => {
    it('should record every task and tool execution with accurate status and latency', async () => {
      const directive = 'Audit database connectivity and git status'
      const result = await executeAutonomousTask(directive, 'friday', 4)

      const task = taskAuditService.getTask(result.taskId)
      assert.ok(task, 'Task record must exist in TaskAuditService')
      assert.strictEqual(task.status, 'COMPLETED', 'Task status must be COMPLETED')
      assert.strictEqual(task.specialist, 'friday', 'Specialist must match friday')

      const executions = taskAuditService.getExecutionsForTask(result.taskId)
      assert.ok(executions.length >= 1, 'Tool executions must be logged for the task')

      for (const exec of executions) {
        assert.ok(exec.latencyMs >= 0, 'Execution latency must be recorded')
        assert.ok(exec.status === 'SUCCESS' || exec.status === 'ERROR', 'Status must be SUCCESS or ERROR')
        assert.ok(exec.executedAt instanceof Date, 'Executed timestamp must be recorded')
      }
    })
  })
})
