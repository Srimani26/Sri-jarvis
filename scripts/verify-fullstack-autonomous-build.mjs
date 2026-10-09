// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. Full-Stack Autonomous Build & Localhost Execution Real-World Verifier
 * Tests end-to-end full-stack capabilities with REAL execution, real localhost ports,
 * real HTTP requests, and real sandbox file generation.
 */

import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WorkspaceManager } from '../src/workspace/WorkspaceManager.ts';
import { MultiAgentSwarmEngine } from '../src/agents/MultiAgentSwarmEngine.ts';
import { ToolRegistry } from '../src/tools/ToolRegistry.ts';

const TEST_PROJECT = 'real_fullstack_audit_project';
const TEST_PORT = 4921;

async function runFullStackVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 J.A.R.V.I.S. FULL-STACK AUTONOMOUS BUILD & LOCALHOST AUDIT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    timestamp: new Date().toISOString(),
    projectName: TEST_PROJECT,
    port: TEST_PORT,
    checks: [],
    overallPass: false,
  };

  const recordCheck = (name, passed, details) => {
    results.checks.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} -> ${JSON.stringify(details)}`);
  };

  try {
    // 1. Initialize isolated project workspace
    const initRes = WorkspaceManager.initProject(TEST_PROJECT);
    recordCheck('1. Workspace Sandbox Initialization', initRes.success, { path: initRes.path });

    // 2. Generate Real Full-Stack Backend (Node.js HTTP Server with dynamic JSON API)
    const backendCode = `
import http from 'node:http';
const PORT = process.env.PORT || ${TEST_PORT};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', service: 'FullStack_Backend_API', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/api/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      data: [
        { id: 'PROD-01', name: 'Banarasi Zari Saree', price: 4999, stock: 42 },
        { id: 'PROD-02', name: 'Kanjivaram Silk Royale', price: 7899, stock: 18 },
        { id: 'PROD-03', name: 'Emerald Velvet Kurti', price: 2499, stock: 65 }
      ]
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('[BACKEND] Live HTTP server running on http://127.0.0.1:' + PORT);
});
`;
    const f1 = WorkspaceManager.writeFile(TEST_PROJECT, 'server.js', backendCode);
    recordCheck('2. Backend Source Code Scaffolding', f1.success, { bytes: f1.bytesWritten, file: f1.filePath });

    // 3. Generate Real Full-Stack Frontend (HTML5, Tailwind, CSS, JS Runtime)
    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Real Full-Stack Verification</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Autonomous Full-Stack Live Build</h1>
    <div id="product-list">Loading real products...</div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;
    const f2 = WorkspaceManager.writeFile(TEST_PROJECT, 'index.html', htmlCode);

    const cssCode = `body { font-family: sans-serif; background: #09090b; color: #fff; padding: 2rem; }
h1 { color: #38bdf8; }`;
    const f3 = WorkspaceManager.writeFile(TEST_PROJECT, 'styles.css', cssCode);

    const jsCode = `async function loadData() {
  try {
    const res = await fetch('http://127.0.0.1:${TEST_PORT}/api/products');
    const json = await res.json();
    document.getElementById('product-list').innerText = JSON.stringify(json.data);
  } catch (e) {
    document.getElementById('product-list').innerText = 'API Fetch Error: ' + e.message;
  }
}
loadData();`;
    const f4 = WorkspaceManager.writeFile(TEST_PROJECT, 'app.js', jsCode);

    // Also write into a nested subdirectory to test recursive preview serving
    const f5 = WorkspaceManager.writeFile(TEST_PROJECT, 'assets/styles/theme.css', '/* Nested Theme */');
    recordCheck('3. Frontend Source & Nested Assets Scaffolding', f2.success && f3.success && f4.success && f5.success, {
      files: ['index.html', 'styles.css', 'app.js', 'assets/styles/theme.css']
    });

    // 4. Run Syntax Validation & Tests via WorkspaceManager.runCommand
    const syntaxTest = await WorkspaceManager.runCommand(TEST_PROJECT, 'node -c server.js');
    recordCheck('4. Backend Code Syntax Verification', syntaxTest.success, { exitCode: syntaxTest.exitCode });

    // 5. Start Real Background Localhost Server via Daemon Manager
    console.log(`\n⏳ Launching background daemon on port ${TEST_PORT}...`);
    const daemon = await WorkspaceManager.startDaemon(TEST_PROJECT, 'node server.js', {
      port: TEST_PORT,
      startupWaitMs: 1500,
    });
    recordCheck('5. Localhost Background Daemon Launch', daemon.status === 'RUNNING', {
      daemonId: daemon.id,
      pid: daemon.pid,
      status: daemon.status
    });

    // 6. Test Real HTTP Request against Localhost Backend Server
    let httpSuccess = false;
    let httpBody = null;
    try {
      const resp = await fetch(`http://127.0.0.1:${TEST_PORT}/api/products`);
      httpSuccess = resp.status === 200;
      httpBody = await resp.json();
    } catch (e) {
      console.error('Fetch error:', e);
    }
    recordCheck('6. Real HTTP Live API Request', httpSuccess && httpBody?.ok === true, {
      status: 200,
      itemCount: httpBody?.data?.length,
      sampleProduct: httpBody?.data?.[0]?.name
    });

    // 7. Verify Daemon Registry and Logs
    const daemonsList = WorkspaceManager.listDaemons(TEST_PROJECT);
    const activeDaemon = daemonsList.find(d => d.id === daemon.id);
    recordCheck('7. Daemon Registry & Live Telemetry', !!activeDaemon && activeDaemon.logs.length > 0, {
      totalDaemons: daemonsList.length,
      latestLog: activeDaemon?.logs?.[0] || 'none'
    });

    // 8. Cleanly Terminate Background Daemon
    const stopped = await WorkspaceManager.stopDaemon(daemon.id);
    recordCheck('8. Clean Daemon Process Termination', stopped, { daemonId: daemon.id });

    // 9. Run 5-Stage Specialist Swarm Pipeline
    console.log('\n⏳ Dispatching 5-Agent Swarm Mission for end-to-end site generation...');
    const swarmMission = await MultiAgentSwarmEngine.dispatchSwarm({
      taskId: `fullstack_swarm_${Date.now()}`,
      objective: 'Build an ultra-modern luxury boutique e-commerce web application with real responsive catalog and shopping cart',
      projectName: 'boutique_swarm_showcase',
    });

    recordCheck('9. 5-Stage Specialist Swarm Pipeline Execution', swarmMission.success && swarmMission.stages.length === 5, {
      durationMs: swarmMission.totalDurationMs,
      stagesCount: swarmMission.stages.length,
      filesCreated: swarmMission.filesCreated,
      previewUrl: swarmMission.previewUrl,
      securityScore: swarmMission.blackboard.securityScore,
      qaPassRate: swarmMission.blackboard.qaPassRate
    });

    // 10. Verify Real Files written to disk by Swarm
    const swarmProjectDir = WorkspaceManager.getProjectPath('boutique_swarm_showcase');
    const indexFile = resolve(swarmProjectDir, 'index.html');
    const fileExistsOnDisk = existsSync(indexFile);
    const fileBytes = fileExistsOnDisk ? readFileSync(indexFile, 'utf-8').length : 0;
    recordCheck('10. Disk Verification of Swarm Deliverable', fileExistsOnDisk && fileBytes > 500, {
      path: indexFile,
      bytes: fileBytes
    });

    results.overallPass = results.checks.every(c => c.passed);
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`RESULT: ${results.overallPass ? '🏆 ALL 10 AUDIT CHECKS PASSED' : '⚠️ SOME CHECKS FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('Fatal audit error:', err);
    recordCheck('Fatal Execution Error', false, { error: err.message });
  }

  // Cleanup test project
  try {
    WorkspaceManager.cleanProject(TEST_PROJECT);
  } catch (_) {}

  return results;
}

runFullStackVerification().then(async (res) => {
  const fs = await import('node:fs');
  fs.mkdirSync('.test-artifacts', { recursive: true });
  fs.writeFileSync('.test-artifacts/fullstack_autonomous_verification_results.json', JSON.stringify(res, null, 2));
  process.exit(res.overallPass ? 0 : 1);
});
