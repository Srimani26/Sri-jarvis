import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const PROD_URL = 'https://sri-jarvis.onrender.com';
const secret = fs.readFileSync(path.join(process.cwd(), '.jarvis-secret'), 'utf8').trim();

const token = jwt.sign(
  { userId: 'cuid_54e3c69c0a2c44ca', username: 'SrimanikandanK' },
  secret,
  { expiresIn: '7d' }
);

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function verifyProduction() {
  await log('═════════════════════════════════════════════════════════════════');
  await log('STARTING PRODUCTION RENDER VERIFICATION SUITE');
  await log(`Target: ${PROD_URL}`);
  await log('═════════════════════════════════════════════════════════════════');

  const results = {
    target: PROD_URL,
    timestamp: new Date().toISOString(),
    endpoints: {}
  };

  // 1. Health check
  try {
    const start = Date.now();
    const res = await fetch(`${PROD_URL}/health`);
    const data = await res.json();
    const latency = Date.now() - start;
    results.endpoints.health = { status: res.status, latency, data };
    await log(`[HEALTH] Status: ${res.status} (${latency}ms) - cloudStatus: ${data.cloudStatus}`);
  } catch (e) {
    results.endpoints.health = { error: e.message };
    await log(`[HEALTH] ERROR: ${e.message}`);
  }

  // 2. Auth Diagnostics
  try {
    const start = Date.now();
    const res = await fetch(`${PROD_URL}/api/auth/diagnostics`, { headers });
    const data = await res.json();
    const latency = Date.now() - start;
    results.endpoints.authDiagnostics = { status: res.status, latency, data };
    await log(`[AUTH DIAGNOSTICS] Status: ${res.status} (${latency}ms) - authenticated: ${data.authenticated}, user: ${data.user?.username}`);
  } catch (e) {
    results.endpoints.authDiagnostics = { error: e.message };
    await log(`[AUTH DIAGNOSTICS] ERROR: ${e.message}`);
  }

  // 3. Specialist Agents Health
  try {
    const start = Date.now();
    const res = await fetch(`${PROD_URL}/api/agents/health`, { headers });
    const data = await res.json();
    const latency = Date.now() - start;
    results.endpoints.agentsHealth = { status: res.status, latency, count: data.agents?.length || Object.keys(data).length };
    await log(`[AGENTS HEALTH] Status: ${res.status} (${latency}ms) - Agents Count: ${data.agents?.length || Object.keys(data).length}`);
  } catch (e) {
    results.endpoints.agentsHealth = { error: e.message };
    await log(`[AGENTS HEALTH] ERROR: ${e.message}`);
  }

  // 4. Test Production Task Dispatch
  try {
    const start = Date.now();
    const res = await fetch(`${PROD_URL}/api/agents/dispatch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId: 'aegis',
        task: 'Production Render runtime verification: audit health and memory'
      })
    });
    const data = await res.json();
    const latency = Date.now() - start;
    results.endpoints.taskDispatch = { status: res.status, latency, data };
    await log(`[TASK DISPATCH] Status: ${res.status} (${latency}ms) - taskId: ${data.taskId}, durationMs: ${data.durationMs}`);
  } catch (e) {
    results.endpoints.taskDispatch = { error: e.message };
    await log(`[TASK DISPATCH] ERROR: ${e.message}`);
  }

  // Save report
  const outPath = path.join(process.cwd(), '.test-artifacts', 'production_render_verification.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  await log(`\nProduction verification saved to: ${outPath}`);
  await log('═════════════════════════════════════════════════════════════════');
}

verifyProduction().catch(console.error);
