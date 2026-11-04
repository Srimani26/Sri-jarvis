import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { swarmOrchestrator } from '../server/src/swarm/engine/SwarmOrchestrator'
import { appBuilderEngine } from '../server/src/swarm/tools/appBuilderEngine'
import { autonomousVerifier } from '../server/src/swarm/engine/AutonomousVerifier'
import { telegramNotifier } from '../server/src/services/telegramNotifier'

describe('Swarm Orchestration Deep Synthesis Test Suite', () => {
  const directive = 'Build a responsive commercial solar ROI calculator web app'

  describe('Criterion 1: J.A.R.V.I.S. Multi-Agent Swarm Decomposer', () => {
    it('should correctly classify complex web projects vs simple single-agent tasks', () => {
      assert.strictEqual(swarmOrchestrator.isComplexWebProject('Build a commercial solar ROI calculator app'), true)
      assert.strictEqual(swarmOrchestrator.isComplexWebProject('Create an interactive crypto dashboard web app'), true)
      assert.strictEqual(swarmOrchestrator.isComplexWebProject('What is the current CPU temperature?'), false)
      assert.strictEqual(swarmOrchestrator.isComplexWebProject('Explain the difference between TCP and UDP'), false)
    })

    it('should derive a clean, URL-safe slug from the directive', () => {
      const slug = swarmOrchestrator.deriveCleanSlug(directive)
      assert.ok(slug.includes('solar'))
      assert.ok(slug.includes('roi-calculator'))
      assert.strictEqual(/^[a-z0-9-]+$/.test(slug), true)
    })

    it('should execute 3-stage multi-agent synthesis and dispatch progress updates', async () => {
      const telemetryEvents: { stage: string; message: string }[] = []

      const result = await swarmOrchestrator.orchestrateTask(directive, {
        specialist: 'jarvis',
        workspaceRoot: process.cwd(),
        onProgress: (stage, message) => {
          telemetryEvents.push({ stage, message })
        }
      })

      assert.strictEqual('stages' in result, true)
      if ('stages' in result) {
        assert.strictEqual(result.success, true)
        assert.ok(result.stages.aegisHtmlLength > 0, 'Aegis HTML should be generated')
        assert.ok(result.stages.raphaelCssLength > 0, 'Raphael CSS should be generated')
        assert.ok(result.stages.midasJsLength > 0, 'Midas JS should be generated')
        assert.ok(result.previewUrl.includes('/preview/'))
        assert.ok(result.previewPath.startsWith('/preview/'))

        // Verify all 5 telemetry events were dispatched in sequence
        assert.ok(telemetryEvents.some(e => e.stage === 'DISPATCH' && e.message.includes('Task decomposed across Aegis, Raphael, and Midas')))
        assert.ok(telemetryEvents.some(e => e.stage === 'PROGRESS' && e.message.includes('Aegis completed semantic HTML structure')))
        assert.ok(telemetryEvents.some(e => e.stage === 'PROGRESS' && e.message.includes('Raphael completed glassmorphic styling system')))
        assert.ok(telemetryEvents.some(e => e.stage === 'PROGRESS' && e.message.includes('Midas completed calculation engine & event handlers')))
        assert.ok(telemetryEvents.some(e => e.stage === 'PROGRESS' && e.message.includes('Synthesis complete. Running autonomous verification...')))
      }
    })
  })

  describe('Criterion 2: Self-Contained Deliverable Bundling', () => {
    it('should bundle HTML, CSS, and JS into a unified self-contained index.html with separate asset files', () => {
      const slug = 'test-solar-roi-bundle'
      const htmlContent = `
        <div id="calculator-root">
          <input type="range" id="solar-kw" value="100" />
          <span id="solar-kw-val">100</span>
          <span id="annual-savings">$15,000</span>
          <button id="export-csv-btn">Export</button>
        </div>
      `
      const cssContent = `
        #calculator-root { background: #0f172a; color: #fff; padding: 2rem; border-radius: 1rem; }
        #solar-kw { accent-color: #38bdf8; }
      `
      const jsContent = `
        const kwInput = document.getElementById('solar-kw');
        const kwVal = document.getElementById('solar-kw-val');
        const savings = document.getElementById('annual-savings');
        kwInput.addEventListener('input', () => {
          kwVal.textContent = kwInput.value;
          savings.textContent = '$' + (Number(kwInput.value) * 150).toLocaleString();
        });
      `

      const bundleRes = appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Solar ROI Test Bundle',
        description: 'Test solar ROI bundle description',
        htmlContent,
        cssContent,
        jsContent
      }, process.cwd())

      assert.strictEqual(bundleRes.success, true)
      assert.strictEqual(bundleRes.projectSlug, slug)

      const buildDir = join(process.cwd(), 'artifacts', 'builds', slug)
      assert.ok(existsSync(join(buildDir, 'index.html')))
      assert.ok(existsSync(join(buildDir, 'styles.css')))
      assert.ok(existsSync(join(buildDir, 'app.js')))

      const indexHtml = readFileSync(join(buildDir, 'index.html'), 'utf-8')
      assert.ok(indexHtml.includes('<!DOCTYPE html>'))
      assert.ok(indexHtml.includes('<style>'))
      assert.ok(indexHtml.includes('#calculator-root'))
      assert.ok(indexHtml.includes('<script>'))
      assert.ok(indexHtml.includes('solar-kw'))
    })
  })

  describe('Criterion 3: DOM Selector Synchronization & Placeholder Rejection Gate', () => {
    it('should pass verification when DOM element IDs match script query selectors and no placeholders exist', async () => {
      const slug = 'test-solar-roi-bundle'
      const verification = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(verification.verified, true)
      assert.strictEqual(verification.errors.length, 0)
      assert.ok(verification.checksPassed.some(c => c.includes('DOM query selectors')))
      assert.ok(verification.checksPassed.some(c => c.includes('Zero placeholder comments verified')))
    })

    it('should reject deliverable if placeholder comments like "// TODO" are present', async () => {
      const slug = 'test-placeholder-reject'
      const htmlWithTodo = `
        <div id="test-root">
          <!-- TODO: add form inputs -->
          // TODO: implement logic here
        </div>
      `
      appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Todo Test',
        description: 'Todo placeholder test',
        htmlContent: htmlWithTodo,
        cssContent: 'body { color: red; }',
        jsContent: '// TODO: write functions\nconsole.log(1);'
      }, process.cwd())

      const verification = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(verification.verified, false)
      assert.ok(verification.errors.some(e => e.includes('placeholder comments') && e.includes('TODO')))
    })

    it('should flag an error if script targets DOM IDs missing from HTML', async () => {
      const slug = 'test-broken-dom-ids'
      const html = `<div id="valid-container"><h1>Hello</h1></div>`
      const brokenJs = `
        const btn = document.getElementById('non-existent-button');
        const input = document.querySelector('#missing-input');
      `
      appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Broken DOM IDs Test',
        description: 'Broken IDs test',
        htmlContent: html,
        cssContent: 'h1 { color: blue; }',
        jsContent: brokenJs
      }, process.cwd())

      const verification = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(verification.verified, false)
      assert.ok(verification.errors.some(e => e.includes('JavaScript references DOM elements missing from HTML: non-existent-button, missing-input')))
    })
  })

  describe('Criterion 4: Telegram Swarm Telemetry & Delivery Integration', () => {
    it('should dispatch instant acknowledgment, live stage progress, and verified completion card', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const res = await telegramNotifier.handleAutonomousRun('1377862282', 'jarvis', directive)
        assert.strictEqual(res.success, true)

        // Instant acknowledgment check
        assert.ok(sentMessages.length >= 1)
        assert.ok(sentMessages[0].includes('J.A.R.V.I.S. SWARM DISPATCHED'))

        // Await background execution
        if (res.taskPromise) {
          await res.taskPromise
        }

        // Swarm telemetry checks
        assert.ok(sentMessages.some(m => m.includes('[Swarm Dispatch]') && m.includes('Aegis, Raphael, and Midas')))
        assert.ok(sentMessages.some(m => m.includes('[Swarm Progress]') && m.includes('Aegis completed')))
        assert.ok(sentMessages.some(m => m.includes('[Swarm Progress]') && m.includes('Raphael completed')))
        assert.ok(sentMessages.some(m => m.includes('[Swarm Progress]') && m.includes('Midas completed')))

        // Final completion card check
        const finalMsg = sentMessages[sentMessages.length - 1]
        assert.ok(finalMsg.includes('Task Completed by SWARM (Aegis + Raphael + Midas)'))
        assert.ok(finalMsg.includes('SUCCESS (Full Swarm Synthesis & Verification Passed)'))
        assert.ok(finalMsg.includes('Live Web Preview:'))
        assert.ok(finalMsg.includes('https://sri-jarvis.onrender.com/preview/'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })
})

