import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { telegramNotifier } from '../server/src/services/telegramNotifier'
import { scaffoldAndDeployWeb, appBuilderEngine } from '../server/src/swarm/tools/appBuilderEngine'
import { executeAutonomousReAct } from '../server/src/swarm/engine/AutonomousAgentLoop'

describe('Web App Builder & Scaffold Suite', () => {
  describe('Criterion 1: Direct Scaffold and Mount in appBuilderEngine', () => {
    it('should scaffold deliverable directly and write full DOM structure', async () => {
      const res = await scaffoldAndDeployWeb({
        directive: 'Build a responsive commercial solar ROI calculator web app',
        slug: 'commercial-solar-roi-calculator',
        author: 'AEGIS'
      })

      assert.strictEqual(res.success, true)
      assert.strictEqual(res.projectSlug, 'commercial-solar-roi-calculator')
      assert.ok(res.previewUrl.includes('/preview/commercial-solar-roi-calculator'))
    })
  })

  describe('Criterion 2: Artifacts Verification on Disk', () => {
    it('should verify physical index.html was written to artifacts directory', () => {
      const buildDir = join(process.cwd(), 'artifacts', 'builds', 'commercial-solar-roi-calculator')
      assert.ok(existsSync(buildDir))
      assert.ok(existsSync(join(buildDir, 'index.html')))
      assert.ok(existsSync(join(buildDir, 'app.js')))
      assert.ok(existsSync(join(buildDir, 'styles.css')))
    })
  })
})

