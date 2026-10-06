/**
 * J.A.R.V.I.S. MARK-V Ollama Local Provider Adapter
 * Connects to local or workstation Ollama instance for 100% private, zero-cost AI execution.
 */

import { LLMCompletionResponse, LLMMessage } from '../types';
import { ProviderAdapter, ProviderUsage } from './ProviderAdapter';

export class OllamaAdapter implements ProviderAdapter {
  public id = 'ollama';
  public name = 'Local Ollama Engine';
  private baseUrl: string;
  private requestsToday = 0;
  private tokensToday = 0;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  public isConfigured(): boolean {
    return true; // No API key required; relies on local daemon
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
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
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      throw new Error(`OLLAMA_OFFLINE: Local Ollama daemon is unreachable at ${this.baseUrl}`);
    }

    const model = options?.model || 'llama3';
    const startTime = Date.now();

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama chat error (${res.status}): ${text}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startTime;
    const text = data.message?.content || '';

    const promptTokens = data.prompt_eval_count || Math.ceil(messages.reduce((a, b) => a + b.content.length, 0) / 4);
    const completionTokens = data.eval_count || Math.ceil(text.length / 4);

    this.requestsToday++;
    this.tokensToday += promptTokens + completionTokens;

    return {
      text,
      model,
      provider: 'ollama',
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: 0,
      },
      latencyMs,
    };
  }

  public async embeddings(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Ollama embedding error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.embedding || [];
  }

  public getUsage(): ProviderUsage {
    return {
      requestsToday: this.requestsToday,
      tokensToday: this.tokensToday,
    };
  }

  public estimateCost(_promptTokens: number, _completionTokens: number): number {
    return 0; // 100% free local compute
  }
}
