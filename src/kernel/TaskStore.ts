/**
 * J.A.R.V.I.S. MARK-V Persistent Task Store
 * Real SQLite storage via Prisma Client with event streaming integration.
 * Truth is maintained in the database, not in transient memory.
 */

import { prisma } from '../lib/db';
import { TaskStatus, EventType, KernelEvent } from './types';
import { ExecutionKernel } from './ExecutionKernel';
import { EventStream } from './EventStream';

export interface CreateTaskInput {
  title?: string;
  description?: string;
  objective?: string;
  id?: string;
  agentId?: string;
  totalSteps?: number;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  parentTaskId?: string;
  dependencies?: string[];
  estimatedDuration?: string;
  category?: string;
  riskLevel?: string;
  requiresApproval?: boolean;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  progress?: number;
  currentOperation?: string;
  currentTool?: string;
  completedSteps?: number;
  totalSteps?: number;
  filesChanged?: string[];
  commandsRun?: string[];
  executionResult?: string;
  verificationResult?: string;
  errorDetails?: string;
}

export class TaskStore {
  /**
   * Generate durable, human-readable task identifier
   */
  public static generateTaskNumber(): string {
    const timePart = Date.now().toString().slice(-6);
    const randPart = Math.floor(Math.random() * 900 + 100);
    return `TASK-V5-${timePart}${randPart}`;
  }

  /**
   * Create and persist a new task in SQLite
   */
  public static async createTask(input: CreateTaskInput) {
    const taskNumber = input.id || this.generateTaskNumber();
    const assignedAgent = input.agentId || 'jarvis';
    const totalSteps = input.totalSteps || 4;
    const title = input.title || input.objective || 'Autonomous Task';
    const description = input.description || input.objective || 'Executed by J.A.R.V.I.S. Execution Kernel';

    const task = await (prisma as any).agentTask.create({
      data: {
        taskNumber,
        title,
        description,
        agentId: assignedAgent,
        status: 'QUEUED',
        progress: 0,
        currentOperation: 'Task queued in execution kernel',
        totalSteps,
        completedSteps: 0,
        estimatedDuration: input.estimatedDuration || ExecutionKernel.calculateEtaRange(totalSteps),
        startedAt: new Date(),
      }
    });

    await this.emitEvent(task.id, 'TASK_CREATED', `Task ${taskNumber} created and assigned to ${assignedAgent}`, {
      taskNumber,
      title: input.title,
      agentId: assignedAgent,
      totalSteps
    });

    return task;
  }

  /**
   * Persist a granular event and broadcast to live subscribers (SSE / WebSocket)
   */
  public static async emitEvent(
    taskId: string,
    eventType: EventType,
    message: string,
    metadata?: Record<string, any>
  ): Promise<KernelEvent> {
    const timestamp = new Date().toISOString();

    // 1. Persist to SQLite
    let persistedEventId = `evt_${Date.now()}`;
    try {
      const dbEvent = await (prisma as any).taskEvent.create({
        data: {
          taskId,
          eventType,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
        }
      });
      persistedEventId = dbEvent.id;
    } catch (err: any) {
      console.error(`[TaskStore] Failed to persist event to SQLite:`, err?.message);
    }

    const event: KernelEvent = {
      id: persistedEventId,
      taskId,
      eventType,
      message,
      timestamp,
      metadata
    };

    // 2. Broadcast to Kernel listeners and SSE streams
    ExecutionKernel.broadcastEvent(event);
    EventStream.broadcastToTask(taskId, event);

    return event;
  }

  /**
   * Update task state and computed progress
   */
  public static async updateTask(taskId: string, input: UpdateTaskInput) {
    const data: any = {};
    if (input.status) data.status = input.status;
    if (input.currentOperation) data.currentOperation = input.currentOperation;
    if (typeof input.totalSteps === 'number') data.totalSteps = input.totalSteps;
    if (typeof input.completedSteps === 'number') {
      data.completedSteps = input.completedSteps;
      // Factual progress calculation
      const total = input.totalSteps || 4;
      data.progress = Math.min(100, Math.round((input.completedSteps / total) * 100));
    } else if (typeof input.progress === 'number') {
      data.progress = Math.min(100, Math.max(0, input.progress));
    }

    if (input.filesChanged) data.filesChanged = JSON.stringify(input.filesChanged);
    if (input.commandsRun) data.commandsRun = JSON.stringify(input.commandsRun);
    if (input.executionResult !== undefined) data.executionResult = input.executionResult;
    if (input.verificationResult !== undefined) data.verificationResult = input.verificationResult;
    if (input.errorDetails !== undefined) data.errorDetails = input.errorDetails;

    if (input.status === 'COMPLETED' || input.status === 'FAILED' || input.status === 'CANCELLED') {
      data.completedAt = new Date();
      if (input.status === 'COMPLETED') data.progress = 100;
    }

    const updated = await (prisma as any).agentTask.update({
      where: { id: taskId },
      data,
    });

    if (input.status) {
      const eventType: EventType =
        input.status === 'COMPLETED' ? 'TASK_COMPLETED' :
        input.status === 'FAILED' ? 'TASK_FAILED' :
        input.status === 'VERIFYING' ? 'VERIFICATION_STARTED' :
        input.status === 'PLANNING' ? 'TASK_PLANNED' : 'TASK_ASSIGNED';

      await this.emitEvent(taskId, eventType, `Task status transitioned to ${input.status}: ${input.currentOperation || ''}`);
    }

    return updated;
  }

  /**
   * Retrieve task by ID or taskNumber with historical event trail
   */
  public static async getTask(taskIdOrNumber: string) {
    try {
      return await (prisma as any).agentTask.findFirst({
        where: {
          OR: [
            { id: taskIdOrNumber },
            { taskNumber: taskIdOrNumber }
          ]
        },
        include: {
          events: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } catch {
      return null;
    }
  }

  /**
   * Fetch all currently active / in-flight tasks
   */
  public static async getActiveTasks() {
    try {
      return await (prisma as any).agentTask.findMany({
        where: {
          status: {
            in: ['CREATED', 'QUEUED', 'PLANNING', 'ASSIGNED', 'RUNNING', 'WAITING_FOR_INPUT', 'BLOCKED', 'RETRYING', 'VERIFYING', 'RECOVERING']
          }
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    } catch {
      return [];
    }
  }

  /**
   * Factual report of all recent tasks and duration telemetry
   */
  public static async getTaskReport() {
    try {
      const allTasks = await (prisma as any).agentTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      });

      const total = allTasks.length;
      const active = allTasks.filter((t: any) => ['RUNNING', 'PLANNING', 'VERIFYING', 'QUEUED', 'RECOVERING'].includes(t.status)).length;
      const completed = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const failed = allTasks.filter((t: any) => t.status === 'FAILED').length;
      const blocked = allTasks.filter((t: any) => t.status === 'BLOCKED').length;

      return {
        timestamp: new Date().toISOString(),
        summary: { total, active, completed, failed, blocked },
        tasks: allTasks
      };
    } catch (err: any) {
      return {
        timestamp: new Date().toISOString(),
        summary: { total: 0, active: 0, completed: 0, failed: 0, blocked: 0 },
        tasks: [],
        error: err?.message
      };
    }
  }
}
