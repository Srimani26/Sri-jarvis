// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. MARK-V Polymorphic Production Database Boundary
 * Supports:
 * 1. Managed PostgreSQL (via DATABASE_URL = postgresql://...) with PrismaPg adapter.
 * 2. SQLite / LibSQL local development (via file:./dev.db) with PrismaLibSql adapter.
 * 
 * Environments explicitly classified:
 * - LOCAL_DEVELOPMENT (SQLite, ephemeral or local dev.db)
 * - STAGING (PostgreSQL / LibSQL replica)
 * - PRODUCTION (Managed PostgreSQL, REQUIRED for production durability)
 */

import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import pg from 'pg';

export type DatabaseEnvironment = 'LOCAL_DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
export type DurabilityClassification = 'PRODUCTION_DURABLE' | 'NOT_PRODUCTION_DURABLE';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

const rawDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');

let adapter: any;
if (isPostgres) {
  const pool = globalForPrisma.pgPool ?? new pg.Pool({ connectionString: rawDbUrl });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.pgPool = pool;
  adapter = new PrismaPg(pool);
} else {
  // Clean url for LibSQL adapter if needed (strip unsupported params like connection_limit)
  const cleanUrl = rawDbUrl.replace(/([?&])connection_limit=\d+(&?)/, '$1').replace(/[?&]$/, '');
  adapter = new PrismaLibSql({
    url: cleanUrl,
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    __internal: {
      configOverride: (config: any) => ({
        ...config,
        activeProvider: isPostgres ? 'postgresql' : 'sqlite',
      }),
    },
  } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Classify environment and persistence assumptions
 */
export function getEnvironmentClassification(): DatabaseEnvironment {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.RENDER_GIT_BRANCH === 'staging' || process.env.STAGE === 'staging') {
      return 'STAGING';
    }
    return 'PRODUCTION';
  }
  return 'LOCAL_DEVELOPMENT';
}

/**
 * Evaluate durability based on provider and hosting environment
 */
export function getDurabilityClassification(): DurabilityClassification {
  if (isPostgres) {
    return 'PRODUCTION_DURABLE';
  }
  // SQLite on Render Free is ephemeral
  return 'NOT_PRODUCTION_DURABLE';
}

export interface DatabaseDiagnostics {
  provider: 'postgresql' | 'sqlite';
  environment: DatabaseEnvironment;
  durability: DurabilityClassification;
  status: 'CONNECTED' | 'DISCONNECTED';
  latencyMs: number;
  details: string;
  connected: boolean;
  error?: string | null;
  storageType: 'postgresql' | 'sqlite';
  durable: boolean;
}

/**
 * Perform startup database health check and validation
 */
export async function validateDatabaseConnectivity(): Promise<DatabaseDiagnostics> {
  const startTime = Date.now();
  const env = getEnvironmentClassification();
  const durability = getDurabilityClassification();
  const provider = isPostgres ? 'postgresql' : 'sqlite';

  try {
    // Deterministic validation query
    await prisma.$queryRawUnsafe('SELECT 1');
    const latencyMs = Date.now() - startTime;

    return {
      provider,
      environment: env,
      durability,
      status: 'CONNECTED',
      latencyMs,
      connected: true,
      error: null,
      storageType: provider,
      durable: durability === 'PRODUCTION_DURABLE',
      details: isPostgres
        ? 'Connected to Managed PostgreSQL. Data and task states are persistent across restarts.'
        : 'Running on SQLite. Note: On container-restart platforms (e.g., Render Free), storage is NOT production-durable.',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      provider,
      environment: env,
      durability,
      status: 'DISCONNECTED',
      latencyMs,
      connected: false,
      error: err?.message || String(err),
      storageType: provider,
      durable: false,
      details: `Database connection error: ${err?.message || err}`,
    };
  }
}
