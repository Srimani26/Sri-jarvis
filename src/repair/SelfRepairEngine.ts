/**
 * J.A.R.V.I.S. MARK-V Autonomous Self-Repair Engine
 * Factual diagnostic root-cause analysis, deterministic vs transient classification,
 * failure memory integration, and safe repair verification.
 */

import { FailureCategory, FailureDiagnosis, RepairStrategy, SelfRepairResult } from './types';
import { MemoryStore } from '../memory/MemoryStore';
import { TaskStore } from '../kernel/TaskStore';

export class SelfRepairEngine {
  /**
   * Classify an error into concrete diagnostic categories and recovery strategies
   */
  public static classifyFailure(rawError: string | Error): FailureDiagnosis {
    const errorStr = rawError instanceof Error ? rawError.message + '\n' + (rawError.stack || '') : String(rawError);

    // 1. Rate Limiting
    if (/429|quota\s+exceeded|rate\s+limit|too\s+many\s+requests/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'RATE_LIMIT',
        strategy: 'FAILOVER_PROVIDER',
        rootCause: 'API provider rate limit or quota exceeded',
        recommendedAction: 'Failover to secondary provider or local model',
        isDeterministic: false,
        canAutoRepair: true,
      };
    }

    // 2. Transient Network
    if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|502|503|fetch\s+failed|network\s+error/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'TRANSIENT_NETWORK',
        strategy: 'RETRY_WITH_BACKOFF',
        rootCause: 'Temporary socket disruption or gateway timeout',
        recommendedAction: 'Wait exponential backoff and retry',
        isDeterministic: false,
        canAutoRepair: true,
      };
    }

    // 3. Missing Dependencies
    if (/cannot\s+find\s+module|module_not_found|no\s+such\s+file\s+or\s+directory\s+.*node_modules/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'DEPENDENCY_MISSING',
        strategy: 'INSTALL_DEPENDENCY',
        rootCause: 'Required package or module is not installed in workspace',
        recommendedAction: 'Install missing package through authorized package manager',
        isDeterministic: true,
        canAutoRepair: true,
      };
    }

    // 4. Permission Denied
    if (/permission\s+denied|eacces|unauthorized|forbidden|confirmation\s+required/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'PERMISSION_DENIED',
        strategy: 'ASK_USER',
        rootCause: 'Operation exceeds current policy capability ceiling',
        recommendedAction: 'Solicit explicit user authorization before proceeding',
        isDeterministic: true,
        canAutoRepair: false,
      };
    }

    // 5. TypeScript / Syntax Errors
    if (/syntaxerror|ts\d{4}|type\s+error|referenceerror|unexpected\s+token/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'TYPESCRIPT_SYNTAX',
        strategy: 'APPLY_CODE_FIX',
        rootCause: 'Static type mismatch or JavaScript/TypeScript syntax error',
        recommendedAction: 'Inspect failing line number, apply surgical diff, and re-compile',
        isDeterministic: true,
        canAutoRepair: true,
      };
    }

    // 6. Test Assertion Failures
    if (/err_assertion|assertionerror|expected\s+.*to\s+equal/i.test(errorStr)) {
      return {
        errorRaw: errorStr,
        category: 'DETERMINISTIC_ASSERTION',
        strategy: 'APPLY_CODE_FIX',
        rootCause: 'Deterministic logic failure in implementation against test expectation',
        recommendedAction: 'Adjust business logic or test fixture to satisfy assertion',
        isDeterministic: true,
        canAutoRepair: true,
      };
    }

    // 7. Unknown / Fallback
    return {
      errorRaw: errorStr,
      category: 'UNKNOWN',
      strategy: 'ESCALATE',
      rootCause: 'Unclassified error condition',
      recommendedAction: 'Escalate to Commander (JARVIS) with full stack trace',
      isDeterministic: false,
      canAutoRepair: false,
    };
  }

  /**
   * Run full self-repair loop on a diagnosed error
   */
  public static async repair(
    taskId: string,
    rawError: string | Error,
    fixer?: (diagnosis: FailureDiagnosis, priorFix?: string) => Promise<{ success: boolean; fixDetails: string }>
  ): Promise<SelfRepairResult> {
    const startTime = Date.now();
    const diagnosis = this.classifyFailure(rawError);

    await TaskStore.emitEvent(
      taskId,
      'ERROR_DETECTED',
      `Diagnosed failure: [${diagnosis.category}] - ${diagnosis.rootCause}`,
      { category: diagnosis.category, strategy: diagnosis.strategy }
    );

    // If deterministic and cannot auto repair, halt immediately
    if (diagnosis.isDeterministic && !diagnosis.canAutoRepair) {
      await TaskStore.emitEvent(
        taskId,
        'TASK_FAILED',
        `Halted deterministic failure requiring user authorization: ${diagnosis.recommendedAction}`
      );
      return {
        recovered: false,
        strategyUsed: diagnosis.strategy,
        diagnosis,
        attempts: 1,
        error: diagnosis.rootCause,
        durationMs: Date.now() - startTime,
      };
    }

    // Check FAILURE memory plane for prior known solution
    const priorFixRecord = MemoryStore.findFixForFailure(diagnosis.rootCause);
    const priorFix = priorFixRecord ? priorFixRecord.content : undefined;

    await TaskStore.emitEvent(
      taskId,
      'RECOVERY_STARTED',
      `Executing repair strategy '${diagnosis.strategy}'. Prior known fix: ${priorFix ? 'FOUND' : 'NONE'}`,
      { strategy: diagnosis.strategy, hasPriorFix: Boolean(priorFix) }
    );

    if (fixer) {
      try {
        const fixResult = await fixer(diagnosis, priorFix);
        if (fixResult.success) {
          // Record successful fix into FAILURE memory plane for permanent system learning
          MemoryStore.recordFailureFix(diagnosis.rootCause, fixResult.fixDetails, { taskId });

          await TaskStore.emitEvent(
            taskId,
            'RECOVERY_COMPLETED',
            `Self-repair succeeded: ${fixResult.fixDetails}`,
            { fixDetails: fixResult.fixDetails }
          );

          return {
            recovered: true,
            strategyUsed: diagnosis.strategy,
            diagnosis,
            attempts: 1,
            fixApplied: fixResult.fixDetails,
            durationMs: Date.now() - startTime,
          };
        }
      } catch (fixErr: any) {
        await TaskStore.emitEvent(taskId, 'ERROR_DETECTED', `Repair attempt failed: ${fixErr?.message}`);
      }
    }

    return {
      recovered: false,
      strategyUsed: diagnosis.strategy,
      diagnosis,
      attempts: 1,
      error: 'Self-repair attempt did not resolve the error condition',
      durationMs: Date.now() - startTime,
    };
  }
}
