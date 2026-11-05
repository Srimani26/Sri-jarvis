import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { swarmOrchestrator } from '../server/src/swarm/engine/SwarmOrchestrator'
import { processManager } from '../server/src/swarm/tools/processManager'
import { previewRoutes } from '../server/src/routes/previewRoutes'
import { FridaySpecialist } from '../server/src/swarm/specialists/FridaySpecialist'

describe('Real Autonomous Swarm Full-Stack Software Engineering Test', () => {
  const directive = 'Build a fullstack fleet vehicle tracker with live REST telemetry, driver shift logs, and alert thresholds.'
  let orchestrationResult: any = null
  let projectSlug = 'fullstack-fleet-vehicle-tracker-live'

  it('Stage 1-6: SwarmOrchestrator should build real fullstack software from natural language', async () => {
    console.log(`\n🚀 [FULLSTACK BUILD START] Directive: "${directive}"`)
    const startTime = Date.now()

    orchestrationResult = await swarmOrchestrator.orchestrateTask(directive, {
      workspaceRoot: process.cwd(),
      onProgress: (stage, message) => {
        console.log(`  📡 [Stage Telemetry] ${stage}: ${message}`)
      }
    })

    const duration = Date.now() - startTime
    console.log(`✅ [FULLSTACK BUILD FINISHED] Duration: ${duration}ms, Success: ${orchestrationResult.success}`)

    assert.strictEqual(orchestrationResult.success, true, 'Orchestration must succeed')
    assert.ok(orchestrationResult.slug, 'Must generate a clean project slug')
    projectSlug = orchestrationResult.slug
    assert.ok(orchestrationResult.previewUrl.includes(`/preview/${projectSlug}`))
    assert.ok(orchestrationResult.previewPath.includes(`/preview/${projectSlug}`))
    assert.ok(existsSync(orchestrationResult.zipPath), 'ZIP archive must exist')
  })

  it('Verification: Dedicated Workspace Directory Tree must have real multi-file architecture', () => {
    const wsRoot = join(process.cwd(), 'workspaces', projectSlug)
    console.log(`\n📂 [INSPECT WORKSPACE] Root: ${wsRoot}`)

    // 1. Database Layer (Cerebro)
    const prismaFile = join(wsRoot, 'prisma', 'schema.prisma')
    assert.ok(existsSync(prismaFile), 'Prisma schema must exist on disk')
    const prismaContent = readFileSync(prismaFile, 'utf-8')
    assert.ok(prismaContent.includes('model Organization'), 'Prisma must have Organization model')
    assert.ok(prismaContent.includes('model User'), 'Prisma must have User model')
    console.log(`  ✓ Cerebro Database Layer verified: schema.prisma (${prismaContent.length} bytes)`)

    // 2. Backend Server & REST API Layer (Aegis)
    const serverFile = join(wsRoot, 'server', 'index.js')
    const routesFile = join(wsRoot, 'server', 'src', 'routes', 'api.js')
    const authFile = join(wsRoot, 'server', 'src', 'middleware', 'auth.js')
    assert.ok(existsSync(serverFile), 'Backend server/index.js must exist')
    assert.ok(existsSync(routesFile), 'Backend routes/api.js must exist')
    assert.ok(existsSync(authFile), 'Backend auth middleware must exist')
    const routesContent = readFileSync(routesFile, 'utf-8')
    assert.ok(routesContent.includes('express.Router()'), 'Routes must define Express router')
    assert.ok(routesContent.includes('/tenant'), 'Routes must have tenant telemetry endpoint')
    console.log(`  ✓ Aegis Backend Layer verified: Express REST routes and RBAC auth`)

    // 3. Frontend UI/UX Layer (Raphael)
    const appJsx = join(wsRoot, 'client', 'src', 'App.jsx')
    const dashboardJsx = join(wsRoot, 'client', 'src', 'components', 'Dashboard.jsx')
    const cssFile = join(wsRoot, 'client', 'src', 'index.css')
    assert.ok(existsSync(appJsx), 'Client App.jsx must exist')
    assert.ok(existsSync(dashboardJsx), 'Client Dashboard.jsx must exist')
    assert.ok(existsSync(cssFile), 'Client index.css must exist')
    console.log(`  ✓ Raphael Frontend Layer verified: React component tree and responsive CSS`)

    // 4. Computation & State Engine Layer (Midas)
    const calcFile = join(wsRoot, 'client', 'src', 'components', 'CalculatorEngine.js')
    assert.ok(existsSync(calcFile), 'CalculatorEngine.js must exist')
    const calcContent = readFileSync(calcFile, 'utf-8')
    assert.ok(calcContent.includes('DOMContentLoaded'), 'Midas engine must initialize state runtime')
    console.log(`  ✓ Midas Computation & State Layer verified: state engine (${calcContent.length} bytes)`)

    // 5. Build Artifact & ZIP Package (Friday)
    const buildZip = orchestrationResult.zipPath
    assert.ok(existsSync(buildZip), 'ZIP deliverable must exist')
    assert.ok(statSync(buildZip).size > 1000, 'ZIP package must contain substantial code')
    console.log(`  ✓ Friday DevOps Layer verified: deliverable.zip (${statSync(buildZip).size} bytes)`)
  })

  it('Verification: Friday QA Contract Integration & Self-Healing Audit', () => {
    assert.ok(orchestrationResult.contractAudit, 'Contract audit must exist')
    assert.strictEqual(orchestrationResult.contractAudit.syntaxValid, true, 'JavaScript syntax must be 100% valid')
    assert.strictEqual(orchestrationResult.contractAudit.passed, true, 'Cross-agent contracts must pass')
    console.log(`\n🔍 [FRIDAY QA GATE] Syntax Valid: ${orchestrationResult.contractAudit.syntaxValid}, Passed: ${orchestrationResult.contractAudit.passed}`)
  })

  it('Verification: Live Process Execution & Dynamic Reverse Proxy Health', async () => {
    // 1. Allocate isolated port and spawn background backend service
    const port = processManager.allocatePort(projectSlug)
    console.log(`\n⚡ [PROCESS RUNNER] Allocated Port: ${port} for slug: ${projectSlug}`)
    assert.ok(port >= 4000 && port <= 4999, 'Port must be in isolated 4000-4999 range')

    const dummyServerScript = 'server/src/dummyBackend.js'
    const fullServerPath = join(process.cwd(), 'workspaces', projectSlug, dummyServerScript)
    
    // Write an executable Node.js HTTP server to simulate the backend service on allocated port
    const { writeFileSync, mkdirSync } = await import('node:fs')
    mkdirSync(join(process.cwd(), 'workspaces', projectSlug, 'server', 'src'), { recursive: true })
    writeFileSync(fullServerPath, `
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', port: ${port}, service: 'fleet-tracker-backend' }));
  } else if (req.url.startsWith('/api/tenant')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ organizationId: 'org-master-sri-001', name: 'Fleet Telemetry Swarm', status: 'ACTIVE' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, url: req.url }));
  }
});
server.listen(${port}, '127.0.0.1', () => console.log('Fleet backend running on port ${port}'));
`)

    const daemon = await processManager.startDaemon(projectSlug, dummyServerScript, port)
    assert.ok(daemon.pid, 'Must have a real process PID')
    await new Promise(r => setTimeout(r, 450))

    // 2. Test live health endpoint through previewRoutes (/projects/:slug/health & /preview/:slug/health)
    const healthReq = new Request(`http://localhost:3005/preview/${projectSlug}/health`)
    const healthRes = await previewRoutes.fetch(healthReq)
    assert.strictEqual(healthRes.status, 200, 'Health endpoint must return 200')
    const healthData = await healthRes.json() as any
    assert.strictEqual(healthData.ok, true)
    assert.strictEqual(healthData.status, 'UP')
    assert.strictEqual(healthData.backend.status.toUpperCase(), 'RUNNING')
    assert.strictEqual(healthData.backend.port, port)
    console.log(`  ✓ Live Health Endpoint verified: 200 OK (PID: ${healthData.backend.pid}, Port: ${healthData.backend.port})`)

    // 3. Test dynamic reverse proxying through /preview/:slug/api/tenant
    const proxyReq = new Request(`http://localhost:3005/preview/${projectSlug}/api/tenant`)
    const proxyRes = await previewRoutes.fetch(proxyReq)
    assert.strictEqual(proxyRes.status, 200, 'Dynamic reverse proxy must return 200')
    const tenantData = await proxyRes.json() as any
    assert.strictEqual(tenantData.organizationId, 'org-master-sri-001')
    assert.strictEqual(tenantData.status, 'ACTIVE')
    console.log(`  ✓ Dynamic Reverse Proxy verified: /preview/${projectSlug}/api/tenant -> forwarded to http://127.0.0.1:${port}`)

    // 4. Test live client preview serving with injected design harness
    const clientReq = new Request(`http://localhost:3005/preview/${projectSlug}`)
    const clientRes = await previewRoutes.fetch(clientReq)
    assert.strictEqual(clientRes.status, 200, 'Preview must return 200 OK')
    const html = await clientRes.text()
    assert.ok(html.includes('cdn.tailwindcss.com'), 'Must have Tailwind CSS harness')
    assert.ok(html.includes('lucide'), 'Must have Lucide icons harness')
    assert.ok(html.includes('leaflet'), 'Must have Leaflet map harness')
    assert.ok(html.includes('chart.js'), 'Must have Chart.js harness')
    assert.ok(html.includes('app.js'), 'Must load Midas state engine script')
    console.log(`  ✓ Live Web Preview verified: HTTP 200 OK with complete interactive design system harness`)

    // Clean up spawned process
    processManager.stopAppProcess(projectSlug)
    console.log(`  ✓ Background daemon stopped cleanly.`)
  })
})
