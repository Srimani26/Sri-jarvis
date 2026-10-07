/**
 * J.A.R.V.I.S. MARK-V Scoped Memory & RAG Protocol Types
 * Layered Memory Architecture with Epistemic Truth Discrimination
 */

export type MemoryScope =
  | 'WORKING'          // Active in-flight plan and scratchpad
  | 'SESSION'          // Current conversation or operational interaction
  | 'LONG_TERM'        // Persistent historical facts across reboots
  | 'SEMANTIC'         // Vector-embedded knowledge items & concepts
  | 'PROJECT'          // Repository, codebase, architecture decisions
  | 'AGENT'            // Specialist agent persona, learnings, performance metrics
  | 'USER_PREFERENCE'  // Specific preferences, habits, instructions of Master Sri
  | 'CONVERSATION'     // Legacy alias for SESSION
  | 'USER'             // Legacy alias for USER_PREFERENCE
  | 'EPISODIC'         // Event sequences and narrative episodes
  | 'FAILURE'          // Recorded failures and verified self-healed solutions
  | 'SKILL'            // Learned capabilities, tool recipes
  | 'SYSTEM';          // System configuration and runtime topology

export type TruthType =
  | 'FACT'                     // Empirically verified ground truth
  | 'INFERENCE'                // Probabilistic model deduction (requires confidence tag)
  | 'USER_PREFERENCE'          // Explicit instruction from Master Sri
  | 'TEMPORARY_CONTEXT'        // Transient state that expires quickly
  | 'UNVERIFIED_INFORMATION';  // External uncorroborated input

export interface MemoryProvenance {
  creator: string;
  verifiedBy?: string;
  verifiedAt?: string;
  chainOfCustody: string[];
  originalSourceUri?: string;
}

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  truthType: TruthType;
  key: string;
  content: string;
  metadata?: Record<string, any>;
  source: string;
  confidence: number;
  permissions: string[];
  provenance: MemoryProvenance;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  artifactKey?: string; // Reference to ObjectStore for large payloads
}

export interface MemorySearchQuery {
  scope?: MemoryScope;
  truthType?: TruthType;
  query: string;
  limit?: number;
  minConfidence?: number;
  agentId?: string;
  includeExpired?: boolean;
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
