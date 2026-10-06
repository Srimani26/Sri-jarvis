/**
 * J.A.R.V.I.S. MARK-V Autonomous Scheduler & 24/7 Workers Engine
 * Continuous execution of recurring, delayed, and event-driven background tasks.
 */

import { ScheduledJob, SchedulerStats, ScheduleType } from './types';
import { TaskStore } from '../kernel/TaskStore';
import { AgentRuntime } from '../agents/AgentRuntime';

export class AutonomousScheduler {
  private static jobs: Map<string, ScheduledJob> = new Map();
  private static ticker: NodeJS.Timeout | null = null;
  private static runsCompleted = 0;

  static {
    // Start background scheduler ticker (unreferenced to allow clean process exits in test runs)
    if (typeof setInterval !== 'undefined') {
      this.ticker = setInterval(() => {
        this.tick().catch(() => {});
      }, 5000);
      if (this.ticker && typeof (this.ticker as any).unref === 'function') {
        (this.ticker as any).unref();
      }
    }
  }

  /**
   * Schedule a recurring interval job
   */
  public static scheduleRecurring(
    name: string,
    intervalMs: number,
    targetAgentId: string,
    objective: string,
    options?: { inputData?: Record<string, any>; maxRuns?: number; startImmediately?: boolean }
  ): ScheduledJob {
    const id = `job_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nextRunAt = options?.startImmediately
      ? new Date().toISOString()
      : new Date(Date.now() + intervalMs).toISOString();

    const job: ScheduledJob = {
      id,
      name,
      type: 'RECURRING_INTERVAL',
      intervalMs,
      targetAgentId,
      objective,
      inputData: options?.inputData,
      nextRunAt,
      runCount: 0,
      enabled: true,
      maxRuns: options?.maxRuns,
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Schedule a one-time delayed job
   */
  public static scheduleDelayed(
    name: string,
    delayMs: number,
    targetAgentId: string,
    objective: string,
    inputData?: Record<string, any>
  ): ScheduledJob {
    const id = `job_delay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nextRunAt = new Date(Date.now() + delayMs).toISOString();

    const job: ScheduledJob = {
      id,
      name,
      type: 'ONE_TIME',
      targetAgentId,
      objective,
      inputData,
      nextRunAt,
      runCount: 0,
      enabled: true,
      maxRuns: 1,
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Evaluate all due jobs and dispatch through the Execution Kernel
   */
  public static async tick(wait: boolean = false): Promise<number> {
    const now = Date.now();
    let executedCount = 0;

    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;
      if (job.maxRuns && job.runCount >= job.maxRuns) {
        job.enabled = false;
        continue;
      }

      const dueTime = new Date(job.nextRunAt).getTime();
      if (dueTime <= now) {
        executedCount++;
        await this.executeJob(job, wait);
      }
    }

    return executedCount;
  }

  /**
   * Execute an individual scheduled job
   */
  public static async executeJob(job: ScheduledJob, wait: boolean = false): Promise<void> {
    const task = await TaskStore.createTask({
      title: `[Scheduled: ${job.name}] ${job.objective.slice(0, 80)}`,
      description: `Autonomous 24/7 worker executed scheduled job '${job.name}'`,
      agentId: job.targetAgentId,
      totalSteps: 2,
    });

    job.lastTaskId = task.id;
    job.lastRunAt = new Date().toISOString();
    job.runCount++;
    this.runsCompleted++;

    if (job.type === 'ONE_TIME' || (job.maxRuns && job.runCount >= job.maxRuns)) {
      job.enabled = false;
    } else if (job.intervalMs) {
      job.nextRunAt = new Date(Date.now() + job.intervalMs).toISOString();
    }

    const taskExecutionPromise = AgentRuntime.executeAgentTask({
      taskId: task.id,
      agentId: job.targetAgentId,
      objective: job.objective,
      inputData: job.inputData,
    }).catch((err) => {
      console.error(`[AutonomousScheduler] Job '${job.name}' execution error:`, err?.message);
    });

    if (wait) {
      await taskExecutionPromise;
    }
  }

  public static getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  public static listJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  public static cancelJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  public static setJobEnabled(id: string, enabled: boolean): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = enabled;
      return true;
    }
    return false;
  }

  public static getStats(): SchedulerStats {
    const all = Array.from(this.jobs.values());
    const active = all.filter((j) => j.enabled);
    const sortedDue = [...active].sort(
      (a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
    );

    return {
      totalJobs: all.length,
      activeJobs: active.length,
      runsCompleted: this.runsCompleted,
      nextScheduledJob: sortedDue[0],
    };
  }

  public static clear(): void {
    this.jobs.clear();
    this.runsCompleted = 0;
  }
}
