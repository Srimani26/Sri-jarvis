/**
 * J.A.R.V.I.S. MARK-V Operational Provider Performance Learning
 * Measures real-world execution telemetry to route tasks to empirically proven models.
 * (Operational ranking and routing optimization, NOT foundation model weight retraining).
 */

import { ProviderType, RoutingTaskType } from './types';

export interface PerformanceMetric {
  taskType: RoutingTaskType;
  provider: ProviderType;
  model: string;
  totalAttempts: number;
  successes: number;
  failures: number;
  avgLatencyMs: number;
  successRate: number;
}

export class ProviderLearner {
  private static metrics: Map<string, PerformanceMetric> = new Map();

  private static getKey(taskType: RoutingTaskType, model: string): string {
    return `${taskType}:${model}`;
  }

  public static recordExecution(
    taskType: RoutingTaskType,
    provider: ProviderType,
    model: string,
    success: boolean,
    latencyMs: number
  ): void {
    const key = this.getKey(taskType, model);
    let m = this.metrics.get(key);

    if (!m) {
      m = {
        taskType,
        provider,
        model,
        totalAttempts: 0,
        successes: 0,
        failures: 0,
        avgLatencyMs: latencyMs,
        successRate: 1.0,
      };
      this.metrics.set(key, m);
    }

    m.totalAttempts++;
    if (success) {
      m.successes++;
    } else {
      m.failures++;
    }

    // Exponential moving average for latency
    m.avgLatencyMs = Math.round((m.avgLatencyMs * 0.7) + (latencyMs * 0.3));
    m.successRate = Number((m.successes / m.totalAttempts).toFixed(3));
  }

  public static getBestModelForTask(taskType: RoutingTaskType): PerformanceMetric | undefined {
    const candidates = Array.from(this.metrics.values()).filter(
      (m) => m.taskType === taskType && m.totalAttempts >= 2
    );

    if (candidates.length === 0) return undefined;

    // Prefer highest success rate, then lowest latency
    candidates.sort((a, b) => {
      const diff = b.successRate - a.successRate;
      if (diff !== 0) return diff;
      return a.avgLatencyMs - b.avgLatencyMs;
    });

    return candidates[0];
  }

  public static getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
}
