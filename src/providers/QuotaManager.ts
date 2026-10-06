/**
 * J.A.R.V.I.S. MARK-V Quota & Rate Limit Manager
 * Monitors API usage, detects 429 rate limits, and governs circuit breaker states.
 */

import { ProviderType } from './types';

export type ProviderQuotaState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'RATE_LIMITED'
  | 'AUTH_FAILED'
  | 'OFFLINE'
  | 'DISABLED';

export interface ProviderQuotaRecord {
  provider: ProviderType;
  state: ProviderQuotaState;
  totalRequests: number;
  totalTokens: number;
  rateLimitHits: number;
  timeoutCount: number;
  authFailures: number;
  estimatedCostUsd: number;
  resetAt?: number;
  lastError?: string;
  backoffMs: number;
}

export class QuotaManager {
  private static quotas: Map<ProviderType, ProviderQuotaRecord> = new Map();
  private static readonly INITIAL_BACKOFF_MS = 5000;
  private static readonly MAX_BACKOFF_MS = 300000; // 5 mins

  static {
    const providers: ProviderType[] = ['ollama', 'gemini', 'groq', 'openrouter', 'anthropic', 'openai', 'together'];
    for (const p of providers) {
      this.quotas.set(p, {
        provider: p,
        state: 'HEALTHY',
        totalRequests: 0,
        totalTokens: 0,
        rateLimitHits: 0,
        timeoutCount: 0,
        authFailures: 0,
        estimatedCostUsd: 0,
        backoffMs: this.INITIAL_BACKOFF_MS,
      });
    }
  }

  public static resetProvider(provider: ProviderType): void {
    const rec = this.getRecord(provider);
    rec.state = 'HEALTHY';
    rec.rateLimitHits = 0;
    rec.timeoutCount = 0;
    rec.authFailures = 0;
    rec.resetAt = undefined;
    rec.lastError = undefined;
    rec.backoffMs = this.INITIAL_BACKOFF_MS;
  }

  public static resetAll(): void {
    for (const provider of this.quotas.keys()) {
      this.resetProvider(provider);
    }
  }

  public static getRecord(provider: ProviderType): ProviderQuotaRecord {
    let rec = this.quotas.get(provider);
    if (!rec) {
      rec = {
        provider,
        state: 'HEALTHY',
        totalRequests: 0,
        totalTokens: 0,
        rateLimitHits: 0,
        timeoutCount: 0,
        authFailures: 0,
        estimatedCostUsd: 0,
        backoffMs: this.INITIAL_BACKOFF_MS,
      };
      this.quotas.set(provider, rec);
    }
    return rec;
  }

  public static recordSuccess(provider: ProviderType, tokens: number, costUsd = 0): void {
    const rec = this.getRecord(provider);
    rec.totalRequests++;
    rec.totalTokens += tokens;
    rec.estimatedCostUsd += costUsd;
    rec.backoffMs = this.INITIAL_BACKOFF_MS; // reset backoff on success

    if (rec.state === 'RATE_LIMITED' || rec.state === 'DEGRADED') {
      rec.state = 'HEALTHY';
    }
  }

  public static recordRateLimit(provider: ProviderType, resetInSeconds?: number): void {
    const rec = this.getRecord(provider);
    rec.rateLimitHits++;
    rec.state = 'RATE_LIMITED';
    rec.backoffMs = Math.min(this.MAX_BACKOFF_MS, rec.backoffMs * 2);
    rec.resetAt = Date.now() + (resetInSeconds ? resetInSeconds * 1000 : rec.backoffMs);
  }

  public static recordTimeout(provider: ProviderType, error?: string): void {
    const rec = this.getRecord(provider);
    rec.timeoutCount++;
    rec.lastError = error;
    if (rec.timeoutCount >= 3) {
      rec.state = 'DEGRADED';
    }
  }

  public static recordAuthFailure(provider: ProviderType, error?: string): void {
    const rec = this.getRecord(provider);
    rec.authFailures++;
    rec.state = 'AUTH_FAILED';
    rec.lastError = error;
  }

  public static isProviderAvailable(provider: ProviderType): boolean {
    const rec = this.getRecord(provider);
    if (rec.state === 'DISABLED' || rec.state === 'AUTH_FAILED' || rec.state === 'OFFLINE') {
      return false;
    }
    if (rec.state === 'RATE_LIMITED') {
      if (rec.resetAt && Date.now() >= rec.resetAt) {
        rec.state = 'DEGRADED'; // Probe state
        return true;
      }
      return false;
    }
    return true;
  }

  public static getStatusOverview(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [provider, rec] of this.quotas.entries()) {
      result[provider] = {
        state: rec.state,
        requests: rec.totalRequests,
        tokens: rec.totalTokens,
        rateLimits: rec.rateLimitHits,
        costUsd: Number(rec.estimatedCostUsd.toFixed(4)),
        available: this.isProviderAvailable(provider),
      };
    }
    return result;
  }
}
