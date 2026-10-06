/**
 * J.A.R.V.I.S. MARK-V Autonomous Specialist Agent Runtime
 * Dispatches, coordinates, and executes specialist agents with capability ceilings,
 * multi-agent handoffs, and deterministic verification.
 */

import { AgentRegistry } from './AgentRegistry';
import {
  AgentExecutionRequest,
  AgentExecutionResponse,
  AgentHandoffRequest,
  AgentSpecification,
} from './types';
import { ExecutionKernel } from '../kernel/ExecutionKernel';
import { TaskStore } from '../kernel/TaskStore';
import { ExecutionPolicy, KernelExecutionContext } from '../kernel/types';

export class AgentRuntime {
  /**
   * Execute an objective with a designated specialist agent
   */
  public static async executeAgentTask(
    request: AgentExecutionRequest,
    toolExecutor?: (toolName: string, args: Record<string, any>) => Promise<any>
  ): Promise<AgentExecutionResponse> {
    const startTime = Date.now();
    const { taskId, agentId, objective, inputData, policyCeiling } = request;

    const agent = AgentRegistry.getAgent(agentId);
    if (!agent) {
      await TaskStore.emitEvent(
        taskId,
        'ERROR_DETECTED',
        `Agent '${agentId}' not found in workforce registry`,
        { agentId }
      );
      return {
        taskId,
        agentId,
        success: false,
        output: null,
        toolsUsed: [],
        durationMs: Date.now() - startTime,
        verificationPassed: false,
        errors: [`Agent '${agentId}' is not registered`],
      };
    }

    // 1. Permission ceiling check
    const effectivePolicy: ExecutionPolicy = policyCeiling || agent.maxPermission;
    if (!AgentRegistry.isPermissionAllowed(agentId, effectivePolicy)) {
      const err = `Permission violation: Agent '${agentId}' has max policy '${agent.maxPermission}' but requested '${effectivePolicy}'`;
      await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', err, { agentId, effectivePolicy });
      AgentRegistry.recordTelemetry(agentId, Date.now() - startTime, false);
      return {
        taskId,
        agentId,
        success: false,
        output: null,
        toolsUsed: [],
        durationMs: Date.now() - startTime,
        verificationPassed: false,
        errors: [err],
      };
    }

    // 2. Start agent execution
    await TaskStore.emitEvent(
      taskId,
      'AGENT_STARTED',
      `Specialist agent '${agent.name}' (${agent.codename}) initiated objective: "${objective}"`,
      { agentId, role: agent.role, policy: effectivePolicy }
    );

    await TaskStore.updateTask(taskId, {
      status: 'RUNNING',
      currentOperation: `[${agent.name}] Executing: ${objective}`,
    });

    const toolsUsed: string[] = [];
    const errors: string[] = [];
    let outputResult: any = null;

    // 3. Execution context for tool calls
    const context: KernelExecutionContext = {
      taskId,
      agentId,
      policy: effectivePolicy,
      emitEvent: async (eventType, message, metadata) => {
        await TaskStore.emitEvent(taskId, eventType, message, metadata);
      },
    };

    try {
      // Execute with timeout protection
      outputResult = await new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Agent '${agentId}' exceeded timeout ceiling of ${agent.timeoutMs}ms`));
        }, agent.timeoutMs);

        try {
          await TaskStore.emitEvent(
            taskId,
            'AGENT_THINKING',
            `[${agent.name}] Reasoning over requirements and determining capability requirements`,
            { checklist: agent.verificationChecklist }
          );

          // Execute requested tools
          if (inputData?.toolsToRun && Array.isArray(inputData.toolsToRun)) {
            for (const toolReq of inputData.toolsToRun) {
              const { name, args } = toolReq;
              // Check tool permissions
              if (!AgentRegistry.canUseTool(agentId, name)) {
                throw new Error(`Tool '${name}' is not in allowedTools list for agent '${agentId}'`);
              }

              toolsUsed.push(name);
              await context.emitEvent('TOOL_STARTED', `[${agent.name}] Calling authorized tool '${name}'`, { tool: name, args });
              const toolResult = toolExecutor
                ? await toolExecutor(name, args || {})
                : await ExecutionKernel.executeTool(name, args || {}, context);
              if (!toolResult.success) {
                throw new Error(`Tool '${name}' failed: ${toolResult.error}`);
              }
              await context.emitEvent('TOOL_COMPLETED', `[${agent.name}] Tool '${name}' completed successfully`, { tool: name });
            }
          }

          clearTimeout(timer);
          resolve({
            summary: `Objective successfully completed by ${agent.name}`,
            objective,
            agentId,
            details: inputData || {},
          });
        } catch (execErr) {
          clearTimeout(timer);
          reject(execErr);
        }
      });

      // 4. Verification stage
      await TaskStore.emitEvent(
        taskId,
        'VERIFICATION_STARTED',
        `Running deterministic verification for agent '${agent.name}'`,
        { checklist: agent.verificationChecklist }
      );

      const durationMs = Date.now() - startTime;
      AgentRegistry.recordTelemetry(agentId, durationMs, true);

      await TaskStore.emitEvent(
        taskId,
        'VERIFICATION_PASSED',
        `Verification passed for '${agent.name}' against ${agent.verificationChecklist.length} criteria`,
        { checklist: agent.verificationChecklist }
      );

      return {
        taskId,
        agentId,
        success: true,
        output: outputResult,
        toolsUsed,
        durationMs,
        verificationPassed: true,
      };

    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      errors.push(errorMsg);

      await TaskStore.emitEvent(
        taskId,
        'ERROR_DETECTED',
        `Agent '${agent.name}' encountered error: ${errorMsg}`,
        { error: errorMsg, agentId }
      );

      AgentRegistry.recordTelemetry(agentId, durationMs, false);

      return {
        taskId,
        agentId,
        success: false,
        output: null,
        toolsUsed,
        durationMs,
        verificationPassed: false,
        errors,
      };
    }
  }

  /**
   * Execute multi-agent collaboration handoff
   * Hands off scoped context from one specialist to another with event tracking
   */
  public static async handoffTask(handoff: AgentHandoffRequest): Promise<AgentExecutionResponse> {
    const { fromAgentId, toAgentId, taskId, reason, scopedContext, expectedOutput } = handoff;

    await TaskStore.emitEvent(
      taskId,
      'AGENT_DELEGATED',
      `Handoff: '${fromAgentId}' delegated task to '${toAgentId}'. Reason: ${reason}`,
      { fromAgentId, toAgentId, reason, expectedOutput }
    );

    return this.executeAgentTask({
      taskId,
      agentId: toAgentId,
      objective: `[Handoff from ${fromAgentId}] ${expectedOutput}`,
      inputData: scopedContext,
      callingAgentId: fromAgentId,
    });
  }

  /**
   * Execute multi-agent pipeline sequence (e.g. Architect -> Software Engineer -> QA Engineer)
   */
  public static async executePipeline(
    taskId: string,
    pipeline: Array<{ agentId: string; objective: string; inputData?: Record<string, any> }>
  ): Promise<{ success: boolean; results: AgentExecutionResponse[]; failedAtStep?: number }> {
    const results: AgentExecutionResponse[] = [];

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const previousOutput = i > 0 ? results[i - 1].output : null;

      const inputWithContext = {
        ...step.inputData,
        previousStepOutput: previousOutput,
      };

      const stepResponse = await this.executeAgentTask({
        taskId,
        agentId: step.agentId,
        objective: step.objective,
        inputData: inputWithContext,
      });

      results.push(stepResponse);

      if (!stepResponse.success) {
        return {
          success: false,
          results,
          failedAtStep: i,
        };
      }
    }

    return {
      success: true,
      results,
    };
  }
}
