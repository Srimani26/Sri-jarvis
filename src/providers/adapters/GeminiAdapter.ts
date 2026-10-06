/**
 * J.A.R.V.I.S. MARK-V Google Gemini Adapter
 * Official REST implementation targeting Gemini 2.5 Flash and Gemini API endpoints.
 */

import { LLMCompletionResponse, LLMMessage } from '../types';
import { ProviderAdapter, ProviderUsage } from './ProviderAdapter';

export class GeminiAdapter implements ProviderAdapter {
  public id = 'gemini';
  public name = 'Google Gemini API';
  private apiKey: string | null = null;
  private requestsToday = 0;
  private tokensToday = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey !== undefined ? (apiKey.trim() || null) : (process.env.GEMINI_API_KEY || null);
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { method: 'GET', signal: AbortSignal.timeout(4000) }
      );
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
      throw new Error('PROVIDER_NOT_CONFIGURED: GEMINI_API_KEY is not set');
    }

    const model = options?.model || 'gemini-2.5-flash';
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const startTime = Date.now();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 2048,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (res.status === 429) {
      throw new Error('RATE_LIMITED: Gemini API quota exceeded');
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startTime;
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(messages.reduce((a, b) => a + b.content.length, 0) / 4);
    const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(candidateText.length / 4);

    this.requestsToday++;
    this.tokensToday += promptTokens + completionTokens;

    return {
      text: candidateText,
      model,
      provider: 'gemini',
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: 0, // Generous free tier
      },
      latencyMs,
    };
  }

  public async embeddings(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      throw new Error('PROVIDER_NOT_CONFIGURED: GEMINI_API_KEY is not set');
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini embedding error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.embedding?.values || [];
  }

  public async vision(prompt: string, imageBase64: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('PROVIDER_NOT_CONFIGURED: GEMINI_API_KEY is not set');
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini vision error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  public getUsage(): ProviderUsage {
    return {
      requestsToday: this.requestsToday,
      tokensToday: this.tokensToday,
      rateLimitRemaining: Math.max(0, 1500 - this.requestsToday),
    };
  }

  public estimateCost(_promptTokens: number, _completionTokens: number): number {
    return 0; // Generous free tier for Flash
  }
}
