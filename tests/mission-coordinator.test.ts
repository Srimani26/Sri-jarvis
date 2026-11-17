import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MissionCoordinator, MissionPorts } from '../src/kernel/MissionCoordinator';

function makeTasks() {
  const tasks = new Map<string, any>();
  let counter = 0;
  const port = {
    async createTask(input: any) {
      const id = `task-${++counter}`;
      const task = {
        id,
        taskNumber: `TASK-V5-TEST${counter}`,
        title: input.title,
        description: input.description,
        agentId: input.agentId ?? 'jarvis',
        status: 'QUEUED',
      };
      tasks.set(id, task);
      return task;
    },
    async updateTask(id: string, input: any) {
      const task = tasks.get(id);
      if (!task) throw new Error('missing task');
      Object.assign(task, input);
      return task;
    },
    async emitEvent() { return { ok: true }; },
    async getTask(id: string) { return tasks.get(id) ?? null; },
  };
  return { port, tasks };
}

function makeApprovals() {
  const rows = new Map<string, any>();
  let counter = 0;
  return {
    rows,
    async createApproval(input: any) {
      const row = {
        id: `approval-${++counter}`,
        status: 'PENDING',
        ...input,
      };
      rows.set(row.id, row);
      return row;
    },
    async getApproval(id: string, userId: string) {
      const row = rows.get(id);
      if (!row || row.userId !== userId) throw new Error('Approval request not found');
      return row;
    },
    async consumeApprovedCheckpoint(id: string, userId: string) {
      const row = rows.get(id);
      if (!row || row.userId !== userId) throw new Error('Approved action not found');
      if (row.status !== 'APPROVED' || row.consumed) throw new Error('Approved action is not available');
      row.consumed = true;
      return { action: row.pendingAction, checkpoint: row.checkpoint ?? null };
    },
  };
}

function build(dispatch: (toolName: string, args: any) => Promise<any>, verify?: MissionPorts['verify']) {
  const tasks = makeTasks();
  const approvals = makeApprovals();
  const coordinator = new MissionCoordinator({
    tasks: tasks.port as any,
    approvals: approvals as any,
    dispatch,
    verify,
    now: () => new Date('2026-11-17T10:00:00Z'),
  });
  return { coordinator, tasks, approvals };
}

test('a permitted mission executes and completes on real evidence', async () => {
  const dispatched: string[] = [];
  const { coordinator, tasks } = build(async (toolName) => {
    dispatched.push(toolName);
    return { success: true, summary: 'tree listed' };
  });

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Inspect the workspace',
    agentId: 'jarvis',
    source: 'chat',
    steps: [{ toolName: 'workspace_view_tree', args: {} }],
  });

  assert.equal(result.status, 'COMPLETED');
  assert.deepEqual(dispatched, ['workspace_view_tree']);
  assert.equal(result.actions[0].status, 'SUCCEEDED');
  assert.equal((await tasks.port.getTask(result.taskId)).status, 'COMPLETED');
});

test('a mission with no executable steps is rejected outright', async () => {
  const { coordinator } = build(async () => ({ success: true }));
  await assert.rejects(
    coordinator.start({ userId: 'user-1', objective: 'Nothing', agentId: 'jarvis', source: 'chat', steps: [] }),
    /at least one actionable step/,
  );
});

test('a denied tool blocks the mission and is never dispatched', async () => {
  let dispatched = 0;
  const { coordinator } = build(async () => { dispatched++; return { success: true }; });

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Send an email from the security agent',
    agentId: 'security_agent',
    source: 'task_api',
    steps: [{ toolName: 'send_email', args: { to: 'owner@example.com' } }],
  });

  assert.equal(dispatched, 0);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.actions[0].status, 'DENIED');
});

test('required verification without a verifier keeps the mission incomplete', async () => {
  const { coordinator } = build(async () => ({ success: true, summary: 'scaffold created' }));

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Scaffold a web app',
    agentId: 'jarvis',
    source: 'task_api',
    requireVerification: true,
    steps: [{ toolName: 'workspace_write_file', args: { path: 'index.html', content: 'x' } }],
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.verification[0].status, 'NOT_RUN');
});

test('passing verification completes the mission', async () => {
  const { coordinator } = build(
    async () => ({ success: true }),
    async () => [{ name: 'Artifact exists', status: 'PASSED', evidence: 'index.html' }],
  );

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Write the landing page',
    agentId: 'jarvis',
    source: 'voice',
    requireVerification: true,
    steps: [{ toolName: 'workspace_write_file', args: { path: 'index.html', content: 'x' } }],
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.actions[0].redactedInput.content, '[redacted]');
});

test('a failing step fails the mission instead of reporting success', async () => {
  const { coordinator } = build(async () => { throw new Error('compiler exploded'); });

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Compile the project',
    agentId: 'jarvis',
    source: 'scheduler',
    steps: [{ toolName: 'terminal_run_command', args: { command: 'npm run build' } }],
  });

  assert.equal(result.status, 'FAILED');
  assert.match(result.errors.join(' '), /compiler exploded/);
});

test('a consequential action pauses the mission without executing it', async () => {
  let dispatched = 0;
  const { coordinator, tasks, approvals } = build(async () => { dispatched++; return { success: true }; });

  const result = await coordinator.start({
    userId: 'user-1',
    objective: 'Email the invoice',
    agentId: 'friday',
    source: 'voice',
    steps: [{ toolName: 'send_email', args: { to: 'owner@example.com', body: 'Invoice' } }],
  });

  assert.equal(dispatched, 0);
  assert.equal(result.status, 'AWAITING_APPROVAL');
  assert.ok(result.pendingApprovalId);
  assert.equal((await tasks.port.getTask(result.taskId)).status, 'AWAITING_APPROVAL');
  const row = approvals.rows.get(result.pendingApprovalId!);
  assert.equal(row.status, 'PENDING');
  assert.ok(row.actionDigest);
});

test('resume executes the approved action exactly once and continues the plan', async () => {
  const dispatched: string[] = [];
  const { coordinator, approvals } = build(async (toolName) => {
    dispatched.push(toolName);
    return { success: true, summary: 'done' };
  });

  const paused = await coordinator.start({
    userId: 'user-1',
    objective: 'Email the invoice then check the public service',
    agentId: 'friday',
    source: 'voice',
    steps: [
      { toolName: 'send_email', args: { to: 'owner@example.com', body: 'Invoice' } },
      { toolName: 'query_public_service', args: { category: 'weather' } },
    ],
  });
  assert.equal(paused.status, 'AWAITING_APPROVAL');
  assert.equal(dispatched.length, 0);

  const approvalId = paused.pendingApprovalId!;
  approvals.rows.get(approvalId).status = 'APPROVED';

  const resumed = await coordinator.resume(paused.taskId, 'user-1', approvalId);
  assert.equal(resumed.status, 'COMPLETED');
  assert.deepEqual(dispatched, ['send_email', 'query_public_service']);

  await assert.rejects(coordinator.resume(paused.taskId, 'user-1', approvalId), /not available/);
});

test('resume refuses an unapproved, foreign or mismatched approval', async () => {
  const { coordinator, approvals } = build(async () => ({ success: true }));

  const paused = await coordinator.start({
    userId: 'user-1',
    objective: 'Email the invoice',
    agentId: 'friday',
    source: 'voice',
    steps: [{ toolName: 'send_email', args: { to: 'owner@example.com' } }],
  });
  const approvalId = paused.pendingApprovalId!;

  await assert.rejects(coordinator.resume(paused.taskId, 'user-1', approvalId), /only an APPROVED action/);
  await assert.rejects(coordinator.resume(paused.taskId, 'user-2', approvalId), /not found/);

  approvals.rows.get(approvalId).status = 'REJECTED';
  await assert.rejects(coordinator.resume(paused.taskId, 'user-1', approvalId), /only an APPROVED action/);
});

test('mission events never carry raw tool arguments', async () => {
  const events: Array<{ message: string; metadata?: any }> = [];
  const tasks = makeTasks();
  const approvals = makeApprovals();
  const coordinator = new MissionCoordinator({
    tasks: {
      ...tasks.port,
      async emitEvent(_taskId: string, _type: any, message: string, metadata?: any) {
        events.push({ message, metadata });
        return { ok: true };
      },
    } as any,
    approvals: approvals as any,
    dispatch: async () => ({ success: true }),
  });

  await coordinator.start({
    userId: 'user-1',
    objective: 'Email the invoice',
    agentId: 'friday',
    source: 'voice',
    steps: [{ toolName: 'send_email', args: { to: 'owner@example.com', body: 'Sensitive content' } }],
  });

  const serialised = JSON.stringify(events);
  // The approval summary may name the recipient (needed for a meaningful
  // decision), but never the body or any raw argument payload.
  assert.equal(serialised.includes('Sensitive content'), false);
  assert.equal(serialised.includes('"body"'), false);
  assert.equal(serialised.includes('"pendingAction"'), false);
});
