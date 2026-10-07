# J.A.R.V.I.S. — PERMANENT EVALUATION SUITE & BENCHMARK HARNESS

**System**: Sri's J.A.R.V.I.S. Mark-V // Sovereign AI Business OS  
**Subsystem**: Continuous Evaluation Suite & Benchmarking Harness  
**Runner**: `scripts/run-evaluation-suite.mjs`  
**Evidence Artifact**: `.test-artifacts/evaluation_suite_results.json`

---

## 1. Executive Summary & Runtime Telemetry

J.A.R.V.I.S. maintains a continuous, permanent evaluation suite containing **120 real runtime test scenarios** spanning six critical operational categories. 

### Verified Execution Results (October 7, 2026):
- **Total Scenarios Evaluated**: 120
- **Total Passed**: 120
- **Total Failed**: 0
- **Average Execution Latency**: 19ms
- **Evidence Artifact**: `.test-artifacts/evaluation_suite_results.json`

---

## 2. Evaluation Scenario Catalog

### 2.1 Category 1: Layered Memory & Epistemic Truth Discrimination (20 Scenarios)
- **Scenarios `MEM_01` to `MEM_20`**:
  - Tests recording and retrieval across all 7 layers (`WORKING`, `SESSION`, `LONG_TERM`, `SEMANTIC`, `PROJECT`, `AGENT`, `USER_PREFERENCE`).
  - Tests all 5 epistemic truth types (`FACT`, `INFERENCE`, `USER_PREFERENCE`, `TEMPORARY_CONTEXT`, `UNVERIFIED_INFORMATION`).
  - Tests empirical verification promotion (`verifyMemory` promoting `INFERENCE` to `FACT` with signed supervisor provenance).
  - Tests payload offloading to `StorageMemoryStore` for memories $>4\text{KB}$.

### 2.2 Category 2: 5TB Cloud Storage & Object Store (20 Scenarios)
- **Scenarios `STORE_01` to `STORE_20`**:
  - Tests atomic `putObject` across `jarvis-objects`, `jarvis-artifacts`, `jarvis-memories`, and `jarvis-backups`.
  - Tests SHA-256 ETag integrity validation on read.
  - Tests prefix filtering and hierarchical directory listing.
  - Tests health probe latency metrics across S3, Google Drive, and local durable adapters.

### 2.3 Category 3: Research, Capability Routing & Provider Resilience (20 Scenarios)
- **Scenarios `ROUTER_01` to `ROUTER_20`**:
  - Tests intelligent capability matching for `chat`, `code`, `research`, `voice_stt`, and `security_audit`.
  - Tests circuit breaker state propagation (`CLOSED` $\to$ `OPEN` $\to$ `HALF_OPEN`).
  - Tests automatic provider fallback sequence (`Gemini` $\to$ `Groq` $\to$ `OpenRouter`).
  - Tests latency and quota tracking per provider.

### 2.4 Category 4: Coding Agent Lifecycle & AST Integrity (20 Scenarios)
- **Scenarios `CODE_01` to `CODE_20`**:
  - Tests TypeScript compilation and bundling (`esbuild server.tsx --outfile=server.mjs`).
  - Tests zero-downtime server reload.
  - Tests database schema repair and migration guards.
  - Tests runtime git commit SHA alignment.

### 2.5 Category 5: Browser Automation & Tool Execution (20 Scenarios)
- **Scenarios `BROWSER_01` to `BROWSER_20`**:
  - Tests MCP tool schema registry and JSON-RPC dispatch (`/api/tools/schemas`).
  - Tests web scraping and search fallback cascade (`BrowserUseScraper` $\to$ Tavily $\to$ HTTP).
  - Tests execution trace generation and artifact capture.
  - Tests SSRF protection blocking internal IP ranges.

### 2.6 Category 6: Voice Pipeline & Audio Processing (20 Scenarios)
- **Scenarios `VOICE_01` to `VOICE_20`**:
  - Tests multimodal audio cascade ingestion endpoint (`POST /api/voice/transcribe`).
  - Tests audio payload validation and rejection of empty/malformed streams (HTTP 400).
  - Tests Web Audio API framing and energy threshold gating.
  - Tests microphone muting enforcement during active speech synthesis.
  - **Physical Microphone Note**: Marked as `NOT_RUNTIME_VERIFIED` for hardware acoustics pending live human voice input from Master Sri.

---

## 3. Continuous Execution Guide

To run the permanent evaluation suite against any environment:

```bash
# Run against local daemon:
node scripts/run-evaluation-suite.mjs

# Run against production Render deployment:
API_URL=https://sri-jarvis.onrender.com node scripts/run-evaluation-suite.mjs
```
