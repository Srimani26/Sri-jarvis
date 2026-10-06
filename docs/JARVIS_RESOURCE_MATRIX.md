# J.A.R.V.I.S. MARK-V — Final Resource Matrix

| Resource ID | Resource Type | Provider | Free Tier? | Configured? | Healthy? | Capabilities | Latency | Fallback Target | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `res-model-ollama-llama3` | MODEL | ollama | Yes (100%) | Yes | Dynamic | `fast`, `tools`, `coding` | ~120ms | `res-model-groq-llama3-70b` | Local workstation inference via localhost:11434 |
| `res-model-gemini-2.5-flash` | MODEL | gemini | Yes | Yes (Key) | Yes | `fast`, `vision`, `tools`, `coding`, `reasoning` | ~380ms | `res-model-groq-llama3-70b` | 1M token context window, multimodal vision |
| `res-model-groq-llama3-70b` | MODEL | groq | Yes | Yes (Key) | Yes | `fast`, `coding`, `tools`, `reasoning` | ~210ms | `res-model-openrouter-free` | Ultra-fast LPU inference (30 RPM free) |
| `res-model-openrouter-free` | MODEL | openrouter | Yes | Yes (Key) | Yes | `fast`, `coding` | ~450ms | `res-model-gemini-2.5-flash` | Community free models gateway |
| `res-browser-playwright-local`| BROWSER | pc-worker | Yes (100%) | Yes | Yes | `dom_snapshot`, `interactive_navigation`, `screenshots` | ~600ms | DOM Emulation | Real Chromium browser on PC worker |
| `res-stt-whisper-local` | STT | pc-worker | Yes (100%) | Yes | Yes | `audio_transcription`, `realtime_stt` | ~350ms | Browser Web Speech | Local Whisper speech-to-text |
| `res-tts-piper-local` | TTS | pc-worker | Yes (100%) | Yes | Yes | `audio_synthesis`, `zero_latency_speech` | ~80ms | Browser Web Speech | Offline neural text-to-speech engine |
| `res-embedding-nomic-local` | EMBEDDING | ollama | Yes (100%) | Yes | Dynamic | `vector_embedding`, `similarity_search` | ~40ms | Gemini Embedding 004 | Local vector embeddings cached in SQLite |
| `res-compute-pc-worker` | WORKER | pc-worker | Yes (100%) | Yes | Yes | `LOCAL_LLM`, `LOCAL_BROWSER`, `WORKSPACE_FILES`, `TERMINAL`, `LOCAL_STT`, `LOCAL_TTS` | ~15ms | Cloud Sandbox | Distributed CLI worker daemon on workstation |
| `res-compute-cloud-render` | COMPUTE | render | Yes | Yes | Yes | `api_gateway`, `scheduler`, `task_store`, `sse_stream`, `mcp_bridge` | ~25ms | Local Hono Server | 24/7 central cloud orchestration node |
