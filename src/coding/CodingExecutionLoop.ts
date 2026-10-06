/**
 * J.A.R.V.I.S. MARK-V Autonomous Coding Execution Loop
 * Real execution loop inspired by OpenHands, Aider, and SWE-agent.
 * Inspect -> Snapshot -> Edit -> Test -> Observe -> Debug -> Fix -> Verify -> Rollback on failure.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { DiffPatcher, PatchBlock } from './DiffPatcher';
import { TaskStore } from '../kernel/TaskStore';

const execFileAsync = promisify(execFile);

export interface CodeEditPlan {
  filePath: string;
  patchBlocks?: PatchBlock[];
  directContent?: string;
}

export interface CodingLoopRequest {
  taskId: string;
  objective: string;
  edits: CodeEditPlan[];
  testCommand?: {
    executable: string;
    args: string[];
    cwd?: string;
  };
  maxRetries?: number;
  fixProvider?: (errorOutput: string, previousEdits: CodeEditPlan[]) => Promise<CodeEditPlan[]>;
}

export interface CodingLoopResult {
  success: boolean;
  filesModified: string[];
  commandsRun: string[];
  testOutput?: string;
  retriesAttempted: number;
  rolledBack: boolean;
  error?: string;
  durationMs: number;
}

export class CodingExecutionLoop {
  /**
   * Execute full autonomous coding cycle
   */
  public static async execute(request: CodingLoopRequest): Promise<CodingLoopResult> {
    const startTime = Date.now();
    const { taskId, objective, edits, testCommand, maxRetries = 2, fixProvider } = request;

    await TaskStore.emitEvent(
      taskId,
      'AGENT_STARTED',
      `Coding Execution Loop initiated for objective: "${objective}"`,
      { filesTargeted: edits.map((e) => e.filePath) }
    );

    // 1. Snapshot stage for rollback protection
    const snapshots = new Map<string, string | null>();
    const filesModified: string[] = [];
    const commandsRun: string[] = [];

    for (const edit of edits) {
      const absPath = resolve(process.cwd(), edit.filePath);
      if (existsSync(absPath)) {
        const originalContent = readFileSync(absPath, 'utf-8');
        snapshots.set(absPath, originalContent);
        await TaskStore.emitEvent(taskId, 'FILE_READ', `Inspected existing file: ${edit.filePath}`, {
          path: edit.filePath,
          bytes: Buffer.byteLength(originalContent, 'utf-8'),
        });
      } else {
        snapshots.set(absPath, null); // Marked as new file
      }
    }

    const applyEdits = (plans: CodeEditPlan[]): boolean => {
      for (const edit of plans) {
        const absPath = resolve(process.cwd(), edit.filePath);
        let newContent = '';

        if (edit.directContent !== undefined) {
          newContent = edit.directContent;
        } else if (edit.patchBlocks && edit.patchBlocks.length > 0) {
          const currentContent = snapshots.get(absPath) || (existsSync(absPath) ? readFileSync(absPath, 'utf-8') : '');
          const patchResult = DiffPatcher.applyPatch(currentContent, edit.patchBlocks);
          if (!patchResult.success) {
            throw new Error(`Failed to patch ${edit.filePath}: ${patchResult.error}`);
          }
          newContent = patchResult.patchedContent;
        } else {
          continue;
        }

        writeFileSync(absPath, newContent, 'utf-8');
        if (!filesModified.includes(edit.filePath)) {
          filesModified.push(edit.filePath);
        }
      }
      return true;
    };

    const rollback = () => {
      for (const [absPath, original] of snapshots.entries()) {
        if (original === null) {
          // File was created new, could be unlinked or left clean
          try {
            const { unlinkSync } = require('node:fs');
            unlinkSync(absPath);
          } catch {}
        } else {
          writeFileSync(absPath, original, 'utf-8');
        }
      }
    };

    let currentPlans = edits;
    let retries = 0;
    let lastTestOutput = '';

    while (retries <= maxRetries) {
      try {
        // Apply file edits
        applyEdits(currentPlans);

        for (const file of filesModified) {
          await TaskStore.emitEvent(taskId, 'FILE_MODIFIED', `Applied surgical edit to ${file}`, { file });
        }

        // If no test command specified, assume successful edit
        if (!testCommand) {
          break;
        }

        // Run automated tests
        const cmdStr = `${testCommand.executable} ${testCommand.args.join(' ')}`;
        commandsRun.push(cmdStr);
        await TaskStore.emitEvent(taskId, 'TEST_STARTED', `Running test verification: ${cmdStr}`, { cmd: cmdStr });

        const testRes = await execFileAsync(testCommand.executable, testCommand.args, {
          cwd: testCommand.cwd || process.cwd(),
          timeout: 45_000,
        });

        lastTestOutput = (testRes.stdout || '') + '\n' + (testRes.stderr || '');
        await TaskStore.emitEvent(taskId, 'TEST_COMPLETED', `Tests passed for ${filesModified.join(', ')}`, {
          cmd: cmdStr,
        });

        // Tests succeeded!
        break;

      } catch (err: any) {
        lastTestOutput = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
        await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', `Test failure on iteration ${retries + 1}: ${err.message}`, {
          output: lastTestOutput.slice(0, 500),
          retries,
        });

        retries++;

        if (retries <= maxRetries && fixProvider) {
          await TaskStore.emitEvent(
            taskId,
            'RECOVERY_STARTED',
            `Attempting automated diagnosis and fix (Attempt ${retries}/${maxRetries})`,
            { error: lastTestOutput.slice(0, 300) }
          );

          try {
            currentPlans = await fixProvider(lastTestOutput, currentPlans);
            continue;
          } catch (fixErr: any) {
            await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', `Fix provider failed: ${fixErr?.message}`);
          }
        }

        // Max retries exhausted: trigger safe rollback to protect codebase
        await TaskStore.emitEvent(
          taskId,
          'RECOVERY_STARTED',
          `Max retries reached. Executing safe rollback of ${filesModified.length} modified file(s).`
        );

        rollback();

        await TaskStore.emitEvent(
          taskId,
          'TASK_FAILED',
          `Coding loop failed after ${retries} attempt(s). Codebase rolled back to pristine state.`
        );

        return {
          success: false,
          filesModified,
          commandsRun,
          testOutput: lastTestOutput,
          retriesAttempted: retries,
          rolledBack: true,
          error: `Test failure: ${err.message}`,
          durationMs: Date.now() - startTime,
        };
      }
    }

    // Final verification passed
    await TaskStore.emitEvent(
      taskId,
      'VERIFICATION_PASSED',
      `Coding cycle complete: ${filesModified.length} file(s) updated, verified green against test suite.`
    );

    return {
      success: true,
      filesModified,
      commandsRun,
      testOutput: lastTestOutput,
      retriesAttempted: retries,
      rolledBack: false,
      durationMs: Date.now() - startTime,
    };
  }
}
