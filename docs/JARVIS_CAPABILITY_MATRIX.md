# J.A.R.V.I.S. MARK-V — Final Capability Matrix

| Capability | Cloud (Render) | PC Worker | Free Available | Paid Supported | Real Implementation | Tested (Automated) | Operational Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LLM Inference** | Yes | Yes | Yes (Gemini/Groq/Ollama) | Yes (Anthropic/OpenAI) | Yes (`ModelRouter`, `adapters/`) | Yes (`phase7`, `phase17`) | Free-first routing with circuit breaker failover |
| **Multimodal Vision** | Yes | Yes | Yes (Gemini 2.5 Flash) | Yes | Yes (`GeminiAdapter.vision`) | Yes (`phase17`) | Scans images and UI screenshots |
| **Speech-to-Text (STT)**| Web API | Yes | Yes (Whisper local) | Yes | Yes (`VoiceEngine`, PC Worker) | Yes (`phase9`, `phase17`) | VAD 2s silence cutoff + local transcription |
| **Text-to-Speech (TTS)**| Web API | Yes | Yes (Piper / Web Speech) | Yes | Yes (`VoiceEngine`, PC Worker) | Yes (`phase9`) | Real-time speech synthesis + barge-in cutoff |
| **Vector Embeddings** | Yes | Yes | Yes (Gemini 004 / Ollama) | Yes | Yes (`RAGPipeline`, `OllamaAdapter`) | Yes (`phase8`, `phase17`) | Chunking with cosine similarity search |
| **Browser Automation** | DOM Scraping| Full Chromium | Yes | Yes | Yes (`BrowserEngine`, Playwright) | Yes (`phase6`, `phase17`) | Offloaded to PC Worker to preserve cloud RAM |
| **Coding Agent** | Yes | Yes | Yes | Yes | Yes (`CodingExecutionLoop`) | Yes (`phase5`) | Search/replace diff patcher with verification |
| **Terminal Execution** | Sandboxed | Yes | Yes | Yes | Yes (`ToolRegistry`, PC Worker) | Yes (`phase4`, `phase17`) | Capability token gated; command allowlist |
| **Filesystem Access** | Yes | Yes | Yes | Yes | Yes (`ToolRegistry`, `WorkerExecutor`)| Yes (`phase4`, `phase17`) | Sandboxed to authorized workspace directory |
| **MCP Integration** | Yes | Yes | Yes | Yes | Yes (`MCPClientManager`) | Yes (`phase4`) | Standard JSON-RPC external tool discovery |
| **Scoped Memory** | Yes | Yes | Yes | Yes | Yes (`MemoryStore`) | Yes (`phase8`) | 4 planes: Profile, History, Fixes, Temporal |
| **Grounding RAG** | Yes | Yes | Yes | Yes | Yes (`RAGPipeline`) | Yes (`phase8`) | Document chunking + citation enforcement |
| **24/7 Scheduler** | Yes | Yes | Yes | Yes | Yes (`AutonomousScheduler`) | Yes (`phase10`, `phase17`) | Deterministic interval/delayed jobs without LLM burn |
| **Self-Repair** | Yes | Yes | Yes | Yes | Yes (`SelfRepairEngine`) | Yes (`phase11-12`) | Error classification + automated patch rollback |
| **Self-Evolution** | Sandboxed | No | Yes | Yes | Yes (`SelfEvolutionEngine`) | Yes (`phase13-15`) | Proposal benchmark sandbox with rollback |
| **Multi-Agent Runtime** | Yes | Yes | Yes | Yes | Yes (`AgentRegistry`, `AgentRuntime`)| Yes (`phase3`) | 20 specialist workforce agents with handoffs |
| **Worker Execution** | Yes (Hub) | Yes (Node) | Yes | Yes | Yes (`WorkerRegistry`, `WorkerClient`)| Yes (`phase17`) | Distributed heartbeat keep-alive & task dispatch |
