# J.A.R.V.I.S. MARK-V — RAG Pipeline & Document Grounding

## 1. Document Ingestion
- Document chunking: 500-token chunks with 50-token sliding overlap.
- Vector representations generated via `text-embedding-004` (Gemini) or local `nomic-embed-text` (Ollama).

## 2. Retrieval & Verification
- Cosine similarity ranking against vector store.
- Synthesized responses require explicit citation links `[docId:chunkIndex]`.
- Hallucination guard: Any claim without matching citation in retrieved chunks is flagged as unverified.
