import { prisma } from '../lib/db';
import { StorageMemoryStore } from '../storage/StorageMemoryStore';
import {
  MemoryRecord,
  MemoryScope,
  MemorySearchQuery,
  TruthType,
  MemoryProvenance,
} from './types';

export class LayeredMemoryEngine {
  private static workingMemory: Map<string, MemoryRecord[]> = new Map(); // Keyed by taskId/threadId
  private static memoryCache: Map<string, MemoryRecord> = new Map();

  /**
   * Stores a new memory entry across the appropriate layer.
   * If content exceeds 4KB, the heavy body is offloaded to ObjectStore/StorageMemoryStore.
   */
  public static async recordMemory(params: {
    scope: MemoryScope;
    truthType: TruthType;
    key: string;
    content: string;
    source: string;
    confidence: number;
    permissions?: string[];
    provenance?: Partial<MemoryProvenance>;
    metadata?: Record<string, any>;
    expiresAt?: string;
    taskId?: string;
  }): Promise<MemoryRecord> {
    const id = `mem_${params.scope.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nowIso = new Date().toISOString();

    const provenance: MemoryProvenance = {
      creator: params.source,
      chainOfCustody: [params.source],
      ...params.provenance,
    };

    let artifactKey: string | undefined;
    let storedContent = params.content;

    // Offload heavy payload to object storage if larger than 4KB
    if (Buffer.byteLength(params.content, 'utf-8') > 4096) {
      const storageMeta = await StorageMemoryStore.putMemoryPayload(id, params.content, {
        scope: params.scope,
        truthType: params.truthType,
        key: params.key,
      });
      artifactKey = storageMeta.key;
      storedContent = `[OFFLOADED_TO_OBJECT_STORE: ${artifactKey}] ${params.content.slice(0, 500)}...`;
    }

    const record: MemoryRecord = {
      id,
      scope: params.scope,
      truthType: params.truthType,
      key: params.key,
      content: storedContent,
      metadata: params.metadata,
      source: params.source,
      confidence: Math.max(0, Math.min(1, params.confidence)),
      permissions: params.permissions || ['read:all'],
      provenance,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: params.expiresAt,
      artifactKey,
    };

    // 1. Working memory isolation
    if (params.scope === 'WORKING') {
      const taskKey = params.taskId || 'global';
      const existing = this.workingMemory.get(taskKey) || [];
      existing.push(record);
      this.workingMemory.set(taskKey, existing);
      this.memoryCache.set(id, record);
      return record;
    }

    // 2. Cache in memory
    this.memoryCache.set(id, record);

    // 3. Persist to relational DB (PostgreSQL / SQLite)
    try {
      await prisma.memory.create({
        data: {
          id,
          content: record.content,
          category: record.scope,
          importance: Math.round(record.confidence * 10),
          tags: `${record.truthType},${record.source}`,
          metadata: JSON.stringify({
            key: record.key,
            truthType: record.truthType,
            confidence: record.confidence,
            permissions: record.permissions,
            provenance: record.provenance,
            expiresAt: record.expiresAt,
            artifactKey: record.artifactKey,
            custom: record.metadata,
          }),
        },
      });
    } catch (err) {
      console.warn(`⚠️ [LayeredMemoryEngine] Failed to persist memory to database (cached in RAM):`, err);
    }

    return record;
  }

  // --- Epistemic Helpers ---

  public static async recordFact(
    scope: MemoryScope,
    key: string,
    content: string,
    source: string,
    verifiedBy: string,
    metadata?: Record<string, any>
  ): Promise<MemoryRecord> {
    return this.recordMemory({
      scope,
      truthType: 'FACT',
      key,
      content,
      source,
      confidence: 1.0,
      provenance: {
        creator: source,
        verifiedBy,
        verifiedAt: new Date().toISOString(),
        chainOfCustody: [source, verifiedBy],
      },
      metadata,
    });
  }

  public static async recordInference(
    scope: MemoryScope,
    key: string,
    content: string,
    source: string,
    confidence: number,
    metadata?: Record<string, any>
  ): Promise<MemoryRecord> {
    return this.recordMemory({
      scope,
      truthType: 'INFERENCE',
      key,
      content,
      source,
      confidence,
      metadata,
    });
  }

  public static async recordUserPreference(
    key: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<MemoryRecord> {
    return this.recordMemory({
      scope: 'USER_PREFERENCE',
      truthType: 'USER_PREFERENCE',
      key,
      content,
      source: 'Master Sri Explicit Directive',
      confidence: 1.0,
      metadata,
    });
  }

  public static async recordTemporaryContext(
    key: string,
    content: string,
    source: string,
    ttlSeconds = 3600
  ): Promise<MemoryRecord> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return this.recordMemory({
      scope: 'WORKING',
      truthType: 'TEMPORARY_CONTEXT',
      key,
      content,
      source,
      confidence: 0.8,
      expiresAt,
    });
  }

  public static async recordUnverifiedInfo(
    scope: MemoryScope,
    key: string,
    content: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<MemoryRecord> {
    return this.recordMemory({
      scope,
      truthType: 'UNVERIFIED_INFORMATION',
      key,
      content,
      source,
      confidence: 0.3,
      metadata,
    });
  }

  /**
   * Promotes an inference or unverified info into an established FACT after empirical validation
   */
  public static async verifyMemory(memoryId: string, verifier: string): Promise<MemoryRecord | null> {
    const record = this.memoryCache.get(memoryId);
    if (!record) return null;

    record.truthType = 'FACT';
    record.confidence = 1.0;
    record.provenance.verifiedBy = verifier;
    record.provenance.verifiedAt = new Date().toISOString();
    record.provenance.chainOfCustody.push(verifier);
    record.updatedAt = new Date().toISOString();

    try {
      await prisma.memory.update({
        where: { id: memoryId },
        data: {
          tags: `FACT,${record.source}`,
          importance: 10,
          metadata: JSON.stringify({
            key: record.key,
            truthType: 'FACT',
            confidence: 1.0,
            permissions: record.permissions,
            provenance: record.provenance,
            expiresAt: record.expiresAt,
            artifactKey: record.artifactKey,
            custom: record.metadata,
          }),
        },
      });
    } catch (_) {}

    return record;
  }

  /**
   * Search layered memory across Working, Session, and Persistent planes
   */
  public static async search(query: MemorySearchQuery): Promise<MemoryRecord[]> {
    const { scope, truthType, query: searchText, limit = 10, minConfidence = 0.4, includeExpired = false } = query;
    const nowMs = Date.now();
    const tokens = searchText.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const candidates: MemoryRecord[] = Array.from(this.memoryCache.values());

    const filtered = candidates.filter((mem) => {
      if (scope && mem.scope !== scope) return false;
      if (truthType && mem.truthType !== truthType) return false;
      if (mem.confidence < minConfidence) return false;
      if (!includeExpired && mem.expiresAt && new Date(mem.expiresAt).getTime() < nowMs) return false;
      return true;
    });

    const scored = filtered.map((mem) => {
      const text = `${mem.key} ${mem.content}`.toLowerCase();
      let matchCount = 0;
      for (const t of tokens) {
        if (text.includes(t)) matchCount++;
      }
      const score = tokens.length === 0 ? 1 : matchCount / tokens.length;
      return { mem, score };
    });

    scored.sort((a, b) => b.score - a.score || b.mem.confidence - a.mem.confidence);
    return scored.slice(0, limit).map((s) => s.mem);
  }

  /**
   * Retrieve full content (including from ObjectStore if offloaded)
   */
  public static async getFullContent(memoryId: string): Promise<string | null> {
    const mem = this.memoryCache.get(memoryId);
    if (!mem) return null;

    if (mem.artifactKey) {
      const payload = await StorageMemoryStore.getMemoryPayload(memoryId);
      if (payload) return payload.toString('utf-8');
    }
    return mem.content;
  }

  /**
   * Wipe working memory for a task upon completion
   */
  public static clearWorkingMemory(taskId: string): void {
    const working = this.workingMemory.get(taskId) || [];
    for (const mem of working) {
      this.memoryCache.delete(mem.id);
    }
    this.workingMemory.delete(taskId);
  }
}
