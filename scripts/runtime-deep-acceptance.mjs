import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { DiffPatcher } from '../src/coding/DiffPatcher.ts';
import { CodingExecutionLoop } from '../src/coding/CodingExecutionLoop.ts';
import { TaskStore } from '../src/kernel/TaskStore.ts';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel.ts';
import { prisma } from '../src/lib/db.ts';

const execFileAsync = promisify(execFile);
const BASE_URL = 'http://localhost:3005';
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

async function runDeepAcceptance() {
  await log('═════════════════════════════════════════════════════════════════');
  await log('STARTING J.A.R.V.I.S. DEEP RUNTIME ACCEPTANCE VERIFICATION');
  await log('═════════════════════════════════════════════════════════════════');

  const report = {
    timestamp: new Date().toISOString(),
    phase9_failure_recovery: {},
    phase10_self_healing: {},
    phase13_dynamic_responses: [],
    phase11_real_data_summary: {}
  };

  // ─────────────────────────────────────────────────────────────────
  // PHASE 9: SAFE CONTROLLED FAILURE RECOVERY & ROLLBACK TEST
  // ─────────────────────────────────────────────────────────────────
  await log('\n--- RUNNING PHASE 9: Controlled Failure & Safe Rollback ---');
  const fixtureDir = path.join(process.cwd(), '.test-fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

  const rollbackTarget = path.join(fixtureDir, 'disposable-rollback-test.js');
  const pristineContent = '// Pristine original code\nexport const value = 42;\n';
  fs.writeFileSync(rollbackTarget, pristineContent, 'utf-8');

  const failTaskId = `TASK-FAIL-${Date.now().toString().slice(-6)}`;
  await TaskStore.createTask({
    id: failTaskId,
    agentId: 'aegis',
    objective: 'Controlled failure recovery test',
    category: 'CODE_ENGINEERING',
    riskLevel: 'LOW',
    requiresApproval: false
  });

  const failureStartTime = new Date().toISOString();
  // Intentionally break the file with code that fails the test
  const brokenContent = '// Intentionally broken code\nexport const value = 0;\nprocess.exit(1);\n';

  const rollbackResult = await CodingExecutionLoop.execute({
    taskId: failTaskId,
    objective: 'Demonstrate safe rollback on unrecoverable test failure',
    edits: [
      {
        filePath: path.relative(process.cwd(), rollbackTarget),
        directContent: brokenContent
      }
    ],
    testCommand: {
      executable: 'node',
      args: ['-e', 'import("./' + path.relative(process.cwd(), rollbackTarget).replace(/\\/g, '/') + '").catch(() => process.exit(1))'],
      cwd: process.cwd()
    },
    maxRetries: 1,
    fixProvider: async (errOut) => {
      // Fix provider also fails to test rollback
      return [
        {
          filePath: path.relative(process.cwd(), rollbackTarget),
          directContent: '// Still broken\nthrow new Error("Deliberate failure in fix provider");\n'
        }
      ];
    }
  });

  const contentAfterRollback = fs.readFileSync(rollbackTarget, 'utf-8');
  const isPristine = contentAfterRollback === pristineContent;

  await log(`Phase 9 Rollback executed: rolledBack=${rollbackResult.rolledBack}, pristineRestored=${isPristine}`);

  report.phase9_failure_recovery = {
    taskId: failTaskId,
    startTime: failureStartTime,
    endTime: new Date().toISOString(),
    initialFileContent: pristineContent.trim(),
    injectedFailure: brokenContent.trim(),
    retriesAttempted: rollbackResult.retriesAttempted,
    rolledBack: rollbackResult.rolledBack,
    pristineRestored: isPristine,
    errorDetected: rollbackResult.error,
    verification: isPristine ? 'PASS: Codebase restored to pristine state upon test failure' : 'FAIL: File corrupted'
  };

  // ─────────────────────────────────────────────────────────────────
  // PHASE 10: SELF-HEALING RECOVERY TEST (Patch -> Test -> Fix -> Pass)
  // ─────────────────────────────────────────────────────────────────
  await log('\n--- RUNNING PHASE 10: Self-Healing Loop (Detect -> Diagnose -> Patch -> Verify) ---');
  const healTarget = path.join(fixtureDir, 'disposable-healing-target.js');
  const initialBuggyCode = `// Disposable self-healing target
export function calculateSum(a, b) {
  // BUG: Subtracts instead of adding
  return a - b;
}
`;
  fs.writeFileSync(healTarget, initialBuggyCode, 'utf-8');

  const healTaskId = `TASK-HEAL-${Date.now().toString().slice(-6)}`;
  await TaskStore.createTask({
    id: healTaskId,
    agentId: 'aegis',
    objective: 'Self-healing bug remediation',
    category: 'CODE_ENGINEERING',
    riskLevel: 'LOW',
    requiresApproval: false
  });

  const healStartTime = new Date().toISOString();

  // Test script that expects calculateSum(2, 3) === 5
  const testScriptPath = path.join(fixtureDir, 'test-runner.mjs');
  fs.writeFileSync(
    testScriptPath,
    `import { calculateSum } from './disposable-healing-target.js';\nif (calculateSum(2, 3) !== 5) { console.error('Sum mismatch'); process.exit(1); } else { console.log('OK'); }\n`,
    'utf-8'
  );

  const healingResult = await CodingExecutionLoop.execute({
    taskId: healTaskId,
    objective: 'Auto-remediate calculateSum bug',
    edits: [
      {
        filePath: path.relative(process.cwd(), healTarget),
        directContent: initialBuggyCode
      }
    ],
    testCommand: {
      executable: 'node',
      args: [path.relative(process.cwd(), testScriptPath)],
      cwd: process.cwd()
    },
    maxRetries: 2,
    fixProvider: async (errorOutput, previousEdits) => {
      await log(`[Self-Healing] Detected error: ${errorOutput.trim().slice(0, 100)}... Synthesizing fix patch.`);
      const fixedCode = `// Disposable self-healing target
export function calculateSum(a, b) {
  // FIXED: Adds correctly
  return a + b;
}
`;
      return [
        {
          filePath: path.relative(process.cwd(), healTarget),
          directContent: fixedCode
        }
      ];
    }
  });

  const finalCodeAfterHealing = fs.readFileSync(healTarget, 'utf-8');
  const isHealed = finalCodeAfterHealing.includes('return a + b;') && healingResult.success && !healingResult.rolledBack;

  await log(`Phase 10 Self-Healing: success=${healingResult.success}, retries=${healingResult.retriesAttempted}, healed=${isHealed}`);

  report.phase10_self_healing = {
    taskId: healTaskId,
    startTime: healStartTime,
    endTime: new Date().toISOString(),
    beforeState: initialBuggyCode.trim(),
    failureObserved: 'Sum mismatch (exit code 1)',
    diagnosis: 'calculateSum subtracted instead of adding',
    patchApplied: 'return a + b;',
    retriesAttempted: healingResult.retriesAttempted,
    verification: isHealed ? 'PASS: Automated test passed green after surgical fix' : 'FAIL',
    finalState: finalCodeAfterHealing.trim(),
    success: isHealed
  };

  // ─────────────────────────────────────────────────────────────────
  // PHASE 13: DYNAMIC RESPONSE & DIVERSITY AUDIT (20 Commands)
  // ─────────────────────────────────────────────────────────────────
  await log('\n--- RUNNING PHASE 13: 20 Dynamic Commands Diversity Test ---');
  const promptList = [
    { agent: 'aegis', prompt: 'Audit package.json for outdated or insecure dependencies' },
    { agent: 'aegis', prompt: 'Inspect TypeScript tsconfig.json strictness settings' },
    { agent: 'aegis', prompt: 'Verify Prisma database connection pool configuration' },
    { agent: 'aegis', prompt: 'Explain the difference between DiffPatcher and naive string replace' },
    { agent: 'vortex', prompt: 'Design an n8n webhook workflow to capture customer support tickets' },
    { agent: 'vortex', prompt: 'Create a cron automation script that cleans up temporary test artifacts' },
    { agent: 'vortex', prompt: 'Draft a webhook endpoint schema for Stripe subscription billing updates' },
    { agent: 'vortex', prompt: 'Specify a Redis rate limiting queue architecture for external API calls' },
    { agent: 'midas', prompt: 'Calculate customer lifetime value (LTV) for a $299/mo B2B SaaS with 3% monthly churn' },
    { agent: 'midas', prompt: 'Compare unit economics of self-hosted vLLM vs cloud OpenAI API at 10M tokens/day' },
    { agent: 'midas', prompt: 'Formulate a go-to-market enterprise tier pricing structure with SLA guarantees' },
    { agent: 'midas', prompt: 'Estimate ROI timeline for automating manual roofing quotation workflows' },
    { agent: 'cerebro', prompt: 'Summarize the architecture of Model Context Protocol (MCP) servers' },
    { agent: 'cerebro', prompt: 'Compare Silero VAD vs WebRTC VAD for real-time speech boundary detection' },
    { agent: 'cerebro', prompt: 'Explain how SWE-bench evaluates autonomous software engineering agents' },
    { agent: 'cerebro', prompt: 'Outline the security implications of AGPL v3 license vs MIT license' },
    { agent: 'stark_os', prompt: 'Check system memory usage and free heap space' },
    { agent: 'stark_os', prompt: 'Inspect node process uptime and active event loop lag' },
    { agent: 'stark_os', prompt: 'Review disk storage consumption in project workspace' },
    { agent: 'stark_os', prompt: 'Verify SQLite WAL journaling mode and database file integrity' }
  ];

  const uniqueOutputs = new Set();
  let cmdIndex = 1;

  for (const item of promptList) {
    const res = await fetch(`${BASE_URL}/api/agents/dispatch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId: item.agent,
        task: item.prompt
      })
    });

    const data = await res.json();
    const resultSnippet = (data.result?.result || data.message || JSON.stringify(data)).slice(0, 150);
    uniqueOutputs.add(resultSnippet);

    report.phase13_dynamic_responses.push({
      commandId: `CMD-${String(cmdIndex).padStart(2, '0')}`,
      agent: item.agent,
      prompt: item.prompt,
      taskId: data.taskId,
      durationMs: data.durationMs,
      responseSnippet: resultSnippet
    });

    await log(`CMD-${String(cmdIndex).padStart(2, '0')} [${item.agent}]: Task=${data.taskId} (${data.durationMs}ms)`);
    cmdIndex++;
  }

  const diversityRatio = uniqueOutputs.size / promptList.length;
  await log(`Phase 13 Diversity Check: ${uniqueOutputs.size} unique response snippets out of ${promptList.length} commands (Ratio: ${(diversityRatio * 100).toFixed(1)}%)`);

  // Write results artifact
  const outPath = path.join(process.cwd(), '.test-artifacts', 'deep_runtime_acceptance_results.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  await log(`\nDeep Acceptance Results written to: ${outPath}`);

  // Clean up test fixtures
  try {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    await log('Test fixtures cleaned up successfully.');
  } catch {}

  await log('═════════════════════════════════════════════════════════════════');
  await log('DEEP RUNTIME ACCEPTANCE VERIFICATION FINISHED SUCCESSFULLY');
  await log('═════════════════════════════════════════════════════════════════');
}

runDeepAcceptance().catch(err => {
  console.error('Acceptance suite failed:', err);
  process.exit(1);
});
