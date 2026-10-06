/**
 * J.A.R.V.I.S. MARK-V Groq Provider Adapter
 * High-speed LPU inference adapter targeting Groq's free developer tier (Llama 3.3 70B / 8B).
 */

import { LLMCompletionResponse, LLMMessage } from '../types';
import { ProviderAdapter, ProviderUsage } from './ProviderAdapter';

export class GroqAdapter implements ProviderAdapter {
  public id = 'groq';
  public name = 'Groq Cloud LPU';
  private apiKey: string | null = null;
  private requestsToday = 0;
  private tokensToday = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey !== undefined ? (apiKey.trim() || null) : (process.env.GROQ_API_KEY || null);
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
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
      throw new Error('PROVIDER_NOT_CONFIGURED: GROQ_API_KEY is not set');
    }

    const model = options?.model || 'llama-3.3-70b-versatile';
    const startTime = Date.now();

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (res.status === 429) {
      throw new Error('RATE_LIMITED: Groq API quota limit reached');
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errorText}`);
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
      provider: 'groq',
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: 0, // Free developer tier
      },
      latencyMs,
    };
  }

  public getUsage(): ProviderUsage {
    return {
      requestsToday: this.requestsToday,
      tokensToday: this.tokensToday,
      rateLimitRemaining: Math.max(0, 14400 - this.requestsToday),
    };
  }

  public estimateCost(_promptTokens: number, _completionTokens: number): number {
    return 0; // Free developer tier
  }
}
