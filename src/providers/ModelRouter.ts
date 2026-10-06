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
   * Classify upstream provider failure into deterministic failure types
   */
  public static classifyFailure(msg: string): import('./types').ProviderFailureType {
    const lower = msg.toLowerCase();
    if (lower.includes('quota') || lower.includes('insufficient_quota') || lower.includes('credit exhausted')) {
      return 'QUOTA_EXHAUSTED';
    }
    if (lower.includes('429') || lower.includes('rate limit')) {
      return 'HTTP_429_RATE_LIMIT';
    }
    if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('invalid_api_key') || lower.includes('forbidden') || lower.includes('401') || lower.includes('403')) {
      return 'AUTH_FAILED';
    }
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('abort')) {
      return 'TIMEOUT';
    }
    if (lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('network') || lower.includes('fetch failed')) {
      return 'NETWORK_ERROR';
    }
    if (lower.includes('malformed') || lower.includes('invalid json') || lower.includes('unexpected token') || lower.includes('empty response')) {
      return 'MALFORMED_RESPONSE';
    }
    if (
      lower.includes('invalid model') ||
      lower.includes('model_not_found') ||
      (lower.includes('model') && (lower.includes('not found') || lower.includes('does not exist')))
    ) {
      return 'INVALID_MODEL';
    }
    if (lower.includes('502') || lower.includes('503') || lower.includes('504') || lower.includes('unavailable') || lower.includes('bad gateway')) {
      return 'PROVIDER_UNAVAILABLE';
    }
    return 'PROVIDER_OUTAGE';
  }

  /**
   * Execute prompt completion with automatic multi-tier failover & observable evidence
   */
  public static async executeWithFailover(
    request: ModelRouteRequest,
    messages: LLMMessage[],
    invoker: (model: ModelMetadata, messages: LLMMessage[]) => Promise<string>
  ): Promise<LLMCompletionResponse> {
    const candidates = this.route(request);
    const attemptedModels: string[] = [];
    const failureHistory: Array<{
      model: string;
      provider: import('./types').ProviderType;
      failureType: import('./types').ProviderFailureType;
      error: string;
    }> = [];

    for (const candidate of candidates) {
      attemptedModels.push(candidate.id);
      const startTime = Date.now();
      try {
        const text = await invoker(candidate, messages);
        const durationMs = Date.now() - startTime;

        // Factual verification: Failover success CANNOT be reported unless the provider actually returned usable content
        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new Error('Provider returned malformed empty response');
        }

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
          failoverOccurred: attemptedModels.length > 1,
          attemptedModels,
          failureHistory: failureHistory.length > 0 ? failureHistory : undefined,
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        const msg = err?.message || String(err);
        const failureType = this.classifyFailure(msg);

        failureHistory.push({
          model: candidate.id,
          provider: candidate.provider,
          failureType,
          error: msg,
        });

        // Record failure in ProviderLearner
        ProviderLearner.recordExecution(request.taskType, candidate.provider, candidate.id, false, durationMs);

        // Classify and update provider state in QuotaManager
        switch (failureType) {
          case 'HTTP_429_RATE_LIMIT':
            QuotaManager.recordRateLimit(candidate.provider);
            break;
          case 'QUOTA_EXHAUSTED':
            QuotaManager.recordQuotaExhaustion(candidate.provider);
            break;
          case 'TIMEOUT':
            QuotaManager.recordTimeout(candidate.provider, msg);
            break;
          case 'AUTH_FAILED':
            QuotaManager.recordAuthFailure(candidate.provider, msg);
            break;
          case 'PROVIDER_UNAVAILABLE':
          case 'PROVIDER_OUTAGE':
          case 'NETWORK_ERROR':
            QuotaManager.recordOutage(candidate.provider, msg);
            break;
          case 'INVALID_MODEL':
            ProviderRegistry.setModelHealth(candidate.id, false);
            break;
          case 'MALFORMED_RESPONSE':
            QuotaManager.recordTimeout(candidate.provider, 'Malformed response received');
            break;
        }

        // Mark failure on circuit breaker
        ProviderRegistry.recordProviderFailure(candidate.provider);
      }
    }

    throw new Error(
      `All candidate models failed failover chain: ${failureHistory.map((e) => `[${e.model} (${e.failureType}): ${e.error}]`).join(' -> ')}`
    );
  }
}
