/**
 * J.A.R.V.I.S. MARK-V Autonomous Crash Recovery Engine
 * Automatically recovers and safely classifies interrupted tasks upon server startup.
 * Prevents orphaned tasks and ensures zero state corruption across reboots.
 */

import { prisma } from '../lib/db';
import { TaskStore } from './TaskStore';

export interface CrashRecoveryReport {
  timestamp: string;
  interruptedTotal: number;
  recoveredToQueued: number;
  blockedForInspection: number;
  tasks: Array<{
    id: string;
    taskNumber: string;
    priorStatus: string;
    newStatus: string;
    reason: string;
  }>;
}

export class CrashRecovery {
  /**
   * Run full boot-time recovery audit of all in-flight tasks
   */
  public static async recoverInterruptedTasks(): Promise<CrashRecoveryReport> {
    const report: CrashRecoveryReport = {
      timestamp: new Date().toISOString(),
      interruptedTotal: 0,
      recoveredToQueued: 0,
      blockedForInspection: 0,
      tasks: []
    };

    try {
      // Find all tasks interrupted while active
      const inFlightTasks = await (prisma as any).agentTask.findMany({
        where: {
          status: {
            in: ['RUNNING', 'PLANNING', 'VERIFYING', 'RETRYING', 'ASSIGNED', 'RECOVERING']
          }
        }
      });

      report.interruptedTotal = inFlightTasks.length;

      for (const task of inFlightTasks) {
        const priorStatus = task.status;
        await TaskStore.emitEvent(
          task.id,
          'RECOVERY_STARTED',
          `Server restart detected while task was ${priorStatus}. Running integrity recovery pass.`
        );

        let newStatus: 'QUEUED' | 'BLOCKED' = 'QUEUED';
        let reason = '';

        // Check if task touched files or ran mutating commands
        const hasFilesChanged = Boolean(task.filesChanged && task.filesChanged !== '[]' && task.filesChanged !== 'null');
        const hasCommandsRun = Boolean(task.commandsRun && task.commandsRun !== '[]' && task.commandsRun !== 'null');

        if (hasFilesChanged || hasCommandsRun) {
          // Dangerous state: files or commands were in progress. Mark BLOCKED to avoid corrupting work.
          newStatus = 'BLOCKED';
          reason = 'Interrupted during filesystem modification or command execution. Paused for integrity check.';
          report.blockedForInspection++;
        } else {
          // Safe state: task was planning or read-only. Re-queue cleanly.
          newStatus = 'QUEUED';
          reason = 'Safely recovered without filesystem modifications. Re-queued for execution.';
          report.recoveredToQueued++;
        }

        await (prisma as any).agentTask.update({
          where: { id: task.id },
          data: {
            status: newStatus,
            currentOperation: `[Crash Recovery] ${reason}`,
            errorDetails: `Server reboot during ${priorStatus}: ${reason}`
          }
        });

        await TaskStore.emitEvent(
          task.id,
          'RECOVERY_COMPLETED',
          `Task transitioned to ${newStatus}. ${reason}`,
          { priorStatus, newStatus, reason }
        );

        report.tasks.push({
          id: task.id,
          taskNumber: task.taskNumber,
          priorStatus,
          newStatus,
          reason
        });
      }

      if (report.interruptedTotal > 0) {
        console.log(`🛡️ [CrashRecovery] Recovered ${report.interruptedTotal} interrupted task(s): ${report.recoveredToQueued} re-queued, ${report.blockedForInspection} blocked for safety.`);
      }

      return report;
    } catch (err: any) {
      console.error('[CrashRecovery] Recovery pass failed:', err?.message);
      return report;
    }
  }
}
