# J.A.R.V.I.S. MARK-V: Autonomous AI Operating System
### Sovereign Multi-Agent Swarm, 24/7 Autonomous Daemon & Distributed PC Worker Architecture

[![Build & Tests](https://img.shields.io/badge/tests-109%2B%20passed-brightgreen.svg)](tests/)
[![Architecture](https://img.shields.io/badge/architecture-Sovereign%20Multi--Agent%20Swarm-blue.svg)](server.tsx)
[![Live Server](https://img.shields.io/badge/production-operational-success.svg)](https://sri-jarvis.onrender.com/api/health)
[![License](https://img.shields.io/badge/license-Apache--2.0-lightgrey.svg)](LICENSE)

J.A.R.V.I.S. Mark-V is a production-grade, 24/7 autonomous operating system engineered around real deterministic multi-agent execution, persistent task DAG pipelines, distributed worker compute, multi-tier quota-resilient AI routing, and sovereign local memory synchronization.

Unlike basic conversational prompt wrappers, every module in J.A.R.V.I.S. executes factual, sandboxed operations: persistent DAG state machines, surgical AST diff patching, live shell/terminal execution, verified RAG retrieval, real-time duplex neural voice with VAD, and headless scheduled routines that run continuously without human intervention.

---

## 🏛️ System Architecture

```
                             MASTER SRI (Voice / Web / Telegram / Open WebUI)
                                                    │
                                                    ▼
                     ┌─────────────────────────────────────────────────────────────┐
                     │            J.A.R.V.I.S. SOVEREIGN CLOUD RUNTIME             │
                     │          (https://sri-jarvis.onrender.com — 24/7 Live)      │
                     └──────────────────────────────┬──────────────────────────────┘
                                                    │
     ┌──────────────────────┬───────────────────────┼───────────────────────┬──────────────────────┐
     ▼                      ▼                       ▼                       ▼                      ▼
[Autonomous Daemon]    [DAG Pipeline]      [Virtual Key Vault]     [Obsidian Vault]       [Omni-Tool Gateway]
 (24x7 Cron Engine)   (Multi-Agent DAG)    (429 Key Rotation)     (Markdown Memory)      (Treg / MCP Tools)
     │                      │                       │                       │                      │
     ▼                      ▼                       ▼                       ▼                      ▼
 Nightly Scans        Jarvis: Strategist      Tier 0: Ollama Local     vault/Pipelines/       Web Research
 Morning Briefs       Aegis: Cyber/Dev        Tier 1: Groq LLaMA 3.3   vault/DailyBriefs/     Docx / XLSX / PDF
 System Heartbeats    Raphael: Architecture   Tier 2: OpenRouter Free  vault/Specialists/     GitHub Automation
 Telegram Inbound     Friday: Coordinator     Tier 3: Gemini Flash     vault/Memory/          Terminal Sandboxing
     │                      │                       │                       │                      │
     └──────────────────────┴───────────────────────┼───────────────────────┴──────────────────────┘
                                                    │ Duplex WebSocket & SSE Protocol
                                                    ▼
                     ┌─────────────────────────────────────────────────────────────┐
                     │                 DISTRIBUTED WORKSTATION WORKER              │
                     │                      (Local PC Runtime)                     │
                     ├──────────────────────────────┬──────────────────────────────┤
                     │ • Ollama (Qwen 3 & DeepSeek) │ • Scoped Workspace Sandbox   │
                     │ • Open WebUI Bridge (/v1)    │ • Faster-Whisper Local STT   │
                     │ • Goose CLI Agent Bridge     │ • Kokoro-ONNX Neural TTS     │
                     └──────────────────────────────┴──────────────────────────────┘
```

---

## ⚡ What Makes J.A.R.V.I.S. Fully Autonomous?

1. **24/7 Unbounded Operations Daemon (`AutonomousScheduler.ts`)**:
   Runs continuously in the background without needing human prompts:
   - **02:00 IST**: `NIGHTLY_REPO_INTEGRITY_SCAN` via **Aegis** (audits git tree, runs unit tests, compiles status report).
   - **08:00 IST**: `MORNING_EXECUTIVE_BRIEF` via **Friday** (aggregates market data, server uptime, and sends proactive briefing).
   - **Every 6 Hours**: `SYSTEM_HEALTH_HEARTBEAT` via **Raphael** (prunes expired caches, audits key health and SessionMemoryManager).
2. **Autonomous Multi-Agent Task DAG Engine (`AutonomousPipelineBuilder.ts`)**:
   Decomposes high-level natural language directives into dependent multi-step DAGs. Distributes work across specialized agents, compiles code in sandboxes, and verifies execution.
3. **Bi-Directional Telegram Autonomous Command Interface (`TelegramBotService.ts`)**:
   Enables mobile remote control from anywhere in the world. Securely execute `/run <agent> <directive>` or check `/status` with instant interactive push notifications.
4. **Resilient AI Waterfall & 429 Virtual Key Vault (`ModelRouter.ts`)**:
   Zero-downtime multi-tiered provider failover:
   - **Tier 0**: Local Air-Gapped Ollama (`qwen3:4b`, `deepseek-r1`)
   - **Tier 1**: Groq Ultra-Fast LLaMA 3.3 70B & DeepSeek-R1 Distill
   - **Tier 2**: OpenRouter Free Coding Models (`qwen-2.5-coder-32b-instruct:free`)
   - **Tier 3**: Google Gemini Flash Lite
   *Automatically rotates keys and cools down rate-limited tokens upon receiving HTTP 429 signals.*
5. **Continuous Markdown Memory Graph (`ObsidianVaultManager.ts`)**:
   Synchronizes all agent memories, daily briefs, and execution pipelines directly into `vault/` in plain-text markdown with YAML frontmatter and `[[wikilinks]]`. Point any Obsidian client to `vault/` for visual graph exploration.
6. **Inbound OpenAI Protocol Bridge (`GET /v1/models` & `POST /v1/chat/completions`)**:
   Compatible with third-party developer tools including **Open WebUI** and **Goose CLI**.
7. **Neural Voice & Multi-Agent Duplex Audio (`voiceGateway.ts`)**:
   High-IQ speech recognition, dynamic VAD (Voice Activity Detection), instant conversational barge-in interruption, and distinct neural voices for all specialist agents.

---

## 🤖 The Specialist Agent Roster

| Agent | Call Sign | Domain & Primary Specialty | Neural Voice Engine |
| :--- | :--- | :--- | :--- |
| **J.A.R.V.I.S.** | Grand Commander | Strategic Planning, Task Decomposition, System Coordination | Adam / Orion (`en-GB`) |
| **Aegis** | Cyber Shield | Security Auditing, Sandboxed Shell, Code Compilation, Git | George (`en-US`) |
| **Raphael** | Lord of Wisdom | Deep Logic Reasoning, Architecture Blueprints, Database Ops | Sarah (`en-US`) |
| **Friday** | Executive Recon | Real-Time Intelligence, Telegram Alerts, Document Delivery | Rachel (`en-US`) |
| **Midas** | Revenue Hunter | Quant Analysis, Financial Modeling, Invoice Generation | Antoni (`en-IN`) |
| **Cerebro** | Master Mind | Persistent RAG Retrieval, Research Synthesis, Web Scraping | Sarah (`en-US`) |

---

## 🛠️ Quickstart & Local Setup

### 1. Central Server Setup

```bash
# Clone the repository
git clone https://github.com/Srimani26/Sri-jarvis.git
cd Sri-jarvis

# Install production dependencies
npm install

# Run database synchronization
npm run db:push

# Run full automated test suite (109+ passing tests across all modules)
npm test

# Build client and server bundles
npm run build
npm run build:server

# Start the full-stack server
node server.mjs
```

### 2. Connect Obsidian Vault

Open Obsidian, click **Open folder as vault**, and select `E:\standardroofs-jarvis\vault`. Your system knowledge graph, agent notes, and execution pipelines will appear in real time.

### 3. Connect Open WebUI or Goose CLI

Point any OpenAI-compatible client to J.A.R.V.I.S.:
- **Base URL**: `http://localhost:3005/v1` (or `https://sri-jarvis.onrender.com/v1`)
- **API Key**: `jarvis-sovereign-master`

---

## 🩺 Operational Health & Observability

- `GET /api/health` — Provider health, active models, uptime, and system status.
- `POST /api/voice/self-eval` — Full multi-agent voice, temporal grounding, and thermal self-test.
- `GET /api/voice/speak?text=...&agentId=jarvis` — Direct neural audio synthesis endpoint.
- `POST /api/voice/intent` — Semantic intent and specialist handoff parser.
- `GET /v1/models` — OpenAI-compatible model catalog.

---

## 🧪 Verification & Test Suite

The system includes 109+ passing tests across 24 test suites:

```bash
# Run the complete test suite
npx tsx --test tests/**/*.test.ts
```

Key verified test suites:
- `tests/voice-system-e2e-acceptance.test.ts` (Adaptive VAD, Barge-In, Neural TTS)
- `tests/phase33-openjarvis-voice-agents-self-test.test.ts` (Temporal Truth, Persona Verification)
- `tests/autonomous-daemon-scheduler.test.ts` (24x7 Cron Loops, Lock Mechanisms, Telegram Ops)
- `tests/autonomous-pipeline-builder.test.ts` (Multi-Agent DAG Task Execution)
- `tests/syedmudassir-jarvis-suite.test.ts` (Obsidian, Ollama, Open WebUI, Goose, Whisper)
- `tests/treg-tool-registry.test.ts` (External Tool Registry & Faithful Relay)
- `tests/omni-gateway-integration.test.ts` (Quota Resilience, Zero-Trust Sanitization)

---

## 🔒 Security Principles

1. **Zero-Trust Hygiene**: All keys, postgres credentials, and auth tokens are sanitized before logging or disk persistence.
2. **Fail-Closed Execution**: Tools and departments have strict permission ceilings; unauthorized commands are blocked immediately.
3. **Thermal & Resource Protections**: Dynamic AudioWorklet downsampling and standby sleep when idle.

---

## 📄 License

Licensed under the Apache-2.0 License.
