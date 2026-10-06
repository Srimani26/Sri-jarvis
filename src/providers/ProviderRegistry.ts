/**
 * J.A.R.V.I.S. MARK-V Provider Registry & Circuit Breaker
 * Manages model inventory, tracks provider health, and loads secure credentials.
 */

import { ModelMetadata, ProviderType } from './types';

export class ProviderRegistry {
  private static models: Map<string, ModelMetadata> = new Map();
  private static providerFailures: Map<ProviderType, number> = new Map();
  private static circuitBreakerThreshold = 3;

  static {
    this.bootstrapModels();
  }

  private static bootstrapModels() {
    const defaultModels: ModelMetadata[] = [
      // 1. Local Ollama (Free, Zero Data Exfiltration)
      {
        id: 'ollama-llama3',
        provider: 'ollama',
        name: 'Llama 3 8B (Local Ollama)',
        capabilities: ['fast', 'tools'],
        contextWindow: 8192,
        costPer1kInputTokens: 0,
        costPer1kOutputTokens: 0,
        avgLatencyMs: 300,
        healthy: true,
        tier: 'LOCAL',
      },
      // 2. Groq (Ultra-fast, Free/Low Cost)
      {
        id: 'groq-llama3-70b',
        provider: 'groq',
        name: 'Llama 3 70B (Groq Fast Inference)',
        capabilities: ['fast', 'coding', 'tools'],
        contextWindow: 8192,
        costPer1kInputTokens: 0.0005,
        costPer1kOutputTokens: 0.0008,
        avgLatencyMs: 250,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 3. Gemini 2.5 Flash (Fast, Generous Free Tier)
      {
        id: 'gemini-2.5-flash',
        provider: 'gemini',
        name: 'Google Gemini 2.5 Flash',
        capabilities: ['fast', 'vision', 'tools', 'coding'],
        contextWindow: 1_000_000,
        costPer1kInputTokens: 0.0001,
        costPer1kOutputTokens: 0.0004,
        avgLatencyMs: 400,
        healthy: true,
        tier: 'FREE',
      },
      // 4. Gemini 2.5 Pro (Deep Research & High-Context)
      {
        id: 'gemini-2.5-pro',
        provider: 'gemini',
        name: 'Google Gemini 2.5 Pro',
        capabilities: ['reasoning', 'coding', 'vision', 'tools'],
        contextWindow: 2_000_000,
        costPer1kInputTokens: 0.00125,
        costPer1kOutputTokens: 0.005,
        avgLatencyMs: 1200,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 5. DeepSeek R1 (Deep Architectural Reasoning)
      {
        id: 'deepseek-r1',
        provider: 'together',
        name: 'DeepSeek-R1 (Architectural Reasoning)',
        capabilities: ['reasoning', 'coding'],
        contextWindow: 64_000,
        costPer1kInputTokens: 0.00055,
        costPer1kOutputTokens: 0.00219,
        avgLatencyMs: 1800,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 6. Claude 3.7 Sonnet (Supreme Coding & Hybrid Reasoning)
      {
        id: 'claude-3-7-sonnet',
        provider: 'anthropic',
        name: 'Anthropic Claude 3.7 Sonnet',
        capabilities: ['reasoning', 'coding', 'vision', 'tools'],
        contextWindow: 200_000,
        costPer1kInputTokens: 0.003,
        costPer1kOutputTokens: 0.015,
        avgLatencyMs: 1500,
        healthy: true,
        tier: 'PAID',
      },
    ];

    for (const m of defaultModels) {
      this.models.set(m.id, m);
    }
  }

  public static getModel(id: string): ModelMetadata | undefined {
    return this.models.get(id);
  }

  public static listModels(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  public static registerModel(model: ModelMetadata): void {
    this.models.set(model.id, model);
  }

  public static setModelHealth(id: string, healthy: boolean): void {
    const model = this.models.get(id);
    if (model) {
      model.healthy = healthy;
    }
  }

  /**
   * Circuit breaker failure recorder
   */
  public static recordProviderFailure(provider: ProviderType): void {
    const failures = (this.providerFailures.get(provider) || 0) + 1;
    this.providerFailures.set(provider, failures);

    if (failures >= this.circuitBreakerThreshold) {
      // Trip circuit breaker: mark all models of this provider unhealthy
      for (const model of this.models.values()) {
        if (model.provider === provider) {
          model.healthy = false;
        }
      }
    }
  }

  public static resetProviderCircuit(provider: ProviderType): void {
    this.providerFailures.set(provider, 0);
    for (const model of this.models.values()) {
      if (model.provider === provider) {
        model.healthy = true;
      }
    }
  }
}
