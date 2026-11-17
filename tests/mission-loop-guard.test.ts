import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMissionLoopGuard, MISSION_APPROVAL_SENTINEL } from '../src/kernel/MissionLoopGuard';
import { executeAutonomousReAct } from '../src/swarm/engine/AutonomousAgentLoop';

function quietLoopOptions(overrides: Record<string, unknown> = {}) {
  return {
    maxSteps: 1,
    createTask: async () => undefined,
    logToolExecution: async () => undefined,
    completeTask: async () => undefined,
    ...overrides,
  };
}

test('the guard requires an authenticated, persisted mission context', () => {
  const executor = async () => ({ success: true });
  assert.throws(() => createMissionLoopGuard({ userId: '', taskId: 't', agentId: 'jarvis' }, executor), /authenticated user/);
  assert.throws(() => createMissionLoopGuard({ userId: 'u', taskId: '', agentId: 'jarvis' }, executor), /persisted task id/);
  assert.throws(() => createMissionLoopGuard({ userId: 'u', taskId: 't', agentId: '' }, executor), /agent id/);
});

test('permitted tools run, denied tools are never executed', async () => {
  const executed: string[] = [];
  const executor = async (toolName: string) => {
    executed.push(toolName);
    return { success: true };
  };
  const guard = createMissionLoopGuard({ userId: 'u', taskId: 'task-1', agentId: 'jarvis' }, executor);

  const allowed = await guard.dispatch('workspace_read_file', { path: 'src/App.tsx' });
  assert.equal(allowed.success, true);

  const denied = await guard.dispatch('delete_everything', {});
  assert.equal(denied.success, false);
  assert.equal(denied.denied, true);
  assert.match(denied.error, /DENIED/);
  assert.deepEqual(executed, ['workspace_read_file']);
  assert.equal(guard.denied.length, 1);
});

test('consequential tools persist an approval instead of executing', async () => {
  let executed = 0;
  const created: any[] = [];
  const executor = async () => { executed++; return { success: true }; };
  const guard = createMissionLoopGuard({
    userId: 'u',
    taskId: 'task-1',
    agentId: 'friday',
    approvals: {
      async createApproval(input) {
        created.push(input);
        return { id: 'approval-1', summary: input.summary, expiresAt: input.expiresAt };
      },
    },
  }, executor);

  const result = await guard.dispatch('send_email', { to: 'owner@example.com', body: 'Invoice' });

  assert.equal(executed, 0);
  assert.equal(result[MISSION_APPROVAL_SENTINEL], true);
  assert.equal(result.approvalId, 'approval-1');
  assert.equal(guard.pendingApprovalId, 'approval-1');
  assert.equal(created[0].toolName, 'send_email');
  assert.match(created[0].actionDigest, /^[a-f0-9]{64}$/);
  assert.ok(created[0].expiresAt > new Date());
});

test('the ReAct loop stops in AWAITING_APPROVAL when a tool needs consent', async () => {
  let executed = 0;
  const result = await executeAutonomousReAct('Email the invoice to the client', quietLoopOptions({
    specialist: 'friday',
    modelDispatch: async () => ({
      content: '',
      tool_calls: [{ id: '1', function: { name: 'send_email', arguments: JSON.stringify({ to: 'owner@example.com', body: 'Invoice' }) } }],
    }),
    toolDispatch: async () => { executed++; return { success: true }; },
    mission: {
      userId: 'user-1',
      taskId: 'task-1',
      agentId: 'friday',
      approvals: {
        async createApproval(input: any) {
          return { id: 'approval-9', summary: input.summary, expiresAt: input.expiresAt };
        },
      },
    },
  }));

  assert.equal(executed, 0, 'the consequential tool must not run before approval');
  assert.equal(result.status, 'AWAITING_APPROVAL');
  assert.equal(result.success, false);
  assert.equal(result.pendingApprovalId, 'approval-9');
  assert.match(result.finalResponse, /approv/i);
});

test('the ReAct loop reports a denial without dispatching anything', async () => {
  let executed = 0;
  const result = await executeAutonomousReAct('Email the report', quietLoopOptions({
    specialist: 'friday',
    modelDispatch: async () => ({
      content: '',
      tool_calls: [{ id: '1', function: { name: 'send_email', arguments: '{}' } }],
    }),
    toolDispatch: async () => { executed++; return { success: true }; },
    mission: {
      userId: 'user-1',
      taskId: 'task-1',
      agentId: 'security_agent',
    },
  }));

  assert.equal(executed, 0);
  assert.notEqual(result.status, 'COMPLETED');
  assert.equal(result.success, false);
});

test('without a mission context the loop keeps its existing behaviour', async () => {
  let executed = 0;
  const result = await executeAutonomousReAct('Read the workspace tree', quietLoopOptions({
    modelDispatch: async () => ({
      content: '',
      tool_calls: [{ id: '1', function: { name: 'workspace_view_tree', arguments: '{}' } }],
    }),
    toolDispatch: async () => { executed++; return { success: true, output: 'ok' }; },
  }));

  assert.equal(executed, 1);
  assert.equal(result.status, 'BLOCKED', 'no finish signal still means incomplete');
});
