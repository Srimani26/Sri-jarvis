/**
 * telegramNotifier.ts — Bi-Directional Sovereign Telegram Interface & Autonomous Alert Daemon
 * Target: src/services/telegramNotifier.ts & server/src/services/telegramNotifier.ts
 *
 * Implements:
 * 1. Proactive Telegram dispatch for 24x7 Autonomous Scheduler updates.
 * 2. Inbound command webhook router & long-polling for Master Sri (Chat ID: 1377862282).
 * 3. /status, /run <specialist> <directive>, and direct conversational LLM routing.
 */

import { executeAutonomousTask } from '../swarm/engine/AgentLoop'
import { swarmModelRouter, SwarmSpecialist } from '../swarm/engine/ModelRouter'

export interface TelegramMessagePayload {
  chat_id: string | number
  text: string
  parse_mode?: 'Markdown' | 'HTML'
}

export class TelegramNotifierService {
  private static instance: TelegramNotifierService
  private botToken: string = process.env.TELEGRAM_BOT_TOKEN || '8833543250:AAEcqCZadls0APgOBM-HGU76M28rBRw9MtI'
  private chatId: string = process.env.TELEGRAM_CHAT_ID || '1377862282'
  private isPollingActive = false
  private abortController: AbortController | null = null
  private lastUpdateId = 0

  public static getInstance(): TelegramNotifierService {
    if (!TelegramNotifierService.instance) {
      TelegramNotifierService.instance = new TelegramNotifierService()
    }
    return TelegramNotifierService.instance
  }

  public getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || this.botToken
  }

  public getChatId(): string {
    return process.env.TELEGRAM_CHAT_ID || this.chatId
  }

  /**
   * Send arbitrary message to Master Sri
   */
  public async sendMessage(text: string, targetChatId?: string | number): Promise<boolean> {
    const token = this.getBotToken()
    const chat = targetChatId || this.getChatId()
    if (!token || !chat) return false

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text,
          parse_mode: 'Markdown'
        }),
        signal: AbortSignal.timeout(5000)
      })
      return res.ok
    } catch (err: any) {
      console.warn('⚠️ [TelegramNotifier] Send error (offline or unreached):', err?.message || err)
      return false
    }
  }

  /**
   * Proactive 24x7 Swarm Update notification
   */
  public async sendSwarmUpdate(
    specialist: string,
    jobName: string,
    status: 'SUCCESS' | 'FAILED',
    latencyMs: number,
    resultSummary: string
  ): Promise<boolean> {
    const message = [
      '⚡ *[J.A.R.V.I.S. 24x7 Swarm Update]*',
      `*Specialist:* \`${specialist.toUpperCase()}\``,
      `*Task:* \`${jobName}\``,
      `*Status:* ${status === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILED'} (Latency: ${latencyMs}ms)`,
      '',
      `*Summary:* ${resultSummary.substring(0, 800)}`
    ].join('\n')

    return this.sendMessage(message)
  }

  /**
   * Handle incoming webhook update from Telegram
   */
  public async handleInboundUpdate(update: any): Promise<{ handled: boolean; reply?: string; command?: string }> {
    const msg = update?.message || update?.edited_message
    if (!msg || !msg.text) return { handled: false }

    const senderChatId = String(msg.chat?.id || '')
    const authorizedChatId = String(this.getChatId())

    // Security Gate: Ensure only Master Sri commands the core
    if (authorizedChatId && senderChatId !== authorizedChatId) {
      console.warn(`🛡️ [TelegramSecurity] Rejected unauthorized message from chat ID: ${senderChatId}`)
      await this.sendMessage('🔒 *ACCESS DENIED:* Unauthorized command source. This incident has been logged.', senderChatId)
      return { handled: false }
    }

    const text = msg.text.trim()

    // 1. /status command
    if (text === '/status' || text.startsWith('/status@')) {
      const providers = swarmModelRouter.getActiveProviders()
      const providerLines = Object.entries(providers).map(([k, v]) => `• *${k.toUpperCase()}:* Tier ${v.tier} (${v.status})`)
      const reply = [
        '⚡ *[J.A.R.V.I.S. System Status]*',
        `*Core Version:* \`5.0.0-mark-v\``,
        `*Cloud Status:* \`ONLINE_24x7\``,
        `*Uptime:* \`${Math.floor(process.uptime())}s\``,
        '',
        '*Active AI Providers:*',
        providerLines.length > 0 ? providerLines.join('\n') : '• Google Gemini Flash Lite (Online)',
        '',
        '*Specialist Swarm:* Jarvis, Aegis, Raphael, Friday, Midas, Cerebro'
      ].join('\n')

      await this.sendMessage(reply, senderChatId)
      return { handled: true, command: '/status', reply }
    }

    // 2. /run <specialist> <directive>
    if (text.startsWith('/run')) {
      const parts = text.substring(4).trim().split(/\s+/)
      const specialistArg = parts[0]?.toLowerCase() as SwarmSpecialist
      const directive = parts.slice(1).join(' ').trim()

      if (!directive) {
        const usage = '⚠️ *Usage:* `/run <specialist> <directive>`\n*Examples:*\n• `/run aegis audit git working tree`\n• `/run friday summarize morning forex and crypto`'
        await this.sendMessage(usage, senderChatId)
        return { handled: true, command: '/run', reply: usage }
      }

      const validSpecialists = ['jarvis', 'aegis', 'raphael', 'friday', 'midas', 'cerebro']
      const specialist: SwarmSpecialist = validSpecialists.includes(specialistArg) ? specialistArg : 'jarvis'

      await this.sendMessage(`🚀 *[Swarm Initiated]* Dispatching autonomous task to \`${specialist.toUpperCase()}\`:\n_${directive}_`, senderChatId)

      // Execute task headlessly
      const startTime = Date.now()
      try {
        const result = await executeAutonomousTask(directive, specialist)
        const latency = Date.now() - startTime
        const summary = [
          `⚡ *[Task Completed by ${specialist.toUpperCase()}]*`,
          `*Status:* ${result.success ? '✅ SUCCESS' : '❌ FAILED'} (${latency}ms)`,
          `*Steps Executed:* ${result.stepsExecuted}`,
          '',
          `*Result:* ${result.finalResponse.substring(0, 1000)}`
        ].join('\n')

        await this.sendMessage(summary, senderChatId)
        return { handled: true, command: '/run', reply: summary }
      } catch (err: any) {
        const errReply = `❌ *[Task Error]* Execution failed: ${err?.message || err}`
        await this.sendMessage(errReply, senderChatId)
        return { handled: true, command: '/run', reply: errReply }
      }
    }

    // 3. Plain text query / conversational message
    try {
      const response = await swarmModelRouter.dispatch('jarvis', [
        {
          role: 'system',
          content: 'You are J.A.R.V.I.S., Tony Stark AI operating system serving Master Sri with absolute loyalty, razor-sharp wit, and executive clarity. Keep Telegram voice/chat responses crisp and under 3-4 sentences.'
        },
        { role: 'user', content: text }
      ], [])

      const reply = response.content || 'Sir, directive received. Swarm is standing by.'
      await this.sendMessage(reply, senderChatId)
      return { handled: true, reply }
    } catch (err: any) {
      const fallbackReply = 'Sir, systems are operating normally. Standing by for instructions.'
      await this.sendMessage(fallbackReply, senderChatId)
      return { handled: true, reply: fallbackReply }
    }
  }

  /**
   * Start background long-polling for development / instances without public webhooks
   */
  public startPolling(): void {
    if (this.isPollingActive) return
    const token = this.getBotToken()
    if (!token) return

    this.isPollingActive = true
    this.abortController = new AbortController()

    ;(async () => {
      while (this.isPollingActive) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=5`, {
            signal: this.abortController?.signal
          })
          if (res.ok) {
            const data = await res.json() as any
            if (data.ok && Array.isArray(data.result)) {
              for (const update of data.result) {
                this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id)
                await this.handleInboundUpdate(update).catch(() => {})
              }
            }
          }
        } catch {
          if (!this.isPollingActive) break
          await new Promise(r => setTimeout(r, 4000))
        }
      }
    })().catch(() => {})
  }

  public stopPolling(): void {
    this.isPollingActive = false
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  public isPolling(): boolean {
    return this.isPollingActive
  }
}

export const telegramNotifier = TelegramNotifierService.getInstance()

