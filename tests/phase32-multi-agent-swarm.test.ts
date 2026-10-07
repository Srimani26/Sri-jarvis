// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { MultiAgentSwarmEngine } from '../src/agents/MultiAgentSwarmEngine';
import { WorkspaceManager } from '../src/workspace/WorkspaceManager';
import { ToolRegistry } from '../src/tools/ToolRegistry';

describe('J.A.R.V.I.S. MARK-V Phase 32: Sovereign Multi-Agent Swarm & Multi-Task Doing Engine', () => {

  test('MultiAgentSwarmEngine executes full 5-stage specialist swarm pipeline', async () => {
    const taskId = `TEST-SWARM-${Date.now()}`;
    const result = await MultiAgentSwarmEngine.dispatchSwarm({
      taskId,
      objective: 'Scaffold real-time financial tracking dashboard with dark HUD styling',
      projectName: `test_swarm_${Date.now().toString().slice(-5)}`,
    });

    assert.equal(result.success, true);
    assert.equal(result.verificationPassed, true);
    assert.equal(result.stages.length, 5);

    // Verify all 5 specialists participated
    const stageAgents = result.stages.map(s => s.agentName);
    assert.ok(stageAgents.includes('D.A.E.D.A.L.U.S.'));
    assert.ok(stageAgents.includes('F.R.I.D.A.Y.'));
    assert.ok(stageAgents.includes('A.E.G.I.S.'));
    assert.ok(stageAgents.includes('S.E.N.T.I.N.E.L.'));
    assert.ok(stageAgents.includes('J.A.R.V.I.S.'));

    // Check all stages status COMPLETED
    result.stages.forEach(stage => {
      assert.equal(stage.status, 'COMPLETED');
    });

    // Check Inter-Agent Blackboard
    assert.ok(result.blackboard.blueprint);
    assert.ok(result.blackboard.securityScore >= 80);
    assert.equal(result.blackboard.qaPassRate, 100);
    assert.ok(result.blackboard.interAgentDialogue.length >= 4);

    // Verify real files generated in workspace
    const files = WorkspaceManager.listFiles(result.projectName);
    const filePaths = files.map(f => f.relativePath);
    assert.ok(filePaths.includes('index.html'));
    assert.ok(filePaths.includes('styles.css'));
    assert.ok(filePaths.includes('app.js'));
    assert.ok(filePaths.includes('blueprint.json'));
    assert.ok(filePaths.includes('README.md'));
  });

  test('MultiAgentSwarmEngine executes parallel multi-task subtasks concurrently', async () => {
    const parallelTasks = [
      { agentId: 'architect', objective: 'Create system architecture for Task Alpha' },
      { agentId: 'software_engineer', objective: 'Scaffold core utilities for Task Beta' },
    ];

    const results = await MultiAgentSwarmEngine.executeParallelTasks(parallelTasks);
    assert.equal(results.length, 2);
    results.forEach(r => {
      assert.equal(r.success, true);
      assert.ok(r.result);
    });
  });

  test('ToolRegistry includes swarm_dispatch and execute_parallel_tasks tools', () => {
    const swarmTool = ToolRegistry.getTool('swarm_dispatch');
    const parallelTool = ToolRegistry.getTool('execute_parallel_tasks');

    assert.ok(swarmTool, 'swarm_dispatch tool must be registered');
    assert.ok(parallelTool, 'execute_parallel_tasks tool must be registered');
    assert.equal(swarmTool.requiredPermission, 'PROJECT_WRITE');
    assert.equal(parallelTool.requiredPermission, 'PROJECT_WRITE');
  });
});
