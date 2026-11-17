import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTurnDecision, rearmDelayMs, DEFAULT_CONVERSATION_WINDOW_MS } from '../src/voice/ConversationFlow';
import { classifyVoiceDirective, detectAgent } from '../src/voice/directiveRouter';

test('a closed surface stops the loop', () => {
  assert.equal(nextTurnDecision({ isOpen: false, isSpeaking: false, isProcessing: false, now: 0 }), 'STOP');
});

test('Jarvis does not listen to itself while speaking or thinking', () => {
  const base = { isOpen: true, lastExchangeAt: 1000, now: 2000 };
  assert.equal(nextTurnDecision({ ...base, isSpeaking: true, isProcessing: false }), 'WAIT');
  assert.equal(nextTurnDecision({ ...base, isSpeaking: false, isProcessing: true }), 'WAIT');
});

test('an interruption re-arms the mic immediately', () => {
  assert.equal(
    nextTurnDecision({ isOpen: true, isSpeaking: true, isProcessing: false, interrupted: true, now: 5 }),
    'LISTEN',
  );
});

test('follow-up speech is expected inside the conversation window, then standby', () => {
  const last = 10_000;
  assert.equal(
    nextTurnDecision({ isOpen: true, isSpeaking: false, isProcessing: false, lastExchangeAt: last, now: last + 5_000 }),
    'LISTEN',
  );
  assert.equal(
    nextTurnDecision({ isOpen: true, isSpeaking: false, isProcessing: false, lastExchangeAt: last, now: last + DEFAULT_CONVERSATION_WINDOW_MS + 1 }),
    'STANDBY',
  );
  assert.equal(
    nextTurnDecision({ isOpen: true, isSpeaking: false, isProcessing: false, lastExchangeAt: null, now: last }),
    'STANDBY',
  );
});

test('re-arm delay is shorter after an interruption but never zero', () => {
  assert.ok(rearmDelayMs(true) > 0);
  assert.ok(rearmDelayMs(true) < rearmDelayMs(false));
});

test('spoken work orders become missions, questions stay conversation', () => {
  assert.equal(classifyVoiceDirective('build me a fullstack dashboard for client invoices').kind, 'mission');
  assert.equal(classifyVoiceDirective('deploy the roofing site to production').kind, 'mission');
  assert.equal(classifyVoiceDirective('how do I build a payment flow?').kind, 'conversation');
  assert.equal(classifyVoiceDirective('what is the status of my tasks').kind, 'conversation');
  assert.equal(classifyVoiceDirective('thanks, that is all').kind, 'conversation');
  assert.equal(classifyVoiceDirective('hi').kind, 'conversation');
});

test('navigation stays instant and is never dispatched as work', () => {
  const route = classifyVoiceDirective('open tasks');
  assert.equal(route.kind, 'navigation');
  assert.equal(route.navigationTarget, 'tasks');
  assert.equal(classifyVoiceDirective('take me to revenue').kind, 'navigation');
});

test('addressed agents and destructive wording are detected', () => {
  const route = classifyVoiceDirective('Aegis fix the failing test suite');
  assert.equal(route.kind, 'mission');
  assert.equal(route.agentId, 'aegis');

  const destructive = classifyVoiceDirective('delete all archived logs from the server');
  assert.equal(destructive.kind, 'mission');
  assert.equal(destructive.destructive, true);

  assert.equal(detectAgent('ask F.R.I.D.A.Y. to compile it'), 'friday');
  assert.equal(detectAgent('no agent here'), undefined);
});
