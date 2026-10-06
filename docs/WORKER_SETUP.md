# J.A.R.V.I.S. MARK-V — Distributed PC Worker Setup

## 1. Quickstart
The worker is located in `workers/jarvis-worker/`.

```bash
# 1. Navigate to worker directory
cd workers/jarvis-worker

# 2. Run local diagnostic audit
npm run doctor

# 3. Check detected capabilities
npm run status

# 4. Start worker daemon (connects to cloud server)
npm run start
```

## 2. Environment Variables
- `JARVIS_SERVER_URL`: URL of cloud orchestrator (default: `https://sri-jarvis.onrender.com`).
- `JARVIS_WORKER_ID`: Unique worker ID (default: hostname-based).
- `JARVIS_WORKER_WORKSPACE`: Sandboxed folder for filesystem operations (default: `E:\JARVIS\workspace`).
- `OLLAMA_BASE_URL`: Local Ollama inference URL (default: `http://localhost:11434`).
