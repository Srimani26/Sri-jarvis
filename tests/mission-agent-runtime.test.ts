import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AgentRuntime } from '../src/agents/AgentRuntime';
import { TaskStore } from '../src/kernel/TaskStore';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel';

async function withMemoryTaskStore<T>(run: () => Promise<T>): Promise<{ result: T; events: any[] }> {
  const oldEmit = TaskStore.emitEvent;
  const oldUpdate = TaskStore.updateTask;
  const events: any[] = [];
  TaskStore.emitEvent = (async (...args: any[]) => { events.push(args); }) as typeof TaskStore.emitEvent;
  TaskStore.updateTask = (async () => ({ id: 'task-test' })) as typeof TaskStore.updateTask;
  try { return { result: await run(), events }; }
  finally {
    TaskStore.emitEvent = oldEmit;
    TaskStore.updateTask = oldUpdate;
  }
}

test('AgentRuntime blocks actionable work when the plan contains no tool actions', async () => {
  const { result } = await withMemoryTaskStore(() => AgentRuntime.executeAgentTask({
    taskId: 'task-test', agentId: 'database_engineer', objective: 'Analyze database performance', inputData: { toolsToRun: [] },
  }));
  assert.equal(result.success, false);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.verificationPassed, false);
  assert.match(result.errors?.[0] || '', /no executable tool actions were planned/);
});

test('a successful tool flag without an artifact verifier cannot complete an agent mission', async () => {
  ExecutionKernel.registerTool({
    name: 'neon_sql_query', description: 'test query', category: 'DATABASE', risk: 'SAFE',
    requiredPermission: 'READ_ONLY', requiresConfirmation: false, timeoutMs: 1000,
    execute: async () => ({ tool: 'neon_sql_query', success: true, output: { rows: [{ ok: 1 }] } }),
  });
  const { result, events } = await withMemoryTaskStore(() => AgentRuntime.executeAgentTask({
    taskId: 'task-test', agentId: 'database_engineer', objective: 'Inspect the database',
    inputData: { toolsToRun: [{ name: 'neon_sql_query', args: { sql: 'SELECT 1', apiKey: 'sensitive-value' } }] },
  }, async () => ({ success: true, output: { rows: [{ ok: 1 }] } })));
  assert.equal(result.success, false);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.verificationPassed, false);
  assert.match(result.errors?.[0] || '', /No independent artifact verification target/);
  const toolStarted = events.find(([, eventType]) => eventType === 'TOOL_STARTED');
  assert.equal(toolStarted?.[3]?.args?.apiKey, '[REDACTED]');
  assert.equal(toolStarted?.[3]?.args?.sql, 'SELECT 1');
});
