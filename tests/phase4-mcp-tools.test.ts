import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { MCPClientManager } from '../src/mcp/MCPClientManager';
import { KernelExecutionContext } from '../src/kernel/types';
import { prisma } from '../src/lib/db';
import { unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Phase 4: J.A.R.V.I.S. Unified Tool Registry & MCP Protocol', () => {
  const testArtifactPath = 'tests/temp_test_artifact.txt';

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
    const absPath = resolve(process.cwd(), testArtifactPath);
    if (existsSync(absPath)) {
      try { unlinkSync(absPath); } catch {}
    }
  });

  const createContext = (policy: 'READ_ONLY' | 'SAFE_LOCAL' | 'PROJECT_WRITE' | 'PRIVILEGED'): KernelExecutionContext => ({
    taskId: 'task_tool_test',
    agentId: 'software_engineer',
    policy,
    emitEvent: async () => {},
  });

  test('ToolRegistry initializes core toolset with risk levels and schemas', () => {
    const tools = ToolRegistry.listTools();
    assert.ok(tools.length >= 6, 'Must have at least 6 core built-in tools');

    const expectedTools = [
      'filesystem_read',
      'filesystem_write',
      'filesystem_list',
      'git_status',
      'terminal_exec',
      'system_health'
    ];

    for (const toolName of expectedTools) {
      const tool = ToolRegistry.getTool(toolName);
      assert.ok(tool, `Core tool '${toolName}' must be registered`);
      assert.ok(tool?.description, `Tool '${toolName}' must have a description`);
      assert.ok(tool?.requiredPermission, `Tool '${toolName}' must define required permission`);
      assert.ok(tool?.riskLevel, `Tool '${toolName}' must define risk level`);
      assert.equal(tool?.health, 'ONLINE');
    }
  });

  test('filesystem_read and filesystem_write execute with permission verification', async () => {
    // 1. Attempt write with READ_ONLY permission -> must fail
    const readOnlyCtx = createContext('READ_ONLY');
    const deniedWrite = await ToolRegistry.execute(
      'filesystem_write',
      { path: testArtifactPath, content: 'Sovereign Kernel Test' },
      readOnlyCtx
    );
    assert.equal(deniedWrite.success, false);
    assert.match(deniedWrite.error || '', /Permission Denied/);

    // 2. Write with PROJECT_WRITE permission -> must succeed
    const writeCtx = createContext('PROJECT_WRITE');
    const successfulWrite = await ToolRegistry.execute(
      'filesystem_write',
      { path: testArtifactPath, content: 'Sovereign Kernel Test 2026' },
      writeCtx
    );
    assert.equal(successfulWrite.success, true);
    assert.equal(successfulWrite.output.path, testArtifactPath);

    // 3. Read written file with READ_ONLY permission -> must succeed
    const successfulRead = await ToolRegistry.execute(
      'filesystem_read',
      { path: testArtifactPath },
      readOnlyCtx
    );
    assert.equal(successfulRead.success, true);
    assert.equal(successfulRead.output.content, 'Sovereign Kernel Test 2026');
    assert.ok(successfulRead.output.bytes > 0);
  });

  test('system_health returns factual hardware and OS telemetry', async () => {
    const ctx = createContext('READ_ONLY');
    const result = await ToolRegistry.execute('system_health', {}, ctx);

    assert.equal(result.success, true);
    const health = result.output;
    assert.ok(health.platform, 'Platform must be reported');
    assert.ok(health.cpus > 0, 'CPU core count must be greater than 0');
    assert.ok(health.totalMemoryMb > 0, 'Total memory must be greater than 0');
    assert.ok(health.freeMemoryMb > 0, 'Free memory must be greater than 0');
    assert.ok(health.usedMemoryPercent >= 0 && health.usedMemoryPercent <= 100);
  });

  test('terminal_exec executes safe commands and blocks dangerous payloads', async () => {
    const ctx = createContext('SAFE_LOCAL');

    // Safe command: git --version
    const safeExec = await ToolRegistry.execute(
      'terminal_exec',
      { command: 'git', args: ['--version'] },
      ctx
    );
    assert.equal(safeExec.success, true);
    assert.match(safeExec.output.stdout, /git version/i);

    // Dangerous command: rm -rf /
    const dangerousExec = await ToolRegistry.execute(
      'terminal_exec',
      { command: 'rm', args: ['-rf', '/'] },
      ctx
    );
    assert.equal(dangerousExec.success, false);
    assert.match(dangerousExec.error || '', /Blocked dangerous command/);
  });

  test('MCPClientManager mounts external server tools into ToolRegistry', async () => {
    const mcpManifest = {
      serverId: 'github_mcp',
      serverName: 'GitHub Context Provider',
      transport: 'in_process' as const,
      tools: [
        {
          name: 'get_pull_request',
          description: 'Fetch pull request details and diff status',
          inputSchema: { type: 'object', properties: { prNumber: { type: 'number' } } },
        },
        {
          name: 'create_issue',
          description: 'Create a new repository issue',
          inputSchema: { type: 'object', properties: { title: { type: 'string' } } },
        },
      ],
    };

    const mountResult = MCPClientManager.mountServer(mcpManifest, async (toolName, args) => {
      if (toolName === 'get_pull_request') {
        return { prNumber: args.prNumber, status: 'OPEN', title: 'Mark-V Architecture PR' };
      }
      return { created: true };
    });

    assert.equal(mountResult.mountedCount, 2);
    assert.ok(MCPClientManager.isServerMounted('github_mcp'));

    // Verify mounted tool is registered in ToolRegistry
    const mountedToolName = 'mcp_github_mcp_get_pull_request';
    const tool = ToolRegistry.getTool(mountedToolName);
    assert.ok(tool, 'MCP tool must be accessible from unified ToolRegistry');

    // Execute mounted MCP tool
    const ctx = createContext('SAFE_LOCAL');
    const execResult = await ToolRegistry.execute(mountedToolName, { prNumber: 42 }, ctx);
    assert.equal(execResult.success, true);
    assert.equal(execResult.output.prNumber, 42);
    assert.equal(execResult.output.title, 'Mark-V Architecture PR');
  });

});
