/**
 * J.A.R.V.I.S. MARK-V Central Telemetry & Observability Hub
 * Tracks task, agent, model, tool latencies, token consumption, and success metrics.
 */

import { AgentRegistry } from '../agents/AgentRegistry';
import { ToolRegistry } from '../tools/ToolRegistry';
import { ProviderRegistry } from '../providers/ProviderRegistry';

export interface SystemMetricsSnapshot {
  timestamp: string;
  agents: {
    total: number;
    active: number;
    totalInvocations: number;
    totalSuccesses: number;
    totalFailures: number;
    overallSuccessRatePercent: number;
  };
  tools: {
    total: number;
    totalCalls: number;
    totalSuccesses: number;
    totalErrors: number;
    avgLatencyMs: number;
  };
  models: {
    total: number;
    healthy: number;
    providers: string[];
  };
}

export class TelemetryHub {
  public static getSystemMetrics(): SystemMetricsSnapshot {
    const agents = AgentRegistry.listAgents();
    let agentInvocations = 0;
    let agentSuccesses = 0;
    let agentFailures = 0;

    for (const a of agents) {
      agentInvocations += a.telemetry.invocations;
      agentSuccesses += a.telemetry.successes;
      agentFailures += a.telemetry.failures;
    }

    const tools = ToolRegistry.listTools();
    let toolCalls = 0;
    let toolSuccesses = 0;
    let toolErrors = 0;
    let totalLatency = 0;

    for (const t of tools) {
      toolCalls += t.telemetry.callCount;
      toolSuccesses += t.telemetry.successCount;
      toolErrors += t.telemetry.errorCount;
      totalLatency += t.telemetry.totalLatencyMs;
    }

    const models = ProviderRegistry.listModels();
    const healthyModels = models.filter((m) => m.healthy);
    const providers = Array.from(new Set(models.map((m) => m.provider)));

    const agentRate = agentInvocations > 0
      ? Number(((agentSuccesses / agentInvocations) * 100).toFixed(2))
      : 100;

    const avgToolLatency = toolCalls > 0
      ? Math.round(totalLatency / toolCalls)
      : 0;

    return {
      timestamp: new Date().toISOString(),
      agents: {
        total: agents.length,
        active: agents.filter((a) => a.health === 'HEALTHY').length,
        totalInvocations: agentInvocations,
        totalSuccesses: agentSuccesses,
        totalFailures: agentFailures,
        overallSuccessRatePercent: agentRate,
      },
      tools: {
        total: tools.length,
        totalCalls: toolCalls,
        totalSuccesses: toolSuccesses,
        totalErrors: toolErrors,
        avgLatencyMs: avgToolLatency,
      },
      models: {
        total: models.length,
        healthy: healthyModels.length,
        providers,
      },
    };
  }
}
