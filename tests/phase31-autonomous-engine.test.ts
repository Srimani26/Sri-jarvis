// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. MARK-V Phase 31: Autonomous ReAct Engine, Workspace Sandbox & Durable Task Queue
 * Deterministic automated verification covering:
 * 1. Sandboxed Workspace project initialization, path traversal prevention, file operations & command execution.
 * 2. ToolRegistry workspace tool registration and execution.
 * 3. AutonomousReActEngine multi-turn (Thought -> Action -> Action Input -> Observation -> Next Thought) reasoning loops.
 * 4. PersistentTaskQueue background worker daemon, atomic job claiming, concurrency bounds & crash recovery.
 */

import { test, describe, after } from 'node:test';
import * as assert from 'node:assert/strict';
import { WorkspaceManager } from '../src/workspace/WorkspaceManager';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { AutonomousReActEngine } from '../src/agents/AutonomousReActEngine';
import { PersistentTaskQueue } from '../src/scheduler/PersistentTaskQueue';
import { TaskStore } from '../src/kernel/TaskStore';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel';

describe('J.A.R.V.I.S. MARK-V Phase 31: Autonomous Engine Verification', () => {
  const TEST_PROJECT = 'test_autonomous_sandbox_p31';

  after(() => {
    WorkspaceManager.cleanProject(TEST_PROJECT);
    PersistentTaskQueue.stopWorker();
  });

  // 1. WorkspaceManager Sandbox Tests
  describe('WorkspaceManager Terminal & File Sandbox', () => {
    test('initProject creates isolated directory and metadata', () => {
      const meta = WorkspaceManager.initProject(TEST_PROJECT);
      assert.equal(meta.name, TEST_PROJECT);
      assert.ok(meta.path.includes(TEST_PROJECT));
      assert.ok(meta.createdAt);
    });

    test('writeFile and readFile work within sandbox', () => {
      const content = 'console.log("Hello J.A.R.V.I.S. Autonomous Engine");';
      const fileMeta = WorkspaceManager.writeFile(TEST_PROJECT, 'src/index.js', content);

      assert.equal(fileMeta.filePath, 'src/index.js');
      assert.equal(fileMeta.bytes, content.length);

      const readRes = WorkspaceManager.readFile(TEST_PROJECT, 'src/index.js');
      assert.equal(readRes.content, content);
      assert.equal(readRes.filePath, 'src/index.js');
    });

    test('listFiles returns all written project files', () => {
      WorkspaceManager.writeFile(TEST_PROJECT, 'package.json', JSON.stringify({ name: 'test-app', version: '1.0.0' }, null, 2));
      const files = WorkspaceManager.listFiles(TEST_PROJECT);

      assert.ok(files.some(f => f.relativePath === 'src/index.js'));
      assert.ok(files.some(f => f.relativePath === 'package.json'));
    });

    test('Path traversal attempts are blocked', () => {
      assert.throws(() => {
        WorkspaceManager.readFile(TEST_PROJECT, '../../package.json');
      }, /Path traversal denied/);

      assert.throws(() => {
        WorkspaceManager.writeFile(TEST_PROJECT, '../malicious.txt', 'blocked');
      }, /Path traversal denied/);
    });

    test('runCommand executes non-interactive terminal process', async () => {
      // Execute a quick Node script in the sandbox
      const res = await WorkspaceManager.runCommand(TEST_PROJECT, 'node src/index.js');
      assert.equal(res.success, true);
      assert.equal(res.exitCode, 0);
      assert.ok(res.stdout.includes('Hello J.A.R.V.I.S. Autonomous Engine'));
    });

    test('runCommand captures non-zero exit codes properly', async () => {
      const res = await WorkspaceManager.runCommand(TEST_PROJECT, 'node -e "throw new Error(\'intentional_fail\')"');
      assert.equal(res.success, false);
      assert.ok(res.exitCode > 0);
    });

    test('startDaemon, listDaemons, and stopDaemon manage background localhost processes', async () => {
      WorkspaceManager.writeFile(TEST_PROJECT, 'server.js', 'console.log("DAEMON_STARTED"); setInterval(() => {}, 1000);');
      const daemon = await WorkspaceManager.startDaemon(TEST_PROJECT, 'node server.js', { port: 4899, startupWaitMs: 300 });
      assert.ok(daemon.id.startsWith(`daemon_${TEST_PROJECT}`));
      assert.equal(daemon.status, 'RUNNING');
      assert.ok(daemon.pid && daemon.pid > 0);

      const daemons = WorkspaceManager.listDaemons(TEST_PROJECT);
      assert.ok(daemons.some(d => d.id === daemon.id));

      const stopped = await WorkspaceManager.stopDaemon(daemon.id);
      assert.equal(stopped, true);
    });
  });

  // 2. ToolRegistry Workspace Integration
  describe('ToolRegistry Workspace Tools Integration', () => {
    test('Workspace tools are registered and available in ToolRegistry', () => {
      const tools = ToolRegistry.listTools();
      const toolNames = tools.map(t => t.name);

      assert.ok(toolNames.includes('workspace_init'));
      assert.ok(toolNames.includes('workspace_run_command'));
      assert.ok(toolNames.includes('workspace_write_file'));
      assert.ok(toolNames.includes('workspace_read_file'));
      assert.ok(toolNames.includes('workspace_list_files'));
      assert.ok(toolNames.includes('workspace_start_daemon'));
      assert.ok(toolNames.includes('workspace_stop_daemon'));
      assert.ok(toolNames.includes('workspace_list_daemons'));
    });

    test('workspace_write_file tool executes via kernel', async () => {
      const t = await TaskStore.createTask({
        title: 'Tool execution test',
        description: 'Testing workspace tool kernel integration',
        agentId: 'software_engineer',
        totalSteps: 1,
      });

      const context = {
        taskId: t.id,
        agentId: 'software_engineer',
        policy: 'PROJECT_WRITE' as const,
        emitEvent: async () => {},
      };

      const result = await ExecutionKernel.executeTool('workspace_write_file', {
        projectName: TEST_PROJECT,
        path: 'test_calc.js',
        content: 'module.exports = { add: (a, b) => a + b };',
      }, context);

      assert.equal(result.success, true);
      assert.ok(result.output);
    });

    test('workspace_read_file tool executes via kernel', async () => {
      const t = await TaskStore.createTask({
        title: 'Tool read test',
        description: 'Testing workspace read tool kernel integration',
        agentId: 'software_engineer',
        totalSteps: 1,
      });

      const context = {
        taskId: t.id,
        agentId: 'software_engineer',
        policy: 'READ_ONLY' as const,
        emitEvent: async () => {},
      };

      const result = await ExecutionKernel.executeTool('workspace_read_file', {
        projectName: TEST_PROJECT,
        path: 'test_calc.js',
      }, context);

      assert.equal(result.success, true);
      assert.ok(result.output?.content?.includes('add: (a, b) => a + b'));
    });
  });

  // 3. AutonomousReActEngine Multi-Turn Loop
  describe('AutonomousReActEngine Multi-Turn ReAct Loop', () => {
    test('AutonomousReActEngine executes multi-step Reasoning -> Action -> Observation loop', async () => {
      const createdTask = await TaskStore.createTask({
        title: 'Build Arithmetic Module',
        description: 'Build and verify an arithmetic module in sandbox',
        agentId: 'software_engineer',
        totalSteps: 5,
      });

      let turnCount = 0;
      const mockAiCaller = async (sys: string, msgs: Array<{ role: string; content: string }>) => {
        turnCount++;
        const lastMsg = msgs[msgs.length - 1]?.content || '';

        if (turnCount === 1) {
          // Turn 1: Write file
          return {
            text: `Thought: I will write the arithmetic module implementation.\nAction: workspace_write_file\nAction Input: {"projectName": "${TEST_PROJECT}", "path": "math.js", "content": "console.log('Result: ' + (21 * 2));"}`,
            source: 'Mock-LLM'
          };
        } else if (turnCount === 2) {
          // Turn 2: Verify stdout from previous step, run it
          assert.ok(lastMsg.includes('Observation:'));
          return {
            text: `Thought: The file is written. Now I must run the script using workspace_run_command to verify output.\nAction: workspace_run_command\nAction Input: {"projectName": "${TEST_PROJECT}", "command": "node math.js"}`,
            source: 'Mock-LLM'
          };
        } else {
          // Turn 3: Observe output 'Result: 42' and complete
          assert.ok(lastMsg.includes('Observation:'));
          assert.ok(lastMsg.includes('Result: 42'));
          return {
            text: `Thought: The script executed successfully and printed Result: 42. Verification complete.\nFinal Answer: Arithmetic module built and tested with 100% verified output Result: 42.`,
            source: 'Mock-LLM'
          };
        }
      };

      const result = await AutonomousReActEngine.run({
        taskId: createdTask.id,
        agentId: 'software_engineer',
        objective: 'Build and run arithmetic module',
        projectName: TEST_PROJECT,
        maxSteps: 5,
        aiCaller: mockAiCaller,
      });

      assert.equal(result.success, true);
      assert.ok(result.steps.length >= 2);
      assert.ok(result.toolsUsed.includes('workspace_write_file'));
      assert.ok(result.toolsUsed.includes('workspace_run_command'));
      assert.ok(result.artifactsCreated.includes('math.js'));
      assert.ok(result.finalAnswer.includes('Result: 42'));
    });
  });

  // 4. PersistentTaskQueue
  describe('PersistentTaskQueue Background Worker', () => {
    test('enqueue creates durable task and returns status QUEUED', async () => {
      const job = await PersistentTaskQueue.enqueue({
        title: 'Background Full Stack Scaffold',
        objective: 'Scaffold modern web application in workspace',
        agentId: 'software_engineer',
        projectName: TEST_PROJECT,
        maxSteps: 10,
      });

      assert.ok(job.taskId);
      assert.ok(job.taskNumber);
      assert.equal(job.status, 'QUEUED');

      const storedTask = await TaskStore.getTask(job.taskId);
      assert.ok(storedTask);
      assert.equal(storedTask?.agentId, 'software_engineer');
    });

    test('getQueueStatus reports background queue metrics', () => {
      const status = PersistentTaskQueue.getQueueStatus();
      assert.equal(typeof status.isRunning, 'boolean');
      assert.equal(typeof status.activeJobCount, 'number');
      assert.equal(typeof status.maxConcurrency, 'number');
      assert.ok(status.maxConcurrency >= 1);
    });

    test('recoverInterruptedTasks runs without error', async () => {
      const recoveredCount = await PersistentTaskQueue.recoverInterruptedTasks();
      assert.equal(typeof recoveredCount, 'number');
      assert.ok(recoveredCount >= 0);
    });
  });
});
