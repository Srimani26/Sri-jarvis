import { describe, it } from 'node:test'
import assert from 'node:assert'
import { autonomousVerifier } from '../server/src/swarm/engine/AutonomousVerifier'
import { appBuilderEngine } from '../server/src/swarm/tools/appBuilderEngine'
import { swarmOrchestrator } from '../server/src/swarm/engine/SwarmOrchestrator'

describe('Verifier Lenient Success & Auto-Healing Contract Suite', () => {
  describe('Criterion 1: Contract Auto-Healing for Shared Element IDs', () => {
    it('should automatically inject missing element IDs referenced in JS into HTML', () => {
      const htmlBefore = `
        <div class="calculator-root">
          <input type="range" value="50" />
          <button class="export-btn">Download Report</button>
        </div>
      `
      const js = `
        const input = document.getElementById('solar-kw-input');
        const btn = document.querySelector('#download-csv-btn');
        const dynamicMetric = document.getElementById('metric-readout');
      `

      const healedHtml = swarmOrchestrator.autoAlignSharedElementIds(htmlBefore, js)

      assert.ok(healedHtml.includes('id="solar-kw-input"'))
      assert.ok(healedHtml.includes('id="download-csv-btn"'))
      assert.ok(healedHtml.includes('id="metric-readout"'))
    })
  })

  describe('Criterion 2: Lenient Verification Pass Criteria', () => {
    it('should return status SUCCESS and clean verification message when files are intact', async () => {
      const slug = 'test-lenient-success'
      const html = `<!DOCTYPE html><html><head><title>App</title><link rel="stylesheet" href="styles.css"></head><body><div id="root"><h1>Clean App</h1></div><script src="app.js"></script></body></html>`
      const css = `#root { color: #fff; background: #0f172a; }`
      const js = `console.log('App initialized'); const root = document.getElementById('root');`

      appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Lenient Test App',
        description: 'Testing lenient verifier',
        htmlContent: html,
        cssContent: css,
        jsContent: js
      }, process.cwd())

      const result = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(result.verified, true)
      assert.strictEqual(result.status, 'SUCCESS')
      assert.strictEqual(result.message, 'VERIFIED (Clean Synthesized Deliverable)')
    })

    it('should pass even when script references dynamic DOM IDs not statically present in HTML', async () => {
      const slug = 'test-lenient-dynamic-ids'
      const html = `<!DOCTYPE html><html><head><title>App</title></head><body><div id="root"></div></body></html>`
      const css = `body { background: #000; }`
      const js = `
        // References elements that may be rendered dynamically at runtime
        const card = document.getElementById('dynamically-rendered-card');
        const metric = document.querySelector('#remote-telemetry-badge');
      `

      appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Dynamic IDs Test',
        description: 'Dynamic element references',
        htmlContent: html,
        cssContent: css,
        jsContent: js
      }, process.cwd())

      const result = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(result.verified, true)
      assert.strictEqual(result.status, 'SUCCESS')
      assert.ok(result.checksPassed.some(c => c.includes('Informational DOM note') || c.includes('DOM query selectors')))
    })

    it('should return status FAILED when fatal JavaScript SyntaxError is present', async () => {
      const slug = 'test-fatal-syntax-error'
      const html = `<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>`
      const css = `body { margin: 0; }`
      const brokenJs = `function broken( { return ???;` // Fatal SyntaxError

      appBuilderEngine.bundleFullSwarmDeliverable({
        slug,
        title: 'Broken Syntax Test',
        description: 'Testing fatal syntax rejection',
        htmlContent: html,
        cssContent: css,
        jsContent: brokenJs
      }, process.cwd())

      const result = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug
      }, process.cwd())

      assert.strictEqual(result.verified, false)
      assert.strictEqual(result.status, 'FAILED')
      assert.ok(result.errors?.some(e => e.includes('JavaScript fatal syntax error')))
    })
  })
})

