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
      // 1. Groq Cloud: LLaMA 3.3 70B Versatile (Ultra-Fast 70B Cloud Inference, ZERO local load)
      {
        id: 'groq-llama-3.3-70b',
        provider: 'groq',
        name: 'LLaMA 3.3 70B Cloud (Groq Ultra-Fast)',
        capabilities: ['fast', 'coding', 'tools', 'reasoning'],
        contextWindow: 128_000,
        costPer1kInputTokens: 0.0005,
        costPer1kOutputTokens: 0.0008,
        avgLatencyMs: 220,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 2. Together Cloud: DeepSeek R1 70B (High-Level Mathematical & Architectural Reasoning)
      {
        id: 'together-deepseek-r1-70b',
        provider: 'together',
        name: 'DeepSeek-R1 70B Cloud (Architectural Logic)',
        capabilities: ['reasoning', 'coding', 'tools'],
        contextWindow: 64_000,
        costPer1kInputTokens: 0.0007,
        costPer1kOutputTokens: 0.0025,
        avgLatencyMs: 1400,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 3. Google Gemini 2.5 Pro / Argon Tier (2 Million Token Infinite Memory & Multimodal Reasoning)
      {
        id: 'gemini-2.5-pro',
        provider: 'gemini',
        name: 'Google Gemini 2.5 Pro (Argon Frontier)',
        capabilities: ['reasoning', 'coding', 'vision', 'tools'],
        contextWindow: 2_000_000,
        costPer1kInputTokens: 0.00125,
        costPer1kOutputTokens: 0.005,
        avgLatencyMs: 950,
        healthy: true,
        tier: 'LOW_COST',
      },
      // 4. Google Gemini 2.5 Flash (Sub-Second Cloud Multimodal & Voice Transceiver)
      {
        id: 'gemini-2.5-flash',
        provider: 'gemini',
        name: 'Google Gemini 2.5 Flash (Ultra-Speed)',
        capabilities: ['fast', 'vision', 'tools', 'coding', 'audio'],
        contextWindow: 1_000_000,
        costPer1kInputTokens: 0.0001,
        costPer1kOutputTokens: 0.0004,
        avgLatencyMs: 280,
        healthy: true,
        tier: 'FREE',
      },
      // 5. Anthropic Claude 3.7 Sonnet / Opus Tier (Fable/Opus Superior Software Architecture)
      {
        id: 'claude-3-7-sonnet',
        provider: 'anthropic',
        name: 'Claude 3.7 Sonnet / Opus (Supreme Agentic Coding)',
        capabilities: ['reasoning', 'coding', 'vision', 'tools'],
        contextWindow: 200_000,
        costPer1kInputTokens: 0.003,
        costPer1kOutputTokens: 0.015,
        avgLatencyMs: 1300,
        healthy: true,
        tier: 'PAID',
      },
      // 6. OpenAI GPT-4o (Frontier Multimodal Agent Core)
      {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'OpenAI GPT-4o Multi-Modal',
        capabilities: ['reasoning', 'coding', 'vision', 'tools', 'fast'],
        contextWindow: 128_000,
        costPer1kInputTokens: 0.0025,
        costPer1kOutputTokens: 0.01,
        avgLatencyMs: 850,
        healthy: true,
        tier: 'PAID',
      },
    ];

    for (const m of defaultModels) {
      this.models.set(m.id, m);
    }
    if (this.models.has('groq-llama-3.3-70b')) {
      this.models.set('groq-llama3-70b', this.models.get('groq-llama-3.3-70b')!);
    }
  }

  public static getModel(id: string): ModelMetadata | undefined {
    if (this.models.has(id)) return this.models.get(id);
    const normalized = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, model] of this.models.entries()) {
      if (key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
        return model;
      }
    }
    return undefined;
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
