# J.A.R.V.I.S. MARK-V — Providers Architecture

## 1. Supported Providers
1. **Local Ollama**: 100% private, self-hosted LLM & embedding engine at `http://localhost:11434`.
2. **Google Gemini API**: Official Google AI Studio free tier via `GEMINI_API_KEY`.
3. **Groq Cloud**: High-speed LPU free developer tier via `GROQ_API_KEY`.
4. **OpenRouter**: Gateway to community free-tier models via `OPENROUTER_API_KEY`.
5. **Hugging Face Serverless**: Community embedding and open models via `HUGGINGFACE_API_KEY`.
6. **Anthropic & OpenAI**: User-provided authorized keys for premium models when explicitly requested.

## 2. Credential Security Rules
- If an API key is missing: `authStatus: 'NOT_CONFIGURED'`. This is a normal state, never a crash or application error.
- Credentials remain strictly server-side.
- Zero credentials appear in logs, client JSON, SSE streams, or git commits.
- Zero credential scraping or unauthorized tokens are permitted.
