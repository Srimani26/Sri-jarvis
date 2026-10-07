/**
 * J.A.R.V.I.S. MARK-V Persistent Scoped Memory Store
 * Manages memory planes with provenance, expiration, epistemic truth typing, and semantic retrieval.
 */

import { MemoryRecord, MemoryScope, MemorySearchQuery } from './types';
import { LayeredMemoryEngine } from './LayeredMemoryEngine';

export class MemoryStore {
  private static memories: Map<string, MemoryRecord> = new Map();

  /**
   * Save or update memory record
   */
  public static store(
    entry: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'truthType' | 'provenance' | 'permissions'> & {
      id?: string;
      truthType?: MemoryRecord['truthType'];
      provenance?: Partial<MemoryRecord['provenance']>;
      permissions?: string[];
    }
  ): MemoryRecord {
    const id = entry.id || `mem_${entry.scope.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const existing = this.memories.get(id);
    const truthType = entry.truthType || (entry.scope === 'USER_PREFERENCE' ? 'USER_PREFERENCE' : 'FACT');
    const permissions = entry.permissions || ['read:all'];
    const provenance = {
      creator: entry.source || 'JARVIS_CORE',
      chainOfCustody: [entry.source || 'JARVIS_CORE'],
      ...entry.provenance,
    };

    const record: MemoryRecord = {
      ...entry,
      id,
      truthType,
      permissions,
      provenance,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.memories.set(id, record);

    // Asynchronously bridge to LayeredMemoryEngine
    LayeredMemoryEngine.recordMemory({
      scope: record.scope,
      truthType: record.truthType,
      key: record.key,
      content: record.content,
      source: record.source,
      confidence: record.confidence,
      permissions: record.permissions,
      provenance: record.provenance,
      metadata: record.metadata,
      expiresAt: record.expiresAt,
    }).catch(() => {});

    return record;
  }

  /**
   * Search memory with scope isolation, confidence filtering, and expiration checks
   */
  public static search(searchQuery: MemorySearchQuery): MemoryRecord[] {
    const { scope, truthType, query, limit = 10, minConfidence = 0.5, includeExpired = false } = searchQuery;
    const now = new Date().getTime();
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const results: Array<{ record: MemoryRecord; score: number }> = [];

    for (const record of this.memories.values()) {
      // 1. Scope filter
      if (scope && record.scope !== scope) {
        continue;
      }

      // 2. Truth type filter
      if (truthType && record.truthType !== truthType) {
        continue;
      }

      // 3. Confidence filter
      if (record.confidence < minConfidence) {
        continue;
      }

      // 4. Expiration filter
      if (!includeExpired && record.expiresAt && new Date(record.expiresAt).getTime() < now) {
        continue;
      }

      // 5. Token similarity scoring
      const contentLower = `${record.key} ${record.content}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) {
          matchCount++;
        }
      }

      if (queryTokens.length === 0 || matchCount > 0) {
        const score = queryTokens.length === 0 ? 1 : matchCount / queryTokens.length;
        results.push({ record, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map((r) => r.record);
  }

  /**
   * Record failure and its verified fix into FAILURE memory plane
   */
  public static recordFailureFix(
    failureSignature: string,
    fixResolution: string,
    metadata?: Record<string, any>
  ): MemoryRecord {
    return this.store({
      scope: 'FAILURE',
      truthType: 'FACT',
      key: failureSignature,
      content: fixResolution,
      source: 'SelfRepairEngine',
      confidence: 1.0,
      metadata,
    });
  }

  /**
   * Retrieve prior solution for a recurring failure
   */
  public static findFixForFailure(failureSignature: string): MemoryRecord | undefined {
    const matches = this.search({
      scope: 'FAILURE',
      query: failureSignature,
      limit: 1,
      minConfidence: 0.8,
    });
    return matches[0];
  }

  /**
   * Record verified skill or solution recipe
   */
  public static recordSkill(skillName: string, recipe: string, tags: string[] = []): MemoryRecord {
    return this.store({
      scope: 'SKILL',
      truthType: 'FACT',
      key: skillName,
      content: recipe,
      source: 'SystemSkillLearner',
      confidence: 1.0,
      metadata: { tags },
    });
  }
}
