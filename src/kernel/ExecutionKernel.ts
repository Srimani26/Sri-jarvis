/**
 * J.A.R.V.I.S. MARK-V Central Execution Kernel
 * Core Principle: AI Recommends. The Execution Kernel Validates.
 */

import {
  TaskStatus,
  EventType,
  ExecutionPolicy,
  KernelEvent,
  TaskRecord,
  KernelToolDefinition,
  KernelToolResult,
  KernelExecutionContext,
  KernelPlanStep,
  KernelVerificationResult
} from './types';

export class ExecutionKernel {
  private static tools = new Map<string, KernelToolDefinition>();
  private static taskListeners = new Map<string, Array<(event: KernelEvent) => void>>();
  private static historicalToolLatencies = new Map<string, number[]>();

  /**
   * Register an executable tool in the kernel
   */
  public static registerTool(tool: KernelToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): KernelToolDefinition | undefined {
    return this.tools.get(name);
  }

  public static getAllTools(): KernelToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Normalize user request into a clear, single-sentence objective
   */
  public static normalizeInput(rawInput: string): string {
    let trimmed = rawInput.trim();
    if (!trimmed) return 'Awaiting user directive';

    const conversationalPattern = /^(hey|hi|hello|please|can you|could you|jarvis|aegis|vortex|sir|master sri)[,\s]+/i;
    while (conversationalPattern.test(trimmed)) {
      trimmed = trimmed.replace(conversationalPattern, '').trim();
    }

    trimmed = trimmed.replace(/\s+/g, ' ').trim();
    if (!trimmed) return 'Awaiting user directive';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  /**
   * Calculate honest, range-based ETA
   */
  public static calculateEtaRange(remainingSteps: number, toolNames: string[] = []): string {
    if (remainingSteps <= 0) return '00:00 min';
    
    let avgLatencyMs = 2000; // default 2s per step
    for (const tool of toolNames) {
      const latencies = this.historicalToolLatencies.get(tool);
      if (latencies && latencies.length > 0) {
        const sum = latencies.reduce((a, b) => a + b, 0);
        avgLatencyMs = Math.max(avgLatencyMs, sum / latencies.length);
      }
    }

    const minSec = Math.max(1, Math.round((remainingSteps * avgLatencyMs * 0.8) / 1000));
    const maxSec = Math.max(minSec + 2, Math.round((remainingSteps * avgLatencyMs * 1.6 + 3000) / 1000));

    const formatSec = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return `${formatSec(minSec)} - ${formatSec(maxSec)} min`;
  }

  /**
   * Check capability permissions
   */
  public static checkPermission(
    required: ExecutionPolicy,
    granted: ExecutionPolicy
  ): { allowed: boolean; reason?: string } {
    const hierarchy: Record<ExecutionPolicy, number> = {
      READ_ONLY: 1,
      SAFE_LOCAL: 2,
      PROJECT_WRITE: 3,
      SANDBOX: 4,
      PRIVILEGED: 5,
      PRODUCTION: 6
    };

    if (hierarchy[granted] >= hierarchy[required]) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Action requires ${required} permissions, but current policy is ${granted}. Confirmation required.`
    };
  }

  /**
   * Execute a registered tool within a managed context
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: KernelExecutionContext
  ): Promise<KernelToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        tool: toolName,
        success: false,
        output: null,
        error: `Tool "${toolName}" is not registered in the Execution Kernel.`
      };
    }

    // Check permission
    const permCheck = this.checkPermission(tool.requiredPermission, context.policy);
    if (!permCheck.allowed) {
      return {
        tool: toolName,
        success: false,
        output: null,
        error: permCheck.reason
      };
    }

    const startTime = Date.now();
    await context.emitEvent('TOOL_STARTED', `Invoking tool: ${toolName}`, { tool: toolName, args });

    let timer: NodeJS.Timeout | null = null;
    try {
      // Execute with timeout race
      const timeoutPromise = new Promise<KernelToolResult>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Tool "${toolName}" timed out after ${tool.timeoutMs}ms`)), tool.timeoutMs);
      });

      const result = await Promise.race([tool.execute(args, context), timeoutPromise]);
      if (timer) clearTimeout(timer);
      const elapsed = Date.now() - startTime;

      // Record latency
      const latencies = this.historicalToolLatencies.get(toolName) || [];
      latencies.push(elapsed);
      if (latencies.length > 20) latencies.shift();
      this.historicalToolLatencies.set(toolName, latencies);

      await context.emitEvent('TOOL_COMPLETED', `Tool ${toolName} completed in ${elapsed}ms`, {
        tool: toolName,
        success: result.success,
        elapsedMs: elapsed
      });

      return result;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      const elapsed = Date.now() - startTime;
      await context.emitEvent('ERROR_DETECTED', `Tool ${toolName} failed: ${err.message}`, {
        tool: toolName,
        error: err.message,
        elapsedMs: elapsed
      });

      return {
        tool: toolName,
        success: false,
        output: null,
        error: err.message
      };
    }
  }

  /**
   * Subscribe to live events for a task
   */
  public static subscribeToTask(taskId: string, listener: (event: KernelEvent) => void): () => void {
    const listeners = this.taskListeners.get(taskId) || [];
    listeners.push(listener);
    this.taskListeners.set(taskId, listeners);

    return () => {
      const current = this.taskListeners.get(taskId) || [];
      this.taskListeners.set(taskId, current.filter(l => l !== listener));
    };
  }

  /**
   * Broadcast an event to all task subscribers
   */
  public static broadcastEvent(event: KernelEvent): void {
    const listeners = this.taskListeners.get(event.taskId) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[Kernel] Listener error:', err);
      }
    }
  }

  /**
   * Verify task outputs
   */
  public static verifyResult(
    checks: Array<{ name: string; run: () => boolean | Promise<boolean> }>
  ): Promise<KernelVerificationResult> {
    return new Promise(async (resolve) => {
      const checksRun: string[] = [];
      const failures: string[] = [];

      for (const check of checks) {
        checksRun.push(check.name);
        try {
          const pass = await check.run();
          if (!pass) failures.push(check.name);
        } catch (err: any) {
          failures.push(`${check.name} threw: ${err.message}`);
        }
      }

      resolve({
        passed: failures.length === 0,
        checksRun,
        failures,
        evidence: failures.length === 0
          ? `All ${checksRun.length} verification checks passed successfully.`
          : `Verification failed on ${failures.length} check(s): ${failures.join(', ')}`
      });
    });
  }
}
