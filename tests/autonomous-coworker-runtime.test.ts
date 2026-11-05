/**
 * autonomous-coworker-runtime.test.ts
 *
 * Validates:
 * 1. Dedicated Workspace Scaffolder:
 *    - Provisions workspaces/${slug}/ with discrete client, server, and prisma directory trees.
 *    - Verifies presence of package.json, vite.config.js, App.jsx, app.js, schema.prisma.
 *    - Validates atomic file write and patch operations.
 * 2. Process Manager & Port Allocator:
 *    - Executes CLI tasks via runCommand.
 *    - Spawns background Node processes on internal ports in the 4000-4999 range.
 *    - Tracks PID lifecycle and logs.
 *    - Gracefully stops processes via stopAppProcess.
 * 3. Dynamic Reverse Proxy & Health Endpoint:
 *    - Verifies /projects/${slug}/health response structure.
 */

import { describe, it, after } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { workspaceManager } from '../server/src/swarm/tools/workspaceManager'
import { processManager } from '../server/src/swarm/tools/processManager'
import { previewRoutes } from '../server/src/routes/previewRoutes'
import { FridaySpecialist } from '../server/src/swarm/specialists/FridaySpecialist'
import { raphaelSpecialist } from '../server/src/swarm/specialists/RaphaelSpecialist'
import { midasSpecialist } from '../server/src/swarm/specialists/MidasSpecialist'
import { ProjectBlueprint } from '../server/src/swarm/types/blueprint'

describe('Phase 2 Autonomous Co-Worker Runtime & Scaffolder Suite', () => {
  const testSlug = `test-solar-saas-${Date.now().toString().slice(-4)}`
  const testDir = path.resolve(process.cwd(), 'workspaces', testSlug)

  after(() => {
    // Clean up test workspace and processes
    processManager.stopAppProcess(testSlug)
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true })
      } catch {}
    }
  })

  describe('Criterion 1: Dedicated Workspace Directory Scaffolding', () => {
    it('should provision discrete client, server, and prisma trees for FULLSTACK_SAAS', () => {
      const manifest = workspaceManager.provisionWorkspace(testSlug, 'FULLSTACK_SAAS')

      assert.strictEqual(manifest.slug, testSlug)
      assert.strictEqual(manifest.scope, 'FULLSTACK_SAAS')
      assert.ok(fs.existsSync(testDir), 'Workspace root directory must exist')

      // Check root files
      assert.ok(fs.existsSync(path.join(testDir, 'package.json')), 'Root package.json must exist')

      // Check client tree
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'package.json')), 'client/package.json must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'vite.config.js')), 'client/vite.config.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'main.jsx')), 'client/src/main.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'App.jsx')), 'client/src/App.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'index.css')), 'client/src/index.css must exist')

      // Check server tree
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'package.json')), 'server/package.json must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'index.js')), 'server/index.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'src', 'app.js')), 'server/src/app.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'routes', 'api.js')), 'server/routes/api.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'src', 'routes', 'api.js')), 'server/src/routes/api.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'server', 'src', 'middleware', 'auth.js')), 'server/src/middleware/auth.js must exist')

      // Check discrete modular components (Step 2)
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'Navbar.jsx')), 'Navbar.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'Sidebar.jsx')), 'Sidebar.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'MetricCards.jsx')), 'MetricCards.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'DataMap.jsx')), 'DataMap.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'DataTable.jsx')), 'DataTable.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'components', 'ActionModal.jsx')), 'ActionModal.jsx must exist')

      // Check discrete modular pages (Step 2)
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'pages', 'Overview.jsx')), 'Overview.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'pages', 'Analytics.jsx')), 'Analytics.jsx must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'src', 'pages', 'Settings.jsx')), 'Settings.jsx must exist')

      // Check prisma tree
      assert.ok(fs.existsSync(path.join(testDir, 'prisma', 'schema.prisma')), 'prisma/schema.prisma must exist')
    })

    it('should support atomic file writing and patching on disk', () => {
      // Write custom file
      const customCode = 'console.log("Aegis Specialist Endpoint")'
      workspaceManager.writeWorkspaceFile(testSlug, 'server/src/routes/custom.js', customCode)

      const readBack = workspaceManager.readWorkspaceFile(testSlug, 'server/src/routes/custom.js')
      assert.strictEqual(readBack?.trim(), customCode)

      // Patch file
      workspaceManager.patchWorkspaceFile(testSlug, 'server/src/routes/custom.js', prev => `${prev}\n// Patched`)
      const patched = workspaceManager.readWorkspaceFile(testSlug, 'server/src/routes/custom.js')
      assert.ok(patched?.includes('// Patched'))
    })
  })

  describe('Criterion 2: Subprocess Execution & Isolated Port Allocation', () => {
    it('should execute CLI commands via runCommand', async () => {
      const res = await processManager.runCommand('node -e "console.log(\'COWORKER_READY\')"', process.cwd())
      assert.strictEqual(res.exitCode, 0)
      assert.ok(res.stdout.includes('COWORKER_READY'))
    })

    it('should allocate unique ports in the 4000-4999 range', () => {
      const port1 = processManager.allocatePort('app1')
      const port2 = processManager.allocatePort('app2')

      assert.ok(port1 >= 4000 && port1 <= 4999)
      assert.ok(port2 >= 4000 && port2 <= 4999)
      assert.notStrictEqual(port1, port2)
    })

    it('should execute workspace shell command via executeShell', async () => {
      const res = await processManager.executeShell(testSlug, 'node -e "console.log(12345)"')
      assert.strictEqual(res.exitCode, 0)
      assert.ok(res.stdout.includes('12345'))
    })

    it('should spawn background daemon via startDaemon and track lifecycle', async () => {
      const daemonPort = processManager.allocatePort(testSlug)
      // Create minimal server entrypoint
      const dummyEntrypoint = 'server/src/dummyServer.js'
      workspaceManager.writeWorkspaceFile(
        testSlug,
        dummyEntrypoint,
        `const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', port: ${daemonPort} }));
  } else {
    res.writeHead(200);
    res.end('OK');
  }
});
server.listen(${daemonPort}, () => console.log('Daemon running on ${daemonPort}'));`
      )

      const daemon = await processManager.startDaemon(testSlug, dummyEntrypoint, daemonPort)
      assert.strictEqual(daemon.status, 'running')
      assert.strictEqual(daemon.port, daemonPort)
      assert.ok(daemon.pid > 0)

      // Query health endpoint directly
      await new Promise(r => setTimeout(r, 400))
      const res = await fetch(`http://127.0.0.1:${daemonPort}/health`)
      assert.strictEqual(res.status, 200)
      const data = await res.json() as any
      assert.strictEqual(data.status, 'UP')

      // Stop daemon
      const stopped = processManager.stopAppProcess(testSlug)
      assert.strictEqual(stopped, true)
    })

    it('should spawn a background process and track its PID lifecycle', async () => {
      // Spawn a harmless background sleep script simulating backend server
      const proc = processManager.spawnAppProcess(
        testSlug,
        'node -e "setInterval(() => {}, 1000)"',
        undefined,
        testDir
      )

      assert.ok(proc.pid > 0)
      assert.ok(proc.port >= 4000 && proc.port <= 4999)
      assert.strictEqual(proc.status, 'running')

      const info = processManager.getProcessInfo(testSlug)
      assert.strictEqual(info?.status, 'running')
      assert.strictEqual(info?.port, proc.port)

      // Stop process
      const stopped = processManager.stopAppProcess(testSlug)
      assert.strictEqual(stopped, true)
      assert.strictEqual(processManager.getProcessInfo(testSlug), undefined)
    })
  })

  describe('Criterion 3: Dynamic Reverse Proxy & Health Endpoint', () => {
    it('should expose /projects/:slug/health with live UI and backend status', async () => {
      const req = new Request(`http://localhost:3005/projects/${testSlug}/health`)
      const res = await previewRoutes.fetch(req)

      assert.strictEqual(res.status, 200)
      const data = await res.json() as any

      assert.strictEqual(data.ok, true)
      assert.strictEqual(data.slug, testSlug)
      assert.strictEqual(data.status, 'UP')
      assert.strictEqual(data.ui.status, 'READY')
      assert.ok('backend' in data)
    })

    it('should serve client index.html from /projects/:slug with injected high-fidelity design harness', async () => {
      const req = new Request(`http://localhost:3005/projects/${testSlug}`)
      const res = await previewRoutes.fetch(req)

      assert.strictEqual(res.status, 200)
      const text = await res.text()
      assert.ok(text.includes('html'))
      // Verify design system harness injection
      assert.ok(text.includes('cdn.tailwindcss.com'), 'Must inject Tailwind CDN')
      assert.ok(text.includes('lucide'), 'Must inject Lucide icons')
      assert.ok(text.includes('chart.js'), 'Must inject Chart.js library')
      assert.ok(text.includes('leaflet'), 'Must inject Leaflet maps library')
    })

    it('should verify active service health and substance via FridaySpecialist gate', async () => {
      const friday = FridaySpecialist.getInstance()
      // First verify without background server running (should verify files)
      const resultNoPort = await friday.verifyActiveServiceHealth({ slug: testSlug })
      assert.strictEqual(resultNoPort.verified, true)
      assert.ok(resultNoPort.filesChecked.length > 0)
      assert.strictEqual(resultNoPort.clientVerified, true)

      // Next verify with active server port returning 200
      const port = processManager.allocatePort(testSlug)
      const daemon = await processManager.startDaemon(testSlug, 'server/src/dummyServer.js', port)
      await new Promise(r => setTimeout(r, 400))

      const resultWithPort = await friday.verifyActiveServiceHealth({ slug: testSlug, port })
      assert.strictEqual(resultWithPort.verified, true)
      assert.strictEqual(resultWithPort.healthCheckPassed, true)

      processManager.stopAppProcess(testSlug)
    })
  })

  describe('Criterion 4: Standalone React 18 & Full Interactive State Runtime', () => {
    it('should inject standalone React 18, ReactDOM 18, and Babel Standalone into preview <head>', async () => {
      const req = new Request(`http://localhost:3005/projects/${testSlug}`)
      const res = await previewRoutes.fetch(req)

      assert.strictEqual(res.status, 200)
      const text = await res.text()
      assert.ok(text.includes('react@18/umd/react.production.min.js'), 'Must inject React 18 CDN')
      assert.ok(text.includes('react-dom@18/umd/react-dom.production.min.js'), 'Must inject ReactDOM 18 CDN')
      assert.ok(text.includes('@babel/standalone/babel.min.js'), 'Must inject Babel Standalone CDN')
    })

    it('should augment preview HTML with React runtime via FridaySpecialist.injectReactRuntime', () => {
      const rawHtml = '<!DOCTYPE html><html><head><title>App</title></head><body><div id="root"></div></body></html>'
      const augmented = FridaySpecialist.getInstance().injectReactRuntime(rawHtml)

      assert.ok(augmented.includes('react@18/umd/react.production.min.js'))
      assert.ok(augmented.includes('react-dom@18/umd/react-dom.production.min.js'))
      assert.ok(augmented.includes('@babel/standalone/babel.min.js'))
      assert.ok(augmented.includes('</head>'))
    })

    it('should scaffold complete interactive controls in Raphael HTML layout', () => {
      const dummyBlueprint: ProjectBlueprint = {
        directive: 'Commercial Solar Asset Manager',
        name: 'Solar Manager Pro',
        slug: 'solar-manager-pro',
        scope: 'FULLSTACK_SAAS',
        database: {} as any,
        backend: {} as any,
        frontend: {
          colorPalette: 'slate-cyan',
          typography: 'Inter',
          components: ['Sidebar', 'KpiCards', 'Table', 'Modal'],
          breakpoints: { mobile: '48px', tablet: '768px', desktop: '1280px' }
        },
        businessLogic: {} as any,
        qaContracts: {} as any
      }

      const html = raphaelSpecialist.generateHtmlLayout(dummyBlueprint)

      // Verify React and Babel CDN scripts
      assert.ok(html.includes('react@18'))
      assert.ok(html.includes('babel.min.js'))

      // Verify interactive controls exist
      assert.ok(html.includes('id="table-search"'), 'Search filter input must exist')
      assert.ok(html.includes('id="filter-all"'), 'Filter all button must exist')
      assert.ok(html.includes('id="filter-active"'), 'Filter active button must exist')
      assert.ok(html.includes('id="filter-alert"'), 'Filter alert button must exist')
      assert.ok(html.includes('id="filter-idle"'), 'Filter idle button must exist')
      assert.ok(html.includes('id="open-modal-btn"'), 'Open modal button must exist')
      assert.ok(html.includes('id="close-modal-btn"'), 'Close modal button must exist')
      assert.ok(html.includes('id="settings-modal"'), 'Settings modal must exist')
      assert.ok(html.includes('id="record-form"'), 'Record form must exist')
      assert.ok(html.includes('id="nav-dashboard"'), 'Nav items must have IDs')
    })

    it('should generate interactive event handlers and state mutation logic in Midas engine', () => {
      const dummyBlueprint: ProjectBlueprint = {
        directive: 'Fleet Vehicle Tracker',
        name: 'Fleet Pro',
        slug: 'fleet-pro',
        scope: 'FULLSTACK_SAAS',
        database: {} as any,
        backend: {} as any,
        frontend: {} as any,
        businessLogic: {
          pricingTiers: ['Starter', 'Pro', 'Enterprise'],
          formulas: ['payback', 'degradation'],
          currency: 'USD'
        },
        qaContracts: {} as any
      }

      const js = midasSpecialist.generateComputationEngine(dummyBlueprint)

      // Verify interactive listeners
      assert.ok(js.includes('table-search'), 'Must bind table search')
      assert.ok(js.includes('filter-active'), 'Must bind filter buttons')
      assert.ok(js.includes('settings-modal'), 'Must bind modal interactions')
      assert.ok(js.includes('record-form'), 'Must handle form submission')
      assert.ok(js.includes('updateChart'), 'Must provide dynamic Chart.js updating')
      assert.ok(js.includes('export-csv-btn'), 'Must bind CSV download')
      assert.ok(js.includes('export-pdf-btn'), 'Must bind PDF print')
    })
  })

  describe('Criterion 5: Real Compiler & Self-Healing Loop (Friday)', () => {
    it('should execute real compilation pass into client/dist/bundle.js and client/dist/index.html', async () => {
      const friday = FridaySpecialist.getInstance()
      const compileRes = await friday.executeCompilerSelfHealingLoop(testSlug)

      assert.strictEqual(compileRes.success, true, 'Compilation must succeed')
      assert.strictEqual(compileRes.distCreated, true, 'Must produce dist/index.html')
      assert.ok(compileRes.attempts >= 1)
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'dist', 'bundle.js')), 'dist/bundle.js must exist')
      assert.ok(fs.existsSync(path.join(testDir, 'client', 'dist', 'index.html')), 'dist/index.html must exist')
    })

    it('should serve compiled Vite/esbuild distribution from /projects/:slug', async () => {
      const req = new Request(`http://localhost:3005/projects/${testSlug}`)
      const res = await previewRoutes.fetch(req)

      assert.strictEqual(res.status, 200)
      const text = await res.text()
      assert.ok(text.includes('html'))
      // Verify bundle reference or html structure
      assert.ok(text.includes('bundle.js') || text.includes('root') || text.includes('App'))
    })
  })
})

