import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceEngine } from '../src/voice/VoiceEngine';
import { prisma } from '../src/lib/db';

describe('Phase 9: J.A.R.V.I.S. Voice Engine, VAD & Barge-In Architecture', () => {
  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('Voice Activity Detection (VAD) distinguishes speech from background silence', () => {
    const engine = new VoiceEngine();

    // 1. Silent audio samples (near zero amplitude)
    const silence = new Array(100).fill(0.001);
    assert.equal(engine.detectVoiceActivity(silence), false, 'Silence must not trigger VAD');

    // 2. Speech audio samples (higher amplitude energy)
    const speech = [0.15, -0.22, 0.35, -0.18, 0.42, 0.08, -0.31];
    assert.equal(engine.detectVoiceActivity(speech), true, 'High-energy audio must trigger VAD');
  });

  test('Wake word detector identifies natural phrasing and variations', () => {
    const engine = new VoiceEngine();

    assert.equal(engine.detectWakeWord('Jarvis, please help'), true);
    assert.equal(engine.detectWakeWord('Hey Jarvis, inspect the codebase'), true);
    assert.equal(engine.detectWakeWord('Ok Jarvis what is our status'), true);
    assert.equal(engine.detectWakeWord('Random conversation without wake word'), false);
  });

  test('Intent parser normalizes directives and routes to specialist workforce agents', () => {
    const engine = new VoiceEngine();

    // Code intent -> software_engineer
    const codeIntent = engine.parseIntent('Hey Jarvis, please inspect the code and fix the broken typescript error');
    assert.equal(codeIntent.assignedAgentId, 'software_engineer');
    assert.equal(codeIntent.isWakeWordPresent, true);

    // Security intent -> security_agent
    const secIntent = engine.parseIntent('Jarvis, audit our system for security vulnerabilities');
    assert.equal(secIntent.assignedAgentId, 'security_agent');

    // Database intent -> database_engineer
    const dbIntent = engine.parseIntent('Jarvis, check the database schema and run migrations');
    assert.equal(dbIntent.assignedAgentId, 'database_engineer');
  });

  test('VoiceEngine executes directive through the real Execution Kernel', async () => {
    const engine = new VoiceEngine();

    const turnResult = await engine.handleVoiceInput('Hey Jarvis, check our system health');
    assert.ok(turnResult.taskId, 'Voice directive must create real task in execution kernel');
    assert.equal(turnResult.intent.assignedAgentId, 'monitor_agent');
    assert.ok(turnResult.spokenResponse.includes('Master Sri'), 'Must return formal viceroy spoken response');
    assert.ok(turnResult.durationMs >= 0);
  });

  test('Barge-in interruption halts active speech when user speaks', () => {
    const engine = new VoiceEngine();

    // Simulate active speaking state
    (engine as any).isSpeaking = true;
    (engine as any).state = 'SPEAKING';

    engine.bargeIn();
    assert.equal(engine.getState(), 'INTERRUPTED', 'Barge-in must transition state to INTERRUPTED');
  });

});
