import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { telegramNotifier } from '../server/src/services/telegramNotifier'
import { scaffoldAndDeployWeb, appBuilderEngine } from '../server/src/swarm/tools/appBuilderEngine'
import { executeAutonomousReAct } from '../server/src/swarm/engine/AutonomousAgentLoop'

describe('Fast-Path Single-Turn Web App Builder & ReAct Bypass Suite', () => {
  describe('Criterion 1: Direct Fast-Path Interception in Telegram Dispatcher', () => {
    it('should intercept web app directive, scaffold directly, and bypass multi-turn loop', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const directive = 'Build a responsive commercial solar ROI calculator web app'
        const res = await telegramNotifier.handleAutonomousRun('1377862282', 'aegis', directive)

        assert.strictEqual(res.success, true)
        // Instant acknowledgment dispatched
        assert.ok(sentMessages.length >= 1)
        assert.ok(sentMessages[0].includes('J.A.R.V.I.S. SWARM DISPATCHED'))

        // Await background execution
        if (res.taskPromise) await res.taskPromise

        // Fast-path completion message should be sent
        assert.ok(sentMessages.length >= 2)
        const finalMsg = sentMessages[sentMessages.length - 1]
        assert.ok(finalMsg.includes('Task Completed by AEGIS'))
        assert.ok(finalMsg.includes('SUCCESS (PASSED & MOUNTED)'))
        assert.ok(finalMsg.includes('Fast-Path Single-Turn: `YES`'))
        assert.ok(finalMsg.includes('Live Web Preview:'))
        assert.ok(finalMsg.includes('https://sri-jarvis.onrender.com/preview/'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })

  describe('Criterion 2: Turn 1 Hard-Clamp in AutonomousAgentLoop', () => {
    it('should force-call scaffold engine on Turn 1 and terminate without hitting turn 25', async () => {
      const directive = 'Create interactive real-time crypto price tracker dashboard app'
      const result = await executeAutonomousReAct(directive, {
        specialist: 'aegis',
        maxSteps: 25,
        deliverableType: 'web_app',
        requireVerification: false
      })

      assert.strictEqual(result.success, true)
      // Must terminate in 1 step (Hard-clamp single-turn)
      assert.strictEqual(result.stepsExecuted, 1)
      assert.ok(result.artifacts.some(a => a.startsWith('/preview/')))
      assert.ok(result.finalResponse.includes('/preview/'))
    })

    it('should verify physical index.html was written to artifacts directory', () => {
      const buildDir = join(process.cwd(), 'artifacts', 'builds', 'commercial-solar-roi-calculator')
      assert.ok(existsSync(buildDir))
      assert.ok(existsSync(join(buildDir, 'index.html')))
      assert.ok(existsSync(join(buildDir, 'app.js')))
      assert.ok(existsSync(join(buildDir, 'styles.css')))
    })
  })
})
