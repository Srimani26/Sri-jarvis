import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionKernel } from '../src/kernel/ExecutionKernel';
import { KernelToolDefinition, KernelExecutionContext, KernelEvent } from '../src/kernel/types';

describe('Phase 1: J.A.R.V.I.S. Execution Kernel Verification', () => {

  test('Input Normalizer cleans input and extracts core objective', () => {
    const raw = '  hey jarvis, could you please inspect the repository schema and fix errors   ';
    const normalized = ExecutionKernel.normalizeInput(raw);
    assert.equal(normalized, 'Inspect the repository schema and fix errors');

    const empty = ExecutionKernel.normalizeInput('   ');
    assert.equal(empty, 'Awaiting user directive');
  });

  test('Permission Policy enforces capability hierarchy', () => {
    // READ_ONLY user attempting PROJECT_WRITE action -> DENIED
    const check1 = ExecutionKernel.checkPermission('PROJECT_WRITE', 'READ_ONLY');
    assert.equal(check1.allowed, false);
    assert.match(check1.reason || '', /Confirmation required/);

    // PROJECT_WRITE user performing SAFE_LOCAL action -> ALLOWED
    const check2 = ExecutionKernel.checkPermission('SAFE_LOCAL', 'PROJECT_WRITE');
    assert.equal(check2.allowed, true);

    // PRIVILEGED user performing SAFE_LOCAL action -> ALLOWED
    const check3 = ExecutionKernel.checkPermission('SAFE_LOCAL', 'PRIVILEGED');
    assert.equal(check3.allowed, true);
  });

  test('Range-based ETA Engine calculates factual ranges, not hallucinations', () => {
    const etaZero = ExecutionKernel.calculateEtaRange(0);
    assert.equal(etaZero, '00:00 min');

    const etaThreeSteps = ExecutionKernel.calculateEtaRange(3);
    assert.match(etaThreeSteps, /^\d{2}:\d{2} - \d{2}:\d{2} min$/);

    // Ensure range has an interval (min < max)
    const [minStr, maxStr] = etaThreeSteps.replace(' min', '').split(' - ');
    const toSec = (s: string) => {
      const [m, sec] = s.split(':').map(Number);
      return m * 60 + sec;
    };
    assert.ok(toSec(minStr) < toSec(maxStr), 'Min ETA must be strictly less than Max ETA in range');
  });

  test('Tool Registry & Controlled Execution with Event Streams', async () => {
    const events: KernelEvent[] = [];

    // Register a test tool
    const mockTool: KernelToolDefinition = {
      name: 'test_file_inspector',
      description: 'Reads test file content and checks size',
      category: 'FILES',
      risk: 'SAFE',
      requiredPermission: 'READ_ONLY',
      requiresConfirmation: false,
      timeoutMs: 5000,
      execute: async (args, ctx) => {
        return {
          tool: 'test_file_inspector',
          success: true,
          output: { fileName: args.fileName, lines: 42 },
          filesTouched: [args.fileName]
        };
      }
    };

    ExecutionKernel.registerTool(mockTool);
    const retrieved = ExecutionKernel.getTool('test_file_inspector');
    assert.ok(retrieved);
    assert.equal(retrieved.name, 'test_file_inspector');

    // Setup context and subscriber
    const taskId = 'task_test_101';
    const unsubscribe = ExecutionKernel.subscribeToTask(taskId, (evt) => {
      events.push(evt);
    });

    const context: KernelExecutionContext = {
      taskId,
      agentId: 'software_engineer',
      policy: 'PROJECT_WRITE',
      emitEvent: async (eventType, message, metadata) => {
        const evt: KernelEvent = {
          id: `evt_${Date.now()}_${Math.random()}`,
          taskId,
          eventType,
          message,
          timestamp: new Date().toISOString(),
          metadata
        };
        ExecutionKernel.broadcastEvent(evt);
      }
    };

    // Execute tool
    const result = await ExecutionKernel.executeTool('test_file_inspector', { fileName: 'src/main.ts' }, context);
    assert.equal(result.success, true);
    assert.deepEqual(result.filesTouched, ['src/main.ts']);

    // Verify events were captured in real-time
    assert.ok(events.length >= 2, 'Must emit at least TOOL_STARTED and TOOL_COMPLETED');
    assert.equal(events[0].eventType, 'TOOL_STARTED');
    assert.equal(events[1].eventType, 'TOOL_COMPLETED');

    unsubscribe();
  });

  test('Tool Timeout Protection terminates hung execution', async () => {
    const hangingTool: KernelToolDefinition = {
      name: 'hung_tool',
      description: 'Simulates infinite loop or timeout',
      category: 'SYSTEM',
      risk: 'LOW',
      requiredPermission: 'READ_ONLY',
      requiresConfirmation: false,
      timeoutMs: 150, // 150ms timeout
      execute: async () => {
        await new Promise((r) => setTimeout(r, 2000));
        return { tool: 'hung_tool', success: true, output: null };
      }
    };

    ExecutionKernel.registerTool(hangingTool);

    const context: KernelExecutionContext = {
      taskId: 'task_hung_102',
      agentId: 'qa',
      policy: 'READ_ONLY',
      emitEvent: async () => {}
    };

    const res = await ExecutionKernel.executeTool('hung_tool', {}, context);
    assert.equal(res.success, false);
    assert.match(res.error || '', /timed out/);
  });

  test('Verification Engine validates factual checks and detects regressions', async () => {
    // Passing checks
    const goodChecks = [
      { name: 'Schema integrity', run: () => true },
      { name: 'Typescript compilation', run: async () => true }
    ];
    const passResult = await ExecutionKernel.verifyResult(goodChecks);
    assert.equal(passResult.passed, true);
    assert.equal(passResult.failures.length, 0);
    assert.match(passResult.evidence, /All 2 verification checks passed/);

    // Failing checks
    const badChecks = [
      { name: 'Unit test suite', run: () => true },
      { name: 'End-to-end integration', run: () => false }
    ];
    const failResult = await ExecutionKernel.verifyResult(badChecks);
    assert.equal(failResult.passed, false);
    assert.deepEqual(failResult.failures, ['End-to-end integration']);
  });

});
