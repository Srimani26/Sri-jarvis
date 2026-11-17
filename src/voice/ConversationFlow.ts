/**
 * Continuous conversation policy.
 *
 * Siri/Alexa-style assistants do not hang up after one sentence: after Jarvis
 * finishes speaking, the microphone re-arms so Master Sri can answer without
 * touching anything. This module is the pure decision behind that, kept out of
 * the React component so the rules are testable.
 */

export type ConversationNext = 'LISTEN' | 'WAIT' | 'STANDBY' | 'STOP';

export interface ConversationContext {
  /** Voice surface is open. */
  isOpen: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  /** The user interrupted playback; re-arm immediately. */
  interrupted?: boolean;
  /** Timestamp of the last completed exchange, if any. */
  lastExchangeAt?: number | null;
  now: number;
  /** How long after an exchange follow-up speech is still expected. */
  conversationWindowMs?: number;
}

export const DEFAULT_CONVERSATION_WINDOW_MS = 45_000;

export function nextTurnDecision(context: ConversationContext): ConversationNext {
  if (!context?.isOpen) return 'STOP';
  if (context.interrupted) return 'LISTEN';
  if (context.isSpeaking || context.isProcessing) return 'WAIT';

  const window = context.conversationWindowMs ?? DEFAULT_CONVERSATION_WINDOW_MS;
  const last = context.lastExchangeAt ?? null;
  if (last !== null && context.now - last <= window) return 'LISTEN';

  return 'STANDBY';
}

/** Delay before re-arming the mic, so Jarvis never records its own tail. */
export function rearmDelayMs(interrupted: boolean): number {
  return interrupted ? 120 : 350;
}
