import { createHash } from 'node:crypto';
import { prisma } from '../lib/db';
import { MissionCheckpointCrypto } from '../security/MissionCheckpointCrypto';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export interface ApprovalRequest {
  id: string;
  taskId: string;
  toolName: string;
  actionDigest: string;
  summary: string;
  expiresAt: Date;
  status: ApprovalStatus;
}

export interface ApprovalDelegate {
  create(input: { data: Record<string, unknown> }): Promise<any>;
  findUnique(input: { where: { id: string } }): Promise<any>;
  findMany(input: { where: Record<string, unknown>; orderBy?: Record<string, string> }): Promise<any[]>;
  updateMany(input: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
}

function publicApproval(row: any): ApprovalRequest {
  return {
    id: row.id,
    taskId: row.taskId,
    toolName: row.toolName,
    actionDigest: row.actionDigest,
    summary: row.summary,
    expiresAt: row.expiresAt,
    status: row.status,
  };
}

export class MissionApprovalStore {
  constructor(
    private readonly delegate: ApprovalDelegate = (prisma as any).taskApproval,
    private readonly checkpointCrypto = new MissionCheckpointCrypto(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createApproval(input: {
    taskId: string;
    userId: string;
    toolName: string;
    actionDigest: string;
    summary: string;
    expiresAt: Date;
    pendingAction: Record<string, unknown>;
  }): Promise<ApprovalRequest> {
    if (!input.taskId || !input.userId || !input.toolName) throw new Error('Approval ownership and tool are required');
    if (!/^[a-f0-9]{64}$/i.test(input.actionDigest)) throw new Error('actionDigest must be a SHA-256 hex digest');
    if (digestMissionAction(input.toolName, input.pendingAction) !== input.actionDigest.toLowerCase()) {
      throw new Error('actionDigest does not match the pending action');
    }
    if (!input.summary.trim() || input.summary.length > 500) throw new Error('Approval summary must be 1–500 characters');
    if (input.expiresAt <= this.now()) throw new Error('Approval expiry must be in the future');
    const encryptedCheckpoint = this.checkpointCrypto.encrypt(JSON.stringify(input.pendingAction));
    const row = await this.delegate.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        toolName: input.toolName,
        actionDigest: input.actionDigest.toLowerCase(),
        summary: input.summary,
        encryptedCheckpoint,
        status: 'PENDING',
        expiresAt: input.expiresAt,
      },
    });
    return publicApproval(row);
  }

  async approveOnce(input: {
    id: string;
    userId: string;
    actionDigest: string;
    decision: 'APPROVE' | 'REJECT';
  }): Promise<ApprovalRequest> {
    const current = await this.delegate.findUnique({ where: { id: input.id } });
    if (!current || current.userId !== input.userId) throw new Error('Approval request not found');
    if (current.actionDigest !== input.actionDigest.toLowerCase()) throw new Error('Approval action does not match the pending action');
    if (current.status !== 'PENDING') throw new Error('Approval request has already been decided');
    const now = this.now();
    if (current.expiresAt <= now) {
      await this.delegate.updateMany({ where: { id: input.id, userId: input.userId, status: 'PENDING' }, data: { status: 'EXPIRED' } });
      throw new Error('Approval request has expired');
    }
    const status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const changed = await this.delegate.updateMany({
      where: {
        id: input.id,
        userId: input.userId,
        actionDigest: input.actionDigest.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      data: { status, decidedAt: now },
    });
    if (changed.count !== 1) throw new Error('Approval request is expired or has already been decided');
    return publicApproval({ ...current, status, decidedAt: now });
  }

  async getPendingApprovals(taskId: string, userId: string): Promise<ApprovalRequest[]> {
    const rows = await this.delegate.findMany({
      where: { taskId, userId, status: 'PENDING', expiresAt: { gt: this.now() } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(publicApproval);
  }

  /** Atomically burns an approval before returning the decrypted action for dispatch. */
  async consumeApprovedAction(id: string, userId: string, actionDigest: string): Promise<Record<string, unknown>> {
    const current = await this.delegate.findUnique({ where: { id } });
    if (!current || current.userId !== userId || current.actionDigest !== actionDigest.toLowerCase()) {
      throw new Error('Approved action not found');
    }
    if (current.status !== 'APPROVED') throw new Error('Approved action is not available');
    const now = this.now();
    if (current.expiresAt <= now) {
      await this.delegate.updateMany({
        where: { id, userId, actionDigest: actionDigest.toLowerCase(), status: 'APPROVED' },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Approved action has expired');
    }
    const consumed = await this.delegate.updateMany({
      where: { id, userId, actionDigest: actionDigest.toLowerCase(), status: 'APPROVED', expiresAt: { gt: now } },
      data: { status: 'CONSUMED', consumedAt: now },
    });
    if (consumed.count !== 1) throw new Error('Approved action has already been consumed');
    const parsed = JSON.parse(this.checkpointCrypto.decrypt(current.encryptedCheckpoint));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid mission checkpoint');
    if (digestMissionAction(current.toolName, parsed) !== actionDigest.toLowerCase()) {
      throw new Error('Mission checkpoint does not match the approved action');
    }
    return parsed;
  }
}

export function digestMissionAction(toolName: string, action: Record<string, unknown>): string {
  const stable = (value: any): any => Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
      : value;
  return createHash('sha256').update(JSON.stringify(stable({ toolName, action }))).digest('hex');
}
