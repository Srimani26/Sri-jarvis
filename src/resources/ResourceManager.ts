/**
 * J.A.R.V.I.S. MARK-V Resource Economics & Manager
 * Manages resource efficiency, optimizes cost vs quality, and monitors system capacity.
 */

import { ResourceRegistry } from './ResourceRegistry';
import { ResourceRequirement, ResourceMetadata, SystemResourceEconomics } from './types';

export class ResourceManager {
  private static totalCostUsd = 0;
  private static totalInvocations = 0;

  /**
   * Plan optimal resources for a multi-step objective
   */
  public static planResources(requirements: ResourceRequirement[]): ResourceMetadata[] {
    const planned: ResourceMetadata[] = [];
    for (const req of requirements) {
      const best = ResourceRegistry.getBestResource(req);
      if (best) {
        planned.push(best);
      }
    }
    return planned;
  }

  /**
   * Record resource cost and invocation
   */
  public static recordConsumption(costUsd: number): void {
    this.totalCostUsd += costUsd;
    this.totalInvocations++;
  }

  /**
   * Get current economics snapshot
   */
  public static getEconomics(): SystemResourceEconomics {
    const all = ResourceRegistry.listAll();
    const healthy = all.filter((r) => r.health === 'HEALTHY');
    const freeCount = all.filter((r) => r.costClass === 'FREE' || r.costClass === 'ZERO_SELF_HOSTED').length;
    const localCount = all.filter((r) => r.classification === 'LOCAL').length;
    const avgLatency = all.length > 0
      ? Math.round(all.reduce((acc, r) => acc + r.latencyMs, 0) / all.length)
      : 0;

    const overallHealthScore = all.length > 0 ? Math.round((healthy.length / all.length) * 100) : 100;

    return {
      totalEstimatedCostUsd: Number(this.totalCostUsd.toFixed(6)),
      activeWorkers: all.filter((r) => r.type === 'WORKER' && r.health === 'HEALTHY').length,
      registeredProviders: all.filter((r) => r.type === 'PROVIDER' || r.type === 'MODEL').length,
      freeTierActiveCount: freeCount,
      localResourceCount: localCount,
      averageLatencyMs: avgLatency,
      overallHealthScore,
    };
  }

  /**
   * Check whether system is within sustainable operational bounds
   */
  public static isSystemHealthy(): boolean {
    const eco = this.getEconomics();
    return eco.overallHealthScore >= 60;
  }
}
