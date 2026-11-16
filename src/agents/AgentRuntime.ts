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

function redactToolArguments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactToolArguments);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    if (/password|secret|token|api[_-]?key|authorization|cookie|credential/i.test(key)) return [key, '[REDACTED]'];
    return [key, redactToolArguments(item)];
  }));
}

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
    const actionResults: Array<{ tool: string; result: unknown }> = [];
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
          if (Array.isArray(inputData?.toolsToRun) && inputData.toolsToRun.length > 0) {
            for (const toolReq of inputData.toolsToRun) {
              const { name, args } = toolReq;
              // Check tool permissions
              if (!AgentRegistry.canUseTool(agentId, name)) {
                throw new Error(`Tool '${name}' is not in allowedTools list for agent '${agentId}'`);
              }
              const registeredTool = ExecutionKernel.getTool(name);
              if (!registeredTool) throw new Error(`Tool '${name}' is not registered in the execution kernel`);
              if (!AgentRegistry.isPermissionAllowed(agentId, registeredTool.requiredPermission)) {
                throw new Error(`Permission denied: '${agentId}' cannot use '${name}' at ${registeredTool.requiredPermission}`);
              }
              const permission = ExecutionKernel.checkPermission(registeredTool.requiredPermission, effectivePolicy);
              if (!permission.allowed) throw new Error(permission.reason || `Permission denied for '${name}'`);
              if (registeredTool.requiresConfirmation || registeredTool.risk === 'HIGH' || registeredTool.risk === 'CRITICAL') {
                throw new Error(`Mission blocked: '${name}' requires an approval coordinator before dispatch`);
              }

              toolsUsed.push(name);
              await context.emitEvent('TOOL_STARTED', `[${agent.name}] Calling authorized tool '${name}'`, { tool: name, args: redactToolArguments(args) });
              const toolResult = toolExecutor
                ? await toolExecutor(name, args || {})
                : await ExecutionKernel.executeTool(name, args || {}, context);
              if (!toolResult.success) {
                throw new Error(`Tool '${name}' failed: ${toolResult.error}`);
              }
              actionResults.push({ tool: name, result: toolResult.output ?? toolResult });
              await context.emitEvent('TOOL_COMPLETED', `[${agent.name}] Tool '${name}' completed successfully`, { tool: name });
            }
          } else {
            throw new Error('Mission blocked: no executable tool actions were planned');
          }

          clearTimeout(timer);
          resolve({
            summary: `Executed ${toolsUsed.length} tool action(s) for the objective.`,
            objective,
            agentId,
            actions: actionResults,
          });
        } catch (execErr) {
          clearTimeout(timer);
          reject(execErr);
        }
      });

      // 4. Verification stage — Factual Deterministic Verification
      await TaskStore.emitEvent(
        taskId,
        'VERIFICATION_STARTED',
        `Running deterministic verification for agent '${agent.name}'`,
        { checklist: agent.verificationChecklist }
      );
      if (!request.deferTaskCompletion) {
        await TaskStore.updateTask(taskId, {
          status: 'VERIFYING',
          currentOperation: `Verifying ${toolsUsed.length} recorded action(s)`,
        });
      }

      const verificationFailures: string[] = [];

      if (!Array.isArray(inputData?.filesToVerify) || inputData.filesToVerify.length === 0) {
        verificationFailures.push('No independent artifact verification target was supplied');
      }

      // Check 1: Verify output artifact
      if (!outputResult) {
        verificationFailures.push('No execution output or artifact was generated');
      }

      // Check 2: Verify touched files actually exist on disk
      const { existsSync, readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      if (inputData?.filesToVerify && Array.isArray(inputData.filesToVerify)) {
        for (const f of inputData.filesToVerify) {
          const resolvedPath = resolve(process.cwd(), f);
          if (!existsSync(resolvedPath)) {
            verificationFailures.push(`Verification failure: Deliverable file "${f}" does not exist on disk`);
          } else {
            // Check 3: Syntax check for JSON/JS/TS deliverables
            if (f.endsWith('.json')) {
              try {
                JSON.parse(readFileSync(resolvedPath, 'utf-8'));
              } catch (jsonErr: any) {
                verificationFailures.push(`Syntax error in JSON deliverable "${f}": ${jsonErr.message}`);
              }
            }
          }
        }
      }

      if (verificationFailures.length > 0) {
        const failureSummary = verificationFailures.join('; ');
        await TaskStore.emitEvent(
          taskId,
          'ERROR_DETECTED',
          `Verification FAILED for '${agent.name}': ${failureSummary}`,
          { failures: verificationFailures }
        );
        throw new Error(`Verification failed against criteria: ${failureSummary}`);
      }

      const durationMs = Date.now() - startTime;
      AgentRegistry.recordTelemetry(agentId, durationMs, true);

      await TaskStore.emitEvent(
        taskId,
        'VERIFICATION_PASSED',
        `Artifact verification passed for ${inputData?.filesToVerify?.length || 0} provided file(s)`,
        { verifiedFiles: inputData?.filesToVerify || [] }
      );

      // The caller owns the mission's terminal state. This runtime records verification but does not complete a shared task.
      if (!request.deferTaskCompletion) {
        await TaskStore.updateTask(taskId, {
          status: 'COMPLETED',
          currentOperation: 'Actions and artifact verification completed',
          verificationResult: 'Passed',
        });
      }

      return {
        taskId,
        agentId,
        success: true,
        output: outputResult,
        toolsUsed,
        durationMs,
        verificationPassed: true,
        status: 'COMPLETED',
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

      const blocked = errorMsg.includes('Mission blocked:') || errorMsg.includes('not in allowedTools list');
      if (!request.deferTaskCompletion) {
        await TaskStore.updateTask(taskId, {
          status: blocked ? 'BLOCKED' : 'FAILED',
          currentOperation: blocked ? 'Mission needs a permitted action plan' : 'Agent execution failed',
          errorDetails: errorMsg,
        }).catch(() => undefined);
      }

      AgentRegistry.recordTelemetry(agentId, durationMs, false);

      return {
        taskId,
        agentId,
        success: false,
        output: null,
        toolsUsed,
        durationMs,
        verificationPassed: false,
        status: blocked ? 'BLOCKED' : 'FAILED',
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
        deferTaskCompletion: true,
      });

      results.push(stepResponse);

      if (!stepResponse.success) {
        await TaskStore.updateTask(taskId, {
          status: stepResponse.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED',
          currentOperation: 'Agent pipeline stopped before verified completion',
          errorDetails: stepResponse.errors?.join('; '),
        }).catch(() => undefined);
        return {
          success: false,
          results,
          failedAtStep: i,
        };
      }
    }

    await TaskStore.updateTask(taskId, {
      status: 'VERIFYING',
      currentOperation: 'Verifying all agent pipeline steps',
    });
    await TaskStore.updateTask(taskId, {
      status: 'COMPLETED',
      currentOperation: 'All agent pipeline steps verified',
      verificationResult: 'Passed',
    });

    return {
      success: true,
      results,
    };
  }
}
