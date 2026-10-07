import fs from 'node:fs';
import path from 'node:path';

const PROD_URL = 'https://sri-jarvis.onrender.com';

async function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function verifyAllAgents() {
  await log('═════════════════════════════════════════════════════════════════');
  await log('PRODUCTION AGENT WORKFORCE ACCEPTANCE TEST');
  await log(`Target: ${PROD_URL}`);
  await log('═════════════════════════════════════════════════════════════════');

  // Step 1: Login to get fresh production JWT
  const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SrimanikandanK', password: 'SriJarvisMaster2026!' })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const { token, user } = await loginRes.json();
  await log(`Authenticated on Render as: ${user?.username} (ID: ${user?.id})`);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const tasksToRun = [
    {
      agentId: 'aegis',
      role: 'software_engineer',
      objective: 'Audit project TypeScript compiler settings and package structure',
      plan: ['Inspect tsconfig.json strictness', 'Analyze package.json dependency tree', 'Report architectural health']
    },
    {
      agentId: 'vortex',
      role: 'automation_agent',
      objective: 'Formulate an enterprise webhook automation pipeline schema for order notifications',
      plan: ['Define webhook ingestion payload', 'Specify idempotency header check', 'Generate routing event nodes']
    },
    {
      agentId: 'midas',
      role: 'business_agent',
      objective: 'Calculate unit economics and net margin for a $499/mo B2B SaaS product with 2% monthly churn',
      plan: ['Determine customer lifetime (50 months)', 'Calculate LTV ($24,950)', 'Compute CAC payback period and margins']
    },
    {
      agentId: 'cerebro',
      role: 'research_agent',
      objective: 'Synthesize comparative trade-off analysis of SQLite vs PostgreSQL for multi-tenant AI systems',
      plan: ['Evaluate single-file concurrency limits', 'Assess horizontal scalability & connection pooling', 'Provide definitive migration verdict']
    },
    {
      agentId: 'stark_os',
      role: 'devops_engineer',
      objective: 'Collect live hardware memory metrics, process uptime, and container operating status',
      plan: ['Query Node.js heap statistics', 'Inspect OS platform and architecture', 'Verify WAL mode status']
    }
  ];

  const agentReports = [];

  for (const t of tasksToRun) {
    await log(`\n--- Executing Task for Agent [${t.agentId.toUpperCase()} (${t.role})] ---`);
    const startTime = new Date().toISOString();
    const startMs = Date.now();

    try {
      const res = await fetch(`${PROD_URL}/api/agents/dispatch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agentId: t.agentId,
          task: t.objective
        })
      });

      const data = await res.json();
      const durationMs = Date.now() - startMs;
      const endTime = new Date().toISOString();

      await log(`Status: ${res.status} | Task ID: ${data.taskId} | Number: ${data.taskNumber} | Duration: ${data.durationMs || durationMs}ms`);

      const resultText = data.result?.result || data.message || JSON.stringify(data);
      await log(`Output Preview: ${resultText.slice(0, 150)}...`);

      // Verify task persistence
      let persisted = false;
      if (data.taskId) {
        const checkRes = await fetch(`${PROD_URL}/api/tasks/${data.taskId}`, { headers });
        if (checkRes.ok) {
          const taskData = await checkRes.json();
          persisted = Boolean(taskData.task);
        }
      }

      agentReports.push({
        taskId: data.taskId || `TASK-FALLBACK-${Date.now()}`,
        taskNumber: data.taskNumber || 'UNKNOWN',
        agentId: t.agentId,
        role: t.role,
        objective: t.objective,
        plan: t.plan,
        status: res.status === 200 ? 'COMPLETED' : 'FAILED',
        httpStatus: res.status,
        startTime,
        endTime,
        durationMs: data.durationMs || durationMs,
        persistedInDB: persisted,
        outputSnippet: resultText.slice(0, 400),
        verification: persisted ? 'PASS: Executed and persisted in production DB' : 'FAIL: Not persisted'
      });
    } catch (err) {
      await log(`ERROR on agent ${t.agentId}: ${err.message}`);
      agentReports.push({
        agentId: t.agentId,
        role: t.role,
        objective: t.objective,
        status: 'FAILED',
        error: err.message,
        verification: 'FAIL'
      });
    }
  }

  // Save full agent verification artifact
  const outPath = path.join(process.cwd(), '.test-artifacts', 'production_all_agents_results.json');
  fs.writeFileSync(outPath, JSON.stringify({
    target: PROD_URL,
    timestamp: new Date().toISOString(),
    totalAgentsTested: agentReports.length,
    successfulTasks: agentReports.filter(r => r.status === 'COMPLETED').length,
    reports: agentReports
  }, null, 2), 'utf-8');

  await log(`\nProduction Agent Workforce Verification saved to: ${outPath}`);
  await log('═════════════════════════════════════════════════════════════════');
}

verifyAllAgents().catch(console.error);
