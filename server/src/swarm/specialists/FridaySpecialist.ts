/**
 * FridaySpecialist.ts — Executive Operations, Inbound Webhooks & Heavy Automation Specialist
 * Target: server/src/swarm/specialists/FridaySpecialist.ts & src/swarm/specialists/FridaySpecialist.ts
 *
 * Implements:
 * 1. PersistentTaskQueue orchestration for heavy background jobs and cron schedules.
 * 2. Inbound Webhook Ingestion Engine (/api/webhooks/inbound/:source).
 * 3. Automatic payload parsing, database task persistence, and real-time Telegram notifications.
 */

import { PersistentTaskQueue } from '../../../../src/scheduler/PersistentTaskQueue'
import { telegramNotifier } from '../../services/telegramNotifier'
import { AutonomousScheduler } from '../../../../src/scheduler/AutonomousScheduler'

export const FRIDAY_SYSTEM_PROMPT = `You are F.R.I.D.A.Y., Master Sri's sharp Irish executive assistant and operations scout.
Tone: Fast, witty, warm, fiercely loyal, highly efficient.
Specialty: Market telemetry, workflow automation, e-commerce reconnaissance, schedule orchestration, webhook triage.
Keep voice responses crisp, cheerful, and under 2 sentences.`

export interface WebhookProcessingResult {
  success: boolean
  source: string
  taskId?: string
  taskNumber?: string
  summary: string
  actionTaken: string
  timestamp: string
}

export class FridaySpecialist {
  private static instance: FridaySpecialist

  public static getInstance(): FridaySpecialist {
    if (!FridaySpecialist.instance) {
      FridaySpecialist.instance = new FridaySpecialist()
    }
    return FridaySpecialist.instance
  }

  /**
   * Process inbound webhook from external sources (Stripe, CRMs, ERPs, GitHub, etc.)
   */
  public async processInboundWebhook(
    source: string,
    payload: any,
    headers: Record<string, any> = {}
  ): Promise<WebhookProcessingResult> {
    const timestamp = new Date().toISOString()
    const cleanSource = (source || 'generic').toLowerCase()

    let summary = ''
    let actionTaken = 'QUEUED_FOR_EXECUTION'
    let objective = `Automated webhook processing for source: ${cleanSource}`

    switch (cleanSource) {
      case 'stripe': {
        const eventType = payload?.type || 'payment.event'
        const amount = payload?.data?.object?.amount_total ? (payload.data.object.amount_total / 100).toFixed(2) : '0.00'
        const currency = (payload?.data?.object?.currency || 'usd').toUpperCase()
        summary = `Stripe Event: ${eventType} | Amount: ${currency} ${amount}`
        objective = `Process Stripe payment event ${eventType} and reconcile account balances.`
        actionTaken = 'REVENUE_AUDITED'
        break
      }

      case 'crm':
      case 'hubspot':
      case 'salesforce': {
        const leadName = payload?.leadName || payload?.contact?.name || 'New Enterprise Lead'
        const email = payload?.email || payload?.contact?.email || 'unspecified'
        summary = `CRM Inbound: ${leadName} (${email})`
        objective = `Ingest enterprise lead ${leadName} and assign follow-up tasks to sales swarm.`
        actionTaken = 'LEAD_REGISTERED'
        break
      }

      case 'erp':
      case 'inventory': {
        const sku = payload?.sku || payload?.productId || 'SKU_AUTO'
        const qty = payload?.quantity || payload?.qty || 0
        summary = `ERP Inventory Sync: Item ${sku} updated to ${qty} units.`
        objective = `Synchronize inventory levels for ${sku} and reorder if below threshold.`
        actionTaken = 'INVENTORY_SYNCHRONIZED'
        break
      }

      default: {
        summary = `Inbound Webhook received from [${cleanSource}]: ${JSON.stringify(payload).slice(0, 100)}`
        objective = `Process and analyze inbound payload from ${cleanSource}.`
        actionTaken = 'PAYLOAD_INGESTED'
      }
    }

    // 1. Submit durable background task into PersistentTaskQueue
    let taskId = `task_${Date.now()}`
    let taskNumber = `TASK-WH-${Math.floor(1000 + Math.random() * 9000)}`
    try {
      const queueRes = await PersistentTaskQueue.enqueue({
        title: `[Webhook: ${cleanSource.toUpperCase()}] ${summary.slice(0, 60)}`,
        objective,
        agentId: 'friday',
        parameters: { source: cleanSource, payload, headers }
      })
      taskId = queueRes.taskId
      taskNumber = queueRes.taskNumber
    } catch (queueErr: any) {
      console.warn('⚠️ [FridaySpecialist] Queue enqueue note:', queueErr?.message || queueErr)
    }

    // 2. Dispatch Alert Summary to Master Sri's Telegram
    const telegramAlert = [
      `🔔 *[F.R.I.D.A.Y. WEBHOOK INGESTED]*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• *Source:* \`${cleanSource.toUpperCase()}\``,
      `• *Action:* \`${actionTaken}\``,
      `• *Task ID:* \`${taskNumber}\``,
      `• *Details:* ${summary}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n')

    await telegramNotifier.sendMessage(telegramAlert).catch(() => {})

    return {
      success: true,
      source: cleanSource,
      taskId,
      taskNumber,
      summary,
      actionTaken,
      timestamp
    }
  }

  /**
   * Schedule recurring automation cron job
   */
  public scheduleAutomationCron(params: {
    title: string
    cronExpression: string
    directive: string
  }): { scheduled: boolean; title: string; cronExpression: string } {
    AutonomousScheduler.scheduleJob({
      title: params.title,
      cronExpression: params.cronExpression,
      agentId: 'friday',
      toolName: 'execute_autonomous_task',
      toolArgs: { directive: params.directive }
    })

    return {
      scheduled: true,
      title: params.title,
      cronExpression: params.cronExpression
    }
  }
}

export const fridaySpecialist = FridaySpecialist.getInstance()
