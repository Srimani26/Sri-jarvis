# J.A.R.V.I.S. MARK-V — Complete Architecture Specification

## 1. Overview
J.A.R.V.I.S. Mark-V is an autonomous personal AI operating system built around real deterministic execution, distributed worker compute, multi-provider resource routing, and continuous self-healing. It bridges cloud orchestration (Render) with local workstation execution (PC Worker) to assimilate open-source software, local models (Ollama), and legitimate free developer tiers into an integrated autonomous workforce.

```
+─────────────────────────────────────────────────────────────────────────────+
|                         J.A.R.V.I.S. CLOUD RUNTIME                          |
|                                                                             |
|  [Hono API Gateway] ◄──► [MissionOrchestrator] ◄──► [ExecutionKernel]       |
|          │                        │                         │               |
|          ▼                        ▼                         ▼               |
|   [EventStream SSE]       [TaskStore SQLite]         [AgentRuntime]         |
|                                                             │               |
|  [ResourceRegistry] ◄──► [ModelRouter V2]            [20 Specialist Agents]  |
|          │                        │                         │               |
|          ▼                        ▼                         ▼               |
|   [QuotaManager]           [ProviderLearner]          [ToolRegistry + MCP]  |
|                                                             │               |
|  [CrashRecovery]          [AutonomousScheduler]     [TelemetryHub]          |
+───────────────────────────────────┬─────────────────────────────────────────+
                                    │ WebSocket / HTTP
                                    ▼
+─────────────────────────────────────────────────────────────────────────────+
|                      DISTRIBUTED PC WORKER (Workstation)                    |
|                                                                             |
|  [WorkerClient] ◄──► [WorkerExecutor] ◄──► [Scoped Workspace]               |
|          │                        │                                         |
|          ▼                        ▼                                         |
|   [Local Ollama]          [Playwright Browser]     [Whisper STT / Piper]   |
+─────────────────────────────────────────────────────────────────────────────+
```

## 2. Core Subsystems

### 2.1 Execution Kernel & Task Store
- **File**: `src/kernel/ExecutionKernel.ts`, `src/kernel/TaskStore.ts`
- **Responsibilities**: Enforces capability ceilings, executes state machine transitions (`QUEUED` -> `PLANNING` -> `EXECUTING` -> `VERIFYING` -> `COMPLETED`/`FAILED`/`BLOCKED`), calculates factual ETA ranges, verifies output artifacts, and streams real-time SSE events.

### 2.2 Unified Resource Architecture
- **Files**: `src/resources/ResourceRegistry.ts`, `src/resources/ResourceManager.ts`
- **Types Represented**: `MODEL`, `PROVIDER`, `EMBEDDING`, `STT`, `TTS`, `BROWSER`, `COMPUTE`, `WORKER`, `MCP_SERVER`, `TOOL`.
- **Classification**: `LOCAL` (self-hosted zero cost), `FREE` (official developer tiers), `EXISTING_AUTHORIZED` (user keys), `PAID`.
- **Resource Economics**: Dynamically optimizes cost and latency while preserving correctness.

### 2.3 Provider Adapters & Quota Governance
- **Files**: `src/providers/adapters/`, `src/providers/QuotaManager.ts`, `src/providers/ProviderLearner.ts`
- **Adapters**: Gemini 2.5 Flash, Groq LPU, OpenRouter, and Local Ollama.
- **Failover**: 429 rate limit detection trips circuit breaker, applies exponential backoff, and fails over immediately to candidate backups.

### 2.4 Distributed PC Worker CLI
- **Path**: `workers/jarvis-worker/`
- **CLI Commands**: `start`, `status`, `register`, `doctor`, `capabilities`, `stop`.
- **Security Boundary**: Capability tokens (`LOCAL_LLM`, `LOCAL_BROWSER`, `WORKSPACE_FILES`, `TERMINAL`, `LOCAL_STT`, `LOCAL_TTS`). Sandboxed filesystem access strictly scoped to designated workspace.

### 2.5 Voice & Vision Subsystems
- **Files**: `src/voice/VoiceEngine.ts`, `src/browser/BrowserEngine.ts`
- **Voice**: Web Speech / Whisper STT + Piper / Kokoro TTS with 2s silence VAD cutoff and barge-in interruption.
- **Vision**: Multimodal inspection supported via Gemini Flash and local Ollama LLaVA models.
