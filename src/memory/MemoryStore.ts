/**
 * J.A.R.V.I.S. MARK-V Persistent Scoped Memory Store
 * Manages 10 distinct memory planes with provenance, expiration, and semantic retrieval.
 */

import { MemoryRecord, MemoryScope, MemorySearchQuery } from './types';

export class MemoryStore {
  private static memories: Map<string, MemoryRecord> = new Map();

  /**
   * Save or update memory record
   */
  public static store(
    entry: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): MemoryRecord {
    const id = entry.id || `mem_${entry.scope.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const existing = this.memories.get(id);
    const record: MemoryRecord = {
      ...entry,
      id,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.memories.set(id, record);
    return record;
  }

  /**
   * Search memory with scope isolation, confidence filtering, and expiration checks
   */
  public static search(searchQuery: MemorySearchQuery): MemoryRecord[] {
    const { scope, query, limit = 10, minConfidence = 0.5 } = searchQuery;
    const now = new Date().getTime();
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const results: Array<{ record: MemoryRecord; score: number }> = [];

    for (const record of this.memories.values()) {
      // 1. Scope filter
      if (scope && record.scope !== scope) {
        continue;
      }

      // 2. Confidence filter
      if (record.confidence < minConfidence) {
        continue;
      }

      // 3. Expiration filter
      if (record.expiresAt && new Date(record.expiresAt).getTime() < now) {
        continue;
      }

      // 4. Token similarity scoring
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
      minConfidence: 0.7,
    });
    return matches[0];
  }

  /**
   * Set user preference in USER memory plane
   */
  public static setUserPreference(key: string, value: string): MemoryRecord {
    return this.store({
      id: `pref_${key}`,
      scope: 'USER',
      key,
      content: value,
      source: 'UserDirective',
      confidence: 1.0,
    });
  }

  public static getUserPreference(key: string): string | undefined {
    const record = this.memories.get(`pref_${key}`);
    return record?.content;
  }

  public static clear(): void {
    this.memories.clear();
  }
}
