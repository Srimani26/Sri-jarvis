/**
 * J.A.R.V.I.S. MARK-V Autonomous Self-Repair & Recovery Types
 */

export type FailureCategory =
  | 'TRANSIENT_NETWORK'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'TYPESCRIPT_SYNTAX'
  | 'DEPENDENCY_MISSING'
  | 'PERMISSION_DENIED'
  | 'DETERMINISTIC_ASSERTION'
  | 'UNKNOWN';

export type RepairStrategy =
  | 'RETRY_WITH_BACKOFF'
  | 'FAILOVER_PROVIDER'
  | 'APPLY_CODE_FIX'
  | 'INSTALL_DEPENDENCY'
  | 'ASK_USER'
  | 'ESCALATE';

export interface FailureDiagnosis {
  errorRaw: string;
  category: FailureCategory;
  strategy: RepairStrategy;
  rootCause: string;
  recommendedAction: string;
  isDeterministic: boolean;
  canAutoRepair: boolean;
}

export interface SelfRepairResult {
  recovered: boolean;
  strategyUsed: RepairStrategy;
  diagnosis: FailureDiagnosis;
  attempts: number;
  fixApplied?: string;
  error?: string;
  durationMs: number;
}
