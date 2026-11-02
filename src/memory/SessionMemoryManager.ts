/**
 * SessionMemoryManager.ts — Progressive 3-Tier Persistent Memory Engine
 * Inspired by: thedotmack/claude-mem & patchy631/ai-engineering-hub
 * Target: src/memory/SessionMemoryManager.ts & server/src/memory/SessionMemoryManager.ts
 *
 * Implements a 3-layer index:
 * 1. Observation Recorder: Intercepts every tool execution and user directive.
 * 2. Timeline Summarizer: Micro-summaries linked by context_id.
 * 3. Detail Index: Full observation records stored in Neon PostgreSQL / in-memory cache.
 */

import pg from 'pg'
import { randomUUID } from 'node:crypto'
import { sanitizePayload, sanitizeString } from '../security/SecretSanitizer'

export type MemoryTier = 'OBSERVATION' | 'TIMELINE' | 'SUMMARY'

export interface MemoryRecord {
  id: string
  contextId: string
  tier: MemoryTier
  content: string
  metadata: Record<string, any>
  createdAt: Date
}

export class SessionMemoryManager {
  private static instance: SessionMemoryManager
  private pool: pg.Pool | null = null
  private initialized = false
  private memoryCache: MemoryRecord[] = []

  public static getInstance(): SessionMemoryManager {
    if (!SessionMemoryManager.instance) {
      SessionMemoryManager.instance = new SessionMemoryManager()
    }
    return SessionMemoryManager.instance
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
        console.warn('⚠️ [SessionMemoryManager] Neon DB connection note:', err?.message || err)
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
        CREATE TABLE IF NOT EXISTS agent_memories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          context_id VARCHAR(100) NOT NULL,
          tier VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_agent_memories_context ON agent_memories(context_id);
        CREATE INDEX IF NOT EXISTS idx_agent_memories_tier ON agent_memories(tier);
      `)
      this.initialized = true
    } catch (err: any) {
      console.warn('⚠️ [SessionMemoryManager] Schema initialization fallback to cache:', err?.message || err)
      this.initialized = true
    }
  }

  /**
   * 1. Record an observation from tool execution or directive
   */
  public async recordObservation(
    contextId: string,
    directive: string,
    toolName: string,
    output: any,
    summary?: string
  ): Promise<MemoryRecord> {
    await this.initSchema()

    const cleanDirective = sanitizeString(directive)
    const cleanOutput = sanitizePayload(output)
    const cleanSummary = summary ? sanitizeString(summary) : `${toolName} executed for: ${cleanDirective.substring(0, 60)}`

    const memory: MemoryRecord = {
      id: randomUUID(),
      contextId: contextId || 'global_session',
      tier: 'OBSERVATION',
      content: cleanSummary,
      metadata: {
        toolName,
        directive: cleanDirective,
        outputSummary: typeof cleanOutput === 'string' ? cleanOutput.substring(0, 500) : cleanOutput
      },
      createdAt: new Date()
    }

    this.memoryCache.push(memory)

    const pool = await this.getPool()
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO agent_memories (id, context_id, tier, content, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [memory.id, memory.contextId, memory.tier, memory.content, JSON.stringify(memory.metadata), memory.createdAt]
        )
      } catch (err: any) {
        console.warn('⚠️ [SessionMemoryManager] Neon DB insert fallback to cache:', err?.message || err)
      }
    }

    return memory
  }

  /**
   * 2. Search memories by text / semantic match
   */
  public async searchMemories(query: string, limit = 5): Promise<MemoryRecord[]> {
    await this.initSchema()
    const cleanQuery = query.toLowerCase().trim()

    const pool = await this.getPool()
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, context_id AS "contextId", tier, content, metadata, created_at AS "createdAt"
           FROM agent_memories
           WHERE LOWER(content) LIKE $1 OR LOWER(metadata::text) LIKE $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [`%${cleanQuery}%`, limit]
        )
        if (res.rows.length > 0) {
          return res.rows.map(r => ({
            ...r,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
          }))
        }
      } catch {
        // Fallback to in-memory cache
      }
    }

    // In-memory search fallback
    return this.memoryCache
      .filter(m => m.content.toLowerCase().includes(cleanQuery) || JSON.stringify(m.metadata).toLowerCase().includes(cleanQuery))
      .slice(-limit)
      .reverse()
  }

  /**
   * 3. Get ordered timeline of memories for a context / session
   */
  public async getTimeline(contextId: string): Promise<MemoryRecord[]> {
    await this.initSchema()

    const pool = await this.getPool()
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, context_id AS "contextId", tier, content, metadata, created_at AS "createdAt"
           FROM agent_memories
           WHERE context_id = $1
           ORDER BY created_at ASC`,
          [contextId]
        )
        if (res.rows.length > 0) {
          return res.rows.map(r => ({
            ...r,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
          }))
        }
      } catch {
        // Fallback to cache
      }
    }

    return this.memoryCache.filter(m => m.contextId === contextId)
  }

  /**
   * 4. Retrieve single observation detail
   */
  public async getObservationDetail(id: string): Promise<MemoryRecord | null> {
    await this.initSchema()

    const pool = await this.getPool()
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, context_id AS "contextId", tier, content, metadata, created_at AS "createdAt"
           FROM agent_memories
           WHERE id = $1`,
          [id]
        )
        if (res.rows[0]) {
          const r = res.rows[0]
          return {
            ...r,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
          }
        }
      } catch {
        // Fallback to cache
      }
    }

    return this.memoryCache.find(m => m.id === id) || null
  }
}

export const sessionMemoryManager = SessionMemoryManager.getInstance()

