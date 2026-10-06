/**
 * J.A.R.V.I.S. MARK-V Unified Resource Architecture
 * Types representing MODEL, PROVIDER, EMBEDDING, STT, TTS, BROWSER, COMPUTE, WORKER, MCP_SERVER, and TOOL.
 */

export type ResourceType =
  | 'MODEL'
  | 'PROVIDER'
  | 'EMBEDDING'
  | 'STT'
  | 'TTS'
  | 'BROWSER'
  | 'COMPUTE'
  | 'WORKER'
  | 'MCP_SERVER'
  | 'TOOL';

export type ResourceCostClass = 'FREE' | 'LOW_COST' | 'PAID' | 'ZERO_SELF_HOSTED';

export type ResourceClassification = 'LOCAL' | 'FREE' | 'EXISTING_AUTHORIZED' | 'PAID';

export type ResourceHealth =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'RATE_LIMITED'
  | 'AUTH_FAILED'
  | 'OFFLINE'
  | 'DISABLED';

export type ResourceAuthStatus = 'CONFIGURED' | 'NOT_CONFIGURED' | 'INVALID_KEY';

export type ResourcePrivacyLevel = 'PUBLIC' | 'RESTRICTED' | 'LOCAL_ONLY';

export interface ResourceLimits {
  rpm?: number;
  tpm?: number;
  dailyRequests?: number;
  contextWindow?: number;
  concurrency?: number;
}

export interface ResourceMetadata {
  id: string;
  name: string;
  provider: string;
  type: ResourceType;
  capabilities: string[];
  costClass: ResourceCostClass;
  classification: ResourceClassification;
  health: ResourceHealth;
  latencyMs: number;
  limits: ResourceLimits;
  contextSize: number;
  authStatus: ResourceAuthStatus;
  lastSuccessfulExecution?: string;
  totalExecutions: number;
  failureRate: number;
  priority: number;
  enabled: boolean;
  privacyLevel: ResourcePrivacyLevel;
  description?: string;
}

export interface ResourceRequirement {
  type?: ResourceType;
  capabilities?: string[];
  maxCostClass?: ResourceCostClass;
  classification?: ResourceClassification;
  minContextSize?: number;
  privacyLevel?: ResourcePrivacyLevel;
  preferLocal?: boolean;
}

export interface SystemResourceEconomics {
  totalEstimatedCostUsd: number;
  activeWorkers: number;
  registeredProviders: number;
  freeTierActiveCount: number;
  localResourceCount: number;
  averageLatencyMs: number;
  overallHealthScore: number;
}
