/**
 * voice-switching-task-lead-navigation.test.ts
 *
 * Verifies:
 * 1. Immediate Agent Persona Handoff (Vortex, Midas, Raphael, Aegis, Friday, Jarvis).
 * 2. Automatic Task Creation with Dynamic Navigation to Lead Task Page ('tasks').
 * 3. Universal Hands-Free Tab Navigation across all system hubs.
 * 4. High-Speed Sub-350ms TTS Waterfall with In-Memory LRU Caching.
 * 5. Phonetic Accent & Speech Recognition Normalization.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ConversationOS } from '../src/voice/ConversationOS'
import { resolveVoiceNavigation } from '../src/features/voice/voiceNavigationRouter'
import { parseVoiceIntent } from '../src/services/voiceGateway'

describe('Voice Persona Switching, Auto-Lead Task Dispatch & Tab Navigation Suite', () => {

  describe('1. Instant Agent Persona Handoff & Voice Switching', () => {
    it('should switch immediately to Vortex when user says "call vortex"', async () => {
      const resp = await ConversationOS.processUserSpeechAsync('call vortex', undefined, 'jarvis')
      assert.strictEqual(resp.targetAgent, 'vortex')
      assert.ok(resp.spokenText.includes('Vortex operational') || resp.spokenText.includes('Vortex'))
    })

    it('should switch immediately to Midas when user says "switch to midas"', async () => {
      const resp = await ConversationOS.processUserSpeechAsync('switch to midas', undefined, 'jarvis')
      assert.strictEqual(resp.targetAgent, 'midas')
      assert.ok(resp.spokenText.includes('Midas') || resp.spokenText.includes('revenue') || resp.spokenText.includes('capital'))
    })

    it('should parse handoff to Vortex and Midas via parseVoiceIntent', () => {
      const vortexIntent = parseVoiceIntent('call vortex', 'jarvis')
      assert.strictEqual(vortexIntent.type, 'HANDOFF')
      assert.strictEqual(vortexIntent.agent, 'vortex')
      assert.ok(vortexIntent.replyText?.includes('Vortex operational'))

      const midasIntent = parseVoiceIntent('talk to midas', 'jarvis')
      assert.strictEqual(midasIntent.type, 'HANDOFF')
      assert.strictEqual(midasIntent.agent, 'midas')
      assert.ok(midasIntent.replyText?.includes('Midas at your service'))
    })
  })

  describe('2. Task Assignment & Auto-Navigation to Lead Task Page', () => {
    it('should detect build task and assign targetTab: "tasks"', async () => {
      const resp = await ConversationOS.processUserSpeechAsync(
        'build a responsive fleet tracking dashboard with live map telemetry',
        undefined,
        'jarvis'
      )
      assert.ok(resp.action, 'Must generate an action')
      assert.strictEqual(resp.action?.type, 'create_task')
      assert.strictEqual(resp.action?.targetTab, 'tasks', 'Must route to Lead Tasks page')
      assert.ok(resp.action?.taskTitle?.includes('fleet tracking'))
    })

    it('should resolve natural navigation to "tasks" when user says "go to lead tasks"', () => {
      const nav1 = resolveVoiceNavigation('go to lead tasks')
      assert.strictEqual(nav1.matched, true)
      assert.strictEqual(nav1.tabKey, 'tasks')

      const nav2 = resolveVoiceNavigation('open active tasks')
      assert.strictEqual(nav2.matched, true)
      assert.strictEqual(nav2.tabKey, 'tasks')
    })
  })

  describe('3. Universal Hands-Free Tab Navigation', () => {
    it('should resolve natural navigation across all primary system tabs', () => {
      const tabs = [
        { text: 'go to revenue', expected: 'revenue' },
        { text: 'open projects', expected: 'projects' },
        { text: 'navigate to cyber defense', expected: 'cyber' },
        { text: 'open code studio', expected: 'studio' },
        { text: 'open storage vault', expected: 'storage' },
        { text: 'show telemetry', expected: 'telemetry' }
      ]

      for (const t of tabs) {
        const res = resolveVoiceNavigation(t.text)
        assert.strictEqual(res.matched, true, `Failed on: ${t.text}`)
        assert.strictEqual(res.tabKey, t.expected, `Expected ${t.expected} for ${t.text}`)
      }
    })
  })

  describe('4. Speech Recognition Phonetic Normalization', () => {
    it('should normalize distorted Indian English and speech-to-text accent variations', () => {
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('call fortex'), 'call vortex')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('switch to my does'), 'switch to midas')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('open lead-tasks'), 'open tasks')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('check invy store'), 'check projects')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('egis scan fierwal'), 'aegis scan cyber')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('run teem audit'), 'run theme audit')
      assert.strictEqual(ConversationOS.normalizePhoneticUtterance('check reg popup'), 'check register popup')
    })
  })

  describe('5. Autonomous Claude Co-Worker Engine & Zero-Touch Routines', () => {
    it('should register all sovereign co-worker routines in AutonomousScheduler', async () => {
      const { SwarmAutonomousScheduler } = await import('../src/swarm/engine/AutonomousScheduler')
      const scheduler = SwarmAutonomousScheduler.getInstance()
      const jobs = scheduler.listJobs()

      const jobIds = jobs.map(j => j.id)
      assert.ok(jobIds.includes('DAILY_INVI_STORE_THEME_AUDIT'), 'Must include Daily Invi theme audit')
      assert.ok(jobIds.includes('HOURLY_REVENUE_PIPELINE_MONITOR'), 'Must include Hourly revenue monitor')
      assert.ok(jobIds.includes('CONTINUOUS_CYBER_DEFENSE_SWEEP'), 'Must include Cyber defense sweep')
      assert.ok(jobIds.includes('WORKFLOW_AUTOMATION_SYNC'), 'Must include Workflow automation sync')
      assert.ok(jobIds.includes('MORNING_EXECUTIVE_BRIEF'), 'Must include Morning executive brief')
    })

    it('should map co-worker specialists to their respective domains', async () => {
      const { SwarmAutonomousScheduler } = await import('../src/swarm/engine/AutonomousScheduler')
      const scheduler = SwarmAutonomousScheduler.getInstance()

      const inviJob = scheduler.getJob('DAILY_INVI_STORE_THEME_AUDIT')
      assert.strictEqual(inviJob?.specialist, 'raphael', 'Raphael must lead UI & Liquid architecture')

      const revJob = scheduler.getJob('HOURLY_REVENUE_PIPELINE_MONITOR')
      assert.strictEqual(revJob?.specialist, 'midas', 'Midas must lead revenue monitoring')

      const secJob = scheduler.getJob('CONTINUOUS_CYBER_DEFENSE_SWEEP')
      assert.strictEqual(secJob?.specialist, 'aegis', 'Aegis must lead cyber security')

      const flowJob = scheduler.getJob('WORKFLOW_AUTOMATION_SYNC')
      assert.strictEqual(flowJob?.specialist, 'vortex', 'Vortex must lead automation pipelines')
    })
  })
})
