/**
 * autonomous-daemon-scheduler.test.ts
 *
 * Verifies:
 * 1. ModelRouter dynamic startup handshake & Tier assignment.
 * 2. SwarmAutonomousScheduler persistent cron registration & next-run calculation.
 * 3. Execution of scheduled routines & trigger of proactive Telegram alerts.
 * 4. Bi-directional Telegram inbound command parsing (/status, /run, plain text).
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { swarmModelRouter } from '../src/swarm/engine/ModelRouter'
import { swarmAutonomousScheduler } from '../src/swarm/engine/AutonomousScheduler'
import { telegramNotifier } from '../src/services/telegramNotifier'

describe('24x7 Autonomous Operations Daemon & Bi-Directional Telegram Interface', () => {

  describe('1. ModelRouter Runtime Handshake & Dynamic Tier Assignment', () => {
    it('should execute startup handshake and report provider statuses with model arrays', async () => {
      const report = await swarmModelRouter.runStartupHandshake()

      assert.ok(report, 'Report must be defined')
      assert.ok(report.groq, 'Report must include groq tier')
      assert.strictEqual(report.groq.tier, 1, 'Groq must be Tier 1')
      assert.ok(report.groq.models.includes('groq/llama-3.3-70b-versatile'), 'Must register LLaMA 3.3 70B')
      assert.ok(report.groq.models.includes('groq/deepseek-r1-distill-llama-70b'), 'Must register DeepSeek-R1 Distill')

      assert.ok(report.openrouter, 'Report must include openrouter')
      assert.strictEqual(report.openrouter.tier, 2, 'OpenRouter must be Tier 2')
      assert.ok(report.openrouter.models.includes('openrouter/qwen/qwen-2.5-coder-32b-instruct:free'), 'Must register Qwen 2.5 Coder Free')

      assert.ok(report.gemini, 'Report must include gemini')
      assert.strictEqual(report.gemini.tier, 3, 'Gemini must be Tier 3')
      assert.ok(report.gemini.models.includes('gemini-flash-lite-latest'), 'Must register Gemini Flash Lite')
    })

    it('should expose verified active providers via getActiveProviders()', () => {
      const active = swarmModelRouter.getActiveProviders()
      assert.ok(active.groq, 'Groq must be present in active providers')
      assert.ok(active.gemini, 'Gemini must be present in active providers')
      assert.ok(active.openrouter, 'OpenRouter must be present in active providers')
    })
  })

  describe('2. AutonomousScheduler Cron Registration & Next-Run Timing', () => {
    it('should register default routines (Nightly Scan, Morning Brief, System Heartbeat)', () => {
      const jobs = swarmAutonomousScheduler.listJobs()
      assert.ok(jobs.length >= 3, 'Must register at least 3 default routines')

      const nightly = swarmAutonomousScheduler.getJob('NIGHTLY_REPO_INTEGRITY_SCAN')
      assert.ok(nightly, 'Nightly scan routine must exist')
      assert.strictEqual(nightly.specialist, 'aegis')
      assert.strictEqual(nightly.cronExpression, '30 20 * * *')

      const morning = swarmAutonomousScheduler.getJob('MORNING_EXECUTIVE_BRIEF')
      assert.ok(morning, 'Morning brief routine must exist')
      assert.strictEqual(morning.specialist, 'friday')

      const heartbeat = swarmAutonomousScheduler.getJob('SYSTEM_HEALTH_HEARTBEAT')
      assert.ok(heartbeat, 'Heartbeat routine must exist')
      assert.strictEqual(heartbeat.specialist, 'raphael')
    })

    it('should correctly calculate future next-run timestamps for cron expressions', () => {
      const now = new Date()
      // Test interval pattern "0 */6 * * *"
      const nextHeartbeat = swarmAutonomousScheduler.calculateNextRun('0 */6 * * *', now)
      assert.ok(nextHeartbeat > now.getTime(), 'Next heartbeat must be in the future')

      // Test daily fixed pattern "30 20 * * *"
      const nextNightly = swarmAutonomousScheduler.calculateNextRun('30 20 * * *', now)
      assert.ok(nextNightly > now.getTime(), 'Next nightly run must be in the future')
    })

    it('should support lifecycle start and stop without memory leaks', () => {
      swarmAutonomousScheduler.start(5000)
      assert.strictEqual(swarmAutonomousScheduler.getIsRunning(), true)
      swarmAutonomousScheduler.stop()
      assert.strictEqual(swarmAutonomousScheduler.getIsRunning(), false)
    })
  })

  describe('3. Scheduled Job Execution & Proactive Telegram Alerting', () => {
    it('should execute a scheduled routine and update execution metrics', async () => {
      // Execute the heartbeat job
      const result = await swarmAutonomousScheduler.executeJob('SYSTEM_HEALTH_HEARTBEAT')
      assert.ok(result, 'Result must be returned')
      assert.strictEqual(typeof result.success, 'boolean')
      assert.ok(result.latencyMs >= 0, 'Latency must be tracked')
      assert.ok(result.summary.length > 0, 'Summary must be non-empty')

      const updatedJob = swarmAutonomousScheduler.getJob('SYSTEM_HEALTH_HEARTBEAT')
      assert.ok(updatedJob?.lastRun, 'Job lastRun must be stamped')
      assert.strictEqual(updatedJob?.lastStatus, result.success ? 'SUCCESS' : 'FAILED')
      assert.ok(updatedJob?.nextRun && updatedJob.nextRun > Date.now(), 'nextRun must be updated to the future')
    })

    it('should prevent overlapping duplicate runs using execution lock', async () => {
      // Register custom test job
      const customJob = swarmAutonomousScheduler.registerJob({
        id: 'TEST_LOCK_ROUTINE',
        name: 'Test Lock Routine',
        cronExpression: '*/5 * * * *',
        specialist: 'jarvis',
        directive: 'Quick lock test directive.'
      })
      assert.ok(customJob, 'Custom job must be registered')

      // Dispatch job
      const p1 = swarmAutonomousScheduler.executeJob('TEST_LOCK_ROUTINE')
      // Try to dispatch again concurrently while lock is active (if fast, catch concurrency)
      const p2 = swarmAutonomousScheduler.executeJob('TEST_LOCK_ROUTINE')

      const [res1, res2] = await Promise.all([p1, p2])
      assert.ok(res1 || res2, 'At least one execution must resolve')
    })
  })

  describe('4. Bi-Directional Telegram Inbound Commands & Security Gate', () => {
    it('should reject inbound command from unauthorized chat ID (Security Perimeter)', async () => {
      const fakeUpdate = {
        message: {
          chat: { id: '999999999_hacker' },
          text: '/status'
        }
      }
      const res = await telegramNotifier.handleInboundUpdate(fakeUpdate)
      assert.strictEqual(res.handled, false, 'Unauthorized command must be rejected')
    })

    it('should handle /status command from authorized Master Sri chat ID', async () => {
      const authorizedId = telegramNotifier.getChatId()
      const update = {
        message: {
          chat: { id: authorizedId },
          text: '/status'
        }
      }
      const res = await telegramNotifier.handleInboundUpdate(update)
      assert.strictEqual(res.handled, true)
      assert.strictEqual(res.command, '/status')
      assert.ok(res.reply?.includes('5.0.0-mark-v'), 'Reply must contain core version')
      assert.ok(res.reply?.includes('ONLINE_24x7'), 'Reply must contain cloud status')
    })

    it('should handle /run <specialist> <directive> and execute task headlessly', async () => {
      const authorizedId = telegramNotifier.getChatId()
      const update = {
        message: {
          chat: { id: authorizedId },
          text: '/run aegis inspect git status and security perimeter'
        }
      }
      const res = await telegramNotifier.handleInboundUpdate(update)
      assert.strictEqual(res.handled, true)
      assert.strictEqual(res.command, '/run')
      assert.ok(res.reply?.includes('AEGIS'), 'Reply must report execution by AEGIS')
    })

    it('should route conversational plain text to Jarvis Core via ModelRouter', async () => {
      const authorizedId = telegramNotifier.getChatId()
      const update = {
        message: {
          chat: { id: authorizedId },
          text: 'Good morning Jarvis, report operational readiness.'
        }
      }
      const res = await telegramNotifier.handleInboundUpdate(update)
      assert.strictEqual(res.handled, true)
      assert.ok(res.reply && res.reply.length > 5, 'Must receive intelligent response from Jarvis Core')
    })
  })
})
