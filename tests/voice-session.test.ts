import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VoiceSession,
  AGENT_VOICE_PROFILES,
  resolveAgentVoice,
  GREET_DEFAULT_DEADLINE_MS,
} from '../src/voice/VoiceSession';

function makeAdapters(overrides: Record<string, any> = {}) {
  const calls = { speak: 0, startListening: 0, stopListening: 0, stopSpeaking: 0 };
  const adapters = {
    speak: async () => { calls.speak++; },
    stopSpeaking: () => { calls.stopSpeaking++; },
    startListening: () => { calls.startListening++; },
    stopListening: () => { calls.stopListening++; },
    ...overrides,
  };
  return { adapters, calls };
}

test('greeting playback starts inside the 2 second budget and arms standby once', async () => {
  const { adapters, calls } = makeAdapters();
  const session = new VoiceSession();
  const startedAt = Date.now();
  await session.open(adapters, { greeting: 'Good evening, Master Sri. All systems are online.' });

  assert.ok(Date.now() - startedAt < GREET_DEFAULT_DEADLINE_MS, 'greeting must begin within 2s');
  assert.equal(calls.speak, 1);
  assert.equal(session.getState(), 'STANDBY');
  assert.equal(calls.startListening, 1, 'microphone is armed exactly once after the greeting');
  session.close();
});

test('an empty greeting still reaches standby with the mic armed', async () => {
  const { adapters, calls } = makeAdapters();
  const session = new VoiceSession();
  await session.open(adapters, { greeting: '   ' });

  assert.equal(calls.speak, 0);
  assert.equal(session.getState(), 'STANDBY');
  assert.equal(calls.startListening, 1);
  session.close();
});

test('a failed greeting never blocks standby listening', async () => {
  const { adapters, calls } = makeAdapters({
    speak: async () => { throw new Error('tts offline'); },
  });
  const session = new VoiceSession();
  await session.open(adapters, { greeting: 'Jarvis online.' });

  assert.equal(session.getState(), 'STANDBY');
  assert.equal(calls.startListening, 1);
  session.close();
});

test('quiet, one-word, duplicate and self-heard speech never become commands', async () => {
  const { adapters } = makeAdapters();
  let now = 10_000;
  const session = new VoiceSession({ now: () => now });
  const greeting = 'Good evening, Master Sri. All systems are online and standing by.';
  await session.open(adapters, { greeting });

  assert.deepEqual(session.handleTranscript(''), { accepted: false, reason: 'EMPTY' });
  assert.deepEqual(session.handleTranscript('   '), { accepted: false, reason: 'EMPTY' });
  assert.deepEqual(session.handleTranscript('uh'), { accepted: false, reason: 'TOO_SHORT' });
  assert.deepEqual(session.handleTranscript('Good evening Master Sri all systems are online'), { accepted: false, reason: 'ECHO' });

  const first = session.handleTranscript('build me a landing page for the roof company');
  assert.equal(first.accepted, true);

  now += 300;
  assert.deepEqual(
    session.handleTranscript('build me a landing page for the roof company'),
    { accepted: false, reason: 'DUPLICATE' },
  );

  now += 5000;
  const repeatLater = session.handleTranscript('build me a landing page for the roof company');
  assert.equal(repeatLater.accepted, true, 'the same request later in the conversation is a new command');
  session.close();
});

test('speaking over Jarvis interrupts playback and returns to listening', async () => {
  const { adapters, calls } = makeAdapters();
  const session = new VoiceSession();
  await session.open(adapters, { greeting: 'Jarvis online.' });

  let release: (() => void) | null = null;
  const playback = new Promise<void>(resolve => { release = resolve; });
  const speaking = session.speak('Compiling the mission plan now, Master Sri.', resolveAgentVoice('aegis'));
  assert.equal(session.getState(), 'SPEAKING');

  const decision = session.handleTranscript('stop and show me the tasks page');
  assert.equal(decision.accepted, true);
  assert.equal(decision.accepted && decision.bargeIn, true);
  assert.ok(calls.stopSpeaking >= 1, 'barge-in stops the active playback');
  assert.equal(session.getState(), 'LISTENING');

  release!();
  await speaking;
  session.close();
});

test('recognition restarts back off instead of spinning', () => {
  const session = new VoiceSession();
  const delays = [0, 1, 2, 3, 4, 5, 6, 7].map(attempt => session.computeRestartDelay(attempt));
  for (let index = 1; index < delays.length; index++) {
    assert.ok(delays[index] >= delays[index - 1]);
  }
  assert.ok(delays[delays.length - 1] <= 4000);
  session.close();
});

test('every specialist agent has its own voice identity', () => {
  const profiles = Object.values(AGENT_VOICE_PROFILES);
  assert.ok(profiles.length >= 20, 'all specialist agents can speak');
  for (const profile of profiles) {
    assert.ok(profile.voiceName.length > 0);
    assert.ok(profile.lang.startsWith('en-'));
    assert.ok(profile.rate > 0.5 && profile.rate < 2);
  }
  assert.equal(resolveAgentVoice('aegis').agentId, 'aegis');
  assert.equal(resolveAgentVoice('F.R.I.D.A.Y.').agentId, 'friday');
  assert.equal(resolveAgentVoice('stark os').agentId, 'stark_os');
  assert.equal(resolveAgentVoice('unknown-agent').agentId, 'jarvis');
  assert.notEqual(resolveAgentVoice('jarvis').voiceName, resolveAgentVoice('friday').voiceName);
});

test('closing the session releases the microphone and speaking', async () => {
  const { adapters, calls } = makeAdapters();
  const session = new VoiceSession();
  await session.open(adapters, { greeting: 'Online.' });
  session.close();

  assert.equal(session.getState(), 'CLOSED');
  assert.equal(calls.stopListening, 1);
  assert.deepEqual(session.handleTranscript('open the code lab'), { accepted: false, reason: 'NOT_OPEN' });
});
