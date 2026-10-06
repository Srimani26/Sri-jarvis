/**
 * J.A.R.V.I.S. MARK-V Intelligent Model Router & Failover Engine
 * Free-First / Local-First capability router with automated graceful failover.
 */

import { ProviderRegistry } from './ProviderRegistry';
import {
  CostTier,
  LLMCompletionResponse,
  LLMMessage,
  ModelMetadata,
  ModelRouteRequest,
} from './types';

const TIER_PRIORITY: Record<CostTier, number> = {
  LOCAL: 1,
  FREE: 2,
  LOW_COST: 3,
  PAID: 4,
};

export class ModelRouter {
  /**
   * Determine prioritized list of candidate models for a given task requirement
   */
  public static route(request: ModelRouteRequest): ModelMetadata[] {
    const allModels = ProviderRegistry.listModels();
    const healthyModels = allModels.filter((m) => m.healthy);

    // Filter by capabilities
    const candidates = healthyModels.filter((model) => {
      if (request.minContextWindow && model.contextWindow < request.minContextWindow) {
        return false;
      }
      if (request.requiresTools && !model.capabilities.includes('tools')) {
        return false;
      }

      switch (request.taskType) {
        case 'coding':
          return model.capabilities.includes('coding');
        case 'architecture':
          return model.capabilities.includes('reasoning');
        case 'simple_chat':
        case 'classification':
          return model.capabilities.includes('fast');
        case 'research':
          return model.capabilities.includes('reasoning') || model.contextWindow >= 100_000;
        case 'vision':
          return model.capabilities.includes('vision');
        default:
          return true;
      }
    });

    // Sort by Free-First / Local-First priority: LOCAL (1) -> FREE (2) -> LOW_COST (3) -> PAID (4)
    candidates.sort((a, b) => {
      const tierDiff = TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier];
      if (tierDiff !== 0) return tierDiff;
      // Secondary sort: lower latency
      return a.avgLatencyMs - b.avgLatencyMs;
    });

    return candidates.length > 0 ? candidates : healthyModels;
  }

  /**
   * Execute prompt completion with automatic multi-tier failover
   */
  public static async executeWithFailover(
    request: ModelRouteRequest,
    messages: LLMMessage[],
    invoker: (model: ModelMetadata, messages: LLMMessage[]) => Promise<string>
  ): Promise<LLMCompletionResponse> {
    const candidates = this.route(request);
    const errors: Array<{ model: string; error: string }> = [];

    for (const candidate of candidates) {
      const startTime = Date.now();
      try {
        const text = await invoker(candidate, messages);
        const durationMs = Date.now() - startTime;

        // Factual token estimation (1 token ≈ 4 chars)
        const promptChars = messages.reduce((acc, m) => acc + m.content.length, 0);
        const promptTokens = Math.ceil(promptChars / 4);
        const completionTokens = Math.ceil(text.length / 4);
        const estimatedCost =
          (promptTokens / 1000) * candidate.costPer1kInputTokens +
          (completionTokens / 1000) * candidate.costPer1kOutputTokens;

        return {
          text,
          model: candidate.id,
          provider: candidate.provider,
          usage: {
            promptTokens,
            completionTokens,
            estimatedCostUsd: Number(estimatedCost.toFixed(6)),
          },
          latencyMs: durationMs,
        };
      } catch (err: any) {
        errors.push({ model: candidate.id, error: err?.message || String(err) });
        // Mark failure on circuit breaker
        ProviderRegistry.recordProviderFailure(candidate.provider);
      }
    }

    throw new Error(
      `All candidate models failed failover chain: ${errors.map((e) => `[${e.model}: ${e.error}]`).join(' -> ')}`
    );
  }
}
