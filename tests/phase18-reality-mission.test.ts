import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { TaskStore } from '../src/kernel/TaskStore';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel';
import { AgentRegistry } from '../src/agents/AgentRegistry';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { ReportGenerator, ExecutionRealityAudit } from '../src/artifacts/ReportGenerator';
import { prisma } from '../src/lib/db';

const SANDBOX_DIR = join(process.cwd(), '.test-artifacts', 'phase18-reality-mission');

describe('Phase 18: Reality-Based Deterministic End-to-End Mission Verification', () => {
  after(async () => {
    // Clean up sandbox artifacts
    try {
      if (existsSync(SANDBOX_DIR)) {
        rmSync(SANDBOX_DIR, { recursive: true, force: true });
      }
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('Executes reality mission: Scaffold artifact -> Detect defect -> Surgical repair -> Verify -> Report evidence', async () => {
    // Setup sandbox directory
    if (!existsSync(SANDBOX_DIR)) {
      mkdirSync(SANDBOX_DIR, { recursive: true });
    }

    const realityAudit: ExecutionRealityAudit = {
      requested: [
        'Scaffold math project module with arithmetic functions',
        'Inspect and identify intentional defect via unit tests',
        'Repair defect through verified source patch',
        'Re-execute test suite to prove zero regression',
        'Produce formal structured evidence report with complete reality breakdown',
        'Deploy to public production cloud (optional future scope)',
      ],
      planned: [
        'STAGE 1: Scaffold artifact files (calculator.cjs and calculator.test.cjs)',
        'STAGE 2: Run unit test via terminal tool to capture intentional defect',
        'STAGE 3: Apply surgical repair to calculator.cjs',
        'STAGE 4: Re-execute unit test to verify exit code 0 and ALL_TESTS_PASSED',
        'STAGE 5: Synthesize observable evidence into final report',
      ],
      attempted: [],
      executed: [],
      verified: [],
      failed: [],
      recovered: [],
      notExecuted: [
        'Deploy to public production cloud (intentionally isolated to local verification sandbox)',
      ],
    };

    // ─── 1. USER OBJECTIVE & TASK CREATION ───
    const task = await TaskStore.createTask({
      title: 'Reality Mission: Create, Detect Defect, Repair, Verify, and Report',
      description: 'Deterministic end-to-end mission with observable file and terminal evidence',
      agentId: 'software_engineer',
      totalSteps: 5,
    });

    assert.ok(task.id, 'Task must be persisted in database');
    assert.equal(task.status, 'QUEUED');

    // ─── STAGE 1: SCAFFOLD ARTIFACT WITH INTENTIONAL DEFECT ───
    realityAudit.attempted.push('STAGE 1: Scaffold calculator artifact with intentional defect');
    await TaskStore.updateTask(task.id, {
      status: 'RUNNING',
      currentOperation: 'Scaffolding artifact files in sandbox',
      completedSteps: 0,
    });

    const calcFile = join(SANDBOX_DIR, 'calculator.cjs');
    const testFile = join(SANDBOX_DIR, 'calculator.test.cjs');

    // Bug: add returns subtraction (a - b) instead of addition (a + b)
    const buggyCode = `// Math utility module with intentional defect\nfunction add(a, b) {\n  return a - b;\n}\nfunction multiply(a, b) {\n  return a * b;\n}\nmodule.exports = { add, multiply };\n`;
    const testCode = `const assert = require('assert');\nconst { add, multiply } = require('./calculator.cjs');\n\ntry {\n  assert.strictEqual(add(2, 3), 5, 'add(2, 3) must equal 5');\n  assert.strictEqual(multiply(4, 5), 20, 'multiply(4, 5) must equal 20');\n  console.log('ALL_TESTS_PASSED');\n} catch (err) {\n  console.error('TEST_FAILED: ' + err.message);\n  process.exit(1);\n}\n`;

    const ctx = {
      taskId: task.id,
      agentId: 'software_engineer',
      policy: 'PROJECT_WRITE' as const,
      emitEvent: async () => {},
    };

    // Tool execution via filesystem_write
    const writeResult1 = await ToolRegistry.execute(
      'filesystem_write',
      { path: calcFile, content: buggyCode },
      ctx
    );
    const writeResult2 = await ToolRegistry.execute(
      'filesystem_write',
      { path: testFile, content: testCode },
      ctx
    );

    assert.equal(writeResult1.success, true);
    assert.equal(writeResult2.success, true);
    assert.ok(existsSync(calcFile));
    assert.ok(existsSync(testFile));

    realityAudit.executed.push('STAGE 1: Created calculator.cjs and calculator.test.cjs');
    await TaskStore.updateTask(task.id, { completedSteps: 1 });

    // ─── STAGE 2: TERMINAL EXECUTION & DEFECT DETECTION ───
    realityAudit.attempted.push('STAGE 2: Run unit test to detect intentional defect');
    const testRun1 = await ToolRegistry.execute(
      'terminal_exec',
      { command: 'node', args: [testFile] },
      ctx
    );

    // The test must FAIL because add(2, 3) returns -1 instead of 5
    assert.equal(testRun1.success, false, 'Terminal execution must fail due to process exit code 1');
    assert.match(testRun1.error || '', /TEST_FAILED: add\(2, 3\) must equal 5/);

    realityAudit.executed.push('STAGE 2: Ran terminal test command and observed expected failure');
    realityAudit.failed.push('Initial test execution failed: add(2, 3) returned -1 instead of 5');
    await TaskStore.updateTask(task.id, {
      completedSteps: 2,
      errorDetails: 'AssertionError: add(2, 3) must equal 5',
    });

    // ─── STAGE 3: SURGICAL DEFECT REPAIR ───
    realityAudit.attempted.push('STAGE 3: Apply surgical repair to calculator.cjs');
    const fixedCode = buggyCode.replace('return a - b;', 'return a + b;');

    const patchResult = await ToolRegistry.execute(
      'filesystem_write',
      { path: calcFile, content: fixedCode },
      ctx
    );
    assert.equal(patchResult.success, true);

    const patchedContent = readFileSync(calcFile, 'utf8');
    assert.match(patchedContent, /return a \+ b;/);

    realityAudit.executed.push('STAGE 3: Overwrote calculator.cjs with repaired addition logic');
    realityAudit.recovered.push('Surgical repair applied: corrected subtraction operator to addition operator');
    await TaskStore.updateTask(task.id, { completedSteps: 3 });

    // ─── STAGE 4: RE-VERIFICATION & SECOND TEST EXECUTION ───
    realityAudit.attempted.push('STAGE 4: Re-execute unit test to verify repair');
    const testRun2 = await ToolRegistry.execute(
      'terminal_exec',
      { command: 'node', args: [testFile] },
      ctx
    );

    assert.equal(testRun2.success, true, 'Repaired test must execute successfully');
    assert.match(testRun2.output.stdout, /ALL_TESTS_PASSED/, 'Repaired test output must contain ALL_TESTS_PASSED');

    realityAudit.executed.push('STAGE 4: Re-executed terminal test command with zero errors');
    realityAudit.verified.push('Unit test passed with exit code 0 and stdout ALL_TESTS_PASSED');
    await TaskStore.updateTask(task.id, { completedSteps: 4 });

    // ─── STAGE 5: FINAL REPORT & EVIDENCE GENERATION ───
    realityAudit.attempted.push('STAGE 5: Generate formal markdown evidence report');

    const reportMarkdown = ReportGenerator.generateMarkdownReport({
      objective: task.description,
      status: 'COMPLETED',
      realityAudit,
      whatJarvisDid: [
        'Scaffolded project artifact files in isolated sandbox directory',
        'Executed terminal test suite and observed intentional assertion failure',
        'Analyzed defect signature and applied surgical operator patch',
        'Re-executed test suite with observable exit code 0 confirmation',
        'Compiled deterministic evidence report with complete reality breakdown',
      ],
      agentsUsed: ['software_engineer', 'qa_engineer'],
      toolsUsed: ['filesystem_write', 'terminal_exec'],
      filesChanged: [calcFile, testFile],
      commandsExecuted: [`node "${testFile}"`],
      result: 'Mission accomplished: Defect identified, surgically repaired, and regression-verified with exit code 0.',
      verification: 'All deterministic verification checks passed (exitCode == 0, output contains ALL_TESTS_PASSED)',
      tests: { total: 2, passed: 2, failed: 0 },
      errors: ['Initial assertion failure: add(2, 3) must equal 5'],
      recoveryActions: ['Applied surgical source patch: return a + b'],
      artifacts: [
        { path: calcFile, description: 'Repaired Calculator Module' },
        { path: testFile, description: 'Regression Test Suite' },
      ],
      timeTakenMs: 450,
      estimatedCostUsd: 0.0001,
      remainingRisks: ['None. All unit tests verified deterministically.'],
      nextRecommendedAction: 'Ready for production deployment or strategic feature expansion.',
    });

    realityAudit.executed.push('STAGE 5: Generated formal markdown evidence report');
    realityAudit.verified.push('Markdown report contains 8-point reality breakdown');

    // Finalize task in TaskStore
    const finalTask = await TaskStore.updateTask(task.id, {
      status: 'COMPLETED',
      progress: 100,
      completedSteps: 5,
      executionResult: 'Defect identified, repaired, and regression-verified',
      verificationResult: 'Exit code 0 confirmed',
    });

    assert.equal(finalTask.status, 'COMPLETED');
    assert.equal(finalTask.progress, 100);

    // ─── VERIFY REPORT DISTINCTIONS ───
    assert.match(reportMarkdown, /### 2\.1 REALITY EXECUTION BREAKDOWN/);
    assert.match(reportMarkdown, /- \*\*Requested\*\*:/);
    assert.match(reportMarkdown, /- \*\*Planned\*\*:/);
    assert.match(reportMarkdown, /- \*\*Attempted\*\*:/);
    assert.match(reportMarkdown, /- \*\*Executed\*\*:/);
    assert.match(reportMarkdown, /- \*\*Verified\*\*:/);
    assert.match(reportMarkdown, /- \*\*Failed\*\*:/);
    assert.match(reportMarkdown, /- \*\*Recovered\*\*:/);
    assert.match(reportMarkdown, /- \*\*Not Executed\*\*:/);

    // Ensure Not Executed contains the unexecuted deployment scope
    assert.match(reportMarkdown, /Deploy to public production cloud/);
    // Ensure Failed captures the initial defect
    assert.match(reportMarkdown, /add\(2, 3\) returned -1/);
    // Ensure Recovered captures the patch
    assert.match(reportMarkdown, /Surgical repair applied/);
    // Ensure Verified captures the test pass
    assert.match(reportMarkdown, /ALL_TESTS_PASSED/);
  });
});
