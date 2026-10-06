/**
 * J.A.R.V.I.S. MARK-V Intelligent Model Router V2 & Failover Engine
 * Free-First / Local-First capability router with automated graceful failover,
 * dynamic quota checking, and operational performance learning.
 */

import { ProviderRegistry } from './ProviderRegistry';
import { QuotaManager } from './QuotaManager';
import { ProviderLearner } from './ProviderLearner';
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
    
    // Filter healthy models that are not actively rate limited or circuit-broken
    const healthyModels = allModels.filter((m) => {
      if (!m.healthy) return false;
      return QuotaManager.isProviderAvailable(m.provider);
    });

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

    const activeList = candidates.length > 0 ? candidates : healthyModels;

    // Check empirical learning data
    const bestLearned = ProviderLearner.getBestModelForTask(request.taskType);

    // Sort by Free-First / Local-First priority: LOCAL (1) -> FREE (2) -> LOW_COST (3) -> PAID (4)
    activeList.sort((a, b) => {
      // If a model has proven superior empirical success for this task, boost it
      if (bestLearned && a.id === bestLearned.model && bestLearned.successRate >= 0.9) return -1;
      if (bestLearned && b.id === bestLearned.model && bestLearned.successRate >= 0.9) return 1;

      const tierDiff = TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier];
      if (tierDiff !== 0) return tierDiff;
      // Secondary sort: lower latency
      return a.avgLatencyMs - b.avgLatencyMs;
    });

    return activeList.length > 0 ? activeList : allModels;
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

        // Record operational success in QuotaManager & ProviderLearner
        QuotaManager.recordSuccess(candidate.provider, promptTokens + completionTokens, estimatedCost);
        ProviderLearner.recordExecution(request.taskType, candidate.provider, candidate.id, true, durationMs);

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
        const durationMs = Date.now() - startTime;
        const msg = err?.message || String(err);
        errors.push({ model: candidate.id, error: msg });

        // Record failure in ProviderLearner
        ProviderLearner.recordExecution(request.taskType, candidate.provider, candidate.id, false, durationMs);

        // Classify failure for QuotaManager and circuit breaker
        if (/429|rate limit/i.test(msg)) {
          QuotaManager.recordRateLimit(candidate.provider);
        } else if (/timeout/i.test(msg)) {
          QuotaManager.recordTimeout(candidate.provider, msg);
        } else if (/auth|unauthorized|invalid.*key/i.test(msg)) {
          QuotaManager.recordAuthFailure(candidate.provider, msg);
        }

        // Mark failure on circuit breaker
        ProviderRegistry.recordProviderFailure(candidate.provider);
      }
    }

    throw new Error(
      `All candidate models failed failover chain: ${errors.map((e) => `[${e.model}: ${e.error}]`).join(' -> ')}`
    );
  }
}
