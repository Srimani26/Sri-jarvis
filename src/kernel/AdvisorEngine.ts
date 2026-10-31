/**
 * AdvisorEngine.ts — Anthropic Executor-Advisor Pattern Engine
 * Assimilated from Anthropic Claude Advisor Tool architecture (advisor_20260301).
 *
 * Solves the high-latency & high-cost bottleneck of running heavy models continuously:
 * - A fast, cost-effective Executor Model (Flash-Lite / Sonnet / Llama) runs routine tasks & tool calls
 * - When an architectural fork, test failure, or ambiguity occurs, it escalates to the Advisor Tool
 * - A high-IQ Frontier Advisor Model (DeepSeek-R1 / Claude Opus / Gemini Pro) provides pure strategic guidance
 * - The Executor absorbs the course-correction and continues execution cleanly.
 */

export interface AdvisorContext {
  goal: string;
  currentStep: string;
  encounteredObstacle?: string;
  availableTools?: string[];
  priorLogs?: string[];
  systemState?: Record<string, any>;
}

export interface AdvisorRequest {
  agentId: string;
  taskTitle: string;
  context: AdvisorContext;
  preferredAdvisorModel?: string;
}

export interface AdvisorGuidance {
  ok: boolean;
  strategicGuidance: string;
  recommendedAction: string;
  suggestedTool?: string;
  suggestedToolArgs?: Record<string, any>;
  riskAssessment: 'LOW' | 'MEDIUM' | 'CRITICAL';
  reasoning: string;
  advisorSource: string;
}

export class AdvisorEngine {
  private static advisorAiCaller: ((systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>) | null = null;

  public static setAdvisorAiCaller(caller: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>) {
    this.advisorAiCaller = caller;
  }

  /**
   * Consults the high-IQ advisor on behalf of a subordinate or executor agent.
   */
  public static async consultAdvisor(
    request: AdvisorRequest,
    callerOverride?: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source?: string }>
  ): Promise<AdvisorGuidance> {
    const caller = callerOverride || this.advisorAiCaller;
    if (!caller) {
      return {
        ok: true,
        strategicGuidance: 'Proceed with standard defensive verification and isolated sandbox execution.',
        recommendedAction: 'Verify input invariants and continue next planned task step.',
        riskAssessment: 'LOW',
        reasoning: 'Fallback heuristic advisor guidance active (no LLM caller bound).',
        advisorSource: 'Heuristic Rules Engine'
      };
    }

    const advisorSystemPrompt = `You are the Supreme Strategic Advisor for Sovereign Master Sri's autonomous J.A.R.V.I.S. Mark-V engine.
Your role: Provide concise, razor-sharp architectural guidance and root-cause solutions to subordinate agents encountering obstacles.

Directives:
1. Deliver pure strategic intelligence and root-cause correction.
2. DO NOT output conversational filler, markdown fluff, or polite disclaimers.
3. Output strictly valid JSON matching this schema:
{
  "strategicGuidance": "One or two concise sentences of architectural direction",
  "recommendedAction": "Exact immediate step the executor must take",
  "suggestedTool": "Name of best tool to invoke (if applicable)",
  "suggestedToolArgs": {},
  "riskAssessment": "LOW" | "MEDIUM" | "CRITICAL",
  "reasoning": "Underlying mathematical or software engineering rationale"
}`;

    const contextPayload = JSON.stringify({
      commander: 'Master Sri',
      callingAgent: request.agentId,
      task: request.taskTitle,
      context: request.context
    }, null, 2);

    try {
      const response = await caller(advisorSystemPrompt, [
        { role: 'user', content: `ADVISOR ESCALATION REQUEST:\n${contextPayload}` }
      ]);

      const rawText = (response?.text || '').trim();
      let parsed: any = null;

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }

      if (parsed && parsed.strategicGuidance) {
        return {
          ok: true,
          strategicGuidance: parsed.strategicGuidance,
          recommendedAction: parsed.recommendedAction || 'Execute advised action.',
          suggestedTool: parsed.suggestedTool,
          suggestedToolArgs: parsed.suggestedToolArgs,
          riskAssessment: parsed.riskAssessment || 'LOW',
          reasoning: parsed.reasoning || 'Strategic evaluation completed.',
          advisorSource: response.source || 'Frontier Advisor Core'
        };
      }

      // If response was natural language rather than pure JSON:
      return {
        ok: true,
        strategicGuidance: rawText.slice(0, 300),
        recommendedAction: 'Incorporate advisor strategy into execution plan.',
        riskAssessment: 'LOW',
        reasoning: rawText.slice(0, 500),
        advisorSource: response.source || 'Frontier Advisor Core'
      };
    } catch (err: any) {
      return {
        ok: false,
        strategicGuidance: `Advisor deliberation timed out. Fallback: isolate error and retry with conservative parameters.`,
        recommendedAction: 'Retry operation with exponential backoff.',
        riskAssessment: 'MEDIUM',
        reasoning: `Advisor error: ${err?.message || err}`,
        advisorSource: 'Safety Circuit Breaker'
      };
    }
  }
}

