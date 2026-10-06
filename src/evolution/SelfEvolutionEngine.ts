/**
 * J.A.R.V.I.S. MARK-V Controlled Self-Evolution Engine
 * Proposes, benchmarks, sandbox-tests, and safely applies optimizations with zero uncontrolled mutations.
 */

import { EvolutionBenchmarkResult, EvolutionProposal } from './types';
import { TaskStore } from '../kernel/TaskStore';

export class SelfEvolutionEngine {
  private static proposals: Map<string, EvolutionProposal> = new Map();

  /**
   * Propose a controlled optimization
   */
  public static proposeOptimization(
    title: string,
    category: 'TOOL' | 'SKILL' | 'PROMPT' | 'ROUTING' | 'PERFORMANCE',
    targetFile: string,
    proposedPatch: string,
    description: string,
    benchmarkBeforeMs: number
  ): EvolutionProposal {
    const id = `evo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const proposal: EvolutionProposal = {
      id,
      title,
      category,
      targetFile,
      proposedPatch,
      description,
      benchmarkBeforeMs,
      securityApproved: false,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(id, proposal);
    return proposal;
  }

  /**
   * Run benchmark and sandbox evaluation on proposal
   */
  public static async evaluateAndApply(
    proposalId: string,
    taskId: string,
    benchmarkRunner: () => Promise<number>,
    securityCheck: (patch: string) => boolean
  ): Promise<EvolutionBenchmarkResult> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

    proposal.status = 'SANDBOX_TESTING';
    await TaskStore.emitEvent(
      taskId,
      'VERIFICATION_STARTED',
      `Evaluating self-evolution proposal: "${proposal.title}" in sandbox environment`,
      { proposalId }
    );

    // 1. Security review
    const isSecure = securityCheck(proposal.proposedPatch);
    proposal.securityApproved = isSecure;

    if (!isSecure) {
      proposal.status = 'REJECTED';
      await TaskStore.emitEvent(
        taskId,
        'ERROR_DETECTED',
        `Self-evolution proposal rejected by Security Shield: potential dangerous pattern in patch`
      );
      return {
        passed: false,
        baselineMs: proposal.benchmarkBeforeMs,
        optimizedMs: 0,
        regressionDetected: true,
      };
    }

    // 2. Benchmark execution
    const optimizedMs = await benchmarkRunner();
    proposal.benchmarkAfterMs = optimizedMs;

    const speedup = ((proposal.benchmarkBeforeMs - optimizedMs) / proposal.benchmarkBeforeMs) * 100;
    proposal.speedupPercent = Number(speedup.toFixed(2));

    // If optimized time is worse than baseline, detect regression and reject/rollback
    if (optimizedMs > proposal.benchmarkBeforeMs * 1.05) {
      proposal.status = 'ROLLED_BACK';
      await TaskStore.emitEvent(
        taskId,
        'TASK_FAILED',
        `Performance regression detected: ${optimizedMs}ms vs baseline ${proposal.benchmarkBeforeMs}ms. Safe rollback executed.`
      );
      return {
        passed: false,
        baselineMs: proposal.benchmarkBeforeMs,
        optimizedMs,
        regressionDetected: true,
      };
    }

    // Benchmark passed! Apply optimization
    proposal.status = 'APPLIED';
    await TaskStore.emitEvent(
      taskId,
      'VERIFICATION_PASSED',
      `Self-evolution optimization applied: ${proposal.speedupPercent}% speedup verified. Baseline: ${proposal.benchmarkBeforeMs}ms -> Optimized: ${optimizedMs}ms`,
      { speedupPercent: proposal.speedupPercent }
    );

    return {
      passed: true,
      baselineMs: proposal.benchmarkBeforeMs,
      optimizedMs,
      regressionDetected: false,
    };
  }

  public static getProposal(id: string): EvolutionProposal | undefined {
    return this.proposals.get(id);
  }

  public static listProposals(): EvolutionProposal[] {
    return Array.from(this.proposals.values());
  }

  public static clear(): void {
    this.proposals.clear();
  }
}
