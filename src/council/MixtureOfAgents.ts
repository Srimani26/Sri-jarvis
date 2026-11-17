/**
 * J.A.R.V.I.S. Mixture-of-Agents (MoA)
 *
 * Real MoA: several specialist agents independently propose an approach for the
 * same objective (proposers run in parallel), then an aggregator synthesizes one
 * plan from their outputs. Failures are isolated — one unavailable provider
 * never sinks the whole deliberation — and the synthesis is auditable by hash.
 *
 * The deterministic council (`AgentCouncil`) stays as the fast, offline
 * veto path; this engine is the model-backed deliberation path.
 */

import { createHash } from 'node:crypto';
import { AgentRegistry } from '../agents/AgentRegistry';

export interface MoAProposer {
  agentId: string;
  /** Optional override; defaults to the agent's registry system prompt. */
  systemPrompt?: string;
}

export interface MoARequest {
  objective: string;
  proposers?: MoAProposer[];
  context?: string;
  synthesizerAgentId?: string;
  maxProposalChars?: number;
}

export interface MoAProposal {
  agentId: string;
  name: string;
  text: string;
  latencyMs: number;
  error?: string;
}

export interface MoAResult {
  objective: string;
  proposals: MoAProposal[];
  synthesis: string;
  usedAgents: string[];
  failedAgents: string[];
  risks: string[];
  requiresApproval: boolean;
  auditHash: string;
  durationMs: number;
}

export type MoADispatch = (agentId: string, messages: Array<{ role: string; content: string }>) => Promise<string>;

const DEFAULT_PROPOSERS: MoAProposer[] = [
  { agentId: 'architect' },
  { agentId: 'software_engineer' },
  { agentId: 'security_agent' },
];

const RISK_PATTERNS: Array<{ pattern: RegExp; risk: string }> = [
  { pattern: /\b(rm\s+-rf|drop\s+table|truncate\s+table|--force)\b/i, risk: 'Destructive command proposed' },
  { pattern: /\b(hardcode|hard-code|paste)\b[\s\S]{0,40}\b(secret|api key|token)\b/i, risk: 'Secret hardcoding proposed' },
  { pattern: /\b(disable|bypass)\b[\s\S]{0,30}\b(auth|security|approval|verification)\b/i, risk: 'Security bypass proposed' },
  { pattern: /\b(skip|ignore)\b[\s\S]{0,20}\b(tests|verification)\b/i, risk: 'Verification skip proposed' },
];

/** Fast, deterministic risk scan of proposer output. */
export function extractMoARisks(proposals: MoAProposal[]): string[] {
  const risks = new Set<string>();
  for (const proposal of proposals) {
    for (const { pattern, risk } of RISK_PATTERNS) {
      if (pattern.test(proposal.text)) risks.add(`${proposal.agentId}: ${risk}`);
    }
  }
  return [...risks];
}

export class MixtureOfAgents {
  constructor(private readonly dispatch: MoADispatch) {
    if (typeof dispatch !== 'function') throw new Error('MixtureOfAgents requires a model dispatch function');
  }

  async run(request: MoARequest): Promise<MoAResult> {
    const objective = String(request?.objective ?? '').trim();
    if (!objective) throw new Error('Mixture-of-Agents requires an objective');

    const proposers = (request.proposers?.length ? request.proposers : DEFAULT_PROPOSERS)
      .filter(proposer => proposer && typeof proposer.agentId === 'string')
      .slice(0, 5);

    if (proposers.length === 0) throw new Error('Mixture-of-Agents requires at least one proposer');

    const startedAt = Date.now();
    const contextBlock = request.context?.trim() ? `\n\nContext:\n${request.context.trim()}` : '';
    const maxChars = request.maxProposalChars ?? 4000;

    const proposals: MoAProposal[] = await Promise.all(proposers.map(async proposer => {
      const agent = AgentRegistry.getAgent(proposer.agentId);
      const proposalStarted = Date.now();
      const systemPrompt = proposer.systemPrompt
        ?? `${agent?.systemPrompt ?? `You are ${agent?.name ?? proposer.agentId}.`}\n\nYou are one proposer in a Mixture-of-Agents deliberation. Produce a concrete, verifiable plan for the objective. State the steps, the tools you would use, the checks that prove it worked, and the main risk. Be specific and brief.`;
      try {
        const text = await this.dispatch(proposer.agentId, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Objective: ${objective}${contextBlock}` },
        ]);
        return {
          agentId: proposer.agentId,
          name: agent?.name ?? proposer.agentId,
          text: String(text ?? '').slice(0, maxChars),
          latencyMs: Date.now() - proposalStarted,
        };
      } catch (error: any) {
        return {
          agentId: proposer.agentId,
          name: agent?.name ?? proposer.agentId,
          text: '',
          latencyMs: Date.now() - proposalStarted,
          error: error?.message ?? String(error),
        };
      }
    }));

    const usable = proposals.filter(proposal => proposal.text.trim().length > 0);
    const failedAgents = proposals.filter(proposal => !proposal.text.trim()).map(proposal => proposal.agentId);

    const synthesis = await this.synthesise(
      objective,
      usable,
      request.synthesizerAgentId ?? 'jarvis',
    );

    const risks = extractMoARisks(usable);
    const auditHash = createHash('sha256')
      .update(JSON.stringify({ objective, proposals: usable.map(p => ({ agentId: p.agentId, text: p.text })), synthesis }))
      .digest('hex');

    return {
      objective,
      proposals,
      synthesis,
      usedAgents: usable.map(proposal => proposal.agentId),
      failedAgents,
      risks,
      requiresApproval: risks.length > 0,
      auditHash,
      durationMs: Date.now() - startedAt,
    };
  }

  private async synthesise(objective: string, proposals: MoAProposal[], synthesizerAgentId: string): Promise<string> {
    if (proposals.length === 0) {
      return 'No proposer produced a usable plan; deliberation produced no synthesis.';
    }
    if (proposals.length === 1) {
      return proposals[0].text;
    }

    const synthesizer = AgentRegistry.getAgent(synthesizerAgentId);
    const proposalBlock = proposals
      .map(proposal => `### ${proposal.name} (${proposal.agentId})\n${proposal.text}`)
      .join('\n\n');

    try {
      const text = await this.dispatch(synthesizerAgentId, [
        {
          role: 'system',
          content: `${synthesizer?.systemPrompt ?? 'You are J.A.R.V.I.S.'}\n\nYou are the aggregator in a Mixture-of-Agents deliberation. Merge the proposals into ONE plan. Keep only steps that are verifiable, resolve disagreements explicitly, and call out any risk you would refuse to accept. Never claim work was executed.`,
        },
        { role: 'user', content: `Objective: ${objective}\n\nProposals:\n${proposalBlock}` },
      ]);
      if (String(text ?? '').trim()) return String(text).trim();
    } catch {
      // Fall through to the deterministic merge below.
    }

    // Deterministic fallback keeps MoA useful even when the aggregator model is
    // down: keep every distinct proposal, ordered, so nothing is lost silently.
    return [
      `Synthesised plan for: ${objective}`,
      ...proposals.map(proposal => `- ${proposal.name}: ${proposal.text}`),
    ].join('\n');
  }
}

/** Production factory: routes proposer calls through the swarm model router. */
export async function createDefaultMixtureOfAgents(): Promise<MixtureOfAgents> {
  const { swarmModelRouter } = await import('../swarm/engine/ModelRouter');
  const { SWARM_TOOL_SCHEMAS } = await import('../swarm/tools/toolRegistry');
  return new MixtureOfAgents(async (agentId, messages) => {
    const completion = await swarmModelRouter.dispatch(agentId as any, messages as any, SWARM_TOOL_SCHEMAS);
    return completion?.content ?? '';
  });
}
