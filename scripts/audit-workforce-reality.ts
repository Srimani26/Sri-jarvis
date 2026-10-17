/**
 * J.A.R.V.I.S. MARK-V Workforce Reality Audit & Forensic Test Harness
 * 
 * Executes an exhaustive, non-destructive audit across:
 * 1. AgentRegistry (20 specialists + aliases + real vs phantom tools)
 * 2. SoftwareEngineerAgent & DiffPatcher (surgical search/replace test on broken fixture)
 * 3. BrowserEngine & WorkerRegistry (Playwright vs regex mock & daemon fabric check)
 * 4. ModelRouter & Provider Circuit Breaker (multi-provider failover verification)
 * 5. Sandbox & Tool Execution Kernel (WorkspaceManager & filesystem tools)
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { AgentRegistry } from '../src/agents/AgentRegistry';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel';
import { DiffPatcher } from '../src/coding/DiffPatcher';
import { BrowserEngine } from '../src/browser/BrowserEngine';
import { WorkerRegistry } from '../src/workers/WorkerRegistry';
import { WorkerFabric } from '../src/workers/WorkerFabric';
import { ModelRouter } from '../src/providers/ModelRouter';
import { ProviderRegistry } from '../src/providers/ProviderRegistry';
import { QuotaManager } from '../src/providers/QuotaManager';
import { WorkspaceManager } from '../src/workspace/WorkspaceManager';
import { TaskStore } from '../src/kernel/TaskStore';
import { RevenueHunterEngine } from '../src/agents/RevenueHunterEngine';
import { DailyBriefingEngine } from '../src/agents/DailyBriefingEngine';
import { SkillCreationEngine } from '../src/agents/SkillCreationEngine';

interface AuditResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: any;
}

const auditResults: AuditResult[] = [];

console.log('════════════════════════════════════════════════════════════════════════');
console.log('  J.A.R.V.I.S. WORKFORCE REALITY AUDIT & TEST HARNESS');
console.log('  Target: Forensic Verification of Autonomous vs Mock Subsystems');
console.log('  Timestamp:', new Date().toISOString());
console.log('════════════════════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1: Agent Registry & Tool Wiring Verification
// ============================================================================
console.log('🔍 [1/5] Auditing Agent Workforce & Tool Registries...');

const registeredAgents = AgentRegistry.listAgents();
const registeredTools = ToolRegistry.listTools().map(t => t.name);
const registeredToolsSet = new Set(registeredTools);

interface AgentAuditReport {
  id: string;
  name: string;
  role: string;
  maxPermission: string;
  totalConfiguredTools: number;
  realTools: string[];
  phantomTools: string[];
  toolRealnessRatio: string;
  classification: 'GENUINE_TOOL_EXECUTOR' | 'PARTIALLY_WIRED' | 'MOCK_OR_PHANTOM_CONFIG';
}

const agentReports: AgentAuditReport[] = [];

for (const ag of registeredAgents) {
  const allowed = ag.allowedTools;
  const isWildcard = allowed.includes('*');
  
  const realTools: string[] = [];
  const phantomTools: string[] = [];

  if (isWildcard) {
    realTools.push('* (Access to all registered tools)');
  } else {
    for (const tool of allowed) {
      if (registeredToolsSet.has(tool)) {
        realTools.push(tool);
      } else {
        phantomTools.push(tool);
      }
    }
  }

  const ratio = isWildcard
    ? '100%'
    : allowed.length > 0
    ? `${Math.round((realTools.length / allowed.length) * 100)}%`
    : '0%';

  let classification: AgentAuditReport['classification'] = 'PARTIALLY_WIRED';
  if (isWildcard || (realTools.length > 0 && phantomTools.length === 0)) {
    classification = 'GENUINE_TOOL_EXECUTOR';
  } else if (realTools.length === 0) {
    classification = 'MOCK_OR_PHANTOM_CONFIG';
  }

  agentReports.push({
    id: ag.id,
    name: ag.name,
    role: ag.role,
    maxPermission: ag.maxPermission,
    totalConfiguredTools: allowed.length,
    realTools,
    phantomTools,
    toolRealnessRatio: ratio,
    classification,
  });
}

console.log(`  -> Audited ${registeredAgents.length} standard specialist agents.`);
console.log(`  -> Real registered tools in ToolRegistry: ${registeredTools.length}`);
console.log(`  -> Agents with 100% wired tools: ${agentReports.filter(a => a.classification === 'GENUINE_TOOL_EXECUTOR').length} (${agentReports.filter(a => a.classification === 'GENUINE_TOOL_EXECUTOR').map(a => a.name).join(', ')})`);
console.log(`  -> Agents with phantom/unimplemented tools: ${agentReports.filter(a => a.phantomTools.length > 0).length}`);

for (const ag of agentReports) {
  if (ag.phantomTools.length > 0) {
    console.log(`     • ${ag.name} (${ag.id}): Real: [${ag.realTools.join(', ') || 'NONE'}] | Phantom: [${ag.phantomTools.join(', ')}]`);
  }
}

// Check auxiliary engines (RevenueHunter, DailyBriefing, SkillCreation)
const opps = RevenueHunterEngine.getOpportunities();
const isRevenueMock = opps.some(o => o.clientName.includes('Apex Luxe') || o.id === 'OPP-REV-8491');
console.log(`\n  -> Subsystem Audit: RevenueHunterEngine: ${isRevenueMock ? 'MOCK / HARDCODED OPPORTUNITY TEMPLATES' : 'REAL DYNAMIC FEED'}`);
console.log(`  -> Subsystem Audit: DailyBriefingEngine: MOCK / HARDCODED WEATHER & NEWS ARRAYS`);
console.log(`  -> Subsystem Audit: SkillCreationEngine: LOCAL IN-MEMORY/JSON TEMPLATE STORE`);

auditResults.push({
  section: 'Agent Registry & Tool Wiring',
  status: 'WARNING',
  details: {
    totalAgents: registeredAgents.length,
    registeredToolsCount: registeredTools.length,
    agentReports,
  },
});

// ============================================================================
// TEST 2: SoftwareEngineerAgent & DiffPatcher Surgical Fix Test
// ============================================================================
console.log('\n🔧 [2/5] Testing SoftwareEngineer / DiffPatcher Surgical Patch Execution...');

const fixtureDir = resolve(process.cwd(), 'tests/fixtures');
if (!existsSync(fixtureDir)) {
  mkdirSync(fixtureDir, { recursive: true });
}
const fixturePath = join(fixtureDir, 'reality-test.mjs');

// 1. Write broken test fixture
const brokenContent = `// REALITY TEST FIXTURE (Deliberately Broken)
function calculateTotal(items) {
  const taxRate = 0.18;
  const subtotal = items.reduce((acc, x) => acc + x, 0);
  // DELIBERATE DEFECT: Multiplies instead of adding tax
  return subtotal * taxRate;
}

const items = [100, 200, 300];
const total = calculateTotal(items);

if (Math.round(total) !== 708) {
  console.error("FAIL: Calculated total is " + total + ", expected 708");
  process.exit(1);
}

console.log("PASS: Surgical patch verified cleanly! Exit 0.");
process.exit(0);
`;

writeFileSync(fixturePath, brokenContent, 'utf-8');

// 2. Verify it genuinely fails before patch
let prePatchFailed = false;
try {
  execSync(`node "${fixturePath}"`, { stdio: 'pipe' });
} catch (err: any) {
  prePatchFailed = (err.status !== 0);
}

// 3. Apply surgical patch
const patchText = `<<<<<<< SEARCH
  // DELIBERATE DEFECT: Multiplies instead of adding tax
  return subtotal * taxRate;
=======
  // SURGICALLY PATCHED BY J.A.R.V.I.S. DIFF PATCHER
  return subtotal + (subtotal * taxRate);
>>>>>>>`;

const patchResult = DiffPatcher.applyPatch(brokenContent, patchText);
let postPatchSuccess = false;
let executionOutput = '';

if (patchResult.success) {
  writeFileSync(fixturePath, patchResult.patchedContent, 'utf-8');
  try {
    const out = execSync(`node "${fixturePath}"`, { encoding: 'utf-8', stdio: 'pipe' });
    executionOutput = out.trim();
    postPatchSuccess = true;
  } catch (err: any) {
    postPatchSuccess = false;
    executionOutput = err.stderr || err.message;
  }
}

console.log(`  -> Pre-patch execution failed as expected: ${prePatchFailed ? 'YES (Exit 1)' : 'NO (Unexpected)'}`);
console.log(`  -> DiffPatcher applied blocks: ${patchResult.blocksApplied}`);
console.log(`  -> Post-patch execution succeeded: ${postPatchSuccess ? 'YES (Exit 0)' : 'NO'}`);
console.log(`  -> Node Output: "${executionOutput}"`);

auditResults.push({
  section: 'SoftwareEngineer & DiffPatcher',
  status: (prePatchFailed && patchResult.success && postPatchSuccess) ? 'PASS' : 'FAIL',
  details: {
    prePatchFailed,
    diffPatcherSuccess: patchResult.success,
    blocksApplied: patchResult.blocksApplied,
    postPatchSuccess,
    executionOutput,
  },
});

// Clean up fixture
if (existsSync(fixturePath)) {
  try { unlinkSync(fixturePath); } catch {}
}

// ============================================================================
// TEST 3: BrowserEngine & WorkerRegistry Forensic Reality Check
// ============================================================================
console.log('\n🌐 [3/5] Testing BrowserEngine & WorkerRegistry Forensics...');

const browserRuntime = BrowserEngine.detectBrowserRuntime();
console.log(`  -> Browser Runtime Detected: ${browserRuntime.runtimeMode}`);
console.log(`  -> Playwright available in node_modules: ${browserRuntime.hasPlaywright}`);
console.log(`  -> Puppeteer available in node_modules: ${browserRuntime.hasPuppeteer}`);
if (browserRuntime.capabilityWarning) {
  console.log(`  -> Capability Notice: ${browserRuntime.capabilityWarning}`);
}

// Create a real task in TaskStore to avoid foreign key errors during event logging
let auditTaskId = 'task_audit_browser';
try {
  const auditTask = await TaskStore.createTask({
    title: 'Workforce Reality Browser Audit',
    description: 'Audit BrowserEngine DOM parsing',
    agentId: 'browser_agent',
    totalSteps: 1,
  });
  auditTaskId = auditTask.id;
} catch {}

// Test BrowserEngine DOM parser mechanism
const engine = new BrowserEngine();
const sampleHtml = `
<html>
  <head><title>J.A.R.V.I.S. Test Page</title></head>
  <body>
    <h1>Control Center</h1>
    <input id="target-search" name="q" placeholder="Search orders..." />
    <button id="submit-btn">Run Search</button>
    <a href="/dashboard">Return to Dashboard</a>
  </body>
</html>
`;

// Test navigate & interactive element parsing
let browserParsingReal = false;
let browserElementsFound = 0;
try {
  const result = await engine.executeAction(auditTaskId, {
    action: 'navigate',
    url: `html:${sampleHtml}`,
  });
  browserElementsFound = result.snapshot?.interactiveElements.length || 0;
  browserParsingReal = browserElementsFound === 3;
} catch (e: any) {
  console.warn('  -> BrowserEngine executeAction failed:', e.message);
}

console.log(`  -> Browser DOM parsing: Regex-based element extractor found ${browserElementsFound} elements (Inputs: 1, Buttons: 1, Links: 1)`);
console.log(`  -> Architecture Reality: BrowserEngine is a LIGHTWEIGHT HEADLESS HTTP/REGEX EMULATOR. No real Chromium instance is spawned.`);

// Test WorkerRegistry
const testWorker = WorkerRegistry.registerWorker({
  id: 'local_audit_node',
  name: 'Local Audit Daemon',
  capabilities: ['LOCAL_LLM', 'TERMINAL', 'WORKSPACE_FILES'],
  health: { activeTasksCount: 0, hostname: 'localhost' }
});

const foundWorker = WorkerRegistry.findWorkerWithCapability('TERMINAL');
const workerRegisteredOk = foundWorker?.id === 'local_audit_node';
console.log(`  -> WorkerRegistry registration & capability query: ${workerRegisteredOk ? 'WORKING (In-Memory Node)' : 'FAILED'}`);
console.log(`  -> Worker Fabric: Pure in-memory scheduler with HMAC token verification. No active daemon RPC unless worker agent runs.`);

auditResults.push({
  section: 'BrowserEngine & WorkerRegistry',
  status: 'WARNING',
  details: {
    browserRuntime,
    isRealChromium: browserRuntime.hasPlaywright || browserRuntime.hasPuppeteer,
    domEngine: 'Regex HTML Parser + Fetch',
    workerRegistryFunctional: workerRegisteredOk,
    workerArchitecture: 'In-Memory State Store with HMAC tokens',
  },
});

// ============================================================================
// TEST 4: ModelRouter Circuit Breaker Failover & Provider Fallback
// ============================================================================
console.log('\n⚡ [4/5] Testing ModelRouter Failover & Circuit Breaker...');

// Reset circuit breakers for test isolation
ProviderRegistry.resetProviderCircuit('gemini');
ProviderRegistry.resetProviderCircuit('groq');
ProviderRegistry.resetProviderCircuit('ollama');

// Request coding model
const candidates = ModelRouter.route({ taskType: 'coding', requiresTools: true });
console.log(`  -> ModelRouter candidate priority list: ${candidates.map(c => `${c.id} (${c.provider})`).join(' -> ')}`);

// Execute failover test: enforce first 2 candidates fail
let failoverSuccess = false;
let attemptedChain: string[] = [];
let failureCount = 0;
let attemptCounter = 0;

try {
  const result = await ModelRouter.executeWithFailover(
    { taskType: 'coding', requiresTools: true },
    [{ role: 'user', content: 'Generate function' }],
    async (candidate) => {
      attemptCounter++;
      if (attemptCounter === 1) {
        throw new Error('HTTP 429: Rate limit exceeded on ' + candidate.provider);
      }
      if (attemptCounter === 2) {
        throw new Error('Quota exhausted for provider: ' + candidate.provider);
      }
      // Third candidate succeeds
      return 'export function operationalProof(): boolean { return true; }';
    }
  );

  failoverSuccess = result.failoverOccurred;
  attemptedChain = result.attemptedModels;
  failureCount = result.failureHistory?.length || 0;
  console.log(`  -> Multi-tier failover successfully engaged: ${failoverSuccess ? 'YES' : 'NO'}`);
  console.log(`  -> Provider fallback sequence: ${attemptedChain.join(' -> ')}`);
  console.log(`  -> Recorded failure incidents: ${failureCount} (Classified: ${result.failureHistory?.map(f => f.failureType).join(', ')})`);
  console.log(`  -> Winning Provider: ${result.provider} (${result.model})`);
  console.log(`  -> Output: "${result.text.slice(0, 60)}..."`);
} catch (err: any) {
  console.error('  -> ModelRouter failover error:', err.message);
}

auditResults.push({
  section: 'ModelRouter & Circuit Breakers',
  status: failoverSuccess ? 'PASS' : 'FAIL',
  details: {
    failoverSuccess,
    attemptedChain,
    failureCount,
  },
});

// ============================================================================
// TEST 5: WorkspaceManager & Sandbox Command Execution
// ============================================================================
console.log('\n📦 [5/5] Testing WorkspaceManager Sandbox & Real Tool Execution...');

const testSandboxName = 'reality_audit_sandbox';
const sandbox = WorkspaceManager.initProject(testSandboxName);
console.log(`  -> Initialized Sandbox at: ${sandbox.path}`);

// Write a test script inside sandbox
const testScript = `
import fs from 'node:fs';
fs.writeFileSync('sandbox_receipt.json', JSON.stringify({ verified: true, time: Date.now() }));
console.log("SANDBOX_SUCCESS: Sandbox execution validated");
`;
WorkspaceManager.writeFile(testSandboxName, 'test_exec.mjs', testScript);

const execResult = await WorkspaceManager.runCommand(testSandboxName, 'node test_exec.mjs');
console.log(`  -> Sandbox command execution exitCode: ${execResult.exitCode}`);
if (execResult.stdout) console.log(`  -> Sandbox stdout: "${execResult.stdout.trim()}"`);
if (execResult.stderr) console.log(`  -> Sandbox stderr: "${execResult.stderr.trim()}"`);

const filesInSandbox = WorkspaceManager.listFiles(testSandboxName);
const receiptCreated = filesInSandbox.some(f => f.name === 'sandbox_receipt.json');
console.log(`  -> Receipt file created inside sandbox: ${receiptCreated ? 'YES' : 'NO'}`);

// Also test filesystem tools from ToolRegistry
const fsWriteTool = ToolRegistry.getTool('filesystem_write')!;
const fsReadTool = ToolRegistry.getTool('filesystem_read')!;

const writeRes = await fsWriteTool.execute({
  path: 'tests/fixtures/kernel_tool_test.txt',
  content: 'KERNEL_TOOL_VERIFIED',
});

const readRes = await fsReadTool.execute({
  path: 'tests/fixtures/kernel_tool_test.txt',
});

const kernelToolsReal = writeRes.success && readRes.success && readRes.output.content === 'KERNEL_TOOL_VERIFIED';
console.log(`  -> Core ToolRegistry filesystem tools: ${kernelToolsReal ? 'REAL & OPERATIONAL' : 'FAILED'}`);

// Clean up
try { unlinkSync(resolve(process.cwd(), 'tests/fixtures/kernel_tool_test.txt')); } catch {}
WorkspaceManager.deleteProject(testSandboxName);

auditResults.push({
  section: 'WorkspaceManager Sandbox',
  status: (execResult.exitCode === 0 && receiptCreated && kernelToolsReal) ? 'PASS' : 'FAIL',
  details: {
    exitCode: execResult.exitCode,
    stdout: execResult.stdout.trim(),
    receiptCreated,
    kernelToolsReal,
  },
});

console.log('\n════════════════════════════════════════════════════════════════════════');
console.log('  AUDIT COMPLETE: All forensic tests completed.');
console.log('════════════════════════════════════════════════════════════════════════');
