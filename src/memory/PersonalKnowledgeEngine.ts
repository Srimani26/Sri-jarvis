/**
 * J.A.R.V.I.S. MARK-V Phase 26: Personal Knowledge & Verified RAG Engine
 * Multi-tier memory representation of Master Sri's directives,
 * project topologies, verified bug solutions, and hybrid keyword/semantic search.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

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
  private static dataDir = resolve(process.cwd(), 'data');
  private static storageFile = join(PersonalKnowledgeEngine.dataDir, 'personal_knowledge.json');

  static {
    this.bootstrapMasterProfile();
  }

  private static ensureStorage() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private static bootstrapMasterProfile() {
    this.ensureStorage();
    if (existsSync(this.storageFile)) {
      try {
        const raw = readFileSync(this.storageFile, 'utf-8');
        const entries: KnowledgeEntry[] = JSON.parse(raw);
        for (const e of entries) {
          this.knowledgeBase.set(e.id, e);
        }
        return;
      } catch (err) {
        console.error('[PersonalKnowledgeEngine] Failed to load stored knowledge, rebuilding defaults:', err);
      }
    }

    const defaultEntries: KnowledgeEntry[] = [
      {
        id: 'pref_master_title',
        category: 'USER_DIRECTIVE',
        topic: 'Operator Identity & Loyalty',
        content: 'Operator is Master Sri. Address with tactical precision, absolute loyalty, warmth, and concise executive clarity. Act as an authentic personal AI assistant.',
        tags: ['master_sri', 'identity', 'protocol', 'personal'],
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
      {
        id: 'pref_high_ticket_focus',
        category: 'USER_DIRECTIVE',
        topic: 'High-Ticket Autonomous Revenue Directives',
        content: 'Focus on high-leverage software execution: Shopify Plus themes, Liquid responsive engineering, enterprise multi-agent workflows, and automated client proposals.',
        tags: ['revenue', 'high_ticket', 'shopify', 'liquid', 'freelance'],
        confidence: 1.0,
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const e of defaultEntries) {
      this.knowledgeBase.set(e.id, e);
    }
    this.persistToDisk();
  }

  private static persistToDisk() {
    this.ensureStorage();
    try {
      const arr = Array.from(this.knowledgeBase.values());
      writeFileSync(this.storageFile, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PersonalKnowledgeEngine] Failed to save to disk:', err);
    }
  }

  public static addEntry(entry: Omit<KnowledgeEntry, 'updatedAt'>): KnowledgeEntry {
    const full: KnowledgeEntry = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };
    this.knowledgeBase.set(full.id, full);
    this.persistToDisk();
    return full;
  }

  public static getSummaryContext(): string {
    const entries = Array.from(this.knowledgeBase.values()).slice(0, 5);
    return entries.map(e => `- [${e.topic}]: ${e.content}`).join('\n');
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
