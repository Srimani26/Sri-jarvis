/**
 * J.A.R.V.I.S. MARK-V Lead Deduplication Service
 * Multi-layer persistence ensuring no freelance opportunity is alerted more than once:
 * Layer 1: In-memory cache for sub-millisecond lookup
 * Layer 2: Persistent JSON registry at data/processed_leads.json
 * Layer 3: SQLite / Database table 'scouted_leads'
 * Layer 4: TaskStore audit trail cross-check
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { prisma } from '../lib/db';
import { TaskStore } from '../kernel/TaskStore';

export interface ProcessedLeadRecord {
  id: string;
  url: string;
  title: string;
  payoutUSD: number;
  payoutINR: number;
  processedAt: string;
}

export class LeadDeduplicationService {
  private static dataDir = resolve(process.cwd(), 'data');
  private static leadsFile = join(LeadDeduplicationService.dataDir, 'processed_leads.json');
  private static cache: Map<string, ProcessedLeadRecord> = new Map();
  private static dbInitialized = false;

  private static ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    if (!existsSync(this.leadsFile)) {
      writeFileSync(this.leadsFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  /**
   * Initialize SQLite scouted_leads table and populate memory cache
   */
  public static async init(): Promise<void> {
    this.ensureDataDir();

    // 1. Load from file into cache
    try {
      const raw = readFileSync(this.leadsFile, 'utf-8');
      const records: ProcessedLeadRecord[] = JSON.parse(raw);
      for (const rec of records) {
        if (rec.id) this.cache.set(rec.id, rec);
        if (rec.url) this.cache.set(rec.url, rec);
      }
    } catch {}

    // 2. Initialize SQLite table if supported
    if (!this.dbInitialized) {
      try {
        await (prisma as any).$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS scouted_leads (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE,
            title TEXT,
            payout_usd REAL,
            payout_inr REAL,
            created_at TEXT
          );
        `);
        this.dbInitialized = true;
      } catch (err: any) {
        // Non-blocking if raw SQL not supported in current adapter
        this.dbInitialized = true;
      }
    }
  }

  /**
   * Check whether a job ID or URL has already been processed and alerted
   */
  public static async isProcessed(id: string, url?: string): Promise<boolean> {
    await this.init();

    // 1. In-memory check
    if (this.cache.has(id)) return true;
    if (url && this.cache.has(url)) return true;

    // 2. Database check (scouted_leads)
    try {
      const dbRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT id FROM scouted_leads WHERE id = $1 OR url = $2 LIMIT 1;`,
        id,
        url || id
      );
      if (dbRows && dbRows.length > 0) {
        return true;
      }
    } catch {}

    // 3. Fallback: Check TaskStore task_events or AgentTasks
    try {
      const existingTask = await (prisma as any).agentTask.findFirst({
        where: {
          OR: [
            { description: { contains: id } },
            url ? { description: { contains: url } } : { id: 'none' },
          ],
        },
        select: { id: true },
      });
      if (existingTask) {
        return true;
      }
    } catch {}

    return false;
  }

  /**
   * Record lead as processed across memory, file, and SQLite
   */
  public static async markProcessed(lead: {
    id: string;
    url?: string;
    title: string;
    payoutUSD: number;
    payoutINR: number;
  }): Promise<void> {
    await this.init();

    const record: ProcessedLeadRecord = {
      id: lead.id,
      url: lead.url || lead.id,
      title: lead.title,
      payoutUSD: lead.payoutUSD,
      payoutINR: lead.payoutINR,
      processedAt: new Date().toISOString(),
    };

    // 1. In-memory
    this.cache.set(record.id, record);
    if (record.url) this.cache.set(record.url, record);

    // 2. Persist to file
    try {
      const records = Array.from(new Set(Array.from(this.cache.values())));
      writeFileSync(this.leadsFile, JSON.stringify(records, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[LeadDeduplicationService] Failed to write leads file:', e?.message);
    }

    // 3. Persist to SQLite scouted_leads table
    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT OR REPLACE INTO scouted_leads (id, url, title, payout_usd, payout_inr, created_at)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        record.id,
        record.url,
        record.title,
        record.payoutUSD,
        record.payoutINR,
        record.processedAt
      );
    } catch {}
  }

  /**
   * Total number of unique processed leads
   */
  public static async getProcessedCount(): Promise<number> {
    await this.init();
    const unique = new Set(Array.from(this.cache.values()).map((r) => r.id));
    return unique.size;
  }

  /**
   * Clear processed leads (for testing/reset)
   */
  public static async clear(): Promise<void> {
    this.cache.clear();
    this.ensureDataDir();
    writeFileSync(this.leadsFile, JSON.stringify([], null, 2), 'utf-8');
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM scouted_leads;`);
    } catch {}
  }
}
