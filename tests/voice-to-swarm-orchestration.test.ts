import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseVoiceIntent } from '../server/src/services/voiceGateway'
import { SwarmOrchestrator } from '../server/src/swarm/engine/SwarmOrchestrator'

describe('Voice to Swarm Orchestration Integration Suite', () => {
  describe('Criterion 1: Acoustic Intent Extraction for Swarm Directives', () => {
    it('should classify speech containing build action and app keyword as SWARM_BUILD', () => {
      const utterances = [
        'Build a responsive commercial solar ROI calculator app',
        'Create a real-time crypto price tracker dashboard app',
        'Scaffold an enterprise multi-tenant SaaS platform',
        'Develop an autonomous inspection tool for Master Sri'
      ]

      for (const utt of utterances) {
        const intent = parseVoiceIntent(utt, 'jarvis')
        assert.strictEqual(intent.type, 'SWARM_BUILD')
        assert.ok(intent.replyText?.includes('Initiating swarm decomposition across Aegis, Raphael, and Midas'))
      }
    })

    it('should NOT trigger SWARM_BUILD for generic conversational or navigation queries', () => {
      const intentNav = parseVoiceIntent('Go to telemetry dashboard', 'jarvis')
      assert.strictEqual(intentNav.type, 'NAVIGATE')

      const intentHandoff = parseVoiceIntent('Switch to Aegis', 'jarvis')
      assert.strictEqual(intentHandoff.type, 'HANDOFF')

      const intentQuery = parseVoiceIntent('What is our cloud infrastructure status?', 'jarvis')
      assert.strictEqual(intentQuery.type, 'QUERY')
    })
  })

  describe('Criterion 2: SwarmOrchestrator.dispatch Voice Gateway Binding', () => {
    it('should execute asynchronous swarm build with vocal status callbacks', async () => {
      const progressLogs: { stage: string; message: string }[] = []

      const result = await SwarmOrchestrator.dispatch({
        directive: 'Build a commercial solar ROI calculator app',
        author: 'MASTER_SRI_VOICE',
        workspaceRoot: process.cwd(),
        onProgress: async (stage, message) => {
          progressLogs.push({ stage, message })
        }
      })

      assert.strictEqual(result.success, true)
      if ('previewPath' in result) {
        assert.ok(result.previewPath.startsWith('/preview/'))
        assert.ok(result.previewUrl.includes('/preview/'))
        assert.ok(progressLogs.length >= 3)
        assert.ok(progressLogs.some(p => p.stage === 'DISPATCH'))
        assert.ok(progressLogs.some(p => p.message.includes('Aegis completed')))
      }
    })
  })
})

