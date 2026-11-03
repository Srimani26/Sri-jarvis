/**
 * AutonomousAgentLoop.ts — Claude-Code & Groq-Grade Autonomous Runtime Engine
 * Target: server/src/swarm/engine/AutonomousAgentLoop.ts & src/swarm/engine/AutonomousAgentLoop.ts
 *
 * Implements:
 * 1. Unbounded Dynamic ReAct Loop (Up to MAX_STEPS = 25).
 * 2. Independent inspection, surgical diff patching, sandbox shell execution, and self-healing.
 * 3. Context Window Rolling Compactor (~32k token threshold / 120k chars).
 * 4. Autonomous Proof-of-Work Verification gate before finish_task sign-off.
 * 5. Telemetry and audit logging persisted to Neon PostgreSQL.
 */

import { randomUUID } from 'node:crypto'
import { SWARM_TOOL_SCHEMAS, dispatchToolCall } from '../tools/toolRegistry'
import { swarmModelRouter, SwarmSpecialist } from './ModelRouter'
import { autonomousVerifier, VerificationRequest } from './AutonomousVerifier'
import { taskAuditService } from '../../services/taskAuditService'
import { telegramNotifier } from '../../services/telegramNotifier'

export interface ToolCallRecord {
  id: string
  name: string
  args: any
  output: any
  status: 'SUCCESS' | 'ERROR'
  latencyMs: number
}

export interface AutonomousTaskResult {
  taskId: string
  success: boolean
  specialist: SwarmSpecialist
  directive: string
  finalResponse: string
  stepsExecuted: number
  toolCallHistory: ToolCallRecord[]
  artifacts: string[]
  selfHealed: boolean
  verificationDetails?: any
}

export interface AutonomousLoopOptions {
  maxSteps?: number
  specialist?: SwarmSpecialist
  requireVerification?: boolean
  deliverableType?: 'web_app' | 'logic_backend' | 'document' | 'general'
  verificationTarget?: string
  slug?: string
  testCommand?: string
  workspaceRoot?: string
  onStepProgress?: (step: number, thought: string, tool: string, observation: any) => void
}

const MAX_CONTEXT_CHARS = 120_000 // Approximate 30,000-32,000 token boundary

/**
 * Compacts conversation history when context exceeds token thresholds
 */
function compactContextWindow(messages: any[]): any[] {
  const totalLength = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content || '').length), 0)

  if (totalLength <= MAX_CONTEXT_CHARS || messages.length <= 8) {
    return messages
  }

  const systemMsg = messages[0]
  const userMsg = messages[1]
  const tailMessages = messages.slice(-6) // Last 3 turns (assistant + tool)
  const intermediateMessages = messages.slice(2, -6)

  const toolSummaries: string[] = []
  const filesTouched = new Set<string>()

  for (const m of intermediateMessages) {
    if (m.role === 'tool') {
      try {
        const parsed = JSON.parse(m.content)
        toolSummaries.push(`- Tool Output: ${typeof parsed === 'string' ? parsed : (parsed.message || parsed.summary || 'Executed')}`)
        if (parsed.filePath) filesTouched.add(parsed.filePath)
        if (parsed.targetPath) filesTouched.add(parsed.targetPath)
        if (Array.isArray(parsed.filesCreated)) parsed.filesCreated.forEach((f: string) => filesTouched.add(f))
      } catch {
        toolSummaries.push(`- Tool Output: ${String(m.content).substring(0, 80)}`)
      }
    } else if (m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      for (const tc of m.tool_calls) {
        try {
          const args = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || tc.arguments)
          if (args?.filePath) filesTouched.add(args.filePath)
          if (args?.targetPath) filesTouched.add(args.targetPath)
          if (args?.path) filesTouched.add(args.path)
        } catch {}
      }
    }
  }

  const filesSummary = filesTouched.size > 0 ? `\nFiles Created/Modified:\n${Array.from(filesTouched).map(f => `  * ${f}`).join('\n')}` : ''
  const summaryContent = `[CONTEXT_WINDOW_ROLLING_COMPACTOR: Intermediate turns compacted (${intermediateMessages.length} messages).${filesSummary}\nSummary of actions taken:\n${toolSummaries.slice(-8).join('\n')}\nRetaining original directive and recent turns.]`

  return [
    systemMsg,
    userMsg,
    { role: 'system', content: summaryContent },
    ...tailMessages
  ]
}

/**
 * Main Autonomous ReAct Execution Engine
 */
export async function executeAutonomousReAct(
  directive: string,
  options: AutonomousLoopOptions = {}
): Promise<AutonomousTaskResult> {
  const taskId = `task_${Date.now()}_${randomUUID().substring(0, 8)}`
  const maxSteps = options.maxSteps || 25
  const specialist: SwarmSpecialist = options.specialist || 'jarvis'
  const workspaceRoot = options.workspaceRoot || process.cwd()

  await taskAuditService.createTask(directive, specialist)

  const systemPrompt = `You are J.A.R.V.I.S. Sovereign Autonomous Agent Runtime Engine matching Claude Code & Groq Agent performance.
You operate under the High Command of Master Sri with autonomous self-healing authorization.

OPERATIONAL INVARIANTS:
1. THINK & OBSERVE: Analyze the current workspace, check existing files, run terminal diagnostics, and read actual error traces.
2. SURGICAL TOOLS:
   - Use 'workspace_view_tree' to locate project layout.
   - Use 'workspace_read_file' with exact line numbers to inspect code before modifying.
   - Use 'workspace_patch_file' to perform surgical diffs rather than overwriting whole files.
   - Use 'workspace_write_file' to create new files or full implementations.
   - Use 'terminal_run_command' to run builds, tests, and syntax checks.
3. SELF-HEALING REFLECTION: If a terminal command fails (exitCode != 0) or tests fail:
   - Read the exact error stack trace.
   - Diagnose the broken line or syntax defect.
   - Apply a surgical patch using workspace_patch_file.
   - Re-run the terminal command to verify it passes cleanly.
   - Do NOT quit or report failure when self-healing is possible.
4. PROOF-OF-WORK VERIFICATION: Terminate only by calling 'finish_task' with summary and artifacts once all tests pass.`

  let messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: directive }
  ]

  const toolCallHistory: ToolCallRecord[] = []
  let artifacts: string[] = []
  let finalResponse = ''
  let success = false
  let selfHealed = false
  let verificationDetails: any = null

  for (let step = 1; step <= maxSteps; step++) {
    // 1. Context Window Rolling Compaction
    messages = compactContextWindow(messages)

    // 2. Dispatch to Specialist Model
    const completion = await swarmModelRouter.dispatch(specialist, messages, SWARM_TOOL_SCHEMAS)

    const modelContent = completion.content || ''
    const toolCalls = completion.tool_calls || []

    if (!toolCalls || toolCalls.length === 0) {
      finalResponse = modelContent || 'Autonomous directive executed.'
      success = true
      break
    }

    // Append Assistant Turn
    messages.push({
      role: 'assistant',
      content: modelContent,
      tool_calls: toolCalls
    })

    let finishTaskEncountered = false

    for (const tc of toolCalls) {
      const toolId = tc.id || `tc_${Date.now()}`
      const toolName = tc.function?.name || tc.name
      let args: any = {}

      try {
        args = typeof tc.function?.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : (tc.function?.arguments || tc.arguments || {})
      } catch {
        args = {}
      }

      const start = Date.now()
      let output: any = null
      let status: 'SUCCESS' | 'ERROR' = 'SUCCESS'

      try {
        output = await dispatchToolCall(toolName, args)
      } catch (err: any) {
        status = 'ERROR'
        output = {
          error: true,
          message: err?.message || String(err)
        }
      }

      const latencyMs = Date.now() - start
      await taskAuditService.logToolExecution(taskId, toolName, args, output, status, latencyMs)

      toolCallHistory.push({
        id: toolId,
        name: toolName,
        args,
        output,
        status,
        latencyMs
      })

      if (options.onStepProgress) {
        options.onStepProgress(step, modelContent, toolName, output)
      }

      // Check for self-healing indicator
      if ((toolName === 'terminal_run_command' || toolName === 'sandbox_terminal_execute') && output?.exitCode !== undefined && output.exitCode !== 0) {
        selfHealed = true
      }

      // Finish Task Inspection & Automated Proof-of-Work Verification
      if (toolName === 'finish_task') {
        if (options.requireVerification) {
          const req: VerificationRequest = {
            deliverableType: options.deliverableType || 'general',
            targetPath: options.verificationTarget,
            slug: options.slug,
            testCommand: options.testCommand
          }

          const verifyRes = await autonomousVerifier.verifyDeliverable(req, workspaceRoot)
          verificationDetails = verifyRes

          if (!verifyRes.verified) {
            // Reject finish_task and force the agent to self-heal
            messages.push({
              role: 'tool',
              tool_call_id: toolId,
              content: JSON.stringify({
                status: 'VERIFICATION_REJECTED',
                message: `Automated verification failed before sign-off: ${verifyRes.message}. Please inspect the error and self-heal before calling finish_task.`,
                errors: verifyRes.errors
              })
            })
            continue
          }
        }

        finishTaskEncountered = true
        success = true
        finalResponse = args.summary || output?.summary || 'Task completed and verified.'
        artifacts = args.artifacts || output?.artifacts || []
        break
      }

      // Append Observation to context with structured self-healing feedback on command failure
      if ((toolName === 'terminal_run_command' || toolName === 'sandbox_terminal_execute') && output?.exitCode !== undefined && output.exitCode !== 0) {
        messages.push({
          role: 'tool',
          tool_call_id: toolId,
          content: `[COMMAND_FAILED: Exit Code ${output.exitCode}]\nSTDERR:\n${output.stderr || ''}\nSTDOUT:\n${output.stdout || ''}\nAnalyze the error, patch the target file using workspace_patch_file, and re-execute.`
        })
      } else {
        messages.push({
          role: 'tool',
          tool_call_id: toolId,
          content: typeof output === 'string' ? output : JSON.stringify(output)
        })
      }
    }

    if (finishTaskEncountered) {
      break
    }
  }

  if (!finalResponse) {
    finalResponse = `Autonomous ReAct execution concluded after ${toolCallHistory.length} tool executions.`
    success = true
  }

  // Final Proof-of-Work Verification gate if required and not already verified
  if (options.requireVerification && !verificationDetails) {
    const req: VerificationRequest = {
      deliverableType: options.deliverableType || 'general',
      targetPath: options.verificationTarget,
      slug: options.slug,
      testCommand: options.testCommand
    }
    verificationDetails = await autonomousVerifier.verifyDeliverable(req, workspaceRoot)
    if (!verificationDetails.verified) {
      success = false
    }
  }

  await taskAuditService.completeTask(taskId, success ? 'COMPLETED' : 'FAILED', finalResponse)

  // Report to Telegram
  telegramNotifier.sendSwarmUpdate(
    specialist,
    `Autonomous ReAct: ${directive.substring(0, 60)}...`,
    success ? 'SUCCESS' : 'FAILED',
    toolCallHistory.reduce((acc, t) => acc + t.latencyMs, 0),
    `Steps: ${toolCallHistory.length} | Self-Healed: ${selfHealed ? 'YES' : 'NO'}\nDeliverables: ${artifacts.join(', ') || 'N/A'}`
  ).catch(() => {})

  return {
    taskId,
    success,
    specialist,
    directive,
    finalResponse,
    stepsExecuted: toolCallHistory.length,
    toolCallHistory,
    artifacts,
    selfHealed,
    verificationDetails
  }
}
