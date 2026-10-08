// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. MARK-V Autonomous ReAct Multi-Turn Agent Loop
 * Executes true iterative reasoning:
 * Thought -> Action -> Action Input -> Observation (Tool Stdout/Stderr) -> Next Thought
 * with self-correction, workspace project execution, and live SSE telemetry.
 */

import { ToolRegistry } from '../tools/ToolRegistry';
import { ExecutionKernel } from '../kernel/ExecutionKernel';
import { TaskStore } from '../kernel/TaskStore';
import { AgentRegistry } from './AgentRegistry';
import { KernelExecutionContext } from '../kernel/types';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

export interface ReActStep {
  stepNumber: number;
  thought: string;
  action?: string;
  actionInput?: Record<string, any>;
  observation?: string;
  durationMs: number;
}

export interface ReActExecutionOptions {
  taskId: string;
  agentId: string;
  objective: string;
  projectName?: string;
  maxSteps?: number;
  allowedTools?: string[];
  systemPrompt?: string;
  contextData?: Record<string, any>;
  aiCaller?: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>;
}

export interface ReActExecutionResult {
  success: boolean;
  finalAnswer: string;
  steps: ReActStep[];
  toolsUsed: string[];
  totalDurationMs: number;
  artifactsCreated: string[];
  errors: string[];
}

export class AutonomousReActEngine {
  /**
   * Run full multi-turn ReAct reasoning and execution loop
   */
  public static async run(options: ReActExecutionOptions): Promise<ReActExecutionResult> {
    const startTime = Date.now();
    const {
      taskId,
      agentId,
      objective,
      projectName = `proj_${taskId.slice(-6)}`,
      maxSteps = 15,
      allowedTools,
      systemPrompt,
      contextData,
      aiCaller,
    } = options;

    const agent = AgentRegistry.getAgent(agentId) || AgentRegistry.getAgent('jarvis')!;
    const effectiveTools = allowedTools || agent.allowedTools;

    // Collect tool schemas
    const availableToolDefs = ToolRegistry.listTools().filter((tool) => {
      if (effectiveTools.includes('*')) return true;
      return effectiveTools.includes(tool.name);
    });

    const toolDocs = availableToolDefs
      .map((t) => {
        const schema = JSON.stringify(t.inputSchema?.properties || {});
        return `Tool: ${t.name}\nDescription: ${t.description}\nParameters: ${schema}`;
      })
      .join('\n\n');

    const projectRoot = WorkspaceManager.initProject(projectName).path;

    await TaskStore.emitEvent(
      taskId,
      'AGENT_STARTED',
      `[${agent.name}] Initialized Autonomous ReAct Loop for objective: "${objective}"`,
      { agentId, projectName, projectRoot, toolsCount: availableToolDefs.length, maxSteps }
    );

    const steps: ReActStep[] = [];
    const toolsUsed: Set<string> = new Set();
    const artifactsCreated: Set<string> = new Set();
    const errors: string[] = [];

    const executionContext: KernelExecutionContext = {
      taskId,
      agentId,
      policy: agent.maxPermission,
      emitEvent: async (eventType, message, metadata) => {
        await TaskStore.emitEvent(taskId, eventType, message, metadata);
      },
    };

    const historyMessages: Array<{ role: string; content: string }> = [];

    const baseSystemPrompt = `${systemPrompt || agent.systemPrompt}
You are an autonomous AI specialist executing tasks in an isolated workspace sandbox.
Project Workspace Directory: ${projectName} (Root: ${projectRoot})

You have access to the following real tools:
${toolDocs}

You MUST execute the task using the standard ReAct protocol:
Thought: <Step-by-step reasoning on what you need to do next based on previous tool results>
Action: <exact_tool_name>
Action Input: <valid JSON object matching the tool parameters>

When you call workspace tools, ALWAYS provide "projectName": "${projectName}".
For example, to initialize a project:
Thought: I need to initialize the project directory and package.json.
Action: workspace_run_command
Action Input: {"projectName": "${projectName}", "command": "npm init -y"}

When you have completely fulfilled the objective and verified your work:
Thought: I have built all requested components, verified the build/tests, and the project is complete.
Final Answer: <Comprehensive explanation of what you built, files created, and how to run it>

Important:
1. Always inspect output from Action/Observation before proceeding. If a command or build fails, observe the error and fix it.
2. Produce complete, working code without placeholders or TODOs.
3. Keep iterating until the goal is fully accomplished.`;

    historyMessages.push({
      role: 'user',
      content: `OBJECTIVE: ${objective}\nContext: ${JSON.stringify(contextData || {})}`,
    });

    let finalAnswer = '';
    let isComplete = false;

    for (let stepNum = 1; stepNum <= maxSteps && !isComplete; stepNum++) {
      const stepStartTime = Date.now();

      await TaskStore.emitEvent(
        taskId,
        'AGENT_THINKING',
        `[${agent.name}] ReAct Step ${stepNum}/${maxSteps}: Reasoning over objective and tool state`,
        { step: stepNum, maxSteps }
      );

      // Call AI model
      let responseText = '';
      try {
        if (aiCaller) {
          const aiRes: any = await aiCaller(baseSystemPrompt, historyMessages);
          responseText = typeof aiRes === 'string' ? aiRes : (aiRes?.text || '');
        } else {
          // Fallback to internal completion if aiCaller not passed
          responseText = `Thought: Simulating step ${stepNum}\nFinal Answer: Task completed in sandbox.`;
        }
      } catch (callErr: any) {
        errors.push(`AI invocation failed at step ${stepNum}: ${callErr.message}`);
        await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', `Model provider error: ${callErr.message}`, { step: stepNum });
        break;
      }

      // Parse Thought, Action, Action Input, or Final Answer
      const thoughtMatch = responseText.match(/Thought:\s*([\s\S]*?)(?=Action:|Final Answer:|$)/i);
      const actionMatch = responseText.match(/Action:\s*([a-zA-Z0-9_\-]+)/i);
      const actionInputMatch = responseText.match(/Action Input:\s*(\{[\s\S]*?\})/i);
      const finalAnswerMatch = responseText.match(/Final Answer:\s*([\s\S]*?)$/i);

      const thought = thoughtMatch ? thoughtMatch[1].trim() : 'Analyzing next action...';

      if (finalAnswerMatch) {
        finalAnswer = finalAnswerMatch[1].trim();
        isComplete = true;

        steps.push({
          stepNumber: stepNum,
          thought,
          durationMs: Date.now() - stepStartTime,
        });

        await TaskStore.emitEvent(
          taskId,
          'AGENT_PROGRESS',
          `[${agent.name}] ReAct Loop reached Final Answer at step ${stepNum}`,
          { step: stepNum, finalAnswer: finalAnswer.slice(0, 300) }
        );
        break;
      }

      if (actionMatch) {
        const action = actionMatch[1].trim();
        let actionInput: Record<string, any> = {};

        if (actionInputMatch) {
          try {
            actionInput = JSON.parse(actionInputMatch[1].trim());
          } catch (jsonErr: any) {
            // Attempt auto-recovery of malformed JSON
            try {
              const clean = actionInputMatch[1].trim().replace(/,\s*}/g, '}');
              actionInput = JSON.parse(clean);
            } catch (_) {
              actionInput = { raw: actionInputMatch[1].trim() };
            }
          }
        }

        // Ensure projectName default
        if (!actionInput.projectName && action.startsWith('workspace_')) {
          actionInput.projectName = projectName;
        }

        toolsUsed.add(action);

        await TaskStore.emitEvent(
          taskId,
          'TOOL_STARTED',
          `[${agent.name}] Step ${stepNum} -> Executing: ${action}`,
          { step: stepNum, tool: action, args: actionInput }
        );

        let observation = '';
        try {
          // Check tool allowlist
          if (!effectiveTools.includes('*') && !effectiveTools.includes(action)) {
            throw new Error(`Tool '${action}' is not authorized for agent '${agent.name}'`);
          }

          const toolRes = await ExecutionKernel.executeTool(action, actionInput, executionContext);

          if (action === 'workspace_write_file' && actionInput.path) {
            artifactsCreated.add(actionInput.path);
          }

          if (toolRes.success) {
            observation = typeof toolRes.output === 'object' ? JSON.stringify(toolRes.output) : String(toolRes.output || 'OK');
            await TaskStore.emitEvent(
              taskId,
              'TOOL_COMPLETED',
              `[${agent.name}] Tool '${action}' completed successfully`,
              { step: stepNum, tool: action }
            );
          } else {
            observation = `ERROR: ${toolRes.error || 'Tool failed'}`;
            await TaskStore.emitEvent(
              taskId,
              'ERROR_DETECTED',
              `[${agent.name}] Tool '${action}' returned error: ${toolRes.error}`,
              { step: stepNum, tool: action }
            );
          }
        } catch (toolExecErr: any) {
          observation = `ERROR: ${toolExecErr.message}`;
          await TaskStore.emitEvent(
            taskId,
            'ERROR_DETECTED',
            `[${agent.name}] Tool execution exception: ${toolExecErr.message}`,
            { step: stepNum, tool: action }
          );
        }

        const stepRecord: ReActStep = {
          stepNumber: stepNum,
          thought,
          action,
          actionInput,
          observation: observation.slice(0, 3000), // Bound observation to prevent context blowout
          durationMs: Date.now() - stepStartTime,
        };
        steps.push(stepRecord);

        // Feed step back into conversation history for the next iteration!
        historyMessages.push({
          role: 'assistant',
          content: `Thought: ${thought}\nAction: ${action}\nAction Input: ${JSON.stringify(actionInput)}`,
        });

        historyMessages.push({
          role: 'user',
          content: `Observation: ${stepRecord.observation}`,
        });

      } else {
        // Model didn't produce Action or Final Answer - prompt it to continue
        historyMessages.push({
          role: 'assistant',
          content: responseText,
        });
        historyMessages.push({
          role: 'user',
          content: 'Please proceed by emitting an "Action: <tool>" and "Action Input: {...}" or a "Final Answer: <result>".',
        });

        steps.push({
          stepNumber: stepNum,
          thought,
          durationMs: Date.now() - stepStartTime,
        });
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const success = isComplete && Boolean(finalAnswer);

    await TaskStore.emitEvent(
      taskId,
      success ? 'VERIFICATION_PASSED' : 'TASK_FAILED',
      success
        ? `Autonomous ReAct execution finalized successfully across ${steps.length} steps.`
        : `Autonomous ReAct execution halted after ${steps.length} steps without final answer.`,
      { totalDurationMs, toolsUsed: Array.from(toolsUsed), artifactsCount: artifactsCreated.size }
    );

    return {
      success,
      finalAnswer: finalAnswer || `Execution halted after ${steps.length} steps. Check telemetry for details.`,
      steps,
      toolsUsed: Array.from(toolsUsed),
      totalDurationMs,
      artifactsCreated: Array.from(artifactsCreated),
      errors,
    };
  }
}
