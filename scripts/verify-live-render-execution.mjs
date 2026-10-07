import fs from 'node:fs';
import path from 'node:path';

const PROD_URL = 'https://sri-jarvis.onrender.com';

async function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function runProductionTests() {
  await log('═════════════════════════════════════════════════════════════════');
  await log('J.A.R.V.I.S. LIVE PRODUCTION RENDER ACCEPTANCE RUNNER');
  await log(`Target URL: ${PROD_URL}`);
  await log('═════════════════════════════════════════════════════════════════');

  const report = {
    target: PROD_URL,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // 1. Production Login to obtain real active Render JWT
  await log('\n--- STEP 1: Live Production Authentication ---');
  const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SrimanikandanK', password: 'SriJarvisMaster2026!' })
  });

  if (!loginRes.ok) {
    throw new Error(`Production login failed with status ${loginRes.status}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  const refreshToken = loginData.refreshToken;
  await log(`Production Token Issued: User=${loginData.user?.username}, ID=${loginData.user?.id}`);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  report.tests.authLogin = {
    status: 'PASS',
    user: loginData.user,
    tokenIssued: !!token,
    refreshTokenIssued: !!refreshToken
  };

  // 2. Production Auth Diagnostics
  await log('\n--- STEP 2: Production Auth Diagnostics ---');
  const diagRes = await fetch(`${PROD_URL}/api/auth/diagnostics`, { headers: authHeaders });
  const diagData = await diagRes.json();
  await log(`Auth Diagnostics: status=${diagRes.status}, user=${diagData.user?.username}, authenticated=${diagData.authenticated}`);
  report.tests.authDiagnostics = {
    status: diagRes.status === 200 ? 'PASS' : 'FAIL',
    data: diagData
  };

  // 3. Production Token Refresh
  await log('\n--- STEP 3: Production Token Refresh ---');
  const refreshRes = await fetch(`${PROD_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    }
  });
  const refreshData = await refreshRes.json();
  await log(`Token Refresh: status=${refreshRes.status}, newToken=${!!refreshData.token}`);
  report.tests.tokenRefresh = {
    status: refreshRes.status === 200 ? 'PASS' : 'FAIL',
    refreshed: !!refreshData.token
  };

  // 4. Production Specialist Agents Health
  await log('\n--- STEP 4: Production Specialist Agents Health ---');
  const agentsRes = await fetch(`${PROD_URL}/api/agents/health`, { headers: authHeaders });
  const agentsData = await agentsRes.json();
  const specialistList = ['aegis', 'vortex', 'midas', 'cerebro', 'stark_os'];
  const agentResults = {};
  for (const spec of specialistList) {
    const res = await fetch(`${PROD_URL}/api/agents/health/${spec}`, { headers: authHeaders });
    const data = await res.json();
    agentResults[spec] = data.agent;
    await log(`Specialist [${spec}]: health=${data.agent?.health}, role=${data.agent?.role}`);
  }
  report.tests.specialistAgents = agentResults;

  // 5. Production Provider Capability Registry Check
  await log('\n--- STEP 5: Production Provider Registry & Health ---');
  const regRes = await fetch(`${PROD_URL}/api/providers/registry`);
  const regData = await regRes.json();
  await log(`Registered Providers on Render: ${regData.providers?.map(p => `${p.id} (${p.health})`).join(', ')}`);

  const geminiHealthRes = await fetch(`${PROD_URL}/api/providers/health/gemini`, { method: 'POST' });
  const geminiHealth = await geminiHealthRes.json();
  await log(`Live Gemini API from Render: healthy=${geminiHealth.healthy}, latency=${geminiHealth.latencyMs}ms`);

  report.tests.providers = {
    registry: regData.providers,
    geminiLiveLatencyMs: geminiHealth.latencyMs,
    geminiHealthy: geminiHealth.healthy
  };

  // 6. Production Task Execution: Dispatch REAL task through Render
  await log('\n--- STEP 6: Execute Real Autonomous Task on Render ---');
  const taskStartTime = Date.now();
  const dispatchRes = await fetch(`${PROD_URL}/api/agents/dispatch`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      agentId: 'aegis',
      task: 'Production Render Acceptance: verify database persistence, provider telemetry, and execution kernel'
    })
  });

  const dispatchData = await dispatchRes.json();
  const totalTaskTime = Date.now() - taskStartTime;
  await log(`Production Task Dispatched: status=${dispatchRes.status}, taskId=${dispatchData.taskId}, durationMs=${dispatchData.durationMs || totalTaskTime}`);
  await log(`Execution Output Snippet: ${(dispatchData.result?.result || dispatchData.message || JSON.stringify(dispatchData)).slice(0, 200)}...`);

  report.tests.taskExecution = {
    status: dispatchRes.status === 200 ? 'PASS' : 'FAIL',
    taskId: dispatchData.taskId,
    taskNumber: dispatchData.taskNumber,
    agent: dispatchData.agent,
    durationMs: dispatchData.durationMs || totalTaskTime,
    resultSummary: (dispatchData.result?.result || dispatchData.message || '').slice(0, 300)
  };

  // 7. Verify Task Persisted in Production Database
  await log('\n--- STEP 7: Verify Production Task Persistence ---');
  const tasksListRes = await fetch(`${PROD_URL}/api/tasks`, { headers: authHeaders });
  const tasksListData = await tasksListRes.json();
  const persistedTasks = tasksListData.tasks || [];
  await log(`Total Persisted Tasks in Production DB: ${persistedTasks.length}`);
  const foundTask = persistedTasks.find(t => t.id === dispatchData.taskId || t.taskNumber === dispatchData.taskNumber);
  await log(`Dispatched Task Found in DB: ${Boolean(foundTask)}`);

  report.tests.taskPersistence = {
    status: foundTask ? 'PASS' : 'FAIL',
    totalTasksInDB: persistedTasks.length,
    foundDispatchedTask: Boolean(foundTask)
  };

  // Save report
  const outPath = path.join(process.cwd(), '.test-artifacts', 'production_render_live_acceptance.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  await log(`\nFull Production Acceptance Report written to: ${outPath}`);
  await log('═════════════════════════════════════════════════════════════════');
}

runProductionTests().catch(err => {
  console.error('Production acceptance tests failed:', err);
  process.exit(1);
});
