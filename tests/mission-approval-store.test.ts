import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MissionApprovalStore, digestMissionAction } from '../src/kernel/MissionApprovalStore';
import { MissionCheckpointCrypto } from '../src/security/MissionCheckpointCrypto';

class MemoryApprovalDelegate {
  rows = new Map<string, any>();
  counter = 0;
  async create({ data }: { data: any }) {
    const row = { ...data, id: `approval-${++this.counter}`, createdAt: new Date() };
    this.rows.set(row.id, row);
    return row;
  }
  async findUnique({ where }: { where: { id: string } }) { return this.rows.get(where.id) ?? null; }
  async findMany({ where }: { where: any }) {
    return [...this.rows.values()].filter(row => row.taskId === where.taskId && row.userId === where.userId && row.status === where.status && row.expiresAt > where.expiresAt.gt);
  }
  async updateMany({ where, data }: { where: any; data: any }) {
    const row = this.rows.get(where.id);
    const valid = row && row.userId === where.userId && row.status === where.status &&
      (!where.actionDigest || row.actionDigest === where.actionDigest) &&
      (!where.expiresAt || row.expiresAt > where.expiresAt.gt);
    if (!valid) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  }
}

test('approval is user-bound, digest-bound, expiring, one-use, and keeps action encrypted', async () => {
  const delegate = new MemoryApprovalDelegate();
  const crypto = new MissionCheckpointCrypto(Buffer.alloc(32, 4).toString('base64'));
  let now = new Date('2026-11-16T10:00:00Z');
  const store = new MissionApprovalStore(delegate, crypto, () => now);
  const action = { to: 'owner@example.com', subject: 'Invoice', body: 'Sensitive content' };
  const digest = digestMissionAction('send_email', action);
  assert.equal(digestMissionAction('send_email', { body: 'Sensitive content', to: 'owner@example.com', subject: 'Invoice' }), digest);
  await assert.rejects(store.createApproval({
    taskId: 'task-1', userId: 'user-1', toolName: 'send_email', actionDigest: digest,
    summary: 'Send different content', expiresAt: new Date('2026-11-16T10:05:00Z'), pendingAction: { ...action, body: 'different' },
  }), /does not match/);
  const pending = await store.createApproval({
    taskId: 'task-1', userId: 'user-1', toolName: 'send_email', actionDigest: digest,
    summary: 'Send the invoice email to owner@example.com', expiresAt: new Date('2026-11-16T10:05:00Z'), pendingAction: action,
  });
  assert.equal(pending.status, 'PENDING');
  assert.equal(JSON.stringify(pending).includes('Sensitive content'), false);
  assert.equal([...delegate.rows.values()][0].encryptedCheckpoint.includes('Sensitive content'), false);
  assert.deepEqual(await store.getPendingApprovals('task-1', 'user-1'), [pending]);
  await assert.rejects(store.approveOnce({ id: pending.id, userId: 'someone-else', actionDigest: digest, decision: 'APPROVE' }), /not found/);
  await assert.rejects(store.approveOnce({ id: pending.id, userId: 'user-1', actionDigest: '0'.repeat(64), decision: 'APPROVE' }), /does not match/);
  await assert.rejects(store.consumeApprovedAction(pending.id, 'user-1', digest), /not available/);
  const approved = await store.approveOnce({ id: pending.id, userId: 'user-1', actionDigest: digest, decision: 'APPROVE' });
  assert.equal(approved.status, 'APPROVED');
  assert.deepEqual(await store.consumeApprovedAction(pending.id, 'user-1', digest), action);
  await assert.rejects(store.consumeApprovedAction(pending.id, 'user-1', digest), /not available/);
});

test('expired and rejected approvals cannot yield a dispatchable action', async () => {
  const delegate = new MemoryApprovalDelegate();
  let now = new Date('2026-11-16T10:00:00Z');
  const store = new MissionApprovalStore(delegate, new MissionCheckpointCrypto(Buffer.alloc(32, 5).toString('base64')), () => now);
  const action = { path: 'report.txt' };
  const digest = digestMissionAction('delete_file', action);
  const expired = await store.createApproval({ taskId: 't', userId: 'u', toolName: 'delete_file', actionDigest: digest, summary: 'Delete report.txt', expiresAt: new Date('2026-11-16T10:01:00Z'), pendingAction: action });
  now = new Date('2026-11-16T10:02:00Z');
  await assert.rejects(store.approveOnce({ id: expired.id, userId: 'u', actionDigest: digest, decision: 'APPROVE' }), /expired/);
  await assert.rejects(store.consumeApprovedAction(expired.id, 'u', digest), /not available/);

  now = new Date('2026-11-16T10:03:00Z');
  const rejected = await store.createApproval({ taskId: 't', userId: 'u', toolName: 'delete_file', actionDigest: digest, summary: 'Delete report.txt', expiresAt: new Date('2026-11-16T10:04:00Z'), pendingAction: action });
  assert.equal((await store.approveOnce({ id: rejected.id, userId: 'u', actionDigest: digest, decision: 'REJECT' })).status, 'REJECTED');
  await assert.rejects(store.consumeApprovedAction(rejected.id, 'u', digest), /not available/);

  now = new Date('2026-11-16T10:05:00Z');
  const approvedThenExpired = await store.createApproval({ taskId: 't', userId: 'u', toolName: 'delete_file', actionDigest: digest, summary: 'Delete report.txt', expiresAt: new Date('2026-11-16T10:06:00Z'), pendingAction: action });
  await store.approveOnce({ id: approvedThenExpired.id, userId: 'u', actionDigest: digest, decision: 'APPROVE' });
  now = new Date('2026-11-16T10:07:00Z');
  await assert.rejects(store.consumeApprovedAction(approvedThenExpired.id, 'u', digest), /expired/);
});

test('concurrent approval decisions have one compare-and-set winner', async () => {
  const delegate = new MemoryApprovalDelegate();
  const store = new MissionApprovalStore(delegate, new MissionCheckpointCrypto(Buffer.alloc(32, 6).toString('base64')));
  const action = { amount: 25 };
  const digest = digestMissionAction('create_invoice', action);
  const request = await store.createApproval({
    taskId: 't', userId: 'u', toolName: 'create_invoice', actionDigest: digest,
    summary: 'Create invoice for $25', expiresAt: new Date(Date.now() + 60_000), pendingAction: action,
  });
  const results = await Promise.allSettled([
    store.approveOnce({ id: request.id, userId: 'u', actionDigest: digest, decision: 'APPROVE' }),
    store.approveOnce({ id: request.id, userId: 'u', actionDigest: digest, decision: 'REJECT' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
});
