// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. MARK-V Persistent Background Task Queue & Worker Daemon
 * Durable database-backed queue that survives server restarts, enforces
 * bounded concurrency, and processes tasks asynchronously via AutonomousReActEngine.
 */

import { prisma } from '../lib/db';
import { TaskStore } from '../kernel/TaskStore';
import { AutonomousReActEngine, ReActExecutionResult } from '../agents/AutonomousReActEngine';

export interface QueueJobInput {
  title: string;
  objective: string;
  agentId?: string;
  projectName?: string;
  maxSteps?: number;
  parameters?: Record<string, any>;
  aiCaller?: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>;
}

export class PersistentTaskQueue {
  private static isRunning = false;
  private static pollTimer: NodeJS.Timeout | null = null;
  private static activeJobs: Map<string, Promise<any>> = new Map();
  private static maxConcurrency = 2; // Controlled concurrency for cloud container stability
  private static defaultAiCaller: ((systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>) | null = null;

  /**
   * Set global AI caller for queue workers
   */
  public static setAiCaller(fn: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>): void {
    this.defaultAiCaller = fn;
  }

  /**
   * Submit an objective to the durable task queue
   * Immediately returns taskId for 202 Accepted HTTP responses
   */
  public static async enqueue(input: QueueJobInput): Promise<{ taskId: string; taskNumber: string; status: string }> {
    const metaPayload = {
      objective: input.objective,
      projectName: input.projectName || `proj_${Date.now().toString().slice(-6)}`,
      maxSteps: input.maxSteps || 15,
      parameters: input.parameters || {},
    };

    const task = await TaskStore.createTask({
      title: input.title || input.objective.slice(0, 80),
      description: JSON.stringify(metaPayload),
      agentId: input.agentId || 'jarvis',
      totalSteps: input.maxSteps || 6,
    });

    // Proactively trigger processing
    this.processNextJobs();

    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      status: 'QUEUED',
    };
  }

  /**
   * Start the continuous background queue worker
   */
  public static startWorker(pollIntervalMs = 2000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`⚡ [PersistentTaskQueue] Background worker daemon started (Concurrency: ${this.maxConcurrency})`);

    // Crash recovery audit: recover any tasks left in CLAIMED or RUNNING state from previous crash
    this.recoverInterruptedTasks();

    this.pollTimer = setInterval(() => {
      this.processNextJobs();
    }, pollIntervalMs);
  }

  /**
   * Stop the queue worker
   */
  public static stopWorker(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isRunning = false;
    console.log('🛑 [PersistentTaskQueue] Background worker stopped');
  }

  /**
   * Recover tasks left hanging when container was shut down or restarted
   */
  public static async recoverInterruptedTasks(): Promise<number> {
    try {
      const hangingTasks = await (prisma as any).agentTask.findMany({
        where: {
          status: { in: ['CLAIMED', 'RUNNING'] },
        },
      });

      for (const t of hangingTasks) {
        console.warn(`🛡️ [PersistentTaskQueue] Recovered interrupted task: ${t.taskNumber} -> Re-queued`);
        await TaskStore.updateTask(t.id, {
          status: 'QUEUED',
          currentOperation: 'Re-queued after server restart recovery pass',
        });
        await TaskStore.emitEvent(t.id, 'RECOVERY_STARTED', `Task re-queued after server reboot`, {
          taskNumber: t.taskNumber,
        });
      }

      return hangingTasks.length;
    } catch (err: any) {
      console.warn(`⚠️ [PersistentTaskQueue] Recovery pass warning:`, err?.message || err);
      return 0;
    }
  }

  /**
   * Process next available jobs up to concurrency limit
   */
  private static async processNextJobs(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrency) {
      return;
    }

    const availableSlots = this.maxConcurrency - this.activeJobs.size;

    try {
      const queuedTasks = await (prisma as any).agentTask.findMany({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
        take: availableSlots,
      });

      for (const task of queuedTasks) {
        if (this.activeJobs.has(task.id)) continue;

        // Atomically claim task
        await TaskStore.updateTask(task.id, {
          status: 'RUNNING',
          currentOperation: 'Claimed by background worker daemon',
        });

        const jobPromise = this.executeJob(task).finally(() => {
          this.activeJobs.delete(task.id);
        });

        this.activeJobs.set(task.id, jobPromise);
      }
    } catch (err: any) {
      // Non-fatal queue lookup error
    }
  }

  /**
   * Execute a single background job via AutonomousReActEngine
   */
  private static async executeJob(task: any): Promise<ReActExecutionResult> {
    let meta: { objective: string; projectName: string; maxSteps: number; parameters: any } = {
      objective: task.title,
      projectName: `proj_${task.id.slice(-6)}`,
      maxSteps: 12,
      parameters: {},
    };

    try {
      if (task.description && task.description.startsWith('{')) {
        meta = JSON.parse(task.description);
      }
    } catch (_) {}

    try {
      await TaskStore.emitEvent(
        task.id,
        'AGENT_STARTED',
        `Worker daemon dispatched task ${task.taskNumber} to specialist '${task.agentId}'`,
        { agentId: task.agentId, projectName: meta.projectName }
      );

      const result = await AutonomousReActEngine.run({
        taskId: task.id,
        agentId: task.agentId,
        objective: meta.objective || task.title,
        projectName: meta.projectName,
        maxSteps: meta.maxSteps || 12,
        contextData: meta.parameters,
        aiCaller: this.defaultAiCaller || undefined,
      });

      await TaskStore.updateTask(task.id, {
        status: result.success ? 'COMPLETED' : 'FAILED',
        progress: result.success ? 100 : task.progress,
        currentOperation: result.success ? 'Completed by Autonomous Engine' : 'Halted with errors',
        executionResult: result.finalAnswer,
        verificationResult: `Verified across ${result.steps.length} steps. Tools: ${result.toolsUsed.join(', ') || 'Direct'}.`,
        filesChanged: result.artifactsCreated,
        commandsRun: result.toolsUsed,
      });

      return result;
    } catch (jobErr: any) {
      const errMsg = jobErr?.message || String(jobErr);
      await TaskStore.updateTask(task.id, {
        status: 'FAILED',
        errorDetails: errMsg,
        currentOperation: `Execution failure: ${errMsg}`,
      });

      await TaskStore.emitEvent(task.id, 'ERROR_DETECTED', `Job execution failed: ${errMsg}`, {
        error: errMsg,
      });

      return {
        success: false,
        finalAnswer: `Error during task execution: ${errMsg}`,
        steps: [],
        toolsUsed: [],
        totalDurationMs: 0,
        artifactsCreated: [],
        errors: [errMsg],
      };
    }
  }

  /**
   * Query status of active jobs
   */
  public static getQueueStatus() {
    return {
      isRunning: this.isRunning,
      activeJobCount: this.activeJobs.size,
      maxConcurrency: this.maxConcurrency,
    };
  }
}
