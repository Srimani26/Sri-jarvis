/**
 * J.A.R.V.I.S. MARK-V Provider Adapter Interface
 * Common contract for legitimate LLM, embedding, and vision providers.
 */

import { LLMMessage, LLMCompletionResponse } from '../types';

export interface ProviderAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ProviderUsage {
  requestsToday: number;
  tokensToday: number;
  rateLimitRemaining?: number;
  quotaResetTime?: string;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  isConfigured(): boolean;
  healthCheck(): Promise<boolean>;
  chat(messages: LLMMessage[], options?: { model?: string; temperature?: number; maxTokens?: number }): Promise<LLMCompletionResponse>;
  stream?(messages: LLMMessage[], options?: { model?: string }): AsyncGenerator<string, void, unknown>;
  structuredOutput?<T>(messages: LLMMessage[], schema: Record<string, any>, options?: { model?: string }): Promise<T>;
  embeddings?(text: string): Promise<number[]>;
  vision?(prompt: string, imageBase64: string): Promise<string>;
  getUsage(): ProviderUsage;
  estimateCost(promptTokens: number, completionTokens: number, model?: string): number;
}
