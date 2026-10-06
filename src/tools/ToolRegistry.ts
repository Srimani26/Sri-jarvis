/**
 * J.A.R.V.I.S. MARK-V Unified Tool Registry & Execution Harness
 * Real, verified execution of system, file, git, and MCP tools with least privilege.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

import { ToolDefinition, ToolCategory, ToolRiskLevel } from './types';
import { ExecutionPolicy, KernelExecutionContext, KernelToolResult } from '../kernel/types';
import { ExecutionKernel } from '../kernel/ExecutionKernel';

const execFileAsync = promisify(execFile);

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static {
    this.registerCoreTools();
  }

  private static createDefaultTelemetry() {
    return {
      callCount: 0,
      successCount: 0,
      errorCount: 0,
      totalLatencyMs: 0,
      avgLatencyMs: 0,
    };
  }

  /**
   * Register core production tools
   */
  private static registerCoreTools() {
    // 1. filesystem_read
    this.registerTool({
      name: 'filesystem_read',
      description: 'Read the text content of a file within the project directory',
      category: 'FILES',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      requiredPermission: 'READ_ONLY',
      riskLevel: 'SAFE',
      timeoutMs: 10_000,
      requiresConfirmation: false,
      requiresAuth: false,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async (args) => {
        const cwd = resolve(process.cwd());
        const filePath = resolve(cwd, args.path);
        if (!filePath.startsWith(cwd)) {
          return { tool: 'filesystem_read', success: false, output: null, error: `Path traversal violation: Access outside workspace root is strictly prohibited (${args.path})` };
        }
        if (!existsSync(filePath)) {
          return { tool: 'filesystem_read', success: false, output: null, error: `File not found: ${args.path}` };
        }
        const content = readFileSync(filePath, 'utf-8');
        return {
          tool: 'filesystem_read',
          success: true,
          output: { content, bytes: Buffer.byteLength(content, 'utf-8') },
          filesTouched: [args.path],
        };
      },
    });

    // 2. filesystem_write
    this.registerTool({
      name: 'filesystem_write',
      description: 'Write or update a file within the project workspace',
      category: 'FILES',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
        required: ['path', 'content'],
      },
      requiredPermission: 'PROJECT_WRITE',
      riskLevel: 'MEDIUM',
      timeoutMs: 15_000,
      requiresConfirmation: false,
      requiresAuth: false,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async (args) => {
        const cwd = resolve(process.cwd());
        const filePath = resolve(cwd, args.path);
        if (!filePath.startsWith(cwd)) {
          return { tool: 'filesystem_write', success: false, output: null, error: `Path traversal violation: Access outside workspace root is strictly prohibited (${args.path})` };
        }
        const parent = dirname(filePath);
        if (!existsSync(parent)) {
          mkdirSync(parent, { recursive: true });
        }
        writeFileSync(filePath, args.content, 'utf-8');
        return {
          tool: 'filesystem_write',
          success: true,
          output: { path: args.path, bytesWritten: Buffer.byteLength(args.content, 'utf-8') },
          filesTouched: [args.path],
        };
      },
    });

    // 3. filesystem_list
    this.registerTool({
      name: 'filesystem_list',
      description: 'List contents of a directory',
      category: 'FILES',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
      },
      requiredPermission: 'READ_ONLY',
      riskLevel: 'SAFE',
      timeoutMs: 10_000,
      requiresConfirmation: false,
      requiresAuth: false,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async (args) => {
        const cwd = resolve(process.cwd());
        const dirPath = resolve(cwd, args.path || '.');
        if (!dirPath.startsWith(cwd)) {
          return { tool: 'filesystem_list', success: false, output: null, error: `Path traversal violation: Access outside workspace root is strictly prohibited (${args.path})` };
        }
        if (!existsSync(dirPath)) {
          return { tool: 'filesystem_list', success: false, output: null, error: `Directory not found: ${args.path}` };
        }
        const entries = readdirSync(dirPath).map((entry) => {
          const fullPath = resolve(dirPath, entry);
          const isDir = statSync(fullPath).isDirectory();
          return { name: entry, isDirectory: isDir };
        });
        return {
          tool: 'filesystem_list',
          success: true,
          output: { entries },
        };
      },
    });

    // 4. git_status
    this.registerTool({
      name: 'git_status',
      description: 'Check git repository status',
      category: 'GIT',
      inputSchema: { type: 'object' },
      requiredPermission: 'READ_ONLY',
      riskLevel: 'SAFE',
      timeoutMs: 10_000,
      requiresConfirmation: false,
      requiresAuth: false,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async () => {
        try {
          const { stdout } = await execFileAsync('git', ['status', '--short'], { cwd: process.cwd() });
          return {
            tool: 'git_status',
            success: true,
            output: { status: stdout.trim() },
          };
        } catch (err: any) {
          return { tool: 'git_status', success: false, output: null, error: err?.message };
        }
      },
    });

    // 5. terminal_exec
    this.registerTool({
      name: 'terminal_exec',
      description: 'Execute an authorized command line executable with strict security boundaries',
      category: 'TERMINAL',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          args: { type: 'array', items: { type: 'string' } },
        },
        required: ['command'],
      },
      requiredPermission: 'SAFE_LOCAL',
      riskLevel: 'HIGH',
      timeoutMs: 30_000,
      requiresConfirmation: true,
      requiresAuth: true,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async (args) => {
        // Prevent destructive commands unless PRIVILEGED or explicit confirmation
        const forbiddenPatterns = [/rm\s+-rf\s+[\/\\]/i, /drop\s+database/i, /format\s+[a-z]:/i];
        const cmdStr = `${args.command} ${(args.args || []).join(' ')}`;
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(cmdStr)) {
            return {
              tool: 'terminal_exec',
              success: false,
              output: null,
              error: `Blocked dangerous command matching prohibited pattern: ${pattern}`,
            };
          }
        }

        try {
          const { stdout, stderr } = await execFileAsync(args.command, args.args || [], {
            cwd: process.cwd(),
            timeout: 25_000,
          });
          return {
            tool: 'terminal_exec',
            success: true,
            output: { stdout: stdout.trim(), stderr: stderr.trim() },
            commandsExecuted: [cmdStr],
          };
        } catch (err: any) {
          return {
            tool: 'terminal_exec',
            success: false,
            output: null,
            error: err?.message || String(err),
            commandsExecuted: [cmdStr],
          };
        }
      },
    });

    // 6. system_health
    this.registerTool({
      name: 'system_health',
      description: 'Retrieve real-time host operating system statistics',
      category: 'MONITORING',
      inputSchema: { type: 'object' },
      requiredPermission: 'READ_ONLY',
      riskLevel: 'SAFE',
      timeoutMs: 5_000,
      requiresConfirmation: false,
      requiresAuth: false,
      health: 'ONLINE',
      telemetry: this.createDefaultTelemetry(),
      execute: async () => {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return {
          tool: 'system_health',
          success: true,
          output: {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemoryMb: Math.round(totalMem / (1024 * 1024)),
            freeMemoryMb: Math.round(freeMem / (1024 * 1024)),
            usedMemoryPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
            uptimeHours: (os.uptime() / 3600).toFixed(2),
            nodeVersion: process.version,
          },
        };
      },
    });
  }

  public static registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    // Also mirror into ExecutionKernel
    ExecutionKernel.registerTool({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      risk: tool.riskLevel,
      requiredPermission: tool.requiredPermission,
      requiresConfirmation: tool.requiresConfirmation,
      timeoutMs: tool.timeoutMs,
      execute: tool.execute,
    });
  }

  public static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public static listTools(category?: ToolCategory): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (category) {
      return all.filter((t) => t.category === category);
    }
    return all;
  }

  /**
   * Execute tool with schema verification, permission check, and telemetry recording
   */
  public static async execute(
    name: string,
    args: Record<string, any>,
    context: KernelExecutionContext
  ): Promise<KernelToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        tool: name,
        success: false,
        output: null,
        error: `Tool '${name}' not found in registry`,
      };
    }

    // Permission check
    const perm = ExecutionKernel.checkPermission(tool.requiredPermission, context.policy);
    if (!perm.allowed) {
      return {
        tool: name,
        success: false,
        output: null,
        error: `Permission Denied: ${perm.reason}`,
      };
    }

    // Execute through kernel with timeout harness
    const result = await ExecutionKernel.executeTool(name, args, context);
    const latency = Date.now() - startTime;

    // Telemetry update
    const t = tool.telemetry;
    t.callCount++;
    if (result.success) {
      t.successCount++;
    } else {
      t.errorCount++;
    }
    t.totalLatencyMs += latency;
    t.avgLatencyMs = Math.round(t.totalLatencyMs / t.callCount);
    t.lastExecuted = new Date().toISOString();

    return result;
  }
}
