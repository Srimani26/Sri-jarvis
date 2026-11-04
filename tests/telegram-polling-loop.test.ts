/**
 * tests/telegram-polling-loop.test.ts
 * Integration test suite verifying the resilient Telegram getUpdates polling loop:
 * 1. Verifies persistent continuous while loop making getUpdates calls.
 * 2. Verifies offset advancement (offset = update_id + 1).
 * 3. Verifies updates are dispatched to handleUpdate().
 * 4. Verifies graceful error recovery on non-ok responses and clean stop on stopPolling().
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { TelegramBotListener } from '../src/notifications/TelegramBotListener'

describe('Telegram Bot Polling Loop & Resilient Poller Test Suite', () => {
  const originalFetch = globalThis.fetch
  let pollRequests: string[] = []
  let handledUpdates: any[] = []

  beforeEach(() => {
    pollRequests = []
    handledUpdates = []
    TelegramBotListener.stopPolling()
    TelegramBotListener.setOffset(0)
  })

  afterEach(() => {
    TelegramBotListener.stopPolling()
    globalThis.fetch = originalFetch
  })

  it('should continuously poll getUpdates, advance offset, and dispatch updates', async () => {
    let callCount = 0

    // Mock global fetch to simulate Telegram API responses
    globalThis.fetch = async (url: any, opts: any) => {
      const urlStr = String(url)
      pollRequests.push(urlStr)

      // 1. Mock deleteWebhook
      if (urlStr.includes('deleteWebhook')) {
        return {
          ok: true,
          json: async () => ({ ok: true, description: 'Webhook deleted' })
        } as any
      }

      // 2. Mock sendMessage
      if (urlStr.includes('sendMessage')) {
        return {
          ok: true,
          json: async () => ({ ok: true, result: { message_id: 999 } })
        } as any
      }

      // 3. Mock getUpdates
      if (urlStr.includes('getUpdates')) {
        callCount++
        await new Promise(r => setTimeout(r, 20))

        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              result: [
                {
                  update_id: 5001,
                  message: {
                    message_id: 1,
                    chat: { id: '1377862282' },
                    text: '/status'
                  }
                }
              ]
            })
          } as any
        }

        if (callCount === 2) {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              result: [
                {
                  update_id: 5002,
                  message: {
                    message_id: 2,
                    chat: { id: '1377862282' },
                    text: '/run aegis inspect system'
                  }
                }
              ]
            })
          } as any
        }

        // Subsequent calls return empty updates
        return {
          ok: true,
          json: async () => ({ ok: true, result: [] })
        } as any
      }

      return {
        ok: true,
        json: async () => ({ ok: true })
      } as any
    }

    // Intercept handleUpdate to verify dispatch
    const origHandleUpdate = TelegramBotListener.handleUpdate
    TelegramBotListener.handleUpdate = async (update: any) => {
      handledUpdates.push(update)
    }

    try {
      TelegramBotListener.setBotToken('TEST_TOKEN_12345')
      TelegramBotListener.startPolling()

      assert.strictEqual(TelegramBotListener.isPolling(), true, 'Poller must be active')

      // Wait for at least 2 long-poll iterations
      const startTime = Date.now()
      while (handledUpdates.length < 2 && Date.now() - startTime < 3000) {
        await new Promise(r => setTimeout(r, 50))
      }

      // Assertions
      assert.ok(callCount >= 2, `Expected at least 2 getUpdates calls, got ${callCount}`)
      assert.strictEqual(handledUpdates.length, 2, 'Expected 2 updates processed')
      assert.strictEqual(handledUpdates[0].update_id, 5001)
      assert.strictEqual(handledUpdates[1].update_id, 5002)

      // Offset must have advanced past 5002 to 5003
      assert.strictEqual(TelegramBotListener.getOffset(), 5003, 'Offset must advance to update_id + 1')

      // Verify getUpdates URLs included the advanced offset
      const firstGetUpdates = pollRequests.find(u => u.includes('offset=0'))
      const secondGetUpdates = pollRequests.find(u => u.includes('offset=5002'))
      assert.ok(firstGetUpdates, 'First poll must query offset=0')
      assert.ok(secondGetUpdates, 'Second poll must query advanced offset=5002')

      // Verify stopPolling()
      TelegramBotListener.stopPolling()
      assert.strictEqual(TelegramBotListener.isPolling(), false, 'Poller must be stopped')
    } finally {
      TelegramBotListener.handleUpdate = origHandleUpdate
    }
  })

  it('should survive and retry when getUpdates returns non-ok or encounters network error', async () => {
    let callCount = 0

    globalThis.fetch = async (url: any) => {
      const urlStr = String(url)
      if (urlStr.includes('deleteWebhook')) {
        return { ok: true, json: async () => ({ ok: true }) } as any
      }

      if (urlStr.includes('getUpdates')) {
        callCount++
        await new Promise(r => setTimeout(r, 20))
        if (callCount === 1) {
          // Simulate 502 Bad Gateway / non-ok response
          return {
            ok: false,
            status: 502,
            json: async () => ({ ok: false, error_code: 502, description: 'Bad Gateway' })
          } as any
        }
        if (callCount === 2) {
          // Simulate recovery with valid update
          return {
            ok: true,
            json: async () => ({
              ok: true,
              result: [
                {
                  update_id: 8888,
                  message: { chat: { id: '1377862282' }, text: 'recovery test' }
                }
              ]
            })
          } as any
        }
        return { ok: true, json: async () => ({ ok: true, result: [] }) } as any
      }

      return { ok: true, json: async () => ({ ok: true }) } as any
    }

    try {
      TelegramBotListener.setBotToken('TEST_TOKEN_12345')
      TelegramBotListener.setOffset(0)
      TelegramBotListener.startPolling()

      assert.strictEqual(TelegramBotListener.isPolling(), true)

      // Wait for retry loop (takes ~3s backoff on error)
      const startTime = Date.now()
      while (callCount < 2 && Date.now() - startTime < 5000) {
        await new Promise(r => setTimeout(r, 100))
      }

      assert.ok(callCount >= 2, 'Loop must have retried after non-ok response')
      assert.strictEqual(TelegramBotListener.getOffset(), 8889, 'Offset must advance upon recovery')
    } finally {
      TelegramBotListener.stopPolling()
    }
  })
})
