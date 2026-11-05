/**
 * workspace-process-runtime.test.ts
 *
 * Validates:
 * 1. Dedicated Multi-File Workspace Scaffolding:
 *    - Generates complete directory structure at workspaces/${slug}/:
 *      package.json, public/index.html, client/src/App.jsx, client/src/main.jsx,
 *      client/src/styles.css, client/vite.config.js, server/index.js,
 *      server/routes/telemetry.js, server/db.js, prisma/schema.prisma.
 * 2. Process Manager Subprocess Runner & Port Allocation:
 *    - executeCommand(cmd, cwd): executes commands and returns stdout, stderr, exitCode.
 *    - startService(slug, command, args, port): allocates port in 4000-4999 pool, tracks PID & logs.
 *    - stopService(slug): terminates child process and recycles allocated port.
 * 3. Dynamic Reverse Proxy & Friday Health Gate:
 *    - /projects/:slug/health returns { status: 'UP', pid, port, uptime, memory, client: { status: 'READY' } }.
 *    - fridaySpecialist.verifyActiveServiceHealth({ slug, port, workspaceRoot }) validates files and process health.
 */

import { describe, it, after } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { workspaceManager } from '../server/src/swarm/tools/workspaceManager'
import { processManager } from '../server/src/swarm/tools/processManager'
import { previewRoutes } from '../server/src/routes/previewRoutes'
import { fridaySpecialist } from '../server/src/swarm/specialists/FridaySpecialist'

describe('Autonomous Co-Worker Runtime & Process Execution Sandbox Suite', () => {
  const testSlug = 'test-fleet-tracker-runtime'
  const workspaceRoot = workspaceManager.getWorkspaceRoot(testSlug)

  after(async () => {
    processManager.stopService(testSlug)
    await new Promise(r => setTimeout(r, 300))
    try {
      if (fs.existsSync(workspaceRoot)) {
        fs.rmSync(workspaceRoot, { recursive: true, force: true, maxRetries: 3 })
      }
    } catch {}
  })

  describe('Criterion 1: Dedicated Multi-File Project Layout', () => {
    it('should provision exact enterprise workspace directory structure', () => {
      const manifest = workspaceManager.provisionWorkspace(testSlug, 'FULLSTACK_SAAS')
      assert.strictEqual(manifest.slug, testSlug)
      assert.ok(fs.existsSync(manifest.workspaceRoot))

      const requiredFiles = [
        'package.json',
        'public/index.html',
        'client/src/App.jsx',
        'client/src/main.jsx',
        'client/src/styles.css',
        'client/vite.config.js',
        'server/index.js',
        'server/routes/telemetry.js',
        'server/db.js',
        'prisma/schema.prisma'
      ]

      for (const rel of requiredFiles) {
        const fullPath = path.join(workspaceRoot, rel)
        assert.ok(fs.existsSync(fullPath), `Required workspace file missing: ${rel}`)
      }
    })

    it('should support atomic file reading, writing, and patching on disk', () => {
      const testFile = 'server/custom-config.json'
      const testData = JSON.stringify({ live: true, timestamp: Date.now() })
      workspaceManager.writeWorkspaceFile(testSlug, testFile, testData)

      const readBack = workspaceManager.readWorkspaceFile(testSlug, testFile)
      assert.ok(readBack)
      assert.strictEqual(JSON.parse(readBack).live, true)

      workspaceManager.patchWorkspaceFile(testSlug, testFile, (prev) => {
        const obj = JSON.parse(prev)
        obj.patched = true
        return JSON.stringify(obj)
      })

      const patchedBack = workspaceManager.readWorkspaceFile(testSlug, testFile)
      assert.ok(patchedBack)
      assert.strictEqual(JSON.parse(patchedBack).patched, true)
    })
  })

  describe('Criterion 2: Process Manager Runner & Port Allocation Pool', () => {
    it('should execute asynchronous CLI commands via executeCommand', async () => {
      const res = await processManager.executeCommand('node -e "console.log(\'AUTONOMOUS_TEST_OK\')"', process.cwd())
      assert.strictEqual(res.exitCode, 0)
      assert.ok(res.stdout.includes('AUTONOMOUS_TEST_OK'))
    })

    it('should start long-running background service via startService with dedicated port (4000-4999)', async () => {
      workspaceManager.writeWorkspaceFile(
        testSlug,
        'server/mock-server.js',
        `const http = require('http')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' })
  res.end(JSON.stringify({ ok: true, status: 'UP', port: process.env.PORT }))
})
server.listen(Number(process.env.PORT), '127.0.0.1')`
      )

      const result = processManager.startService(
        testSlug,
        'node',
        ['server/mock-server.js'],
        undefined,
        workspaceRoot
      )

      assert.ok(result.pid > 0)
      assert.ok(result.port >= 4000 && result.port <= 4999)
      assert.strictEqual(result.status, 'running')

      // Allow service 300ms to bind port
      await new Promise(r => setTimeout(r, 400))

      const procInfo = processManager.getProcessInfo(testSlug)
      assert.ok(procInfo)
      assert.strictEqual(procInfo.slug, testSlug)
      assert.strictEqual(procInfo.status, 'running')
    })

    it('should stop service and release allocated port via stopService', () => {
      const port = processManager.getAllocatedPort(testSlug)
      assert.ok(port)

      const stopped = processManager.stopService(testSlug)
      assert.strictEqual(stopped, true)

      const procInfo = processManager.getProcessInfo(testSlug)
      assert.strictEqual(procInfo, undefined)
      assert.strictEqual(processManager.getAllocatedPort(testSlug), undefined)
    })
  })

  describe('Criterion 3: Dynamic Reverse Proxy & Friday Health Gate', () => {
    it('should expose /projects/:slug/health with comprehensive process telemetry', async () => {
      // Re-start service for health check
      const service = processManager.startService(
        testSlug,
        'node',
        ['server/mock-server.js'],
        4250,
        workspaceRoot
      )

      await new Promise(r => setTimeout(r, 200))

      const req = new Request(`http://localhost/projects/${testSlug}/health`)
      const res = await previewRoutes.fetch(req)
      assert.strictEqual(res.status, 200)

      const data = await res.json() as any
      assert.strictEqual(data.ok, true)
      assert.strictEqual(data.status, 'UP')
      assert.strictEqual(data.client.status, 'READY')
      assert.ok(data.pid)
      assert.ok(data.port)
      assert.ok(data.memory)
    })

    it('should verify workspace files and active service health via Friday Specialist gate', async () => {
      const check = await fridaySpecialist.verifyActiveServiceHealth({
        slug: testSlug,
        port: 4250,
        workspaceRoot
      })

      assert.strictEqual(check.verified, true)
      assert.strictEqual(check.healthCheckPassed, true)
      assert.strictEqual(check.missingFiles.length, 0)
      processManager.stopService(testSlug)
    })
  })
})
