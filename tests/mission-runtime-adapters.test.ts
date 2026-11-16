import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeAutonomousReAct } from '../src/swarm/engine/AutonomousAgentLoop';

function quietOptions(overrides: Record<string, unknown> = {}) {
  return {
    maxSteps: 1,
    specialist: 'jarvis' as const,
    createTask: async () => undefined,
    logToolExecution: async () => undefined,
    completeTask: async () => undefined,
    toolDispatch: async () => ({ success: true, output: 'done' }),
    ...overrides,
  };
}

test('model prose without tool calls stays incomplete', async () => {
  const result = await executeAutonomousReAct('Find a way to help me', quietOptions({
    modelDispatch: async () => ({ content: 'I completed the task.' }),
  }));
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.success, false);
});

test('step exhaustion stays incomplete even after a successful ordinary tool', async () => {
  const result = await executeAutonomousReAct('Inspect the workspace', quietOptions({
    modelDispatch: async () => ({ content: '', tool_calls: [{ id: '1', function: { name: 'workspace_view_tree', arguments: '{}' } }] }),
  }));
  assert.equal(result.stepsExecuted, 1);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.success, false);
});

test('scaffold output and an existing preview do not replace an explicit finish signal', async () => {
  const result = await executeAutonomousReAct('Build a web app', quietOptions({
    deliverableType: 'web_app',
    modelDispatch: async () => ({ content: '', tool_calls: [{ id: '1', function: { name: 'aegis_scaffold_and_deploy_web', arguments: '{}' } }] }),
    toolDispatch: async () => ({ success: true, previewUrl: '/preview/demo' }),
  }));
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.success, false);
});

test('explicit finish signal completes only when required verification passes', async () => {
  const result = await executeAutonomousReAct('Write a report', quietOptions({
    requireVerification: true,
    modelDispatch: async () => ({ content: '', tool_calls: [{ id: '1', function: { name: 'finish_task', arguments: JSON.stringify({ summary: 'Report prepared' }) } }] }),
    verifyDeliverable: async () => ({ verified: true, message: 'Checks passed', errors: [], checksPassed: ['file exists'] }),
  }));
  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.success, true);
});

test('explicit finish signal with a failed verifier cannot complete', async () => {
  const result = await executeAutonomousReAct('Write a report', quietOptions({
    requireVerification: true,
    maxSteps: 2,
    modelDispatch: async (_specialist: string, messages: any[]) => messages.some(message => message.role === 'tool')
      ? { content: 'I cannot fix the failed check.' }
      : { content: '', tool_calls: [{ id: '1', function: { name: 'finish_task', arguments: JSON.stringify({ summary: 'Report prepared' }) } }] },
    verifyDeliverable: async () => ({ verified: false, message: 'Missing output', errors: ['file missing'] }),
  }));
  assert.equal(result.status, 'FAILED');
  assert.equal(result.success, false);
});
