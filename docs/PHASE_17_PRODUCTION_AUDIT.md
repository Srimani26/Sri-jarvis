# J.A.R.V.I.S. MARK-V — Phase 17 Production Audit

**Audit Date**: October 6, 2026  
**Production URL**: [https://sri-jarvis.onrender.com](https://sri-jarvis.onrender.com)  
**Repository**: [https://github.com/Srimani26/standardroofs-jarvis](https://github.com/Srimani26/standardroofs-jarvis)  
**Audit Target**: Live Cloud Deployment, Container Infrastructure, Networking, Persistence, and API Surfaces

---

## 1. Executive Summary

| Category | Status | Details |
| :--- | :--- | :--- |
| **HTTP Availability** | **LIVE (200 OK)** | Root (`/`) and root `/health` respond with HTTP 200. |
| **Active Cloud Commit** | `bca641f` | Render auto-deploys on push to `origin/main`. `fc7c828` (Phase 16) is committed locally and will be pushed alongside Phase 17. |
| **API Health Endpoint** | **OPERATIONAL** | `/api/health` returns `status: operational`, `uptime: ~530s`, `moa: 6/6 models active`. |
| **Frontend PWA** | **SERVING** | Static assets served from `./dist` via Hono `serveStatic` with SPA fallback. |
| **Database & Persistence** | **EPHEMERAL SQLITE (RISK)** | Free-tier Render container uses `file:./dev.db` on ephemeral disk. Restarts wipe local db. Self-healing schema recovers structure on boot. |
| **Server Runtime** | **HONO + NODE.JS** | Built via esbuild to `server.mjs`, run via `node server.mjs`. |
| **Port Configuration** | **COMPLIANT** | Listens on `process.env.PORT` (Render injects `PORT=10000`). |

---

## 2. Live Network & Endpoint Verification

Direct HTTP probes were conducted against `https://sri-jarvis.onrender.com`:

```
GET /health
HTTP 200 OK
{"ok":true,"timestamp":"2026-10-06T11:10:34.499Z","cloudStatus":"ONLINE_24x7"}

GET /api/health
HTTP 200 OK
{
  "status": "operational",
  "version": "2.0.0-nextgen",
  "ai": { "moa": "6/6 models active" },
  "security": { "rateLimit": "300/min", "bcrypt": "12 rounds", "jwt": "enabled" },
  "uptime": 526.40
}

GET /api/auth/me
HTTP 401 Unauthorized
{"error": "Unauthorized"}

GET /
HTTP 200 OK
<!DOCTYPE html><html lang="en" class="dark">... (Vite SPA HTML rendered cleanly)
```

---

## 3. Render Deployment & Infrastructure Configuration

Inspecting `render.yaml`:
```yaml
services:
  - type: web
    name: sri-jarvis
    runtime: node
    plan: free
    region: singapore
    buildCommand: npm install && npm run build && npm run build:server
    startCommand: node server.mjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Critical Infrastructure Findings:
1. **Ephemeral Filesystem**:
   - Render Free Tier instances do NOT have persistent disks attached.
   - Any write to `./dev.db` is ephemeral and reset upon container restart or deployment.
   - Mitigation implemented in codebase: `ensureDatabaseSchema` in `custom-routes.ts` automatically runs DDL creation on boot so the server boots cleanly without crashing.
   - **Long-term Production Recommendation**: Attach external PostgreSQL (`DATABASE_URL=postgresql://...`) or Render PostgreSQL instance for permanent user & audit history persistence.
2. **Container Compute Constraints**:
   - Free plan provides 512MB RAM and 0.1 CPU core.
   - Heavy operations (such as running local LLM inference via Ollama, headless Chromium with full Playwright, or heavy PyTorch TTS/STT) **CANNOT** run inside this cloud container.
   - **Architectural Solution**: The **Distributed PC Worker** (`workers/jarvis-worker/`) offloads heavy compute, local models (Ollama), real browser automation (Playwright), local STT (Whisper), and local TTS to Sri's workstation while Render handles orchestration, cloud APIs, and state coordination.
3. **Spin-down & Cold Starts**:
   - Render free web services spin down after 15 minutes of inactivity.
   - The `/health` endpoint is configured for external keep-alive pingers to maintain 24/7 uptime.

---

## 4. Subsystem Audits

### 4.1 Security & Protection Shield
- Rate limiter: 300 req/min per IP with in-memory map.
- Security headers: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Content-Security-Policy.
- Uncaught exception shield: Handlers on `uncaughtException` and `unhandledRejection` prevent Node server termination.

### 4.2 Database & Migrations
- Prisma 7 configured in `prisma.config.ts`.
- Database URL fallback: `file:./dev.db`.
- SQLite foreign key constraints enforced in SQLite driver.

### 4.3 Providers & Model Routing
- AI Base URL configurable via `AI_PROXY_URL` / `SHOGO_API_URL` or direct provider API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, etc.).
- Missing keys default cleanly to `NOT_CONFIGURED` without crashing the application.

### 4.4 Worker Subsystem
- `WorkerRegistry` designed and verified locally in Phase 16 (`fc7c828`).
- Deployment on Render will become active once Phase 17 is pushed to `origin/main`.

---

## 5. Deployment Audit Conclusion
The production deployment on Render is **HEALTHY and OPERATIONAL** for its current deployed commit (`bca641f`), serving both frontend assets and API endpoints. The transition to Mark-V Phase 17 will deploy the unified `ResourceRegistry`, legitimate free provider adapters, quota management, and the distributed PC worker coordination endpoints.
