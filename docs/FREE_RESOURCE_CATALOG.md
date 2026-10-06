# J.A.R.V.I.S. MARK-V — Free & Legitimate Resource Catalog

**Catalog Date**: October 2026  
**Engineering Directive**: Only legitimate, officially documented, developer-accessible free tiers and open-source local resources are approved. Zero unauthorized, leaked, or abusive methods.

---

## 1. Provider Comparison Matrix

| Provider | Status | Official Free Tier | Models | RPM / Rate Limits | Context | Vision | Tools | Embeddings | Auth Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Local Ollama** | Available | 100% Free / Unlimited | Llama 3, Mistral, Qwen2.5-Coder, Nomic | Hardware Bound | Up to 128k | Yes (LLaVA) | Yes | Yes | None / Localhost |
| **Google Gemini API** | Available | Yes (Google AI Studio) | Gemini 2.5 Flash, 2.5 Flash-Lite | 15 RPM / 1M TPM / 1500 RPD | 1,048,576 | Yes | Yes | Yes (004) | `GEMINI_API_KEY` (Header / Query) |
| **Groq Cloud** | Available | Yes (Developer Free) | Llama 3.3 70B, Llama 3.1 8B | 30 RPM / 14,400 RPD | 8,192 – 128k | Yes | Yes | No | `GROQ_API_KEY` (`Bearer`) |
| **OpenRouter** | Available | Yes (`:free` suffix) | Llama 3.2 3B, Mistral 7B, DeepSeek R1 | 20 RPM / 200 RPD | 32,768 | Varies | Varies | No | `OPENROUTER_API_KEY` (`Bearer`) |
| **Hugging Face Serverless**| Available | Yes (Free User Token) | DeepSeek, Qwen, Mistral | Fair-use queue | Varies | Yes | No | Yes | `HUGGINGFACE_API_KEY` (`Bearer`) |
| **Cerebras Cloud** | Available | Yes (Free Tier) | Llama 3.1 8B, Llama 3.3 70B | 30 RPM / 1M tokens/day | 8,192 | No | Yes | No | `CEREBRAS_API_KEY` (`Bearer`) |
| **Cloudflare Workers AI** | Available | Yes (10k Neurons/day) | Llama 3.2, Whisper, BGE Small | 10,000 neurons / day | 8,192 | Yes | Yes | Yes | `CLOUDFLARE_API_TOKEN` |

---

## 2. Deep-Dive Provider Specifications

### 2.1 Local Ollama (Primary Sovereign Local Resource)
- **API URL**: `http://localhost:11434/api`
- **Supported Capabilities**:
  - LLM: `llama3`, `mistral`, `qwen2.5-coder:7b`
  - Embeddings: `nomic-embed-text` (768 dimensions), `bge-small`
  - Vision: `llava:7b`
- **Rate Limits**: Zero rate limits; limited only by client PC GPU VRAM and CPU cores.
- **Privacy**: Local-only (`LOCAL_ONLY`). No telemetry or network egress.
- **Role in JARVIS**: Default execution target for privacy-sensitive tasks, local code audits, and zero-cost background workloads executed by the PC Worker.

### 2.2 Google Gemini API (AI Studio Developer Tier)
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Recommended Free Models**:
  - `gemini-2.5-flash`: High-speed general inference, coding, vision, long-context reasoning.
  - `gemini-2.5-flash-lite`: Ultra-low latency categorization and agent dispatch.
  - `text-embedding-004`: Vector representations for RAG and semantic memory.
- **Limits**:
  - 15 Requests Per Minute (RPM)
  - 1,000,000 Tokens Per Minute (TPM)
  - 1,500 Requests Per Day (RPD)
- **Authentication**: `GEMINI_API_KEY` passed via query parameter or `x-goog-api-key` header.
- **Role in JARVIS**: Preferred high-context cloud reasoning and multimodal document/image inspection.

### 2.3 Groq Cloud (Ultra-Fast Developer Tier)
- **API Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Recommended Free Models**:
  - `llama-3.3-70b-versatile`
  - `llama-3.1-8b-instant`
- **Limits**:
  - 30 RPM
  - 14,400 Requests Per Day
- **Latency**: ~150–250ms time-to-first-token.
- **Authentication**: `GROQ_API_KEY` via `Authorization: Bearer <key>` header.
- **Role in JARVIS**: Real-time tool-calling decisions, fast agent loops, voice interaction responses.

### 2.4 OpenRouter Free Gateway
- **API Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Recommended Models**:
  - `meta-llama/llama-3.2-3b-instruct:free`
  - `deepseek/deepseek-r1:free`
- **Limits**: 20 requests/minute, subject to community traffic.
- **Authentication**: `OPENROUTER_API_KEY` via `Authorization: Bearer <key>`.
- **Role in JARVIS**: Resilient fallback provider when other free quotas are exhausted.

---

## 3. Local Hardware-Accelerated Resources (PC Worker)

### 3.1 Speech-to-Text (STT)
- **Engine**: Whisper (`whisper.cpp` / `faster-whisper`)
- **Cost**: $0.00 (Self-hosted on PC Worker)
- **Latency**: ~200-400ms for short voice utterances
- **RAM Footprint**: ~150MB (base.en / tiny.en)

### 3.2 Text-to-Speech (TTS)
- **Engine**: Piper / Kokoro / Browser Web Speech API
- **Cost**: $0.00
- **Latency**: <100ms real-time audio chunk generation
- **RAM Footprint**: ~100MB

### 3.3 Headless Browser Automation
- **Engine**: Playwright / Chromium
- **Cost**: $0.00
- **Capabilities**: Full DOM inspection, screenshot capture, interactive click/type navigation.
- **Execution Scoping**: Scoped to client workstation PC Worker to avoid Render memory limits.

---

## 4. Quota Governance & Fallback Hierarchy

```
1. LOCAL WORKER (Ollama / Playwright / Whisper / Piper)
   └─ If offline / insufficient VRAM ───►
2. OFFICIAL FREE APIS (Gemini 2.5 Flash / Groq LPU)
   └─ If 429 Rate Limited ───►
3. FREE ROUTER FALLBACK (OpenRouter :free models)
   └─ If exhausted ───►
4. LOW-COST / USER-AUTHORIZED PAY-AS-YOU-GO
```

All credentials reside strictly server-side in environment variables and are never surfaced in client responses, logs, or mission dossiers.
