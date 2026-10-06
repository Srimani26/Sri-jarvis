/**
 * J.A.R.V.I.S. MARK-V Unified Resource Registry
 * Single pane of glass for all legitimate local, free, authorized, and cloud resources.
 */

import {
  ResourceMetadata,
  ResourceRequirement,
  ResourceType,
  ResourceHealth,
  ResourceCostClass,
  ResourceClassification,
} from './types';

export class ResourceRegistry {
  private static resources: Map<string, ResourceMetadata> = new Map();
  private static failureCounts: Map<string, number> = new Map();

  static {
    this.bootstrapResources();
  }

  public static bootstrapResources(): void {
    const defaults: ResourceMetadata[] = [
      // ─── 1. LOCAL OLLAMA (Zero cost, local privacy) ───
      {
        id: 'res-model-ollama-llama3',
        name: 'Ollama Llama 3 8B',
        provider: 'ollama',
        type: 'MODEL',
        capabilities: ['fast', 'tools', 'coding'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 120,
        limits: { contextWindow: 8192, concurrency: 2 },
        contextSize: 8192,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 10,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Local workstation Ollama inference via localhost:11434',
      },
      // ─── 2. GOOGLE GEMINI 2.5 FLASH (Official Generous Free Tier) ───
      {
        id: 'res-model-gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        provider: 'gemini',
        type: 'MODEL',
        capabilities: ['fast', 'vision', 'tools', 'coding', 'reasoning'],
        costClass: 'FREE',
        classification: 'FREE',
        health: 'HEALTHY',
        latencyMs: 380,
        limits: { rpm: 15, tpm: 1_000_000, dailyRequests: 1500, contextWindow: 1_048_576 },
        contextSize: 1_048_576,
        authStatus: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 20,
        enabled: true,
        privacyLevel: 'RESTRICTED',
        description: 'Google AI Studio official free tier API with 1M context and vision',
      },
      // ─── 3. GROQ LLAMA 3 70B (Fast Free Tier Developer API) ───
      {
        id: 'res-model-groq-llama3-70b',
        name: 'Groq Llama 3 70B',
        provider: 'groq',
        type: 'MODEL',
        capabilities: ['fast', 'coding', 'tools', 'reasoning'],
        costClass: 'FREE',
        classification: 'FREE',
        health: 'HEALTHY',
        latencyMs: 210,
        limits: { rpm: 30, dailyRequests: 14400, contextWindow: 8192 },
        contextSize: 8192,
        authStatus: process.env.GROQ_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 25,
        enabled: true,
        privacyLevel: 'RESTRICTED',
        description: 'Groq LPUs high-throughput free developer tier',
      },
      // ─── 4. OPENROUTER FREE TIER MODELS ───
      {
        id: 'res-model-openrouter-free',
        name: 'OpenRouter Free Model Router',
        provider: 'openrouter',
        type: 'MODEL',
        capabilities: ['fast', 'coding'],
        costClass: 'FREE',
        classification: 'FREE',
        health: 'HEALTHY',
        latencyMs: 450,
        limits: { rpm: 20, dailyRequests: 200, contextWindow: 32768 },
        contextSize: 32768,
        authStatus: process.env.OPENROUTER_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 30,
        enabled: true,
        privacyLevel: 'PUBLIC',
        description: 'OpenRouter :free tagged community models',
      },
      // ─── 5. LOCAL BROWSER (Playwright on PC Worker) ───
      {
        id: 'res-browser-playwright-local',
        name: 'Playwright Local Headless Browser',
        provider: 'pc-worker',
        type: 'BROWSER',
        capabilities: ['dom_snapshot', 'interactive_navigation', 'full_rendering', 'screenshots'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 600,
        limits: { concurrency: 3 },
        contextSize: 0,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 15,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Local Chromium/WebKit automation running on client PC worker',
      },
      // ─── 6. LOCAL STT (Whisper via PC Worker) ───
      {
        id: 'res-stt-whisper-local',
        name: 'Whisper Local STT',
        provider: 'pc-worker',
        type: 'STT',
        capabilities: ['audio_transcription', 'realtime_stt'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 350,
        limits: { concurrency: 1 },
        contextSize: 0,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 10,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Open-source local Whisper speech-to-text inference',
      },
      // ─── 7. LOCAL TTS (Piper / Web Speech) ───
      {
        id: 'res-tts-piper-local',
        name: 'Piper / Web Speech Local TTS',
        provider: 'pc-worker',
        type: 'TTS',
        capabilities: ['audio_synthesis', 'zero_latency_speech'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 80,
        limits: { concurrency: 2 },
        contextSize: 0,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 10,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Fast, offline open-source text-to-speech engine',
      },
      // ─── 8. LOCAL EMBEDDINGS (Sentence Transformers / Ollama) ───
      {
        id: 'res-embedding-nomic-local',
        name: 'Nomic Embed Text / BGE Small',
        provider: 'ollama',
        type: 'EMBEDDING',
        capabilities: ['vector_embedding', 'similarity_search'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 40,
        limits: { contextWindow: 8192 },
        contextSize: 8192,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 10,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Local vector embeddings cached in local memory/sqlite',
      },
      // ─── 9. DISTRIBUTED PC COMPUTE WORKER ───
      {
        id: 'res-compute-pc-worker',
        name: 'Sri Workstation PC Worker',
        provider: 'pc-worker',
        type: 'WORKER',
        capabilities: ['LOCAL_LLM', 'LOCAL_BROWSER', 'WORKSPACE_FILES', 'TERMINAL', 'LOCAL_STT', 'LOCAL_TTS'],
        costClass: 'ZERO_SELF_HOSTED',
        classification: 'LOCAL',
        health: 'HEALTHY',
        latencyMs: 15,
        limits: { concurrency: 4 },
        contextSize: 0,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 5,
        enabled: true,
        privacyLevel: 'LOCAL_ONLY',
        description: 'Distributed Node.js CLI daemon running on Sri workstation',
      },
      // ─── 10. CLOUD ORCHESTRATION COMPUTE (Render 24/7) ───
      {
        id: 'res-compute-cloud-render',
        name: 'Render Cloud 24/7 Orchestrator',
        provider: 'render',
        type: 'COMPUTE',
        capabilities: ['api_gateway', 'scheduler', 'task_store', 'sse_stream', 'mcp_bridge'],
        costClass: 'FREE',
        classification: 'FREE',
        health: 'HEALTHY',
        latencyMs: 25,
        limits: { concurrency: 10 },
        contextSize: 0,
        authStatus: 'CONFIGURED',
        totalExecutions: 0,
        failureRate: 0,
        priority: 50,
        enabled: true,
        privacyLevel: 'RESTRICTED',
        description: 'Central Hono cloud server running 24x7 at sri-jarvis.onrender.com',
      },
    ];

    for (const r of defaults) {
      this.resources.set(r.id, r);
    }
  }

  public static registerResource(resource: ResourceMetadata): void {
    this.resources.set(resource.id, resource);
  }

  public static getResource(id: string): ResourceMetadata | undefined {
    return this.resources.get(id);
  }

  public static listAll(): ResourceMetadata[] {
    return Array.from(this.resources.values());
  }

  public static setHealth(id: string, health: ResourceHealth): void {
    const res = this.resources.get(id);
    if (res) {
      res.health = health;
    }
  }

  public static queryResources(filter?: Partial<ResourceMetadata>): ResourceMetadata[] {
    return this.listAll().filter((r) => {
      if (!r.enabled) return false;
      if (filter?.type && r.type !== filter.type) return false;
      if (filter?.provider && r.provider !== filter.provider) return false;
      if (filter?.costClass && r.costClass !== filter.costClass) return false;
      if (filter?.classification && r.classification !== filter.classification) return false;
      if (filter?.health && r.health !== filter.health) return false;
      return true;
    });
  }

  /**
   * Get all resources belonging to the FREE / ZERO-COST pool
   */
  public static getFreeResourcePool(): ResourceMetadata[] {
    return this.listAll().filter(
      (r) =>
        r.enabled &&
        r.health === 'HEALTHY' &&
        (r.costClass === 'FREE' || r.costClass === 'ZERO_SELF_HOSTED')
    );
  }

  /**
   * Pick the best available resource according to capability, health, latency and cost.
   * Ranking hierarchy: LOCAL / ZERO_SELF_HOSTED -> FREE -> LOW_COST -> PAID
   */
  public static getBestResource(requirement: ResourceRequirement): ResourceMetadata | undefined {
    const costRank: Record<ResourceCostClass, number> = {
      ZERO_SELF_HOSTED: 1,
      FREE: 2,
      LOW_COST: 3,
      PAID: 4,
    };

    const candidates = this.listAll().filter((r) => {
      if (!r.enabled) return false;
      if (r.health !== 'HEALTHY' && r.health !== 'DEGRADED') return false;
      if (requirement.type && r.type !== requirement.type) return false;
      if (requirement.minContextSize && r.contextSize < requirement.minContextSize) return false;
      if (requirement.privacyLevel === 'LOCAL_ONLY' && r.privacyLevel !== 'LOCAL_ONLY') return false;

      if (requirement.capabilities && requirement.capabilities.length > 0) {
        const hasAll = requirement.capabilities.every((cap) => r.capabilities.includes(cap));
        if (!hasAll) return false;
      }
      return true;
    });

    if (candidates.length === 0) return undefined;

    candidates.sort((a, b) => {
      if (requirement.preferLocal) {
        if (a.classification === 'LOCAL' && b.classification !== 'LOCAL') return -1;
        if (b.classification === 'LOCAL' && a.classification !== 'LOCAL') return 1;
      }
      const costDiff = costRank[a.costClass] - costRank[b.costClass];
      if (costDiff !== 0) return costDiff;

      // Secondary: lower failure rate
      const failDiff = a.failureRate - b.failureRate;
      if (failDiff !== 0) return failDiff;

      // Tertiary: lower latency
      return a.latencyMs - b.latencyMs;
    });

    return candidates[0];
  }

  public static recordExecutionOutcome(id: string, success: boolean, latencyMs: number): void {
    const res = this.resources.get(id);
    if (!res) return;

    res.totalExecutions++;
    res.latencyMs = Math.round((res.latencyMs * 0.7) + (latencyMs * 0.3)); // Exponential moving avg

    if (success) {
      res.lastSuccessfulExecution = new Date().toISOString();
      const currentFail = this.failureCounts.get(id) || 0;
      if (currentFail > 0) {
        this.failureCounts.set(id, Math.max(0, currentFail - 1));
      }
      if (res.health === 'DEGRADED' || res.health === 'RATE_LIMITED') {
        res.health = 'HEALTHY';
      }
    } else {
      const fails = (this.failureCounts.get(id) || 0) + 1;
      this.failureCounts.set(id, fails);
      if (fails >= 3) {
        res.health = 'DEGRADED';
      }
      if (fails >= 5) {
        res.health = 'RATE_LIMITED';
      }
    }

    res.failureRate = (this.failureCounts.get(id) || 0) / Math.max(1, res.totalExecutions);
  }

  public static getSummary() {
    const list = this.listAll();
    return {
      total: list.length,
      healthy: list.filter((r) => r.health === 'HEALTHY').length,
      freePoolSize: this.getFreeResourcePool().length,
      localResources: list.filter((r) => r.classification === 'LOCAL').length,
      configuredAuth: list.filter((r) => r.authStatus === 'CONFIGURED').length,
    };
  }
}
