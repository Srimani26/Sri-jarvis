/**
 * Voice directive routing.
 *
 * Decides whether a spoken sentence is conversation, navigation, or real
 * autonomous work. Only genuine work orders become missions; questions about
 * work ("how do I build X?") stay conversational, and navigation stays instant.
 */

export type VoiceDirectiveKind = 'mission' | 'navigation' | 'conversation';

export interface VoiceDirectiveRoute {
  kind: VoiceDirectiveKind;
  agentId?: string;
  /** Irreversible or production-facing wording; policy will require approval. */
  destructive?: boolean;
  navigationTarget?: string;
}

const AGENT_ALIASES: Record<string, string> = {
  jarvis: 'jarvis',
  friday: 'friday',
  'f.r.i.d.a.y.': 'friday',
  raphael: 'raphael',
  aegis: 'aegis',
  vortex: 'vortex',
  midas: 'midas',
  cerebro: 'cerebro',
  'stark os': 'stark_os',
};

const NAVIGATION = /^(?:please\s+)?(?:open|go\s+to|show|switch\s+to|navigate\s+to|take\s+me\s+to)\s+(?:the\s+)?([a-z0-9 \-]+)$/i;

const WORK_VERBS = /\b(build|create|implement|develop|scaffold|deploy|ship|refactor|fix|debug|audit|migrate|optimi[sz]e|research|investigate|generate|write|set\s+up|configure|integrate|test|delete|purge|wipe|erase)\b/i;

const QUESTION_START = /^(what|why|how|who|when|where|which|can|could|would|should|do|does|did|is|are|explain|tell\s+me\s+about)\b/i;

const DESTRUCTIVE = /\b(delete|drop|wipe|erase|reset|force|purge|overwrite)\b/i;

const NOT_WORK = /\b(how\s+are\s+you|who\s+are\s+you|what\s+time|what'?s\s+up|thank\s+you|thanks|good\s+(morning|evening|afternoon|night)|tell\s+me\s+a\s+joke)\b/i;

export function detectAgent(text: string): string | undefined {
  const lower = String(text ?? '').toLowerCase();
  for (const [alias, agentId] of Object.entries(AGENT_ALIASES)) {
    // Aliases may contain dots (F.R.I.D.A.Y.), where \b cannot close the match,
    // so use explicit non-alphanumeric lookarounds instead.
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?![a-z0-9])`, 'i').test(lower)) {
      return agentId;
    }
  }
  return undefined;
}

export function classifyVoiceDirective(rawText: string): VoiceDirectiveRoute {
  const text = String(rawText ?? '').trim();
  if (!text) return { kind: 'conversation' };

  const navigation = text.match(NAVIGATION);
  if (navigation) {
    return {
      kind: 'navigation',
      navigationTarget: (navigation[1] || '').trim().toLowerCase(),
    };
  }

  if (NOT_WORK.test(text)) return { kind: 'conversation' };

  // A question about work is still a question: answer it, don't dispatch it.
  if (/\?\s*$/.test(text) || QUESTION_START.test(text)) {
    return { kind: 'conversation' };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 3) return { kind: 'conversation' };
  if (!WORK_VERBS.test(text)) return { kind: 'conversation' };

  return {
    kind: 'mission',
    agentId: detectAgent(text),
    destructive: DESTRUCTIVE.test(text),
  };
}
