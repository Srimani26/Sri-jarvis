# J.A.R.V.I.S. MARK-V — Production Deployment & Hardening

## 1. Cloud Production Architecture
- **Host**: Render Web Service (`https://sri-jarvis.onrender.com`)
- **Region**: Singapore
- **Runtime**: Node.js 22+ (Hono ESM server `server.mjs`)
- **Port**: Dynamically configured via `PORT` environment variable (`10000` on Render, fallback `3005` locally).

## 2. Hardening Measures
1. **Zero-Crash Exception Shield**: `uncaughtException` and `unhandledRejection` handlers in `server.tsx` intercept unexpected rejections, preventing unhandled termination.
2. **Crash Recovery on Boot**: `CrashRecovery.recoverInterruptedTasks()` audits SQLite task store on every server startup, automatically recovering interrupted jobs.
3. **Database Self-Healing**: `ensureDatabaseSchema()` inspects database tables on boot and automatically restores any missing schema DDL without manual migrations.
4. **Rate Limiting & Security Headers**: Strict 300 req/min rate limiter with HSTS, X-Content-Type-Options: nosniff, and Content-Security-Policy.

## 3. Ephemeral Storage Risk & PostgreSQL Path
- On Render free tier, `./dev.db` resides on an ephemeral container filesystem.
- Restarts and deployments reset local SQLite files.
- **Production Persistence Solution**: Provide `DATABASE_URL=postgresql://user:pass@host:5432/dbname` in Render Environment Variables. Prisma 7 automatically adapts connection pooling.
