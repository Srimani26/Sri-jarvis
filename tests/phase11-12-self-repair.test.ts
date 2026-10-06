import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SelfRepairEngine } from '../src/repair/SelfRepairEngine';
import { MemoryStore } from '../src/memory/MemoryStore';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';

describe('Phase 11 & 12: J.A.R.V.I.S. Self-Repair & Deterministic Diagnostic Engine', () => {
  beforeEach(() => {
    MemoryStore.clear();
  });

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('SelfRepairEngine classifies transient vs deterministic failures accurately', () => {
    // 1. Rate Limit (Transient)
    const diag1 = SelfRepairEngine.classifyFailure('Error: 429 Rate Limit Exceeded on OpenAI endpoint');
    assert.equal(diag1.category, 'RATE_LIMIT');
    assert.equal(diag1.strategy, 'FAILOVER_PROVIDER');
    assert.equal(diag1.isDeterministic, false);

    // 2. Network disruption (Transient)
    const diag2 = SelfRepairEngine.classifyFailure('FetchError: request failed with ECONNRESET');
    assert.equal(diag2.category, 'TRANSIENT_NETWORK');
    assert.equal(diag2.strategy, 'RETRY_WITH_BACKOFF');
    assert.equal(diag2.isDeterministic, false);

    // 3. TypeScript / Syntax Error (Deterministic -> Must NOT just retry!)
    const diag3 = SelfRepairEngine.classifyFailure('SyntaxError: Unexpected token "export" in src/app.ts');
    assert.equal(diag3.category, 'TYPESCRIPT_SYNTAX');
    assert.equal(diag3.strategy, 'APPLY_CODE_FIX');
    assert.equal(diag3.isDeterministic, true);

    // 4. Missing Dependency (Deterministic)
    const diag4 = SelfRepairEngine.classifyFailure('Error: Cannot find module "@modelcontextprotocol/sdk"');
    assert.equal(diag4.category, 'DEPENDENCY_MISSING');
    assert.equal(diag4.strategy, 'INSTALL_DEPENDENCY');
    assert.equal(diag4.isDeterministic, true);

    // 5. Permission violation (Requires user authorization)
    const diag5 = SelfRepairEngine.classifyFailure('Permission Denied: PROJECT_WRITE requires confirmation');
    assert.equal(diag5.category, 'PERMISSION_DENIED');
    assert.equal(diag5.strategy, 'ASK_USER');
    assert.equal(diag5.canAutoRepair, false);
  });

  test('SelfRepairEngine repairs code failure and learns fix for future encounters', async () => {
    const task = await TaskStore.createTask({
      title: 'Diagnose runtime exception',
      description: 'Repair failing handler and test failure memory retention',
      agentId: 'debugger',
      totalSteps: 3,
    });

    const error = new Error('TypeError: Cannot read properties of undefined in route handler');

    // First encounter: Fixer runs and solves the problem
    const repairResult = await SelfRepairEngine.repair(task.id, error, async (diag, priorFix) => {
      assert.equal(priorFix, undefined, 'Prior fix should not exist on first occurrence');
      return {
        success: true,
        fixDetails: 'Add optional chaining check: `user?.profile?.id`',
      };
    });

    assert.equal(repairResult.recovered, true);
    assert.equal(repairResult.fixApplied, 'Add optional chaining check: `user?.profile?.id`');

    // Second encounter: Verify prior fix is retrieved directly from memory
    const secondTask = await TaskStore.createTask({
      title: 'Second occurrence of runtime exception',
      description: 'Verify memory reuse',
      agentId: 'debugger',
      totalSteps: 2,
    });

    let observedPriorFix: string | undefined;

    const secondResult = await SelfRepairEngine.repair(secondTask.id, error, async (diag, priorFix) => {
      observedPriorFix = priorFix;
      return {
        success: true,
        fixDetails: `Reapplied known fix: ${priorFix}`,
      };
    });

    assert.equal(secondResult.recovered, true);
    assert.equal(observedPriorFix, 'Add optional chaining check: `user?.profile?.id`');
  });

  test('SelfRepairEngine halts deterministic permission failures without infinite loops', async () => {
    const task = await TaskStore.createTask({
      title: 'Attempt unauthorized mutation',
      description: 'Verify permission denial halts immediately',
      agentId: 'security_agent',
      totalSteps: 2,
    });

    const permError = 'Permission Denied: write operation blocked by least privilege policy';
    const result = await SelfRepairEngine.repair(task.id, permError);

    assert.equal(result.recovered, false);
    assert.equal(result.strategyUsed, 'ASK_USER');
    assert.equal(result.diagnosis.canAutoRepair, false);
  });

});
