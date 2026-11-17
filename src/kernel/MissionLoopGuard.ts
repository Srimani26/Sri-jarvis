/**
 * Mission Loop Guard
 *
 * Adapter between the autonomous ReAct loop and the mission dispatch boundary.
 * When a loop runs with a mission context, every tool call is authorized by
 * `MissionToolPolicy` first. Consequential actions never execute inline: the
 * guard persists a one-use approval bound to the exact arguments and returns a
 * sentinel that makes the loop stop in AWAITING_APPROVAL.
 *
 * Denials are returned as ordinary tool observations so the model sees why it
 * was denied, but nothing is dispatched.
 */

import { MissionApprovalStore } from './MissionApprovalStore';
import { authorizeMissionTool } from './MissionToolPolicy';
import type { ExecutionPolicy } from './types';

export const MISSION_APPROVAL_SENTINEL = '__missionApprovalRequired';

export interface MissionLoopContext {
  userId: string;
  /** Persisted mission task (AgentTask id) the approval attaches to. */
  taskId: string;
  /** Agent identity used for the allowlist and permission ceiling. */
  agentId: string;
  taskScope?: ExecutionPolicy;
  approvalTtlMs?: number;
  /** Injectable for tests; production constructs the encrypted store lazily. */
  approvals?: {
    createApproval(input: {
      taskId: string;
      userId: string;
      toolName: string;
      actionDigest: string;
      summary: string;
      expiresAt: Date;
      pendingAction: Record<string, unknown>;
      checkpoint?: Record<string, unknown>;
    }): Promise<{ id: string; summary: string; expiresAt: Date }>;
  };
  now?: () => Date;
}

export interface MissionLoopGuard {
  dispatch: (toolName: string, args: Record<string, unknown>) => Promise<any>;
  readonly denied: string[];
  readonly pendingApprovalId?: string;
}

const DEFAULT_APPROVAL_TTL_MS = 10 * 60 * 1000;

export function createMissionLoopGuard(
  context: MissionLoopContext,
  executor: (toolName: string, args: Record<string, any>) => Promise<any>,
): MissionLoopGuard {
  if (!context?.userId?.trim()) throw new Error('Approval-backed missions require an authenticated user');
  if (!context?.taskId?.trim()) throw new Error('Approval-backed missions require a persisted task id');
  if (!context?.agentId?.trim()) throw new Error('Approval-backed missions require an agent id');

  const denied: string[] = [];
  let pendingApprovalId: string | undefined;
  let approvals = context.approvals ?? null;

  const getApprovals = () => {
    // Constructed lazily: without MISSION_CHECKPOINT_ENCRYPTION_KEY the store
    // throws, so approval-backed dispatch fails closed instead of running.
    if (!approvals) approvals = new MissionApprovalStore();
    return approvals;
  };

  return {
    get pendingApprovalId() {
      return pendingApprovalId;
    },
    denied,
    async dispatch(toolName: string, args: Record<string, unknown>) {
      const authorization = authorizeMissionTool({
        agentId: context.agentId,
        toolName,
        args,
        taskScope: context.taskScope,
      });

      if (!authorization.allowed) {
        const reason = authorization.reason ?? `Tool '${toolName}' is not permitted`;
        denied.push(reason);
        return { success: false, denied: true, error: `DENIED: ${reason}` };
      }

      if (authorization.requiresApproval) {
        const now = (context.now ?? (() => new Date()))();
        const approval = await getApprovals().createApproval({
          taskId: context.taskId,
          userId: context.userId,
          toolName,
          actionDigest: authorization.actionDigest!,
          summary: authorization.summary ?? `Approve ${toolName}`,
          expiresAt: new Date(now.getTime() + (context.approvalTtlMs ?? DEFAULT_APPROVAL_TTL_MS)),
          pendingAction: args,
        });
        pendingApprovalId = approval.id;
        return {
          success: false,
          [MISSION_APPROVAL_SENTINEL]: true,
          approvalId: approval.id,
          summary: approval.summary,
          toolName,
        };
      }

      return executor(toolName, args);
    },
  };
}
