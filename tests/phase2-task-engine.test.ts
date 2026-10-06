import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { TaskStore } from '../src/kernel/TaskStore';
import { EventStream } from '../src/kernel/EventStream';
import { CrashRecovery } from '../src/kernel/CrashRecovery';
import { prisma } from '../src/lib/db';
import { KernelEvent } from '../src/kernel/types';

describe('Phase 2: J.A.R.V.I.S. Persistent Task Engine, SSE & Crash Recovery', () => {
  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('TaskStore persists task to SQLite with deterministic properties', async () => {
    const task = await TaskStore.createTask({
      title: 'Audit authentication middleware',
      description: 'Ensure token expiry and refresh flow are robust against replay attacks',
      agentId: 'security_agent',
      totalSteps: 5,
    });

    assert.ok(task.id, 'Task must have a database-generated ID');
    assert.match(task.taskNumber, /^TASK-V5-\d+$/, 'Task number must follow sovereign format');
    assert.equal(task.title, 'Audit authentication middleware');
    assert.equal(task.agentId, 'security_agent');
    assert.equal(task.status, 'QUEUED');
    assert.equal(task.progress, 0);
    assert.match(task.estimatedDuration || '', /min$/, 'Estimated duration must be generated as a range');

    // Verify task can be retrieved from database
    const retrieved = await TaskStore.getTask(task.id);
    assert.ok(retrieved, 'Persisted task must be retrievable from database');
    assert.equal(retrieved?.id, task.id);
  });

  test('TaskStore computes factual progress and logs state transitions', async () => {
    const task = await TaskStore.createTask({
      title: 'Run integration test suite',
      description: 'Execute vitest and node tests in sandbox',
      agentId: 'qa_engineer',
      totalSteps: 4,
    });

    // Step 1 of 4 completed -> 25%
    const updated1 = await TaskStore.updateTask(task.id, {
      status: 'RUNNING',
      currentOperation: 'Running unit test stage',
      completedSteps: 1,
      totalSteps: 4,
    });

    assert.equal(updated1.status, 'RUNNING');
    assert.equal(updated1.progress, 25, '1 of 4 steps must equal exactly 25%');
    assert.equal(updated1.currentOperation, 'Running unit test stage');

    // Step 4 of 4 completed -> 100% and marks completedAt
    const updated2 = await TaskStore.updateTask(task.id, {
      status: 'COMPLETED',
      currentOperation: 'All tests passed with 0 failures',
      completedSteps: 4,
      totalSteps: 4,
      verificationResult: 'VERIFIED: 100% tests passed',
    });

    assert.equal(updated2.status, 'COMPLETED');
    assert.equal(updated2.progress, 100);
    assert.ok(updated2.completedAt, 'completedAt timestamp must be recorded');
    assert.equal(updated2.verificationResult, 'VERIFIED: 100% tests passed');
  });

  test('EventStream formats SSE payloads conforming to W3C EventSource spec', () => {
    const event: KernelEvent = {
      id: 'evt_test_999',
      taskId: 'task_001',
      eventType: 'TOOL_STARTED',
      message: 'Executing ripgrep search',
      timestamp: '2026-10-06T12:00:00.000Z',
      metadata: { query: 'authenticate' }
    };

    const sseChunk = EventStream.formatSSE(event);
    assert.ok(sseChunk.startsWith('id: evt_test_999\n'), 'SSE chunk must declare id');
    assert.ok(sseChunk.includes('event: TOOL_STARTED\n'), 'SSE chunk must declare event name');
    assert.ok(sseChunk.includes('data: {"id":"evt_test_999"'), 'SSE chunk must declare json data');
    assert.ok(sseChunk.endsWith('\n\n'), 'SSE chunk must terminate with double newline');
  });

  test('EventStream dispatches task-scoped and global SSE broadcasts', async () => {
    const taskEvents: string[] = [];
    const globalEvents: string[] = [];

    const taskId = `task_sse_${Date.now()}`;

    const unsubTask = EventStream.subscribe(taskId, (chunk) => {
      taskEvents.push(chunk);
    });

    const unsubGlobal = EventStream.subscribeGlobal((chunk) => {
      globalEvents.push(chunk);
    });

    const evt: KernelEvent = {
      id: 'evt_dispatch_1',
      taskId,
      eventType: 'AGENT_THINKING',
      message: 'Architect designing schema migration',
      timestamp: new Date().toISOString()
    };

    EventStream.broadcastToTask(taskId, evt);

    assert.equal(taskEvents.length, 1, 'Task listener must receive broadcast');
    assert.equal(globalEvents.length, 1, 'Global listener must receive cockpit broadcast');
    assert.ok(taskEvents[0].includes('AGENT_THINKING'));

    unsubTask();
    unsubGlobal();

    // Verify unsubscribing prevents further emissions
    EventStream.broadcastToTask(taskId, evt);
    assert.equal(taskEvents.length, 1, 'Unsubscribed listener must not receive further events');
  });

  test('CrashRecovery audits interrupted tasks and safely isolates mutating tasks', async () => {
    // 1. Create a safe in-flight task (read-only / planning, no filesystem changes)
    const safeTask = await (prisma as any).agentTask.create({
      data: {
        taskNumber: `TASK-CRASH-SAFE-${Date.now()}`,
        title: 'Safe read-only research task',
        description: 'Searching for documentation',
        agentId: 'research_agent',
        status: 'RUNNING',
        progress: 30,
        currentOperation: 'Searching arXiv papers',
        totalSteps: 3,
        completedSteps: 1,
        startedAt: new Date(),
      }
    });

    // 2. Create a hazardous in-flight task (interrupted mid-write with files changed)
    const dangerousTask = await (prisma as any).agentTask.create({
      data: {
        taskNumber: `TASK-CRASH-DANGER-${Date.now()}`,
        title: 'Mutating code refactor task',
        description: 'Writing to production middleware',
        agentId: 'software_engineer',
        status: 'RUNNING',
        progress: 60,
        currentOperation: 'Patching auth middleware',
        totalSteps: 4,
        completedSteps: 2,
        filesChanged: JSON.stringify(['src/middleware/auth.ts', 'src/routes/api.ts']),
        startedAt: new Date(),
      }
    });

    // Run CrashRecovery pass
    const report = await CrashRecovery.recoverInterruptedTasks();

    assert.ok(report.interruptedTotal >= 2, 'Must detect at least the 2 interrupted tasks');
    assert.ok(report.recoveredToQueued >= 1, 'Must recover safe task to QUEUED');
    assert.ok(report.blockedForInspection >= 1, 'Must block mutating task for inspection');

    // Inspect safe task in DB
    const recoveredSafe = await TaskStore.getTask(safeTask.id);
    assert.equal(recoveredSafe?.status, 'QUEUED', 'Safe task must be re-queued');

    // Inspect dangerous task in DB
    const blockedDangerous = await TaskStore.getTask(dangerousTask.id);
    assert.equal(blockedDangerous?.status, 'BLOCKED', 'Mutating task must be BLOCKED for safety');
    assert.match(blockedDangerous?.errorDetails || '', /Server reboot during RUNNING/);
  });

});
