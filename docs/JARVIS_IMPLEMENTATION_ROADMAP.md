# J.A.R.V.I.S. MARK-V: Implementation Roadmap (Phases 0–15)

**Version:** 5.0.0-UPGRADE  
**Author:** Antigravity Autonomous Engineering Agent  
**Rule:** Phase $N+1$ cannot begin until Phase $N$ has verified automated tests.

---

## Roadmap Overview

```
PHASE 0  ──► Reality Audit & Open-Source Intelligence Registry [COMPLETE]
PHASE 1  ──► Foundation Cleanup: TypeScript Compilation & Execution Kernel Core
PHASE 2  ──► Persistent Task Engine & Live SSE Event Stream
PHASE 3  ──► Sovereign Agent Registry & Capability Permissions
PHASE 4  ──► MCP Tool Architecture & Sandboxed Tool Execution
PHASE 5  ──► Real Coding Agent (Repo-Map, Surgical Diffs, Test-Driven Verification)
PHASE 6  ──► Real Browser Agent (Playwright / CDP Headless Automation)
PHASE 7  ──► Real-Time Voice Pipeline (Non-blocking TTS, Streaming Audio, Barge-in)
PHASE 8  ──► Multi-Layer Memory & Citation-Backed RAG
PHASE 9  ──► Verification Engine & Critic Loop
PHASE 10 ──► Observability & Hierarchical Trace Engine (Langfuse Pattern)
PHASE 11 ──► Autonomous Self-Repair Engine (Reproduce -> Fix -> Test -> Report)
PHASE 12 ──► Safe Self-Evolution Engine (Scout -> Sandbox -> Security -> Approve)
PHASE 13 ──► Open-Source Intelligence Scout & Registry Automation
PHASE 14 ──► Agent Benchmark Suite (`tests/agent-benchmarks/`)
PHASE 15 ──► Production Hardening, Crash Recovery & Final Acceptance Tests
```

---

## Detailed Phase Breakdown

### Phase 0: Reality Audit & Open-Source Intelligence (Completed)
- **Goal:** Forensic audit of all existing claims, identification of simulated mocks, and formal assimilation matrix of external open-source repositories.
- **Deliverables:**
  - `docs/JARVIS_REALITY_AUDIT.md`
  - `docs/JARVIS_OPEN_SOURCE_INTELLIGENCE.md`
  - `docs/JARVIS_ARCHITECTURE_V2.md`
  - `docs/JARVIS_IMPLEMENTATION_ROADMAP.md`
  - `docs/open-source-registry.json`
- **Verification:** Completed and committed.

---

### Phase 1: Foundation Cleanup & Execution Kernel Core
- **Goal:**
  1. Fix the broken TypeScript compilation in `src/generated/` and root configuration so `npx tsc --noEmit` exits with 0 errors.
  2. Implement the central **Execution Kernel** (`src/kernel/ExecutionKernel.ts`) establishing the pipeline:
     `Input Normalizer -> Intent Analyzer -> Policy Check -> Tool Execution -> Verification -> Result`.
- **Files to Modify/Create:**
  - `tsconfig.json` (ensure clean typechecking paths)
  - `src/kernel/ExecutionKernel.ts` (new)
  - `src/kernel/types.ts` (new)
  - `tests/phase1-kernel.test.ts` (new test suite)
- **Verification:** `npx tsc --noEmit` passes with code 0; `npm run test` executes and verifies Phase 1 kernel tests.

---

### Phase 2: Persistent Task Engine & Live SSE Event Stream
- **Goal:**
  1. Upgrade `src/lib/task-engine.ts` from fake percentage timers to real atomic operation tracking.
  2. Implement native Server-Sent Events (SSE) route: `GET /api/tasks/:id/stream`.
  3. Range-based ETA calculation engine without exact completion hallucinations.
  4. Server boot crash recovery: re-hydrate and handle interrupted tasks.
- **Files to Modify/Create:**
  - `src/kernel/TaskEngine.ts` (refactored authoritative task engine)
  - `src/kernel/EventStream.ts` (SSE event bus)
  - `custom-routes.ts` (mount `/api/tasks/:id/stream` and clean task endpoints)
  - `tests/phase2-task-engine.test.ts`
- **Verification:** Create task -> stream live SSE events -> verify database persistence -> verify crash recovery.

---

### Phase 3: Sovereign Agent Registry & Capability Permissions
- **Goal:**
  1. Standardize 16 specialized core agents with explicit capability-based permissions (`READ_ONLY`, `SAFE_LOCAL`, `PROJECT_WRITE`, `SANDBOX`, `PRIVILEGED`, `PRODUCTION`).
  2. Implement Dynamic Agent Foundry with persistence into SQLite and security validation gate.
- **Files to Modify/Create:**
  - `src/kernel/AgentRegistry.ts`
  - `src/kernel/PermissionPolicy.ts`
  - `tests/phase3-agents-permissions.test.ts`
- **Verification:** Permissions engine denies unauthorized operations; dynamic agents cannot escalate to privileged status without confirmation.

---

### Phase 4: MCP Tool Architecture & Sandboxed Execution
- **Goal:**
  1. Refactor `sovereign-mcp.ts` into a hardened, modular MCP tool suite.
  2. Sandbox code execution: isolate Python/Node execution with memory limits, timeouts, and working directory encapsulation.
  3. Implement Public API catalog filter (curate `public-apis-raw.md` into reliable, verified no-auth APIs).
- **Files to Modify/Create:**
  - `src/tools/ToolRegistry.ts`
  - `src/tools/SandboxExecutor.ts`
  - `src/tools/PublicApiCatalog.ts`
  - `tests/phase4-mcp-sandbox.test.ts`
- **Verification:** Unsandboxed host commands rejected; sandbox captures stdout/stderr; MCP tool schemas validated against JSON Schema.

---

### Phase 5: Real Coding Agent (Aider & OpenHands Pattern)
- **Goal:**
  1. Replace the mock `OpenHandsAgent.ts` with a real workspace software engineering agent.
  2. Capabilities: Repository symbol indexing, surgical search/replace diff application, automated `tsc` verification, and git rollback on failure.
- **Files to Modify/Create:**
  - `src/agents/SoftwareEngineerAgent.ts`
  - `src/kernel/DiffPatcher.ts`
  - `tests/phase5-coding-agent.test.ts`
- **Verification:** Coding agent takes a bug description, edits a file, verifies compiler passes, and provides exact diff.

---

### Phase 6: Real Browser Agent
- **Goal:**
  1. Replace `BrowserUseScraper.ts` regex fetch with real browser automation (Playwright / CDP).
  2. Extract interactive DOM with index labels; click, fill forms, scroll, and capture screenshots.
  3. External web content boundary: treat external DOM text as untrusted DATA to defeat prompt injection.
- **Files to Modify/Create:**
  - `src/agents/BrowserAgent.ts`
  - `tests/phase6-browser-agent.test.ts`
- **Verification:** Real browser navigates page, extracts elements, takes screenshot, and verifies page state.

---

### Phase 7: Real-Time Voice Pipeline
- **Goal:**
  1. Eliminate synchronous `execFileSync` in `/api/voice/speak`.
  2. Implement non-blocking streaming TTS via `scripts/neural-tts.py` with multi-voice support.
  3. Build client-side interruption / barge-in handling (cancel active audio buffer immediately upon speech detection).
- **Files to Modify/Create:**
  - `src/voice/VoicePipeline.ts`
  - `src/components/JarvisVoiceModal.tsx`
  - `src/lib/sound.ts`
  - `tests/phase7-voice.test.ts`
- **Verification:** Voice request returns streaming audio without blocking Node event loop; instant client interruption cancels audio.

---

### Phase 8: Multi-Layer Memory & Citation RAG
- **Goal:**
  1. Implement structured memory tiers: Working, Episodic, Semantic, Project, Failure, and User Preferences.
  2. Citation engine: every retrieved factual claim links directly to its source file, line, or task ID.
- **Files to Modify/Create:**
  - `src/memory/MemoryKernel.ts`
  - `src/memory/RAGRetriever.ts`
  - `tests/phase8-memory.test.ts`
- **Verification:** Ask query requiring project memory -> returns exact citation with file path and evidence.

---

### Phase 9: Verification Engine & Critic Loop
- **Goal:**
  1. Implement independent Critic Agent and Verifier.
  2. Every significant action runs through: `Executor -> Critic -> Verifier`.
- **Files to Modify/Create:**
  - `src/kernel/VerificationEngine.ts`
  - `src/agents/CriticAgent.ts`
  - `tests/phase9-verification.test.ts`
- **Verification:** Tasks with flawed assumptions or failing tests are rejected by the Critic and sent back for recovery.

---

### Phase 10: Observability & Hierarchical Trace Engine
- **Goal:**
  1. Build Langfuse-style hierarchical trace logging: `Task -> Step -> Agent -> Tool -> Model`.
  2. Measure latency, token consumption, and cost per task.
- **Files to Modify/Create:**
  - `src/observability/TraceEngine.ts`
  - `tests/phase10-observability.test.ts`
- **Verification:** Full task trace exported and queryable via API.

---

### Phase 11: Autonomous Self-Repair Engine
- **Goal:**
  1. Replace the mock `SelfHealingEngine` with a real diagnostic repair loop:
     `Reproduce Error -> Locate Target -> Formulate Diff -> Test in Sandbox -> Verify Clean -> Apply & Report`.
- **Files to Modify/Create:**
  - `src/agents/DebuggerAgent.ts`
  - `tests/phase11-self-repair.test.ts`
- **Verification:** Intentionally inject a syntax/logic error in a test fixture -> Debugger reproduces, fixes, verifies, and outputs diff report.

---

### Phase 12: Safe Self-Evolution Engine
- **Goal:**
  1. Replace browser `localStorage` random numbers with real self-evolution protocol:
     `Scout -> Sandbox -> Security Check -> Benchmark -> Request Approval -> Apply`.
- **Files to Modify/Create:**
  - `src/agents/EvolutionAgent.ts`
  - `tests/phase12-evolution.test.ts`
- **Verification:** Discovers new skill candidate, evaluates in sandbox, verifies safety, and requests user approval before deployment.

---

### Phase 13: Open-Source Intelligence Scout Automation
- **Goal:**
  1. Automate periodic scouting of GitHub and package registries to update `docs/open-source-registry.json`.
- **Files to Modify/Create:**
  - `src/intelligence/OpenSourceScout.ts`
  - `tests/phase13-scout.test.ts`
- **Verification:** Runs scout routine -> extracts valid candidate repo metadata -> outputs structured JSON entry.

---

### Phase 14: Agent Benchmark Suite
- **Goal:**
  1. Build automated benchmark suite testing all 15 scenarios specified in User Instruction 58.
- **Files to Modify/Create:**
  - `tests/agent-benchmarks/suite.test.ts`
- **Verification:** Benchmark suite executes across all 15 acceptance tests.

---

### Phase 15: Production Hardening & Final Acceptance
- **Goal:**
  1. End-to-end integration test across all subsystems.
  2. Final verification of all 15 acceptance criteria.
- **Files to Modify/Create:**
  - Documentation, final performance benchmarks, production readiness checklist.
- **Verification:** 100% green tests, clean builds, production server verified.
