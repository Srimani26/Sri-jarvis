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

export interface OpenSourceProject {
  id: string;
  name: string;
  repo: string;
  stars: string;
  license: string;
  category: 'autonomous_agents' | 'code_generation' | 'multi_agent' | 'voice_multimodal' | 'tools_mcp' | 'local_ai';
  description: string;
  keyArchitecture: string[];
  assimilatedCapabilities: string[];
  sourceFilesOrPatterns: string[];
  status: 'ASSIMILATED_ACTIVE' | 'INTEGRATED_ADAPTER' | 'MONITORED';
}
