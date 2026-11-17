/**
 * J.A.R.V.I.S. Mission Coordinator
 *
 * One lifecycle for every actionable mission, whoever asks for it (voice, chat,
 * task API, scheduler). The coordinator:
 *
 *   1. persists the mission as an AgentTask before any work happens;
 *   2. authorizes every tool call at the dispatch boundary (MissionToolPolicy);
 *   3. pauses in AWAITING_APPROVAL for consequential actions, storing the exact
 *      pending action encrypted and returning control to the caller;
 *   4. resumes from that encrypted checkpoint after a one-use approval;
 *   5. records redacted evidence and requires passing verification before a
 *      mission may be reported COMPLETED.
 *
 * Completion is derived from executed actions, an explicit terminal signal and
 * verification evidence — never from model prose.
 */

// Type-only imports: the coordinator is constructed with injected ports, so a
// unit test never has to load Prisma just to exercise mission rules.
import type { MissionApprovalStore } from './MissionApprovalStore';
import { authorizeMissionTool, redactMissionValue } from './MissionToolPolicy';
import { classifyMissionOutcome, type MissionStatus } from './missionLifecycle';
import type { EventType, ExecutionPolicy } from './types';

export type MissionSource = 'voice' | 'chat' | 'task_api' | 'scheduler';

export interface MissionStepPlan {
  toolName: string;
  args?: Record<string, unknown>;
  title?: string;
}

export interface MissionRequest {
  taskId?: string;
  userId: string;
  objective: string;
  agentId: string;
  source: MissionSource;
  steps: MissionStepPlan[];
  taskScope?: ExecutionPolicy;
  requireVerification?: boolean;
}

export interface MissionActionEvidence {
  actionId: string;
  toolName: string;
  status: 'SUCCEEDED' | 'FAILED' | 'DENIED' | 'AWAITING_APPROVAL';
  redactedInput: Record<string, unknown>;
  resultSummary: string;
  elapsedMs: number;
}

export interface MissionVerification {
  name: string;
  status: 'PASSED' | 'FAILED' | 'NOT_RUN';
  evidence: string;
}

export interface MissionResult {
  taskId: string;
  taskNumber: string;
  status: MissionStatus;
  summary: string;
  actions: MissionActionEvidence[];
  artifacts: string[];
  verification: MissionVerification[];
  errors: string[];
  pendingApprovalId?: string;
}

export interface MissionTasksPort {
  createTask(input: {
    title?: string;
    description?: string;
    agentId?: string;
    totalSteps?: number;
  }): Promise<any>;
  updateTask(taskId: string, input: Record<string, any>): Promise<any>;
  emitEvent(taskId: string, eventType: EventType, message: string, metadata?: Record<string, any>): Promise<any>;
  getTask(taskId: string): Promise<any>;
}

export interface MissionPorts {
  tasks: MissionTasksPort;
  approvals: MissionApprovalStore;
  dispatch: (toolName: string, args: Record<string, unknown>) => Promise<any>;
  verify?: (context: {
    taskId: string;
    objective: string;
    actions: MissionActionEvidence[];
    artifacts: string[];
  }) => Promise<MissionVerification[]>;
  now?: () => Date;
  approvalTtlMs?: number;
  defaultApprovalTtlMs?: number;
}

interface ResumeCheckpoint {
  objective?: string;
  agentId?: string;
  source?: MissionSource;
  taskScope?: ExecutionPolicy;
  requireVerification?: boolean;
  remainingSteps: MissionStepPlan[];
  actions: MissionActionEvidence[];
  artifacts: string[];
}

const DEFAULT_APPROVAL_TTL_MS = 10 * 60 * 1000;

function assertMissionRequest(request: MissionRequest): void {
  if (!request?.userId?.trim()) throw new Error('A mission requires an authenticated user');
  if (!request?.objective?.trim()) throw new Error('A mission requires an objective');
  if (!request?.agentId?.trim()) throw new Error('A mission requires an agent');
  if (!Array.isArray(request.steps) || request.steps.length === 0) {
    throw new Error('A mission requires at least one actionable step');
  }
}

function summariseResult(output: any): string {
  if (output === undefined || output === null) return 'Completed with no output';
  if (typeof output === 'string') return output.length > 400 ? `${output.slice(0, 400)}…` : output;
  const candidate = output.summary ?? output.message ?? output.output ?? output.previewUrl;
  if (typeof candidate === 'string' && candidate.trim()) return candidate.slice(0, 400);
  const json = JSON.stringify(output);
  return json.length > 400 ? `${json.slice(0, 400)}…` : json;
}

function extractArtifacts(output: any): string[] {
  const found = new Set<string>();
  if (!output || typeof output !== 'object') return [];
  for (const key of ['previewUrl', 'filePath', 'path', 'url']) {
    const value = (output as any)[key];
    if (typeof value === 'string' && value.trim()) found.add(value);
  }
  if (Array.isArray((output as any).artifacts)) {
    for (const artifact of (output as any).artifacts) {
      if (typeof artifact === 'string' && artifact.trim()) found.add(artifact);
    }
  }
  return [...found];
}

export class MissionCoordinator {
  constructor(private readonly ports: MissionPorts) {
    if (!ports?.tasks || !ports?.approvals || !ports?.dispatch) {
      throw new Error('MissionCoordinator requires tasks, approvals and dispatch ports');
    }
  }

  private get now(): Date {
    return (this.ports.now ?? (() => new Date()))();
  }

  async start(request: MissionRequest): Promise<MissionResult> {
    assertMissionRequest(request);
    const task = request.taskId
      ? await this.ports.tasks.getTask(request.taskId)
      : await this.ports.tasks.createTask({
          title: request.objective.slice(0, 100),
          description: request.objective,
          agentId: request.agentId,
          totalSteps: request.steps.length,
        });
    if (!task) throw new Error('Mission task could not be created');

    await this.ports.tasks.updateTask(task.id, {
      status: 'PLANNING',
      currentOperation: `Planning ${request.steps.length} step(s) for ${request.agentId}`,
      totalSteps: request.steps.length,
    });

    await this.ports.tasks.emitEvent(task.id, 'TASK_PLANNED', `Mission planned with ${request.steps.length} actionable step(s)`, {
      objective: request.objective,
      agentId: request.agentId,
      source: request.source,
      steps: request.steps.map((step, index) => ({ index: index + 1, toolName: step.toolName, title: step.title })),
      requireVerification: request.requireVerification === true,
    });

    await this.ports.tasks.updateTask(task.id, {
      status: 'RUNNING',
      currentOperation: `Running ${request.agentId} mission`,
    });

    return this.run(task, request, request.steps, [], []);
  }

  async resume(taskId: string, userId: string, approvalId: string): Promise<MissionResult> {
    if (!userId?.trim()) throw new Error('A mission requires an authenticated user');
    const task = await this.ports.tasks.getTask(taskId);
    if (!task) throw new Error('Mission task not found');

    const approval = await this.ports.approvals.getApproval(approvalId, userId);
    if (approval.taskId !== task.id) throw new Error('Approval does not belong to this mission');
    if (approval.status !== 'APPROVED') {
      throw new Error(`Approval is ${approval.status}; only an APPROVED action can resume a mission`);
    }

    // Policy is re-checked BEFORE the approval is burned, so a tool that was
    // removed from an agent's allowlist cannot consume a valid approval.
    const precheck = authorizeMissionTool({
      agentId: task.agentId,
      toolName: approval.toolName,
      args: {},
    });
    if (!precheck.allowed) {
      await this.ports.tasks.emitEvent(task.id, 'TASK_BLOCKED', `Resume denied: ${precheck.reason ?? 'tool no longer permitted'}`, {
        approvalId,
        toolName: approval.toolName,
      });
      await this.ports.tasks.updateTask(task.id, { status: 'BLOCKED', currentOperation: 'Approval resume denied by policy' });
      return {
        taskId: task.id,
        taskNumber: task.taskNumber ?? task.id,
        status: 'BLOCKED',
        summary: `Mission blocked: ${precheck.reason ?? 'the approved tool is no longer permitted'}`,
        actions: [{
          actionId: `act_${Date.now()}`,
          toolName: approval.toolName,
          status: 'DENIED',
          redactedInput: {},
          resultSummary: precheck.reason ?? 'Denied by mission policy',
          elapsedMs: 0,
        }],
        artifacts: [],
        verification: [],
        errors: [precheck.reason ?? 'Denied by mission policy'],
      };
    }

    const consumed = await this.ports.approvals.consumeApprovedCheckpoint(approvalId, userId, approval.actionDigest);
    const checkpoint = (consumed.checkpoint ?? null) as ResumeCheckpoint | null;

    const resumedRequest: MissionRequest = {
      taskId: task.id,
      userId,
      objective: checkpoint?.objective ?? task.description ?? task.title ?? 'Resumed mission',
      agentId: checkpoint?.agentId ?? task.agentId,
      source: checkpoint?.source ?? 'task_api',
      steps: [],
      taskScope: checkpoint?.taskScope,
      requireVerification: checkpoint?.requireVerification === true,
    };

    return this.executeOne(task, resumedRequest, approval.toolName, consumed.action, checkpoint);
  }

  private async executeOne(
    task: any,
    request: MissionRequest,
    toolName: string,
    args: Record<string, unknown>,
    checkpoint: ResumeCheckpoint | null,
  ): Promise<MissionResult> {
    const actions = checkpoint?.actions ?? [];
    const artifacts = checkpoint?.artifacts ?? [];
    const remainingSteps = checkpoint?.remainingSteps ?? [];

    // AWAITING_APPROVAL -> RUNNING is the legal resume transition.
    await this.ports.tasks.updateTask(task.id, {
      status: 'RUNNING',
      currentOperation: `Resuming approved action: ${toolName}`,
    });

    // This action's one-use approval was just consumed from the encrypted
    // checkpoint, so it dispatches directly instead of pausing again.
    const evidence = await this.dispatchStep(task, request, toolName, args, actions, artifacts, remainingSteps, true);
    if (evidence.pause) return evidence.pause;

    const initialErrors = evidence.status === 'SUCCEEDED' ? [] : [evidence.resultSummary];
    return this.run(task, request, remainingSteps, actions, artifacts, initialErrors);
  }

  private async run(
    task: any,
    request: MissionRequest,
    steps: MissionStepPlan[],
    actions: MissionActionEvidence[],
    artifacts: string[],
    initialErrors: string[] = [],
  ): Promise<MissionResult> {
    const errors: string[] = [...initialErrors];
    let denied = false;
    let executionState: 'IDLE' | 'RUNNING' | 'ERROR' | 'EXHAUSTED' =
      initialErrors.length > 0 ? (initialErrors.some(error => /denied/i.test(error)) ? 'IDLE' : 'ERROR') : steps.length === 0 ? 'IDLE' : 'RUNNING';

    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      const result = await this.dispatchStep(
        task,
        request,
        step.toolName,
        step.args ?? {},
        actions,
        artifacts,
        steps.slice(index + 1),
      );
      if (result.pause) return result.pause;
      if (result.status === 'DENIED') {
        // A policy denial is not an execution failure: the mission is blocked,
        // never reported as completed and never retried blindly.
        denied = true;
        errors.push(result.resultSummary);
      } else if (result.status === 'FAILED') {
        errors.push(result.resultSummary);
        executionState = 'ERROR';
      }
    }

    // A mission is terminally complete only when something actually executed and
    // nothing failed; a plan with zero successful actions can never complete.
    const terminalIntentReceived =
      executionState !== 'ERROR' && !denied && actions.some(action => action.status === 'SUCCEEDED');
    const verification = await this.verify(task, request, actions, artifacts, errors);
    const verificationState = !request.requireVerification
      ? 'NOT_REQUIRED' as const
      : verification.every(entry => entry.status === 'PASSED')
        ? 'PASSED' as const
        : verification.some(entry => entry.status === 'FAILED')
          ? 'FAILED' as const
          : 'NOT_RUN' as const;

    const status = classifyMissionOutcome({
      executedActions: actions.filter(action => action.status === 'SUCCEEDED').length,
      terminalIntentReceived,
      executionState: executionState === 'RUNNING' ? 'IDLE' : executionState,
      verification: verificationState,
    });

    const summary = this.summarise(status, actions, errors, verificationState);

    if (status === 'COMPLETED') {
      await this.ports.tasks.updateTask(task.id, {
        status: 'VERIFYING',
        currentOperation: 'Running deterministic mission verification',
        verificationResult: verification.map(entry => `${entry.name}: ${entry.status}`).join('; ') || 'Not required',
      });
    }

    await this.ports.tasks.updateTask(task.id, {
      status,
      progress: status === 'COMPLETED' ? 100 : 50,
      completedSteps: actions.filter(action => action.status === 'SUCCEEDED').length,
      totalSteps: Math.max(steps.length, actions.length),
      executionResult: summary,
      verificationResult: verification.map(entry => `${entry.name}: ${entry.status}`).join('; ') || 'Not required',
      errorDetails: errors.length ? errors.join('; ') : undefined,
      filesChanged: artifacts,
    });

    const eventType: EventType = status === 'COMPLETED'
      ? 'TASK_COMPLETED'
      : status === 'FAILED'
        ? 'TASK_FAILED'
        : 'TASK_BLOCKED';

    await this.ports.tasks.emitEvent(task.id, eventType, `Mission ${status}: ${summary}`, {
      status,
      verification: verificationState,
      actions: actions.map(action => ({
        toolName: action.toolName,
        status: action.status,
        elapsedMs: action.elapsedMs,
        resultSummary: action.resultSummary,
      })),
      artifacts,
    });

    return {
      taskId: task.id,
      taskNumber: task.taskNumber ?? task.id,
      status,
      summary,
      actions,
      artifacts,
      verification,
      errors,
    };
  }

  private async dispatchStep(
    task: any,
    request: MissionRequest,
    toolName: string,
    args: Record<string, unknown>,
    actions: MissionActionEvidence[],
    artifacts: string[],
    remainingSteps: MissionStepPlan[] = [],
    alreadyApproved = false,
  ): Promise<MissionActionEvidence & { pause?: MissionResult }> {
    const authorization = authorizeMissionTool({
      agentId: request.agentId,
      toolName,
      args,
      taskScope: request.taskScope,
    });

    if (!authorization.allowed) {
      const denied: MissionActionEvidence = {
        actionId: `act_${Date.now()}_denied`,
        toolName,
        status: 'DENIED',
        redactedInput: redactMissionValue(args) as Record<string, unknown>,
        resultSummary: authorization.reason ?? 'Denied by mission policy',
        elapsedMs: 0,
      };
      actions.push(denied);
      await this.ports.tasks.emitEvent(task.id, 'TOOL_COMPLETED', `Denied ${toolName} before dispatch`, {
        toolName,
        status: 'DENIED',
        reason: denied.resultSummary,
      });
      return denied;
    }

    if (authorization.requiresApproval && !alreadyApproved) {
      const pending: MissionActionEvidence = {
        actionId: `act_${Date.now()}_pending`,
        toolName,
        status: 'AWAITING_APPROVAL',
        redactedInput: redactMissionValue(args) as Record<string, unknown>,
        resultSummary: authorization.summary ?? 'Awaiting approval',
        elapsedMs: 0,
      };
      actions.push(pending);

      const checkpoint: ResumeCheckpoint = {
        objective: request.objective,
        agentId: request.agentId,
        source: request.source,
        taskScope: request.taskScope,
        requireVerification: request.requireVerification === true,
        remainingSteps,
        actions,
        artifacts,
      };
      const approval = await this.ports.approvals.createApproval({
        taskId: task.id,
        userId: request.userId,
        toolName,
        actionDigest: authorization.actionDigest!,
        summary: authorization.summary ?? `Approve ${toolName}`,
        expiresAt: new Date(this.now.getTime() + (this.ports.approvalTtlMs ?? DEFAULT_APPROVAL_TTL_MS)),
        pendingAction: args,
        checkpoint: checkpoint as unknown as Record<string, unknown>,
      });

      await this.ports.tasks.updateTask(task.id, {
        status: 'AWAITING_APPROVAL',
        currentOperation: `Awaiting approval: ${approval.summary}`,
        currentTool: toolName,
      });
      await this.ports.tasks.emitEvent(task.id, 'TASK_AWAITING_APPROVAL', `Mission paused for approval: ${approval.summary}`, {
        approvalId: approval.id,
        toolName,
        expiresAt: approval.expiresAt,
      });

      return {
        ...pending,
        pause: {
          taskId: task.id,
          taskNumber: task.taskNumber ?? task.id,
          status: 'AWAITING_APPROVAL',
          summary: `Mission paused. Approve to run: ${approval.summary}`,
          actions,
          artifacts,
          verification: [],
          errors: [],
          pendingApprovalId: approval.id,
        },
      };
    }

    const started = Date.now();
    await this.ports.tasks.emitEvent(task.id, 'TOOL_STARTED', `Executing ${toolName}`, { toolName });
    try {
      const output = await this.ports.dispatch(toolName, args);
      const evidence: MissionActionEvidence = {
        actionId: `act_${Date.now()}_${toolName}`,
        toolName,
        status: output?.success === false || output?.error ? 'FAILED' : 'SUCCEEDED',
        redactedInput: redactMissionValue(args) as Record<string, unknown>,
        resultSummary: summariseResult(output),
        elapsedMs: Date.now() - started,
      };
      actions.push(evidence);
      for (const artifact of extractArtifacts(output)) artifacts.push(artifact);
      await this.ports.tasks.emitEvent(task.id, 'TOOL_COMPLETED', `${toolName} ${evidence.status.toLowerCase()}`, {
        toolName,
        status: evidence.status,
        elapsedMs: evidence.elapsedMs,
        resultSummary: evidence.resultSummary,
      });
      return evidence;
    } catch (error: any) {
      const evidence: MissionActionEvidence = {
        actionId: `act_${Date.now()}_${toolName}`,
        toolName,
        status: 'FAILED',
        redactedInput: redactMissionValue(args) as Record<string, unknown>,
        resultSummary: error?.message ?? String(error),
        elapsedMs: Date.now() - started,
      };
      actions.push(evidence);
      await this.ports.tasks.emitEvent(task.id, 'ERROR_DETECTED', `${toolName} failed: ${evidence.resultSummary}`, { toolName });
      return evidence;
    }
  }

  private async verify(
    task: any,
    request: MissionRequest,
    actions: MissionActionEvidence[],
    artifacts: string[],
    errors: string[],
  ): Promise<MissionVerification[]> {
    const verification: MissionVerification[] = [];

    if (!request.requireVerification) return verification;

    if (!this.ports.verify) {
      return [{ name: 'Mission verification', status: 'NOT_RUN', evidence: 'No verifier is configured for this mission' }];
    }

    await this.ports.tasks.emitEvent(task.id, 'VERIFICATION_STARTED', 'Running mission verification', {});
    try {
      verification.push(...await this.ports.verify({ taskId: task.id, objective: request.objective, actions, artifacts }));
    } catch (error: any) {
      verification.push({ name: 'Mission verification', status: 'FAILED', evidence: error?.message ?? String(error) });
    }

    const passed = verification.length > 0 && verification.every(entry => entry.status === 'PASSED');
    await this.ports.tasks.emitEvent(
      task.id,
      passed ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED',
      passed ? 'Verification passed' : 'Verification did not pass',
      { checks: verification, errors },
    );
    return verification;
  }

  private summarise(
    status: MissionStatus,
    actions: MissionActionEvidence[],
    errors: string[],
    verificationState: 'NOT_REQUIRED' | 'NOT_RUN' | 'PASSED' | 'FAILED',
  ): string {
    const succeeded = actions.filter(action => action.status === 'SUCCEEDED').length;
    const failed = actions.filter(action => action.status === 'FAILED' || action.status === 'DENIED').length;
    if (status === 'COMPLETED') {
      return `Mission completed: ${succeeded} action(s) executed and verified (${verificationState.replace('_', ' ').toLowerCase()}).`;
    }
    if (status === 'AWAITING_APPROVAL') return 'Mission paused awaiting approval.';
    if (status === 'FAILED') {
      return `Mission failed after ${succeeded} action(s): ${errors.slice(0, 3).join('; ') || 'verification failed'}`;
    }
    if (status === 'WAITING_FOR_INPUT') return 'Mission needs input from the operator before it can continue.';
    return `Mission not completed: ${succeeded} action(s) succeeded, ${failed} blocked or failed${errors.length ? ` — ${errors.slice(0, 3).join('; ')}` : ''}.`;
  }
}

/**
 * Production ports. Approval-backed missions fail closed without
 * MISSION_CHECKPOINT_ENCRYPTION_KEY; constructing the store throws by design.
 */
export async function createDefaultMissionPorts(): Promise<MissionPorts> {
  const [{ TaskStore }, { MissionApprovalStore: ApprovalStore }] = await Promise.all([
    import('./TaskStore'),
    import('./MissionApprovalStore'),
  ]);
  return {
    tasks: TaskStore as unknown as MissionTasksPort,
    approvals: new ApprovalStore(),
    dispatch: async (toolName: string, args: Record<string, unknown>) => {
      const { dispatchToolCall } = await import('../swarm/tools/toolRegistry');
      return dispatchToolCall(toolName, args);
    },
  };
}
