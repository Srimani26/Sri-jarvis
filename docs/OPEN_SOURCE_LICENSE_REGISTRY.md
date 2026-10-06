# J.A.R.V.I.S. MARK-V — Open-Source License & Attribution Registry

**Registry Version**: 1.0 (Phase 17)  
**Compliance Policy**: Complete adherence to Open Source Initiative (OSI) approved licenses, preservation of copyright notices, and formal recording of architectural adaptations.

---

## 1. Compliance Matrix

| Project | License | Source Repository | Version / Commit | Decision | Files Affected / Adapted | Attribution Notice |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Context Protocol (MCP)** | MIT | `modelcontextprotocol/typescript-sdk` | v1.32.0 | ADAPT | `src/mcp/MCPClientManager.ts` | Copyright (c) Anthropic, PBC. |
| **Hono Web Framework** | MIT | `honojs/hono` | v4.x | IMPORT | `server.tsx`, `custom-routes.ts` | Copyright (c) 2021 - present, Yusuke Wada |
| **Prisma ORM** | Apache-2.0 | `prisma/prisma` | v7.3.0 | IMPORT | `prisma/`, `src/lib/db.ts` | Copyright (c) Prisma Data, Inc. |
| **Ollama Inference Engine** | MIT | `ollama/ollama` | v0.5.x | ADAPT | `src/providers/adapters/OllamaAdapter.ts`, `workers/jarvis-worker/` | Copyright (c) Ollama Authors |
| **Playwright Automation** | Apache-2.0 | `microsoft/playwright` | v1.4x | ADAPT | `src/browser/BrowserEngine.ts`, `workers/jarvis-worker/` | Copyright (c) Microsoft Corporation |
| **OpenHands** | MIT | `All-Hands-AI/OpenHands` | v0.18.0 | INSPIRE | `src/coding/CodingExecutionLoop.ts` | Copyright (c) All-Hands-AI |
| **Whisper (Speech-to-Text)** | MIT | `openai/whisper` | v20231117 | ADAPT | `src/voice/VoiceEngine.ts`, `workers/jarvis-worker/` | Copyright (c) OpenAI |
| **Piper TTS** | MIT | `rhasspy/piper` | v1.2.0 | INSPIRE | `src/voice/VoiceEngine.ts` | Copyright (c) Michael Hansen |
| **Groq SDK Patterns** | MIT | `groq/groq-typescript` | v0.7.0 | ADAPT | `src/providers/adapters/GroqAdapter.ts` | Copyright (c) Groq, Inc. |
| **Google GenAI SDK Patterns** | Apache-2.0 | `google-gemini/generative-ai-js` | v0.21.0 | ADAPT | `src/providers/adapters/GeminiAdapter.ts` | Copyright (c) Google LLC |

---

## 2. Adaptation Details & Modifications

### 2.1 Model Context Protocol (MCP) TypeScript SDK
- **License**: MIT
- **Adapted Pattern**: Tool discovery over stdio/HTTP JSON-RPC and schemas.
- **Modifications**: Integrated with JARVIS `ExecutionKernel` capability shield and permission validation; tool execution requests are governed by capability tokens.

### 2.2 Ollama API Contract
- **License**: MIT
- **Adapted Pattern**: REST protocol over `http://localhost:11434` for tags, completions, and embeddings.
- **Modifications**: Wrapped in `OllamaAdapter` with resilient offline detection, zero-crash handling, and quota manager integration.

### 2.3 Browser Automation (Playwright / Chromium)
- **License**: Apache-2.0
- **Adapted Pattern**: Headless browser control, DOM sanitization, snapshot extraction.
- **Modifications**: Offloaded to `workers/jarvis-worker/` so Render free-tier container memory is never overwhelmed; scoped to allowed URLs with prompt-injection defense.

### 2.4 Voice Processing (Whisper / Piper)
- **License**: MIT
- **Adapted Pattern**: Real-time turn-taking, 2s VAD cutoff, local STT/TTS fallback.
- **Modifications**: Integrated with `VoiceEngine.ts` and barge-in architecture.

---

## 3. License Texts & Warranties

All adapted third-party code retains its original copyrights. The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
