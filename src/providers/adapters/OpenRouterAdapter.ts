/**
 * J.A.R.V.I.S. MARK-V OpenRouter Provider Adapter
 * Multi-model gateway adapter routing to official free-tier models (:free).
 */

import { LLMCompletionResponse, LLMMessage } from '../types';
import { ProviderAdapter, ProviderUsage } from './ProviderAdapter';

export class OpenRouterAdapter implements ProviderAdapter {
  public id = 'openrouter';
  public name = 'OpenRouter Free Model Gateway';
  private apiKey: string | null = null;
  private requestsToday = 0;
  private tokensToday = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || null;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(4000),
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  public async chat(
    messages: LLMMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<LLMCompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('PROVIDER_NOT_CONFIGURED: OPENROUTER_API_KEY is not set');
    }

    const model = options?.model || 'meta-llama/llama-3.2-3b-instruct:free';
    const startTime = Date.now();

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://sri-jarvis.onrender.com',
        'X-Title': 'JARVIS Mark-V',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 429) {
      throw new Error('RATE_LIMITED: OpenRouter quota rate limited');
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startTime;
    const text = data.choices?.[0]?.message?.content || '';

    const promptTokens = data.usage?.prompt_tokens || Math.ceil(messages.reduce((a, b) => a + b.content.length, 0) / 4);
    const completionTokens = data.usage?.completion_tokens || Math.ceil(text.length / 4);

    this.requestsToday++;
    this.tokensToday += promptTokens + completionTokens;

    return {
      text,
      model,
      provider: 'openrouter',
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: 0,
      },
      latencyMs,
    };
  }

  public getUsage(): ProviderUsage {
    return {
      requestsToday: this.requestsToday,
      tokensToday: this.tokensToday,
      rateLimitRemaining: Math.max(0, 200 - this.requestsToday),
    };
  }

  public estimateCost(_promptTokens: number, _completionTokens: number): number {
    return 0; // Target free models
  }
}
