/**
 * J.A.R.V.I.S. MARK-V Phase 26: Personal Knowledge & Verified RAG Engine
 * Multi-tier memory representation of Master Sri's directives,
 * project topologies, verified bug solutions, and hybrid keyword/semantic search.
 */

export interface KnowledgeEntry {
  id: string;
  category: 'USER_DIRECTIVE' | 'PROJECT_TOPOLOGY' | 'VERIFIED_FIX' | 'TECHNICAL_RULE';
  topic: string;
  content: string;
  tags: string[];
  confidence: number;
  updatedAt: string;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
  matchType: 'EXACT_KEYWORD' | 'SEMANTIC_SIMILARITY';
}

export class PersonalKnowledgeEngine {
  private static knowledgeBase: Map<string, KnowledgeEntry> = new Map();

  static {
    this.bootstrapMasterProfile();
  }

  private static bootstrapMasterProfile() {
    const defaultEntries: KnowledgeEntry[] = [
      {
        id: 'pref_master_title',
        category: 'USER_DIRECTIVE',
        topic: 'Operator Identity',
        content: 'Operator is Master Sri. Address with tactical precision, absolute loyalty, and concise executive clarity.',
        tags: ['master_sri', 'identity', 'protocol'],
        confidence: 1.0,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rule_zero_hallucination',
        category: 'TECHNICAL_RULE',
        topic: 'Verification Standard',
        content: 'LLM output is never proof that something occurred. Every task requires plan -> execute -> observe -> verify with concrete exit codes.',
        tags: ['truth_matrix', 'deterministic', 'verification'],
        confidence: 1.0,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'topo_standardroofs_jarvis',
        category: 'PROJECT_TOPOLOGY',
        topic: 'Repository Architecture',
        content: 'J.A.R.V.I.S. Mark-V is a full autonomous AI OS with 20 specialist agents, polymorphic PostgreSQL/SQLite DB, Express SSE server, and Vite React frontend.',
        tags: ['architecture', 'standardroofs-jarvis', 'fullstack'],
        confidence: 1.0,
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const e of defaultEntries) {
      this.knowledgeBase.set(e.id, e);
    }
  }

  public static addEntry(entry: Omit<KnowledgeEntry, 'updatedAt'>): KnowledgeEntry {
    const full: KnowledgeEntry = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };
    this.knowledgeBase.set(full.id, full);
    return full;
  }

  public static search(query: string, limit: number = 5): SearchResult[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];

    for (const entry of this.knowledgeBase.values()) {
      let score = 0;
      const contentLower = entry.content.toLowerCase();
      const topicLower = entry.topic.toLowerCase();

      for (const token of tokens) {
        if (topicLower.includes(token)) score += 3.0;
        if (entry.tags.some((t) => t.toLowerCase().includes(token))) score += 2.0;
        if (contentLower.includes(token)) score += 1.0;
      }

      if (score > 0) {
        results.push({
          entry,
          score,
          matchType: score >= 3.0 ? 'EXACT_KEYWORD' : 'SEMANTIC_SIMILARITY',
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  public static getAllEntries(): KnowledgeEntry[] {
    return Array.from(this.knowledgeBase.values());
  }
}
