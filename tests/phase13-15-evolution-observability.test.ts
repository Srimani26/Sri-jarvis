import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SelfEvolutionEngine } from '../src/evolution/SelfEvolutionEngine';
import { TelemetryHub } from '../src/observability/TelemetryHub';
import { ReportGenerator } from '../src/artifacts/ReportGenerator';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';

describe('Phases 13–15: J.A.R.V.I.S. Self-Evolution, Observability & Mission Reporting', () => {
  beforeEach(() => {
    SelfEvolutionEngine.clear();
  });

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('SelfEvolutionEngine sandbox-benchmarks proposals and safely applies optimizations', async () => {
    const task = await TaskStore.createTask({
      title: 'Benchmark SQLite WAL optimization',
      description: 'Test Self-Evolution proposal pipeline',
      agentId: 'evolution_agent',
      totalSteps: 3,
    });

    const proposal = SelfEvolutionEngine.proposeOptimization(
      'PRAGMA synchronous = NORMAL',
      'PERFORMANCE',
      'src/lib/db.ts',
      'PRAGMA synchronous = NORMAL;\nPRAGMA journal_mode = WAL;',
      'Optimize disk I/O throughput by switching SQLite to WAL mode',
      250 // Baseline: 250ms
    );

    assert.equal(proposal.status, 'PROPOSED');

    // Run sandbox evaluation with simulated 120ms benchmark (52% speedup)
    const result = await SelfEvolutionEngine.evaluateAndApply(
      proposal.id,
      task.id,
      async () => 120, // Benchmark after
      (patch) => !patch.includes('rm -rf') // Security check passes
    );

    assert.equal(result.passed, true);
    assert.equal(result.regressionDetected, false);
    assert.equal(result.optimizedMs, 120);

    const updated = SelfEvolutionEngine.getProposal(proposal.id);
    assert.equal(updated?.status, 'APPLIED');
    assert.equal(updated?.speedupPercent, 52);
  });

  test('SelfEvolutionEngine detects performance regression and rolls back proposal', async () => {
    const task = await TaskStore.createTask({
      title: 'Regressive index proposal',
      description: 'Ensure regression rollback is enforced',
      agentId: 'evolution_agent',
      totalSteps: 2,
    });

    const proposal = SelfEvolutionEngine.proposeOptimization(
      'Heavy composite index',
      'PERFORMANCE',
      'prisma/schema.prisma',
      '@@index([a, b, c, d, e])',
      'Add multi-column index',
      100 // Baseline: 100ms
    );

    // Run evaluation where optimized time is WORSE (350ms vs 100ms baseline)
    const result = await SelfEvolutionEngine.evaluateAndApply(
      proposal.id,
      task.id,
      async () => 350,
      () => true
    );

    assert.equal(result.passed, false);
    assert.equal(result.regressionDetected, true);

    const updated = SelfEvolutionEngine.getProposal(proposal.id);
    assert.equal(updated?.status, 'ROLLED_BACK');
  });

  test('TelemetryHub aggregates real metrics across agents, tools, and models', () => {
    const metrics = TelemetryHub.getSystemMetrics();

    assert.ok(metrics.timestamp);
    assert.ok(metrics.agents.total >= 20, 'Must track all 20 specialist agents');
    assert.ok(metrics.tools.total >= 6, 'Must track all core tools');
    assert.ok(metrics.models.total >= 6, 'Must track models');
    assert.ok(metrics.agents.overallSuccessRatePercent >= 0 && metrics.agents.overallSuccessRatePercent <= 100);
  });

  test('ReportGenerator produces structured Markdown mission report with all required sections', () => {
    const reportMd = ReportGenerator.generateMarkdownReport({
      objective: 'Implement Autonomous Task Engine and Multi-Agent Workforce',
      status: 'COMPLETED',
      whatJarvisDid: [
        'Created SQLite persistent task store via Prisma',
        'Bootstrapped 20 specialist agents with permission ceilings',
        'Built Aider-style Search/Replace surgical diff patcher',
        'Implemented browser automation engine with prompt injection defense',
        'Integrated multi-provider model router with circuit breaker',
      ],
      agentsUsed: ['J.A.R.V.I.S.', 'Architect', 'Software Engineer', 'QA Engineer'],
      toolsUsed: ['filesystem_read', 'filesystem_write', 'terminal_exec', 'system_health'],
      filesChanged: ['src/kernel/TaskStore.ts', 'src/agents/AgentRegistry.ts'],
      commandsExecuted: ['npx tsx --test tests/**/*.test.ts', 'npm run build:server'],
      result: 'All 15 roadmap phases verified green with 0 errors.',
      verification: 'Deterministic test assertions verified across 12 test suites',
      tests: { total: 49, passed: 49, failed: 0 },
      errors: [],
      recoveryActions: [],
      artifacts: [
        { path: 'docs/JARVIS_CURRENT_STATE.md', description: 'Updated state audit' },
      ],
      timeTakenMs: 14200,
      estimatedCostUsd: 0.0042,
      remainingRisks: ['Ensure Ollama daemon is running locally for full offline fallback'],
      nextRecommendedAction: 'Deploy Mark-V build to sovereign cloud server port 3005',
    });

    assert.ok(reportMd.includes('### 1. OBJECTIVE'));
    assert.ok(reportMd.includes('### 2. STATUS'));
    assert.ok(reportMd.includes('### 3. WHAT J.A.R.V.I.S. DID'));
    assert.ok(reportMd.includes('### 4. AGENTS USED'));
    assert.ok(reportMd.includes('### 5. TOOLS USED'));
    assert.ok(reportMd.includes('### 6. FILES CHANGED'));
    assert.ok(reportMd.includes('### 7. COMMANDS EXECUTED'));
    assert.ok(reportMd.includes('### 8. RESULT'));
    assert.ok(reportMd.includes('### 9. VERIFICATION & TESTS'));
    assert.ok(reportMd.includes('### 10. ERRORS & RECOVERY ACTIONS'));
    assert.ok(reportMd.includes('### 11. ARTIFACTS'));
    assert.ok(reportMd.includes('### 12. PERFORMANCE & ECONOMICS'));
    assert.ok(reportMd.includes('### 13. REMAINING RISKS & NEXT ACTION'));
  });

});
