/**
 * J.A.R.V.I.S. MARK-V Provider & Model Router Types
 * Engineering truth: Multi-provider abstraction, capability routing, and circuit breaker.
 */

export type ProviderType =
  | 'ollama'
  | 'gemini'
  | 'anthropic'
  | 'openai'
  | 'groq'
  | 'together'
  | 'openrouter'
  | 'mock';

export type ModelCapability =
  | 'reasoning'
  | 'coding'
  | 'fast'
  | 'vision'
  | 'embedding'
  | 'audio'
  | 'tools';

export type CostTier = 'LOCAL' | 'FREE' | 'LOW_COST' | 'PAID';

export interface ModelMetadata {
  id: string;
  provider: ProviderType;
  name: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  avgLatencyMs: number;
  healthy: boolean;
  tier: CostTier;
}

export type RoutingTaskType =
  | 'simple_chat'
  | 'classification'
  | 'coding'
  | 'architecture'
  | 'research'
  | 'vision'
  | 'voice';

export interface ModelRouteRequest {
  taskType: RoutingTaskType;
  minContextWindow?: number;
  requiresTools?: boolean;
  preferredTier?: CostTier;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionResponse {
  text: string;
  model: string;
  provider: ProviderType;
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  latencyMs: number;
}
