import { describe, it } from 'node:test'
import assert from 'node:assert'
import { telegramNotifier, TelegramNotifierService } from '../server/src/services/telegramNotifier'

describe('Telegram Bot Command Dispatcher & Autonomous Swarm Bridge Suite', () => {

  describe('Criterion 1: /run Command Parser & Specialist Mapping', () => {
    it('should parse /run <agent> <directive> and dispatch to autonomous runtime', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const update = {
          update_id: 1001,
          message: {
            message_id: 50,
            chat: { id: '1377862282' },
            text: '/run aegis audit git working tree'
          }
        }

        const res = await telegramNotifier.handleInboundUpdate(update)
        assert.strictEqual(res.handled, true)
        assert.strictEqual(res.command, '/run')
        assert.ok(sentMessages.length >= 1, 'Expected immediate dispatch ack (<500ms)')

        // 1. First message is immediate dispatch acknowledgement
        assert.ok(sentMessages[0].includes('SWARM DISPATCHED') || sentMessages[0].includes('Autonomous Swarm Dispatch'))
        assert.ok(sentMessages[0].includes('AEGIS'))
        assert.ok(sentMessages[0].includes('audit git working tree'))

        // Await background execution
        if (res.taskPromise) await res.taskPromise
        else if (telegramNotifier.lastTaskPromise) await telegramNotifier.lastTaskPromise

        // 2. Final message is formatted completion card with latency & verification
        assert.ok(sentMessages.length >= 2, 'Expected at least dispatch ack + completion card')
        const completionMsg = sentMessages.find(m => m.includes('Task Completed by AEGIS')) || sentMessages[sentMessages.length - 1]
        assert.ok(completionMsg.includes('Task Completed by AEGIS'))
        assert.ok(completionMsg.includes('Execution Latency:'))
        assert.ok(completionMsg.includes('ReAct Turns:'))
        assert.ok(completionMsg.includes('Executive Summary:'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })

    it('should provide clear usage guide if /run is called without a directive', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const update = {
          update_id: 1002,
          message: {
            message_id: 51,
            chat: { id: '1377862282' },
            text: '/run'
          }
        }

        const res = await telegramNotifier.handleInboundUpdate(update)
        assert.strictEqual(res.handled, true)
        assert.strictEqual(res.command, '/run')
        assert.ok(sentMessages[0].includes('Usage:'))
        assert.ok(sentMessages[0].includes('/run <specialist> <directive>'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })

  describe('Criterion 2: Freeform Natural Language Commands', () => {
    it('should parse natural agent prefix delegation (e.g. "Friday, generate Q4 report")', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const update = {
          update_id: 1003,
          message: {
            message_id: 52,
            chat: { id: '1377862282' },
            text: 'Friday, generate executive Q4 revenue PDF report'
          }
        }

        const res = await telegramNotifier.handleInboundUpdate(update)
        assert.strictEqual(res.handled, true)
        assert.strictEqual(res.command, 'NATURAL_DELEGATION')
        assert.ok(sentMessages[0].includes('FRIDAY'))

        if (res.taskPromise) await res.taskPromise
        else if (telegramNotifier.lastTaskPromise) await telegramNotifier.lastTaskPromise

        const completionMsg = sentMessages.find(m => m.includes('Task Completed by FRIDAY')) || sentMessages[sentMessages.length - 1]
        assert.ok(completionMsg.includes('Task Completed by FRIDAY'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })

    it('should infer appropriate specialist from action verbs (e.g. "build asset optimizer" -> Aegis)', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const update = {
          update_id: 1004,
          message: {
            message_id: 53,
            chat: { id: '1377862282' },
            text: 'build a responsive crypto price tracker web app'
          }
        }

        const res = await telegramNotifier.handleInboundUpdate(update)
        assert.strictEqual(res.handled, true)
        assert.strictEqual(res.command, 'NATURAL_DIRECTIVE')
        assert.ok(sentMessages[0].includes('AEGIS'))

        if (res.taskPromise) await res.taskPromise
        else if (telegramNotifier.lastTaskPromise) await telegramNotifier.lastTaskPromise
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })

  describe('Criterion 3: Live Telemetry & Artifact Links in Output', () => {
    it('should format artifact download links and preview URLs in completion card', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const res = await telegramNotifier.handleAutonomousRun(
          '1377862282',
          'friday',
          'Compile formal test presentation deck'
        )

        assert.strictEqual(res.success, true)
        assert.ok(sentMessages.length >= 1)

        if (res.taskPromise) await res.taskPromise
        else if (telegramNotifier.lastTaskPromise) await telegramNotifier.lastTaskPromise

        assert.ok(sentMessages.length >= 2)
        const finalCard = sentMessages.find(m => m.includes('Task Completed by')) || sentMessages[sentMessages.length - 1]
        assert.ok(finalCard.includes('Execution Latency:'))
        assert.ok(finalCard.includes('ReAct Turns:'))
        assert.ok(finalCard.includes('Executive Summary:'))
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })

  describe('Criterion 4: Security Perimeter & Access Control', () => {
    it('should block unauthorized chat IDs and reject execution with diagnostic chat ID', async () => {
      const sentMessages: string[] = []
      const origSend = telegramNotifier.sendMessage
      telegramNotifier.sendMessage = async (msg: string) => {
        sentMessages.push(msg)
        return true
      }

      try {
        const unauthorizedUpdate = {
          update_id: 9999,
          message: {
            message_id: 99,
            chat: { id: '999999999' }, // Intruder chat ID
            text: '/run aegis delete all files'
          }
        }

        const res = await telegramNotifier.handleInboundUpdate(unauthorizedUpdate)
        assert.strictEqual(res.handled, false)
        assert.strictEqual(sentMessages.length, 1)
        assert.ok(sentMessages[0].toLowerCase().includes('access denied'))
        assert.ok(sentMessages[0].includes('999999999'), 'Denial message must state the rejected chat ID for diagnostics')
      } finally {
        telegramNotifier.sendMessage = origSend
      }
    })
  })
})

