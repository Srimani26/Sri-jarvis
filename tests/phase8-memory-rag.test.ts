import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/memory/MemoryStore';
import { RAGPipeline } from '../src/memory/RAGPipeline';
import { prisma } from '../src/lib/db';

describe('Phase 8: J.A.R.V.I.S. Scoped Memory & Verified RAG Engine', () => {
  beforeEach(() => {
    MemoryStore.clear();
    RAGPipeline.clear();
  });

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('MemoryStore enforces scope isolation across distinct planes', () => {
    // 1. Store in USER plane
    MemoryStore.setUserPreference('preferred_editor', 'VSCode / Antigravity');

    // 2. Store in PROJECT plane
    MemoryStore.store({
      scope: 'PROJECT',
      key: 'architecture_style',
      content: 'Modular monolith with clean boundary layers and Hono micro-routes',
      source: 'ArchitectAgent',
      confidence: 1.0,
    });

    // 3. Store in SEMANTIC plane
    MemoryStore.store({
      scope: 'SEMANTIC',
      key: 'token_definition',
      content: 'A token is approximately 4 characters in standard English text',
      source: 'LLMDocs',
      confidence: 0.95,
    });

    // Search specifically within USER plane
    const userResults = MemoryStore.search({ scope: 'USER', query: 'editor' });
    assert.equal(userResults.length, 1);
    assert.equal(userResults[0].content, 'VSCode / Antigravity');

    // Verify search in USER plane does NOT leak PROJECT or SEMANTIC records
    const leaked = MemoryStore.search({ scope: 'USER', query: 'monolith' });
    assert.equal(leaked.length, 0, 'USER search must not leak PROJECT plane memories');
  });

  test('MemoryStore indexes failure signatures and retrieves previous verified fixes', () => {
    const errorSignature = 'TypeScript Error TS2322: Type "TERMINAL" is not assignable to type ToolCategory';
    const fixResolution = 'Expand KernelToolDefinition.category union in src/kernel/types.ts to include TERMINAL';

    // Record fix in FAILURE plane
    MemoryStore.recordFailureFix(errorSignature, fixResolution, { file: 'src/kernel/types.ts' });

    // When identical or similar error recurs, query FAILURE plane
    const match = MemoryStore.findFixForFailure('TS2322 Type TERMINAL');
    assert.ok(match, 'Must retrieve matching fix from failure memory');
    assert.equal(match?.content, fixResolution);
  });

  test('MemoryStore automatically filters out expired memories', () => {
    const pastTime = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago

    MemoryStore.store({
      scope: 'WORKING',
      key: 'temporary_task_lock',
      content: 'Task 101 holds write lock',
      source: 'KernelLockManager',
      confidence: 1.0,
      expiresAt: pastTime,
    });

    const activeResults = MemoryStore.search({ scope: 'WORKING', query: 'lock' });
    assert.equal(activeResults.length, 0, 'Expired memory records must be filtered out');
  });

  test('RAGPipeline ingests document, chunks with overlap, and returns citations', () => {
    const docTitle = 'J.A.R.V.I.S. Architecture Manual';
    const docUri = 'docs/JARVIS_ARCHITECTURE_V2.md';
    const docContent = `
      The J.A.R.V.I.S. operating system separates truth from AI recommendation.
      The Execution Kernel is the absolute authority for capability enforcement.
      All tools are validated against capability ceilings before invocation.
      Tasks maintain deterministic state in SQLite databases via Prisma.
      The SSE event stream provides real-time cockpit updates without HTTP polling.
    `;

    const { documentId, chunkCount } = RAGPipeline.ingestDocument(docTitle, docUri, docContent, 15, 3);
    assert.ok(documentId.startsWith('doc_'));
    assert.ok(chunkCount >= 1, 'Must produce indexed chunks');

    // Query RAG pipeline
    const query = 'Execution Kernel capability enforcement';
    const result = RAGPipeline.retrieve(query, 2);

    assert.ok(result.chunks.length > 0, 'Must retrieve matching chunks');
    assert.ok(result.synthesizedContext.includes('Execution Kernel'));
    assert.ok(result.citations.length > 0, 'Must produce citations');
    assert.equal(result.citations[0].documentTitle, docTitle);
    assert.equal(result.citations[0].sourceUri, docUri);
  });

});
