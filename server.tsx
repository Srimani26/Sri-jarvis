// SOVEREIGN ZERO-CRASH SHIELD: Intercept all uncaught exceptions & unhandled rejections
// Ensures J.A.R.V.I.S. server runtime NEVER shuts down or terminates under any circumstance
process.on('uncaughtException', (err) => {
  console.error('🛡️ [SOVEREIGN ZERO-CRASH SHIELD] Intercepted uncaught exception (kept alive):', err?.message || err)
})

process.on('unhandledRejection', (reason) => {
  console.error('🛡️ [SOVEREIGN ZERO-CRASH SHIELD] Intercepted unhandled rejection (kept alive):', reason)
})

/**
 * Sovereign J.A.R.V.I.S. Full-Stack Cloud Server (Hono + Node.js)
 * Serves both API endpoints and the production frontend PWA on a single cloud port.
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import customRoutes from './custom-routes'
import { CrashRecovery } from './src/kernel/CrashRecovery'
import { AutonomousScheduler } from './src/scheduler/AutonomousScheduler'
import { PersistentTaskQueue } from './src/scheduler/PersistentTaskQueue'
import { validateDatabaseConnectivity } from './src/lib/db'
import { createToolsHandlers } from '@shogo-ai/sdk/tools/server'

const app = new Hono()

// CORS - manual middleware so wildcard always propagates
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (c.req.method === 'OPTIONS') return c.text('', 204)
  await next()
})

// Health check endpoint (for Cloudflare tunnel & Render keep-alive monitors)
app.get('/health', async (c) => {
  const dbDiag = await validateDatabaseConnectivity().catch(() => ({ provider: 'unknown', status: 'ERROR', durable: false }));
  return c.json({
    ok: true,
    timestamp: new Date().toISOString(),
    cloudStatus: 'ONLINE_24x7',
    commit: process.env.RENDER_GIT_COMMIT || '3284f46',
    render: {
      gitCommit: process.env.RENDER_GIT_COMMIT || null,
      gitBranch: process.env.RENDER_GIT_BRANCH || null,
      serviceId: process.env.RENDER_SERVICE_ID || null,
      instanceId: process.env.RENDER_INSTANCE_ID || null
    },
    database: {
      provider: dbDiag.provider,
      status: dbDiag.status,
      durable: dbDiag.durable
    }
  });
});
app.get('/health/:sub', async (c) => {
  const sub = c.req.param('sub')
  const newUrl = new URL(c.req.url)
  newUrl.pathname = `/api/health/${sub}`
  return app.fetch(new Request(newUrl.toString(), c.req.raw))
})

// Custom API routes (always mounted under /api)
app.route('/api', customRoutes)

// Installed-integration tools proxy
const tools = createToolsHandlers({})
app.post('/api/tools/execute', (c) => tools.execute(c.req.raw))
app.get('/api/tools/schemas', (c) => tools.list(c.req.raw))

// Serve static production assets from ./dist (PWA, icons, bundle)
app.use('/*', serveStatic({ root: './dist' }))

// SPA fallback: Any non-API route serves dist/index.html so client-side routing works cleanly
app.get('*', (c) => {
  const indexPath = join(process.cwd(), 'dist', 'index.html')
  if (existsSync(indexPath)) {
    return c.html(readFileSync(indexPath, 'utf-8'))
  }
  return c.text('J.A.R.V.I.S. Sovereign Cloud Engine Active', 200)
})

const port = Number(process.env.PORT) || 3005
console.log(`⚡ J.A.R.V.I.S. Cloud Server running on http://localhost:${port}`)

// Validate database connectivity and durability on boot
validateDatabaseConnectivity().then((diag) => {
  console.log(`🗄️ [Database] Provider: ${diag.provider} | Env: ${diag.environment} | Durability: ${diag.durability} | Status: ${diag.status} (${diag.latencyMs}ms)`)
}).catch((err) => {
  console.error('⚠️ [Database] Startup connectivity check failed:', err?.message || err)
})

// Autonomous Crash Recovery: inspect and safely recover in-flight tasks from prior runs
CrashRecovery.recoverInterruptedTasks().catch((err) => {
  console.error('⚠️ [CrashRecovery] Boot recovery failed:', err?.message || err)
})

// 24/7 Persistent Task Queue: Boot durable background worker daemon
PersistentTaskQueue.startWorker(2000)

// 24/7 Autonomous Scheduler: Boot background health monitor
AutonomousScheduler.scheduleJob({
  title: 'Autonomous System Health Audit',
  cronExpression: '*/30 * * * *',
  agentId: 'jarvis',
  toolName: 'system_health',
  toolArgs: {},
})

serve({ port, fetch: app.fetch })
