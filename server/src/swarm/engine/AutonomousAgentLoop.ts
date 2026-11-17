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
import { AEGIS_SYSTEM_PROMPT } from '../specialists/AegisSpecialist'
import { CEREBRO_SYSTEM_PROMPT } from '../specialists/CerebroSpecialist'
import { RAPHAEL_SYSTEM_PROMPT } from '../specialists/RaphaelSpecialist'
import { MIDAS_SYSTEM_PROMPT } from '../specialists/MidasSpecialist'
import { FRIDAY_SYSTEM_PROMPT } from '../specialists/FridaySpecialist'
import { classifyMissionOutcome, type MissionStatus } from '../../../../src/kernel/missionLifecycle'
import { createMissionLoopGuard, MISSION_APPROVAL_SENTINEL, type MissionLoopContext } from '../../../../src/kernel/MissionLoopGuard'

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
  status: MissionStatus
  specialist: SwarmSpecialist
  directive: string
  finalResponse: string
  stepsExecuted: number
  toolCallHistory: ToolCallRecord[]
  artifacts: string[]
  selfHealed: boolean
  verificationDetails?: any
  /** Set when a consequential action paused the loop for approval. */
  pendingApprovalId?: string
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
  modelDispatch?: (specialist: SwarmSpecialist, messages: any[], tools: any[]) => Promise<{ content?: string; tool_calls?: any[] }>
  toolDispatch?: (toolName: string, args: any) => Promise<any>
  verifyDeliverable?: (request: VerificationRequest, root: string) => Promise<any>
  createTask?: (directive: string, specialist: SwarmSpecialist, taskId: string) => Promise<any>
  logToolExecution?: (taskId: string, tool: string, args: any, output: any, status: 'SUCCESS' | 'ERROR', latencyMs: number) => Promise<any>
  completeTask?: (taskId: string, status: 'COMPLETED' | 'FAILED' | 'BLOCKED', result: string) => Promise<any>
  /**
   * Route tool calls through the mission dispatch boundary. Without it the loop
   * keeps its legacy behaviour; with it, consequential tools pause for approval.
   */
  mission?: MissionLoopContext
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
  // Enforce RFC 4122 UUID format across all tasks
  const taskId = randomUUID()

  const lowerDirective = directive.toLowerCase()
  const isCodingTask = options.specialist === 'aegis' ||
    options.deliverableType === 'web_app' ||
    options.deliverableType === 'logic_backend' ||
    lowerDirective.includes('build') ||
    lowerDirective.includes('create') ||
    lowerDirective.includes('app') ||
    lowerDirective.includes('web') ||
    lowerDirective.includes('code') ||
    lowerDirective.includes('scaffold') ||
    lowerDirective.includes('dashboard') ||
    lowerDirective.includes('refactor')

  const taskType = isCodingTask ? 'coding' : 'general'
  const maxSteps = options.maxSteps || (taskType === 'coding' ? 35 : 25)
  const specialist: SwarmSpecialist = options.specialist || (isCodingTask ? 'aegis' : 'jarvis')
  const workspaceRoot = options.workspaceRoot || process.cwd()
  const modelDispatch = options.modelDispatch || ((agent, history, tools) => swarmModelRouter.dispatch(agent, history, tools))
  const toolDispatch = options.toolDispatch || dispatchToolCall
  const missionGuard = options.mission ? createMissionLoopGuard(options.mission, toolDispatch) : null
  const verifyDeliverable = options.verifyDeliverable || ((request, root) => autonomousVerifier.verifyDeliverable(request, root))
  const createTask = options.createTask || ((request, agent, id) => taskAuditService.createTask(request, agent, id))
  const logToolExecution = options.logToolExecution || ((id, tool, args, output, status, latency) => taskAuditService.logToolExecution(id, tool, args, output, status, latency))
  const completeTask = options.completeTask || ((id, status, result) => taskAuditService.completeTask(id, status, result))

  await createTask(directive, specialist, taskId)

  let systemPrompt = `You are J.A.R.V.I.S. Sovereign Autonomous Agent Runtime Engine matching Claude Code & Groq Agent performance.
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
4. PROOF-OF-WORK VERIFICATION: Terminate only by calling 'finish_task' (or 'complete_task') with summary and artifacts once all tests pass.`

  if (specialist === 'aegis') {
    systemPrompt = `${AEGIS_SYSTEM_PROMPT}\n\n${systemPrompt}`
  } else if (specialist === 'cerebro') {
    systemPrompt = `${CEREBRO_SYSTEM_PROMPT}\n\n${systemPrompt}`
  } else if (specialist === 'raphael') {
    systemPrompt = `${RAPHAEL_SYSTEM_PROMPT}\n\n${systemPrompt}`
  } else if (specialist === 'midas') {
    systemPrompt = `${MIDAS_SYSTEM_PROMPT}\n\n${systemPrompt}`
  } else if (specialist === 'friday') {
    systemPrompt = `${FRIDAY_SYSTEM_PROMPT}\n\n${systemPrompt}`
  } else if (taskType === 'coding') {
    systemPrompt = `${AEGIS_SYSTEM_PROMPT}\n\n${systemPrompt}`
  }

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
  let terminalIntentReceived = false
  let awaitingApproval = false
  let pendingApprovalId: string | undefined
  let executionState: 'IDLE' | 'RUNNING' | 'ERROR' | 'EXHAUSTED' = 'EXHAUSTED'
  let discoveredSlug = options.slug || ''
  const filesWritten: string[] = []

  for (let step = 1; step <= maxSteps; step++) {
    // 1. Context Window Rolling Compaction
    messages = compactContextWindow(messages)

    // 2. Dispatch to Specialist Model
    const completion = await modelDispatch(specialist, messages, SWARM_TOOL_SCHEMAS)

    const modelContent = completion.content || ''
    const toolCalls = completion.tool_calls || []

    if (!toolCalls || toolCalls.length === 0) {
      finalResponse = modelContent || 'No action was executed.'
      executionState = 'IDLE'
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
        output = missionGuard ? await missionGuard.dispatch(toolName, args) : await toolDispatch(toolName, args)
        if (output && typeof output === 'object' && output[MISSION_APPROVAL_SENTINEL] === true) {
          awaitingApproval = true
          pendingApprovalId = output.approvalId
          finalResponse = `Mission paused for approval. ${output.summary ?? ''}`.trim()
          executionState = 'IDLE'
        }
      } catch (err: any) {
        status = 'ERROR'
        output = {
          error: true,
          message: err?.message || String(err)
        }
      }

      const latencyMs = Date.now() - start
      await logToolExecution(taskId, toolName, args, output, status, latencyMs)

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

      if (awaitingApproval) break

      // Track created artifacts, slugs, and files
      if (output?.previewUrl && typeof output.previewUrl === 'string') {
        if (!artifacts.includes(output.previewUrl)) artifacts.push(output.previewUrl)
        const m = output.previewUrl.match(/\/preview\/([a-zA-Z0-9_-]+)/)
        if (m) discoveredSlug = m[1]
      }
      if (output?.filePath && typeof output.filePath === 'string') {
        if (!artifacts.includes(output.filePath)) artifacts.push(output.filePath)
        filesWritten.push(output.filePath)
      }
      if (args?.filePath && typeof args.filePath === 'string') {
        filesWritten.push(args.filePath)
        const m = args.filePath.match(/artifacts[/\\]builds[/\\]([^/\\]+)/)
        if (m) discoveredSlug = m[1]
      }
      if (args?.projectSlug && typeof args.projectSlug === 'string') {
        discoveredSlug = args.projectSlug
      }

      // Check for self-healing indicator
      if ((toolName === 'terminal_run_command' || toolName === 'sandbox_terminal_execute') && output?.exitCode !== undefined && output.exitCode !== 0) {
        selfHealed = true
      }

      // Finish Task Inspection & Automated Proof-of-Work Verification (supports finish_task & complete_task)
      if ((toolName === 'finish_task' || toolName === 'complete_task') && status === 'SUCCESS' && output?.success !== false) {
        const targetSlug = discoveredSlug || options.slug || 'app-preview'
        if (options.requireVerification) {
          const req: VerificationRequest = {
            deliverableType: options.deliverableType || 'general',
            targetPath: options.verificationTarget,
            slug: targetSlug,
            testCommand: options.testCommand
          }

          const verifyRes = await verifyDeliverable(req, workspaceRoot)
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
        terminalIntentReceived = true
        executionState = 'IDLE'
        finalResponse = args.summary || output?.summary || 'Task completed.'
        if (Array.isArray(args.artifacts)) artifacts.push(...args.artifacts)
        if (args.previewUrl && !artifacts.includes(args.previewUrl)) artifacts.push(args.previewUrl)
        if (targetSlug && options.deliverableType === 'web_app' && !artifacts.includes(`/preview/${targetSlug}`)) {
          artifacts.push(`/preview/${targetSlug}`)
        }
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

    if (finishTaskEncountered || awaitingApproval) {
      break
    }
  }

  if (!finalResponse) {
    finalResponse = `Mission did not complete: execution reached its step limit after ${toolCallHistory.length} tool actions without a finish signal.`
  }

  // Final Proof-of-Work Verification gate if required and not already verified
  if (terminalIntentReceived && options.requireVerification && !verificationDetails) {
    const targetSlug = discoveredSlug || options.slug || 'app-preview'
    const req: VerificationRequest = {
      deliverableType: options.deliverableType || 'general',
      targetPath: options.verificationTarget,
      slug: targetSlug,
      testCommand: options.testCommand
    }
    verificationDetails = await verifyDeliverable(req, workspaceRoot)
    if (verificationDetails.verified) {
      if (options.deliverableType === 'web_app') {
        const previewPath = `/preview/${targetSlug}`
        if (!artifacts.includes(previewPath)) artifacts.push(previewPath)
      }
    }
  }

  const status = classifyMissionOutcome({
    executedActions: toolCallHistory.length,
    terminalIntentReceived,
    executionState,
    verification: !options.requireVerification
      ? 'NOT_REQUIRED'
      : verificationDetails?.verified
        ? 'PASSED'
        : verificationDetails
          ? 'FAILED'
          : 'NOT_RUN',
    awaitingApproval,
  })
  success = status === 'COMPLETED'
  if (!success && !terminalIntentReceived && !awaitingApproval && !finalResponse.startsWith('Mission did not complete:')) {
    finalResponse = `Mission did not complete: ${finalResponse}`
  }

  const auditStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'BLOCKED'
  await completeTask(taskId, auditStatus, finalResponse)

  // Report to Telegram
  telegramNotifier.sendSwarmUpdate(
    specialist,
    `Autonomous ReAct: ${directive.substring(0, 60)}...`,
    status === 'COMPLETED' ? 'SUCCESS' : status === 'BLOCKED' ? 'BLOCKED' : 'FAILED',
    toolCallHistory.reduce((acc, t) => acc + t.latencyMs, 0),
    `Steps: ${toolCallHistory.length} | Self-Healed: ${selfHealed ? 'YES' : 'NO'}\nDeliverables: ${artifacts.join(', ') || 'N/A'}`
  ).catch(() => {})

  return {
    taskId,
    success,
    status,
    specialist,
    directive,
    finalResponse,
    stepsExecuted: toolCallHistory.length,
    toolCallHistory,
    artifacts,
    selfHealed,
    verificationDetails,
    pendingApprovalId
  }
}
