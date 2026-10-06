/**
 * J.A.R.V.I.S. MARK-V Controlled Self-Evolution Types
 */

export interface EvolutionProposal {
  id: string;
  title: string;
  category: 'TOOL' | 'SKILL' | 'PROMPT' | 'ROUTING' | 'PERFORMANCE';
  description: string;
  proposedPatch: string;
  targetFile: string;
  benchmarkBeforeMs: number;
  benchmarkAfterMs?: number;
  speedupPercent?: number;
  securityApproved: boolean;
  status: 'PROPOSED' | 'SANDBOX_TESTING' | 'APPROVED' | 'APPLIED' | 'ROLLED_BACK' | 'REJECTED';
  createdAt: string;
}

export interface EvolutionBenchmarkResult {
  passed: boolean;
  baselineMs: number;
  optimizedMs: number;
  regressionDetected: boolean;
}
