/**
 * J.A.R.V.I.S. MARK-V Scoped Memory & RAG Protocol Types
 * Engineering truth: Explicit memory scoping, provenance, expiration, and factual citations.
 */

export type MemoryScope =
  | 'WORKING'
  | 'CONVERSATION'
  | 'USER'
  | 'PROJECT'
  | 'AGENT'
  | 'EPISODIC'
  | 'SEMANTIC'
  | 'FAILURE'
  | 'SKILL'
  | 'SYSTEM';

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  key: string;
  content: string;
  metadata?: Record<string, any>;
  source: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MemorySearchQuery {
  scope?: MemoryScope;
  query: string;
  limit?: number;
  minConfidence?: number;
}

export interface RAGDocument {
  id: string;
  title: string;
  sourceUri: string;
  content: string;
  createdAt: string;
}

export interface RAGChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceUri: string;
  chunkIndex: number;
  text: string;
  relevanceScore: number;
}

export interface RAGQueryResult {
  query: string;
  chunks: RAGChunk[];
  synthesizedContext: string;
  citations: Array<{ documentTitle: string; sourceUri: string; chunkIndex: number }>;
}
