#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

console.log(`🗄️ [db-startup] Initializing J.A.R.V.I.S. database layer...`);
console.log(`🗄️ [db-startup] Target database type: ${isPostgres ? 'POSTGRESQL (Durable Cloud)' : 'SQLITE (Local Development)'}`);

try {
  let schema = readFileSync(schemaPath, 'utf-8');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  // Update datasource db provider dynamically
  const updatedSchema = schema.replace(
    /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*["'][^"']+["'][\s\S]*?\}/,
    `datasource db {\n  provider = "${targetProvider}"\n}`
  );

  if (schema !== updatedSchema) {
    writeFileSync(schemaPath, updatedSchema, 'utf-8');
    console.log(`🗄️ [db-startup] Updated schema.prisma datasource provider to: "${targetProvider}"`);
  }

  // Push schema to the database (creates tables automatically on Neon/Postgres or SQLite)
  console.log(`🗄️ [db-startup] Synchronizing database tables with Prisma...`);
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      timeout: 60000,
    });
    console.log(`✅ [db-startup] Database tables successfully synchronized!`);
  } catch (err) {
    console.warn(`⚠️ [db-startup] Non-fatal schema push warning:`, err?.message || err);
  }
} catch (err) {
  console.error(`⚠️ [db-startup] Error adjusting schema provider:`, err);
}

// Start the production server
console.log(`🚀 [db-startup] Launching J.A.R.V.I.S. server...`);
const serverProc = spawn('node', ['server.mjs'], { stdio: 'inherit' });

serverProc.on('exit', (code) => {
  process.exit(code ?? 0);
});
