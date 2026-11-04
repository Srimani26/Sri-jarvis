/**
 * taskAuditService.ts — Neon PostgreSQL Swarm Telemetry & Audit Service
 * Target: server/src/services/taskAuditService.ts & src/services/taskAuditService.ts
 *
 * Persists swarm directives, specialist assignments, tool execution telemetry,
 * latencies, and execution outputs directly to Neon PostgreSQL.
 */

import pg from 'pg'
import { randomUUID } from 'node:crypto'
import { sanitizePayload, sanitizeString } from '../security/SecretSanitizer'

export interface SwarmTaskRecord {
  id: string
  directive: string
  specialist: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  result?: string
  createdAt: Date
  completedAt?: Date
}

export interface SwarmToolExecutionRecord {
  id: string
  taskId: string
  toolName: string
  arguments: any
  output: any
  status: 'SUCCESS' | 'ERROR'
  latencyMs: number
  executedAt: Date
}

export class TaskAuditService {
  private static instance: TaskAuditService
  private pool: pg.Pool | null = null
  private initialized = false
  private inMemoryTasks: Map<string, SwarmTaskRecord> = new Map()
  private inMemoryExecutions: SwarmToolExecutionRecord[] = []
  private legacyIdToUuidMap: Map<string, string> = new Map()

  public static getInstance(): TaskAuditService {
    if (!TaskAuditService.instance) {
      TaskAuditService.instance = new TaskAuditService()
    }
    return TaskAuditService.instance
  }

  public isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  }

  public ensureValidUUID(id?: string): string {
    if (!id) return randomUUID()
    if (this.isValidUUID(id)) return id

    let mapped = this.legacyIdToUuidMap.get(id)
    if (!mapped) {
      mapped = randomUUID()
      this.legacyIdToUuidMap.set(id, mapped)
    }
    return mapped
  }

  private async getPool(): Promise<pg.Pool | null> {
    const rawDbUrl = process.env.DATABASE_URL
    if (!rawDbUrl || (!rawDbUrl.startsWith('postgres://') && !rawDbUrl.startsWith('postgresql://'))) {
      return null
    }

    if (!this.pool) {
      try {
        this.pool = new pg.Pool({
          connectionString: rawDbUrl,
          connectionTimeoutMillis: 5000,
          ssl: rawDbUrl.includes('sslmode=require') || rawDbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
        })
      } catch (err: any) {
        console.warn('⚠️ [TaskAuditService] Neon Pool creation note:', err?.message || err)
      }
    }
    return this.pool
  }

  public async initSchema(): Promise<void> {
    if (this.initialized) return

    const pool = await this.getPool()
    if (!pool) {
      this.initialized = true
      return
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS swarm_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          directive TEXT NOT NULL,
          specialist VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'RUNNING',
          result TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS swarm_tool_executions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID REFERENCES swarm_tasks(id) ON DELETE CASCADE,
          tool_name VARCHAR(100) NOT NULL,
          arguments JSONB,
          output JSONB,
          status VARCHAR(20),
          latency_ms INTEGER,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      this.initialized = true
    } catch (err: any) {
      console.warn('⚠️ [TaskAuditService] Schema initialization note (in-memory audit active):', err?.message || err)
      this.initialized = true
    }
  }

  /**
   * Record task initiation
   */
  public async createTask(directive: string, specialist: string, customTaskId?: string): Promise<string> {
    await this.initSchema()
    const taskId = customTaskId ? this.ensureValidUUID(customTaskId) : randomUUID()
    const cleanDirective = sanitizeString(directive)

    const task: SwarmTaskRecord = {
      id: taskId,
      directive: cleanDirective,
      specialist,
      status: 'RUNNING',
      createdAt: new Date()
    }

    this.inMemoryTasks.set(taskId, task)

    const pool = await this.getPool()
    if (pool) {
      try {
        const dbTaskId = this.ensureValidUUID(taskId)
        await pool.query(
          `INSERT INTO swarm_tasks (id, directive, specialist, status, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [dbTaskId, cleanDirective, specialist, 'RUNNING', task.createdAt]
        )
      } catch (err: any) {
        console.warn('[TaskAuditService] Database insert fallback to in-memory:', err?.message || err)
      }
    }

    return taskId
  }

  /**
   * Log tool execution with latency, args, and output
   */
  public async logToolExecution(
    taskId: string,
    toolName: string,
    args: any,
    output: any,
    status: 'SUCCESS' | 'ERROR',
    latencyMs: number
  ): Promise<void> {
    await this.initSchema()
    const execId = randomUUID()
    const cleanArgs = sanitizePayload(args)
    const cleanOutput = sanitizePayload(output)

    const record: SwarmToolExecutionRecord = {
      id: execId,
      taskId,
      toolName,
      arguments: cleanArgs,
      output: cleanOutput,
      status,
      latencyMs,
      executedAt: new Date()
    }

    this.inMemoryExecutions.push(record)

    const pool = await this.getPool()
    if (pool) {
      try {
        const dbTaskId = this.ensureValidUUID(taskId)
        await pool.query(
          `INSERT INTO swarm_tool_executions (id, task_id, tool_name, arguments, output, status, latency_ms, executed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            execId,
            dbTaskId,
            toolName,
            JSON.stringify(cleanArgs || {}),
            JSON.stringify(cleanOutput || {}),
            status,
            latencyMs,
            record.executedAt
          ]
        )
      } catch (err: any) {
        console.warn('[TaskAuditService] Database execution log note:', err?.message || err)
      }
    }
  }

  /**
   * Complete task with outcome and deliverables
   */
  public async completeTask(taskId: string, status: 'COMPLETED' | 'FAILED', result: string): Promise<void> {
    await this.initSchema()
    const task = this.inMemoryTasks.get(taskId)
    const completedAt = new Date()
    const cleanResult = sanitizeString(result)

    if (task) {
      task.status = status
      task.result = cleanResult
      task.completedAt = completedAt
    }

    const pool = await this.getPool()
    if (pool) {
      try {
        const dbTaskId = this.ensureValidUUID(taskId)
        await pool.query(
          `UPDATE swarm_tasks SET status = $1, result = $2, completed_at = $3 WHERE id = $4`,
          [status, cleanResult, completedAt, dbTaskId]
        )
      } catch (err: any) {
        console.warn('[TaskAuditService] Database update note:', err?.message || err)
      }
    }
  }

  public getTask(taskId: string): SwarmTaskRecord | undefined {
    return this.inMemoryTasks.get(taskId)
  }

  public getExecutionsForTask(taskId: string): SwarmToolExecutionRecord[] {
    return this.inMemoryExecutions.filter(e => e.taskId === taskId)
  }

  public getRecentExecutions(limit = 20): SwarmToolExecutionRecord[] {
    return this.inMemoryExecutions.slice(-limit)
  }

  public getRecentLogs(limit = 20): SwarmToolExecutionRecord[] {
    return this.getRecentExecutions(limit)
  }

  public getAllTasks(): SwarmTaskRecord[] {
    return Array.from(this.inMemoryTasks.values())
  }
}

export const taskAuditService = TaskAuditService.getInstance()

