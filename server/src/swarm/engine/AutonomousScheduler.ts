/**
 * AutonomousScheduler.ts — 24x7 Autonomous Operations Daemon & Cron Schedule Engine
 * Target: src/swarm/engine/AutonomousScheduler.ts & server/src/swarm/engine/AutonomousScheduler.ts
 *
 * Implements:
 * 1. Persistent in-process cron task runner for Render.
 * 2. Default autonomous swarm routines:
 *    - NIGHTLY_REPO_INTEGRITY_SCAN (02:00 IST / 20:30 UTC) -> Aegis
 *    - MORNING_EXECUTIVE_BRIEF (08:00 IST / 02:30 UTC) -> Friday
 *    - SYSTEM_HEALTH_HEARTBEAT (Every 6 hours) -> Raphael
 * 3. Non-overlapping execution locks per job ID.
 * 4. Automatic dispatch to executeAutonomousTask & Proactive Telegram reporting.
 */

import { executeAutonomousTask } from './AgentLoop'
import { SwarmSpecialist } from './ModelRouter'
import { telegramNotifier } from '../../services/telegramNotifier'

export interface SwarmCronJob {
  id: string
  name: string
  cronExpression: string
  specialist: SwarmSpecialist
  directive: string
  lastRun?: number
  nextRun: number
  lastStatus?: 'SUCCESS' | 'FAILED'
  lastLatencyMs?: number
  lastSummary?: string
}

export class SwarmAutonomousScheduler {
  private static instance: SwarmAutonomousScheduler
  private jobs: Map<string, SwarmCronJob> = new Map()
  private executingJobs: Set<string> = new Set()
  private ticker: NodeJS.Timeout | null = null
  private isRunning = false

  public static getInstance(): SwarmAutonomousScheduler {
    if (!SwarmAutonomousScheduler.instance) {
      SwarmAutonomousScheduler.instance = new SwarmAutonomousScheduler()
    }
    return SwarmAutonomousScheduler.instance
  }

  constructor() {
    this.registerDefaultJobs()
  }

  /**
   * Register default sovereign autonomous routines
   */
  public registerDefaultJobs(): void {
    // 1. NIGHTLY_REPO_INTEGRITY_SCAN (02:00 IST / 20:30 UTC)
    this.registerJob({
      id: 'NIGHTLY_REPO_INTEGRITY_SCAN',
      name: 'Nightly Repository & Cyber Integrity Scan',
      cronExpression: '30 20 * * *',
      specialist: 'aegis',
      directive: 'Inspect git working tree, execute test suite, audit code syntax, and compile status report.'
    })

    // 2. MORNING_EXECUTIVE_BRIEF (08:00 IST / 02:30 UTC)
    this.registerJob({
      id: 'MORNING_EXECUTIVE_BRIEF',
      name: 'Morning Executive Brief & Market Intel',
      cronExpression: '30 2 * * *',
      specialist: 'friday',
      directive: 'Fetch live currency exchange rates (USD/INR), crypto market overview via Treg public routes, check server uptime, and summarize daily briefing.'
    })

    // 3. SYSTEM_HEALTH_HEARTBEAT (Every 6 hours)
    this.registerJob({
      id: 'SYSTEM_HEALTH_HEARTBEAT',
      name: 'System Health Heartbeat & Memory Audit',
      cronExpression: '0 */6 * * *',
      specialist: 'raphael',
      directive: 'Audit SessionMemoryManager entries, check API failover health, and prune expired temporary logs.'
    })

    // 4. DAILY_INVI_STORE_THEME_AUDIT (Daily 10:00 AM IST / 04:30 UTC)
    this.registerJob({
      id: 'DAILY_INVI_STORE_THEME_AUDIT',
      name: 'Daily Invi Luxury Theme & Store Audit',
      cronExpression: '30 4 * * *',
      specialist: 'raphael',
      directive: 'Audit Shopify Liquid templates in Invi luxury theme: verify sections/invi-register-popup.liquid syntax, check schema JSON formatting, drawer z-index stacking contexts, and mobile responsive layout consistency.'
    })

    // 5. HOURLY_REVENUE_PIPELINE_MONITOR (Every hour)
    this.registerJob({
      id: 'HOURLY_REVENUE_PIPELINE_MONITOR',
      name: 'Hourly Luxury Goods & Revenue Pipeline Monitor',
      cronExpression: '0 * * * *',
      specialist: 'midas',
      directive: 'Track e-commerce luxury consumer goods pricing, conversion funnels, currency exchange velocity, and identify high-yield profit opportunities.'
    })

    // 6. CONTINUOUS_CYBER_DEFENSE_SWEEP (Every 4 hours)
    this.registerJob({
      id: 'CONTINUOUS_CYBER_DEFENSE_SWEEP',
      name: 'Continuous Cyber Threat & Secret Leakage Defense',
      cronExpression: '0 */4 * * *',
      specialist: 'aegis',
      directive: 'Audit environment keys, verify zero-trust perimeter, inspect git diffs for leaked secrets, and verify API token quota health.'
    })

    // 7. WORKFLOW_AUTOMATION_SYNC (Every 6 hours)
    this.registerJob({
      id: 'WORKFLOW_AUTOMATION_SYNC',
      name: 'Autonomous Workflow & n8n Pipeline Sync',
      cronExpression: '30 */6 * * *',
      specialist: 'vortex',
      directive: 'Verify automated webhook handlers, Shopify order dispatch pipelines, and external API connectors.'
    })
  }

  /**
   * Register or replace a scheduled cron job
   */
  public registerJob(spec: {
    id: string
    name: string
    cronExpression: string
    specialist: SwarmSpecialist
    directive: string
  }): SwarmCronJob {
    const nextRun = this.calculateNextRun(spec.cronExpression)
    const job: SwarmCronJob = {
      ...spec,
      nextRun
    }
    this.jobs.set(spec.id, job)
    return job
  }

  public getJob(id: string): SwarmCronJob | undefined {
    return this.jobs.get(id)
  }

  public listJobs(): SwarmCronJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Simple Cron Parser to compute next execution timestamp
   */
  public calculateNextRun(cronExpression: string, fromDate = new Date()): number {
    const parts = cronExpression.trim().split(/\s+/)
    if (parts.length < 5) {
      // Default to 1 hour from now if expression invalid
      return fromDate.getTime() + 60 * 60 * 1000
    }

    const [minExp, hourExp] = parts

    // Case 1: Interval pattern "0 */6 * * *"
    if (hourExp.startsWith('*/')) {
      const step = parseInt(hourExp.replace('*/', ''), 10) || 6
      const next = new Date(fromDate)
      next.setUTCMinutes(0, 0, 0)
      const currentUTCHour = next.getUTCHours()
      const nextHour = (Math.floor(currentUTCHour / step) + 1) * step
      next.setUTCHours(nextHour)
      return next.getTime()
    }

    // Case 2: Specific UTC time "30 20 * * *" or "30 2 * * *"
    const targetMin = parseInt(minExp, 10) || 0
    const targetHour = parseInt(hourExp, 10) || 0

    const next = new Date(Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate(),
      targetHour,
      targetMin,
      0,
      0
    ))

    if (next.getTime() <= fromDate.getTime()) {
      next.setUTCDate(next.getUTCDate() + 1)
    }

    return next.getTime()
  }

  /**
   * Execute a scheduled job immediately with non-overlapping lock
   */
  public async executeJob(jobId: string): Promise<{ success: boolean; latencyMs: number; summary: string }> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found in AutonomousScheduler.`)
    }

    if (this.executingJobs.has(jobId)) {
      console.warn(`🔒 [AutonomousScheduler] Job ${jobId} is already executing. Skipping duplicate execution.`)
      return { success: false, latencyMs: 0, summary: 'Job already locked/executing.' }
    }

    this.executingJobs.add(jobId)
    const startTime = Date.now()
    console.log(`⏱️ [AutonomousScheduler] Executing routine [${job.id}] via ${job.specialist.toUpperCase()}: "${job.directive}"`)

    try {
      const result = await executeAutonomousTask(job.directive, job.specialist)
      const latencyMs = Date.now() - startTime
      const status: 'SUCCESS' | 'FAILED' = result.success ? 'SUCCESS' : 'FAILED'
      const summary = result.finalResponse || 'Routine completed successfully.'

      job.lastRun = Date.now()
      job.lastStatus = status
      job.lastLatencyMs = latencyMs
      job.lastSummary = summary
      job.nextRun = this.calculateNextRun(job.cronExpression)

      // Alert Master Sri via Telegram
      await telegramNotifier.sendSwarmUpdate(job.specialist, job.name, status, latencyMs, summary).catch(() => {})

      return { success: result.success, latencyMs, summary }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime
      const summary = `Execution error: ${err?.message || err}`

      job.lastRun = Date.now()
      job.lastStatus = 'FAILED'
      job.lastLatencyMs = latencyMs
      job.lastSummary = summary
      job.nextRun = this.calculateNextRun(job.cronExpression)

      await telegramNotifier.sendSwarmUpdate(job.specialist, job.name, 'FAILED', latencyMs, summary).catch(() => {})
      return { success: false, latencyMs, summary }
    } finally {
      this.executingJobs.delete(jobId)
    }
  }

  /**
   * Scheduler tick: checks for due jobs
   */
  public async tick(): Promise<void> {
    const now = Date.now()
    for (const job of this.jobs.values()) {
      if (now >= job.nextRun && !this.executingJobs.has(job.id)) {
        // Run non-blocking
        this.executeJob(job.id).catch((err) => {
          console.error(`⚠️ [AutonomousScheduler] Background execution error on ${job.id}:`, err?.message || err)
        })
      }
    }
  }

  /**
   * Start 24x7 scheduler loop
   */
  public start(intervalMs = 15000): void {
    if (this.isRunning) return
    this.isRunning = true

    this.ticker = setInterval(() => {
      this.tick().catch(() => {})
    }, intervalMs)

    if (this.ticker && typeof (this.ticker as any).unref === 'function') {
      (this.ticker as any).unref()
    }

    console.log('⚡ [AutonomousScheduler] 24x7 Swarm Autonomous Scheduler running.')
  }

  /**
   * Stop scheduler loop
   */
  public stop(): void {
    this.isRunning = false
    if (this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
    console.log('🛑 [AutonomousScheduler] Scheduler stopped.')
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }
}

export const swarmAutonomousScheduler = SwarmAutonomousScheduler.getInstance()

