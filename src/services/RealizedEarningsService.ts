/**
 * J.A.R.V.I.S. MARK-V Realized Earnings Service
 * Durable ledger of confirmed won cash and realized revenue.
 * Synchronized across:
 * 1. In-memory cache for instant telemetry
 * 2. SQLite / Database table 'realized_earnings'
 * 3. Persistent JSON file at data/realized_earnings.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { prisma } from '../lib/db';

export interface RealizedEarningRecord {
  id: string;
  taskId: string;
  title: string;
  amountINR: number;
  amountUSD: number;
  recordedAt: string;
  note?: string;
}

export class RealizedEarningsService {
  private static dataDir = resolve(process.cwd(), 'data');
  private static ledgerFile = join(RealizedEarningsService.dataDir, 'realized_earnings.json');
  private static cache: Map<string, RealizedEarningRecord> = new Map();
  private static dbInitialized = false;

  private static ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    if (!existsSync(this.ledgerFile)) {
      writeFileSync(this.ledgerFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static async init(): Promise<void> {
    this.ensureDataDir();

    // 1. Populate memory cache from JSON ledger
    try {
      const raw = readFileSync(this.ledgerFile, 'utf-8');
      const records: RealizedEarningRecord[] = JSON.parse(raw);
      for (const rec of records) {
        if (rec.id) this.cache.set(rec.id, rec);
      }
    } catch {}

    // 2. Initialize SQLite table if supported
    if (!this.dbInitialized) {
      try {
        await (prisma as any).$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS realized_earnings (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            title TEXT,
            amount_inr REAL,
            amount_usd REAL,
            recorded_at TEXT,
            note TEXT
          );
        `);
        this.dbInitialized = true;
      } catch {
        this.dbInitialized = true;
      }
    }
  }

  /**
   * Record confirmed won cash into ledger
   */
  public static async recordEarnings(entry: {
    taskId: string;
    title?: string;
    amountINR: number;
    amountUSD?: number;
    note?: string;
  }): Promise<RealizedEarningRecord> {
    await this.init();

    const id = `EARN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amountUSD = entry.amountUSD || Math.round(entry.amountINR / 84);

    const record: RealizedEarningRecord = {
      id,
      taskId: entry.taskId,
      title: entry.title || `Won Project ${entry.taskId}`,
      amountINR: entry.amountINR,
      amountUSD,
      recordedAt: new Date().toISOString(),
      note: entry.note || 'Won via Telegram Mobile Bot action button',
    };

    // 1. In-memory
    this.cache.set(record.id, record);

    // 2. Persist to file
    try {
      const records = Array.from(this.cache.values());
      writeFileSync(this.ledgerFile, JSON.stringify(records, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[RealizedEarningsService] Failed to write ledger file:', e?.message);
    }

    // 3. Persist to SQLite
    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO realized_earnings (id, task_id, title, amount_inr, amount_usd, recorded_at, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        record.id,
        record.taskId,
        record.title,
        record.amountINR,
        record.amountUSD,
        record.recordedAt,
        record.note || null
      );
    } catch {}

    return record;
  }

  /**
   * Compute total realized earnings in the given time window (default 24h)
   */
  public static async getTotalRealized(hoursWindow: number = 24): Promise<{
    totalINR: number;
    totalUSD: number;
    count: number;
    records: RealizedEarningRecord[];
  }> {
    await this.init();

    const thresholdTime = Date.now() - hoursWindow * 60 * 60 * 1000;
    const windowRecords = Array.from(this.cache.values()).filter(
      (r) => new Date(r.recordedAt).getTime() >= thresholdTime
    );

    let totalINR = 0;
    let totalUSD = 0;

    for (const r of windowRecords) {
      totalINR += r.amountINR;
      totalUSD += r.amountUSD;
    }

    return {
      totalINR,
      totalUSD,
      count: windowRecords.length,
      records: windowRecords,
    };
  }

  public static async listEarnings(): Promise<RealizedEarningRecord[]> {
    await this.init();
    return Array.from(this.cache.values());
  }

  public static async clear(): Promise<void> {
    this.cache.clear();
    this.ensureDataDir();
    writeFileSync(this.ledgerFile, JSON.stringify([], null, 2), 'utf-8');
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM realized_earnings;`);
    } catch {}
  }
}
