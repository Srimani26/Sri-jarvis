# J.A.R.V.I.S. MARK-V
### Autonomous AI Operating System — Cloud & Distributed PC Worker Architecture

J.A.R.V.I.S. Mark-V is an autonomous personal AI operating system engineered around real deterministic execution, distributed worker compute, multi-provider resource routing, and continuous self-healing.

Unlike prompt wrappers or mock agent dashboards, every module in J.A.R.V.I.S. executes factual operations: persistent state machines, surgical diff patching, sandbox-checked bash execution, verified RAG retrieval, real-time voice with VAD, and distributed worker execution across cloud and workstation hardware.

---

## 🏛️ System Architecture

```
                                  USER (Voice / Web / API)
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │    J.A.R.V.I.S. CLOUD RUNTIME     │
                          │   (sri-jarvis.onrender.com: 24/7) │
                          └─────────────────┬─────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      [MissionOrchestrator]         [ResourceRegistry]           [AutonomousScheduler]
               │                            │                            │
               ▼                            ▼                            ▼
      [ExecutionKernel]             [ModelRouter V2]            [CrashRecovery]
               │                            │
               ├─ TaskStore (SQLite)        ├─ Free-First / Local-First
               ├─ EventStream (SSE)         ├─ Quota & Circuit Breakers
               └─ AgentRuntime              └─ ProviderLearner
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   [20 Specialist Agents]      [ToolRegistry + MCP]
        │                             │
        └──────────────┬──────────────┘
                       │ WebSocket / HTTP Protocol
                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 DISTRIBUTED PC WORKER                       │
        │                  (Sri's Workstation)                        │
        ├─────────────────────────────┬───────────────────────────────┤
        │  • Local Ollama (Llama 3)   │  • Scoped Workspace Files     │
        │  • Playwright Chromium      │  • Whisper Local STT          │
        │  • Capability Security Gating│ • Piper Neural TTS           │
        └─────────────────────────────┴───────────────────────────────┘
```

---

## ⚡ Core Capabilities

- **Unified Resource Registry**: Aggregates models, providers, tools, workers, browsers, STT, TTS, and embeddings into a single pane of glass.
- **Legitimate Free Tier Maximization**: Integrates official free developer tiers (Google Gemini 2.5 Flash, Groq Cloud, OpenRouter `:free`) alongside local Ollama inference ($0.00 cost).
- **Intelligent Model Router V2**: Classifies tasks dynamically (`simple`, `coding`, `architecture`, `vision`, `research`), prioritizes local and free options, and learns empirical performance without weight retraining.
- **Quota Governance & Circuit Breakers**: Automatically tracks requests, tokens, and 429 rate limits, failing over seamlessly to secondary providers with exponential backoff.
- **Distributed PC Worker (`workers/jarvis-worker/`)**: Lightweight CLI daemon running on your PC that offloads heavy compute, local models, Playwright browser automation, and sandboxed filesystem access from cloud memory constraints.
- **20 Specialist Workforce Agents**: Dedicated specialist agents (`software_engineer`, `architect`, `qa_engineer`, `debugger`, `devops_engineer`, etc.) with strict capability ceilings and tool allowlists.
- **Surgical Coding Execution Loop**: Search/replace diff patcher that applies edits with AST precision, validates changes against the test suite, and auto-repairs regressions.
- **Voice Engine with VAD & Barge-In**: Real-time voice interaction with a 2-second silence cutoff and immediate playback cancellation on barge-in.
- **24/7 Autonomous Scheduler**: Background worker executing maintenance, health audits, and periodic syncs deterministically without burning LLM tokens.
- **Crash Recovery & Self-Healing**: Recovers interrupted tasks from SQLite on reboot and self-heals database schemas without downtime.

---

## 🛠️ Quickstart & Installation

### 1. Central Server Setup

```bash
# Clone the repository
git clone https://github.com/Srimani26/standardroofs-jarvis.git
cd standardroofs-jarvis

# Install dependencies
npm install

# Run database setup & Prisma generation
npm run db:push

# Run full automated test suite (80/80 passing)
npm test

# Build client and server bundles
npm run build
npm run build:server

# Start the full-stack server
node server.mjs
```

### 2. Distributed PC Worker Setup

The worker runs on your local workstation to execute local Ollama models, Playwright browser workflows, and local tasks:

```bash
# Navigate to worker directory
cd workers/jarvis-worker

# Run local hardware & software diagnostic check
npm run doctor

# Inspect detected capability tokens
npm run status

# Launch the worker daemon (connects to cloud server)
npm run start
```

---

## 🔑 Environment Configuration

Configure the following variables in `.env` (or in the Render Dashboard):

```env
# Server Runtime
PORT=3005
NODE_ENV=production
JWT_SECRET=your-random-64-char-secret

# Legitimate AI Provider Keys (Server-Side Only)
GEMINI_API_KEY=your-gemini-api-key       # Official Google AI Studio free tier
GROQ_API_KEY=your-groq-api-key           # Official Groq developer free tier
OPENROUTER_API_KEY=your-openrouter-key   # (Optional) OpenRouter community free models
ANTHROPIC_API_KEY=your-anthropic-key     # (Optional) User-authorized premium models

# Local Worker Configuration
OLLAMA_BASE_URL=http://localhost:11434   # Local Ollama daemon endpoint
JARVIS_SERVER_URL=https://sri-jarvis.onrender.com # Target cloud orchestrator
JARVIS_WORKER_WORKSPACE=E:\JARVIS\workspace       # Sandboxed workstation workspace
```

*Note: All API keys reside strictly server-side and are never sent to client browsers or exposed in git commits.*

---

## 🩺 System Health & Observability Endpoints

All endpoints return safe, sanitized operational data without exposing credentials or internal paths:

- `GET /health` — Overall server heartbeat and cloud availability status.
- `GET /health/providers` — Active providers, quota states, and circuit breaker status.
- `GET /health/database` — SQLite / PostgreSQL connection health and persistence status.
- `GET /health/workers` — Connected distributed worker nodes and active capability tokens.
- `GET /health/scheduler` — Active autonomous background jobs and execution counters.
- `GET /health/resources` — Comprehensive summary of the Unified Resource Registry and economics.
- `GET /health/version` — Release version, runtime stats, and process uptime.

---

## 🧪 Automated Test Verification

J.A.R.V.I.S. Mark-V maintains a comprehensive automated test suite with **80 passing tests** across 19 test suites:

```bash
npm test
```

Test suites cover:
- **Phase 1**: Execution Kernel & Deterministic State Machine
- **Phase 2**: Persistent SQLite TaskStore, SSE Event Streams & Crash Recovery
- **Phase 3**: 20 Specialist Agents, Capability Boundaries & Handoffs
- **Phase 4**: Unified Tool Registry, Permission Gating & MCP Protocols
- **Phase 5**: Coding Execution Loop, Surgical Diff Patcher & Rollback
- **Phase 6**: Browser Automation & Prompt-Injection Security Shield
- **Phase 7**: Model Router, Cost Tiers & Circuit Breaker Failover
- **Phase 8**: Scoped Memory Planes & Grounded RAG Pipeline
- **Phase 9**: Voice Engine, VAD 2s Cutoff & Barge-In Interruption
- **Phase 10**: Autonomous 24/7 Scheduler & Delayed/Recurring Jobs
- **Phase 11-12**: Self-Repair Engine & Deterministic Diagnostic Loop
- **Phase 13-15**: Sandboxed Self-Evolution, TelemetryHub & Mission Reporting
- **Phase 17**: ResourceRegistry, QuotaManager, Legitimate Adapters & PC Worker

---

## 🔒 Security Principles

1. **Zero Fake Execution**: No mock responses or simulated agent loops.
2. **Capability Token Gating**: Every tool and worker requires explicit capability authorization.
3. **Strict Filesystem Sandboxing**: All file writes and reads are restricted to designated workspace roots. Directory traversal attacks are caught and blocked immediately.
4. **Adversarial Content Isolation**: Untrusted web pages and external files are permanently tagged as untrusted context and stripped of executable payloads.
5. **Zero Credential Exfiltration**: Credentials never touch client bundles, logs, or git commits.

---

## 📄 License

Licensed under the Apache-2.0 License. Third-party open-source components and their respective licenses are cataloged in `docs/OPEN_SOURCE_LICENSE_REGISTRY.md`.
