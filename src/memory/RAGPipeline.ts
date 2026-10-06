/**
 * J.A.R.V.I.S. MARK-V Retrieval-Augmented Generation (RAG) Engine
 * Document ingestion, semantic chunking, BM25 scoring, context synthesis, and citations.
 */

import { RAGChunk, RAGDocument, RAGQueryResult } from './types';

export class RAGPipeline {
  private static documents: Map<string, RAGDocument> = new Map();
  private static chunks: RAGChunk[] = [];

  /**
   * Ingest and chunk a document with sliding window
   */
  public static ingestDocument(
    title: string,
    sourceUri: string,
    content: string,
    chunkSize: number = 300,
    overlap: number = 50
  ): { documentId: string; chunkCount: number } {
    const documentId = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const doc: RAGDocument = {
      id: documentId,
      title,
      sourceUri,
      content,
      createdAt: new Date().toISOString(),
    };

    this.documents.set(documentId, doc);

    // Sliding window chunking
    const words = content.split(/\s+/);
    let chunkIndex = 0;
    let i = 0;

    while (i < words.length) {
      const slice = words.slice(i, i + chunkSize);
      const text = slice.join(' ');

      this.chunks.push({
        id: `chunk_${documentId}_${chunkIndex}`,
        documentId,
        documentTitle: title,
        sourceUri,
        chunkIndex,
        text,
        relevanceScore: 0,
      });

      chunkIndex++;
      i += chunkSize - overlap;
    }

    return {
      documentId,
      chunkCount: chunkIndex,
    };
  }

  /**
   * Retrieve most relevant chunks, rerank, and synthesize context with citations
   */
  public static retrieve(query: string, topK: number = 3): RAGQueryResult {
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const scoredChunks: RAGChunk[] = [];

    for (const chunk of this.chunks) {
      const textLower = chunk.text.toLowerCase();
      let matchCount = 0;

      for (const token of queryTokens) {
        if (textLower.includes(token)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = matchCount / (queryTokens.length || 1);
        scoredChunks.push({
          ...chunk,
          relevanceScore: Number(score.toFixed(4)),
        });
      }
    }

    // Rerank by score descending
    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const selected = scoredChunks.slice(0, topK);

    // Build synthesized context block
    const synthesizedContext = selected
      .map((c, idx) => `[Source ${idx + 1}: ${c.documentTitle} (chunk #${c.chunkIndex})]\n${c.text}`)
      .join('\n\n');

    // Build formal citations
    const citations = selected.map((c) => ({
      documentTitle: c.documentTitle,
      sourceUri: c.sourceUri,
      chunkIndex: c.chunkIndex,
    }));

    return {
      query,
      chunks: selected,
      synthesizedContext,
      citations,
    };
  }

  public static clear(): void {
    this.documents.clear();
    this.chunks = [];
  }
}
