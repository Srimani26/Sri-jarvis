import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AutonomousScheduler } from '../src/scheduler/AutonomousScheduler';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';

describe('Phase 10: J.A.R.V.I.S. Autonomous Scheduler & 24/7 Workers', () => {
  beforeEach(() => {
    AutonomousScheduler.clear();
  });

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('AutonomousScheduler schedules delayed and recurring background jobs', () => {
    // 1. Delayed job
    const delayed = AutonomousScheduler.scheduleDelayed(
      'Database Vacuum',
      60_000,
      'database_engineer',
      'Run SQLite WAL checkpoint and VACUUM'
    );

    assert.ok(delayed.id.startsWith('job_delay_'));
    assert.equal(delayed.type, 'ONE_TIME');
    assert.equal(delayed.enabled, true);
    assert.equal(delayed.runCount, 0);

    // 2. Recurring interval job
    const recurring = AutonomousScheduler.scheduleRecurring(
      'Daily Project Health Check',
      3600_000,
      'monitor_agent',
      'Inspect repository git status and error logs'
    );

    assert.ok(recurring.id.startsWith('job_rec_'));
    assert.equal(recurring.type, 'RECURRING_INTERVAL');
    assert.equal(recurring.enabled, true);

    const stats = AutonomousScheduler.getStats();
    assert.equal(stats.totalJobs, 2);
    assert.equal(stats.activeJobs, 2);
  });

  test('AutonomousScheduler tick() evaluates due jobs and executes through Kernel', async () => {
    // Schedule job due immediately (startImmediately: true)
    const job = AutonomousScheduler.scheduleRecurring(
      'Hourly Dependency Audit',
      60_000,
      'security_agent',
      'Scan node_modules for high-severity CVEs',
      { startImmediately: true, maxRuns: 2 }
    );

    // Run tick pass
    const executedCount = await AutonomousScheduler.tick(true);
    assert.equal(executedCount, 1, 'Tick must execute the 1 due job');

    const updatedJob = AutonomousScheduler.getJob(job.id);
    assert.equal(updatedJob?.runCount, 1, 'Run count must increment');
    assert.ok(updatedJob?.lastRunAt, 'lastRunAt must be recorded');
    assert.ok(updatedJob?.lastTaskId, 'lastTaskId must be populated from execution kernel');

    // Verify task actually exists in TaskStore SQLite database
    const task = await TaskStore.getTask(updatedJob!.lastTaskId!);
    assert.ok(task, 'Task must be persisted in database');
    assert.equal(task?.agentId, 'security_agent');
  });

  test('AutonomousScheduler enforces maxRuns ceiling and disables completed jobs', async () => {
    const job = AutonomousScheduler.scheduleRecurring(
      'One-time recurring test',
      1000,
      'monitor_agent',
      'Check telemetry',
      { startImmediately: true, maxRuns: 1 }
    );

    await AutonomousScheduler.tick(true);

    const afterFirstRun = AutonomousScheduler.getJob(job.id);
    assert.equal(afterFirstRun?.runCount, 1);
    assert.equal(afterFirstRun?.enabled, false, 'Job must be disabled after reaching maxRuns');

    // Subsequent tick should execute 0 jobs
    const nextTickCount = await AutonomousScheduler.tick();
    assert.equal(nextTickCount, 0, 'Disabled job must not execute again');
  });

  test('AutonomousScheduler supports job cancellation and state inspection', () => {
    const job = AutonomousScheduler.scheduleDelayed('Cancel Me', 10_000, 'jarvis', 'Objective');
    assert.equal(AutonomousScheduler.listJobs().length, 1);

    const cancelled = AutonomousScheduler.cancelJob(job.id);
    assert.equal(cancelled, true);
    assert.equal(AutonomousScheduler.listJobs().length, 0);
  });

});
