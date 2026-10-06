import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { AgentRegistry } from '../src/agents/AgentRegistry';
import { AgentRuntime } from '../src/agents/AgentRuntime';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';

describe('Phase 3: J.A.R.V.I.S. Specialist Agent Workforce & Runtime', () => {
  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('AgentRegistry bootstraps 20 specialist agents with complete specifications', () => {
    const agents = AgentRegistry.listAgents();
    assert.equal(agents.length, 20, 'Must have exactly 20 registered specialist agents');

    const expectedAgentIds = [
      'jarvis', 'architect', 'software_engineer', 'frontend_engineer', 'backend_engineer',
      'database_engineer', 'devops_engineer', 'qa_engineer', 'debugger', 'security_agent',
      'research_agent', 'browser_agent', 'automation_agent', 'data_agent', 'business_agent',
      'documentation_agent', 'memory_agent', 'monitor_agent', 'scheduler_agent', 'evolution_agent'
    ];

    for (const id of expectedAgentIds) {
      const agent = AgentRegistry.getAgent(id);
      assert.ok(agent, `Agent '${id}' must be registered`);
      assert.ok(agent?.name, `Agent '${id}' must have a name`);
      assert.ok(agent?.codename, `Agent '${id}' must have a codename`);
      assert.ok(agent?.role, `Agent '${id}' must have a role`);
      assert.ok(agent?.allowedTools.length > 0, `Agent '${id}' must define allowed tools`);
      assert.ok(agent?.preferredModels.length > 0, `Agent '${id}' must have preferred models`);
      assert.ok(agent?.verificationChecklist.length > 0, `Agent '${id}' must have verification criteria`);
      assert.equal(agent?.health, 'HEALTHY');
    }
  });

  test('AgentRegistry enforces capability ceilings and tool allowlists', () => {
    // Architect has SAFE_LOCAL max permission
    assert.equal(AgentRegistry.isPermissionAllowed('architect', 'READ_ONLY'), true);
    assert.equal(AgentRegistry.isPermissionAllowed('architect', 'SAFE_LOCAL'), true);
    assert.equal(AgentRegistry.isPermissionAllowed('architect', 'PROJECT_WRITE'), false);
    assert.equal(AgentRegistry.isPermissionAllowed('architect', 'PRIVILEGED'), false);

    // Security Agent has READ_ONLY ceiling
    assert.equal(AgentRegistry.isPermissionAllowed('security_agent', 'READ_ONLY'), true);
    assert.equal(AgentRegistry.isPermissionAllowed('security_agent', 'PROJECT_WRITE'), false);

    // Software Engineer has PROJECT_WRITE ceiling
    assert.equal(AgentRegistry.isPermissionAllowed('software_engineer', 'PROJECT_WRITE'), true);
    assert.equal(AgentRegistry.isPermissionAllowed('software_engineer', 'PRIVILEGED'), false);

    // Tool allowlist enforcement
    assert.equal(AgentRegistry.canUseTool('security_agent', 'security_audit'), true);
    assert.equal(AgentRegistry.canUseTool('security_agent', 'terminal_exec'), false);

    assert.equal(AgentRegistry.canUseTool('software_engineer', 'filesystem_write'), true);
    assert.equal(AgentRegistry.canUseTool('software_engineer', 'browser_click'), false);

    // Supreme Commander (JARVIS) has wildcard '*' tool access
    assert.equal(AgentRegistry.canUseTool('jarvis', 'any_arbitrary_tool'), true);
  });

  test('AgentRuntime executes task with verified lifecycle and records telemetry', async () => {
    const task = await TaskStore.createTask({
      title: 'Design distributed database indexing',
      description: 'Create indexing strategy for audit logs',
      agentId: 'database_engineer',
      totalSteps: 3,
    });

    const response = await AgentRuntime.executeAgentTask({
      taskId: task.id,
      agentId: 'database_engineer',
      objective: 'Analyze slow query logs and propose B-tree composite index',
      inputData: { targetTable: 'audit_logs', columns: ['timestamp', 'userId'] },
    });

    assert.equal(response.success, true);
    assert.equal(response.verificationPassed, true);
    assert.ok(response.durationMs >= 0);

    const agent = AgentRegistry.getAgent('database_engineer');
    assert.ok((agent?.telemetry.invocations || 0) >= 1, 'Telemetry invocations must increment');
    assert.ok((agent?.telemetry.successes || 0) >= 1, 'Telemetry successes must increment');
  });

  test('AgentRuntime blocks policy violations and records failure telemetry', async () => {
    const task = await TaskStore.createTask({
      title: 'Perform privileged OS root action',
      description: 'Attempting escalation through security agent',
      agentId: 'security_agent',
      totalSteps: 2,
    });

    // Security agent only has READ_ONLY, trying to execute with PRIVILEGED ceiling
    const response = await AgentRuntime.executeAgentTask({
      taskId: task.id,
      agentId: 'security_agent',
      objective: 'Run kernel bypass',
      policyCeiling: 'PRIVILEGED',
    });

    assert.equal(response.success, false);
    assert.equal(response.verificationPassed, false);
    assert.match(response.errors?.[0] || '', /Permission violation/);

    const agent = AgentRegistry.getAgent('security_agent');
    assert.ok((agent?.telemetry.failures || 0) >= 1, 'Failure telemetry must increment');
  });

  test('AgentRuntime coordinates multi-agent handoffs and pipelines', async () => {
    const task = await TaskStore.createTask({
      title: 'Full feature implementation pipeline',
      description: 'From architecture specification to verified software release',
      agentId: 'architect',
      totalSteps: 6,
    });

    // 1. Direct Specialist Handoff (Architect -> Software Engineer)
    const handoffResult = await AgentRuntime.handoffTask({
      fromAgentId: 'architect',
      toAgentId: 'software_engineer',
      taskId: task.id,
      reason: 'Architecture blueprint finalized, ready for implementation',
      scopedContext: { blueprint: 'Implement JWT refresh rotation' },
      expectedOutput: 'Write auth middleware tests and functions',
    });

    assert.equal(handoffResult.success, true);
    assert.equal(handoffResult.agentId, 'software_engineer');
    assert.equal(handoffResult.verificationPassed, true);

    // 2. Multi-Agent Pipeline (Architect -> Software Engineer -> QA Engineer)
    const pipelineResult = await AgentRuntime.executePipeline(task.id, [
      { agentId: 'architect', objective: 'Draft API route contract' },
      { agentId: 'software_engineer', objective: 'Implement Hono route handlers' },
      { agentId: 'qa_engineer', objective: 'Validate endpoint responses and status codes' },
    ]);

    assert.equal(pipelineResult.success, true);
    assert.equal(pipelineResult.results.length, 3);
    assert.equal(pipelineResult.results[0].agentId, 'architect');
    assert.equal(pipelineResult.results[1].agentId, 'software_engineer');
    assert.equal(pipelineResult.results[2].agentId, 'qa_engineer');
  });

});
