/**
 * OllamaLocalProvider.ts — Sovereign Air-Gapped Local Inference Engine (Ollama + Qwen3)
 * Target: src/swarm/engine/OllamaLocalProvider.ts & server/src/swarm/engine/OllamaLocalProvider.ts
 *
 * Implements Ollama + Qwen3 local air-gapped inference from:
 * https://gist.github.com/Syedmudassir1604/512684147667ecd5e6cc9843e4277a48
 *
 * Features:
 * 1. Probes http://localhost:11434/api/tags on startup.
 * 2. Automatic discovery of local offline models (qwen3:4b, deepseek-r1, llama3).
 * 3. Zero-token-cost local execution tier without internet or API keys.
 */

export interface OllamaModelTag {
  name: string
  model: string
  size: number
  digest: string
}

export class OllamaLocalProvider {
  private static instance: OllamaLocalProvider
  private baseUrl: string

  public static getInstance(customUrl?: string): OllamaLocalProvider {
    if (!OllamaLocalProvider.instance) {
      OllamaLocalProvider.instance = new OllamaLocalProvider(customUrl)
    }
    return OllamaLocalProvider.instance
  }

  constructor(customUrl?: string) {
    this.baseUrl = customUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Check if local Ollama daemon is active
   */
  public async probeHealth(): Promise<{ online: boolean; models: string[]; baseUrl: string; latencyMs?: number }> {
    const start = Date.now()
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000)
      })

      if (res.ok) {
        const data = await res.json() as { models?: OllamaModelTag[] }
        const models = (data.models || []).map(m => m.name)
        return {
          online: true,
          models: models.length > 0 ? models : ['qwen3:4b', 'deepseek-r1:latest'],
          baseUrl: this.baseUrl,
          latencyMs: Date.now() - start
        }
      }
      return { online: false, models: [], baseUrl: this.baseUrl }
    } catch {
      return { online: false, models: [], baseUrl: this.baseUrl }
    }
  }

  /**
   * Run local inference via Ollama OpenAI-compatible endpoint
   */
  public async dispatchCompletion(
    model: string,
    messages: any[],
    tools?: any[]
  ): Promise<{ content?: string; tool_calls?: any[] } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'qwen3:4b',
          messages,
          tools: tools && tools.length > 0 ? tools : undefined,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(15000)
      })

      if (res.ok) {
        const json = await res.json() as any
        const choice = json.choices?.[0]?.message
        if (choice) {
          return {
            content: choice.content,
            tool_calls: choice.tool_calls
          }
        }
      }
      return null
    } catch {
      return null
    }
  }
}

export const ollamaLocalProvider = OllamaLocalProvider.getInstance()

