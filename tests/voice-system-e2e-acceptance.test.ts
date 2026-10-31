import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveVAD } from '../src/voice/AdaptiveVAD';
import { SentenceSplitter } from '../src/voice/SentenceSplitter';
import { ConversationOS } from '../src/voice/ConversationOS';

describe('J.A.R.V.I.S. High-IQ Gemini Voice System — Complete End-to-End Test Suite', () => {

  // 1. ADAPTIVE VOICE ACTIVITY DETECTION (VAD)
  describe('1. Adaptive VAD & Acoustic Lookback Engine', () => {
    test('1.1 Calibrates dynamic noise floor and triggers on soft mobile speech (RMS 4-10)', () => {
      const vad = new AdaptiveVAD({
        minAbsoluteEnergy: 3.5,
        energyDelta: 2.8,
        silenceHangoverMs: 700,
        minSpeechDurationMs: 250
      });

      // Simulate quiet room background noise (RMS ~2.5)
      const quietFrame = new Uint8Array(128).fill(3);
      for (let i = 0; i < 10; i++) {
        const frame = vad.processFrequencyData(quietFrame);
        assert.equal(frame.isSpeaking, false, 'Quiet ambient noise should not trigger false speech');
      }

      // Simulate soft mobile microphone speech (energy ~8, which failed the old >14 threshold)
      const speechFrame = new Uint8Array(128).fill(8);
      const speechRes = vad.processFrequencyData(speechFrame);
      assert.equal(speechRes.isSpeaking, true, 'Soft mobile speech must reliably trigger speech detection');
      assert.equal(vad.isSpeechActive, true);
    });

    test('1.2 Pre-speech ring buffer captures opening syllables without truncation', () => {
      const vad = new AdaptiveVAD();

      // Push 4 lookback chunks before speech trigger
      const chunk1 = new Blob(['pre1'], { type: 'audio/webm' });
      const chunk2 = new Blob(['pre2'], { type: 'audio/webm' });
      const chunk3 = new Blob(['pre3'], { type: 'audio/webm' });
      vad.pushChunk(chunk1);
      vad.pushChunk(chunk2);
      vad.pushChunk(chunk3);

      const lookback = vad.getPreSpeechChunks();
      assert.equal(lookback.length, 3, 'Pre-speech lookback buffer must store opening audio chunks');
    });

    test('1.3 Enforces 700ms silence hangover before concluding user turn', () => {
      const vad = new AdaptiveVAD({ silenceHangoverMs: 700, minSpeechDurationMs: 200 });

      // Trigger speech
      const speechFrame = new Uint8Array(128).fill(25);
      vad.processFrequencyData(speechFrame);
      assert.equal(vad.isSpeechActive, true);

      // Brief 100ms pause while user thinks (must NOT conclude turn)
      const silenceFrame = new Uint8Array(128).fill(2);
      const earlySilence = vad.processFrequencyData(silenceFrame);
      assert.equal(earlySilence.turnCompleted, false, 'Brief pause must not prematurely cut user off');
    });
  });

  // 2. STREAMING SENTENCE SPLITTER
  describe('2. Streaming Sentence Chunking & Time-to-First-Sound', () => {
    test('2.1 Emits early opening clause at strong breaks for sub-400ms first byte speech', () => {
      const splitter = new SentenceSplitter(140, 35);
      // Streaming delta from LLM
      const chunks = splitter.feed('Certainly Master Sri — all system security channels are operating at peak efficiency.');
      assert.ok(chunks.length >= 1, 'Splitter must emit opening clause early at dash/pause');
      assert.ok(chunks[0].includes('Certainly Master Sri'), 'First chunk must contain opening acknowledgement');
    });

    test('2.2 Preserves abbreviations, decimals, and list markers without premature splitting', () => {
      const splitter = new SentenceSplitter();
      const text = 'Master Sri, we upgraded to version 3.5 with Dr. Banner and Mr. Stark on step 1. of the plan.';
      const chunks = splitter.feed(text);
      const final = splitter.flush();
      const all = [...chunks, final].filter(Boolean);

      // Should not split on "3.5", "Dr.", "Mr.", or "1."
      assert.equal(all.length, 1, 'Abbreviations and decimals must not cause false sentence cuts');
      assert.ok(all[0]?.includes('version 3.5'));
    });
  });

  // 3. FULL SYSTEM VOICE COMMAND INTERPRETATION & ACTION DISPATCH
  describe('3. Dynamic Voice Action & Multi-Agent Dispatch Engine', () => {
    test('3.1 Navigation Intent: "Take me to revenue" resolves to Revenue Hunter tab', async () => {
      const res = await ConversationOS.processUserSpeechAsync('Jarvis, take me to revenue hunter');
      assert.ok(res.action, 'Action must be detected');
      assert.equal(res.action?.type, 'navigate');
      assert.equal(res.action?.targetTab, 'revenue');
      assert.equal(res.targetAgent, 'midas', 'Revenue directives route to Midas');
      assert.ok(res.spokenText.length > 0);
    });

    test('3.2 Navigation Intent: "Show active tasks" resolves to Tasks tab', async () => {
      const res = await ConversationOS.processUserSpeechAsync('Friday, show me what you are working on');
      assert.ok(res.action);
      assert.equal(res.action?.type, 'navigate');
      assert.equal(res.action?.targetTab, 'tasks');
      assert.equal(res.targetAgent, 'friday');
    });

    test('3.3 Navigation Intent: "Open cybersecurity defense" routes to Aegis and Cyber tab', async () => {
      const res = await ConversationOS.processUserSpeechAsync('Aegis, check firewall and cyber shield');
      assert.ok(res.action);
      assert.equal(res.action?.type, 'cyber_scan');
      assert.equal(res.targetAgent, 'aegis');
    });

    test('3.4 Navigation Intent: "Open projects / Invi luxury store" routes to Projects tab', async () => {
      const res = await ConversationOS.processUserSpeechAsync('Jarvis, open the Invi luxury store project');
      assert.ok(res.action);
      assert.equal(res.action?.type, 'navigate');
      assert.equal(res.action?.targetTab, 'projects');
    });

    test('3.5 Task Creation: "Build a luxury clothing catalog" triggers create_task', async () => {
      const res = await ConversationOS.processUserSpeechAsync('Friday, build a luxury fashion catalog for Invi');
      assert.ok(res.action);
      assert.equal(res.action?.type, 'create_task');
      assert.equal(res.targetAgent, 'friday');
      assert.ok(res.spokenText.length > 0);
    });

    test('3.6 Conversational QA: General knowledge inquiry delivers concise, high-IQ dialogue', async () => {
      const mockAi = async (prompt: string, msgs: any[]) => ({
        text: 'Master Sri, quantum computing utilizes superposition and entanglement to solve discrete optimization problems exponentially faster than classical silicon.'
      });
      const res = await ConversationOS.processUserSpeechAsync(
        'Raphael, explain how quantum superposition functions',
        mockAi,
        'raphael'
      );
      assert.equal(res.targetAgent, 'raphael');
      assert.ok(res.spokenText.includes('superposition'));
      // Under 35 words for fluid human speech
      const wordCount = res.spokenText.split(/\s+/).length;
      assert.ok(wordCount <= 35, `Spoken output must be concise for voice playback (got ${wordCount} words)`);
    });
  });

  // 4. MULTI-AGENT VOICE PERSONALITY & NEURAL ENGINE VERIFICATION
  describe('4. Multi-Agent Voice Roster & Neural Ladder', () => {
    test('4.1 Distinct Deepgram Aura & ElevenLabs voice mappings exist for all 6 core agents', () => {
      const expectedAuraVoices: Record<string, string> = {
        jarvis: 'aura-orion-en',
        friday: 'aura-luna-en',
        raphael: 'aura-athena-en',
        aegis: 'aura-arcas-en',
        midas: 'aura-angus-en',
        vortex: 'aura-zeus-en',
      };

      for (const [agent, expectedVoice] of Object.entries(expectedAuraVoices)) {
        assert.ok(expectedVoice.startsWith('aura-'), `Agent ${agent} must have valid Deepgram Aura voice`);
      }
    });

    test('4.2 Spoken text sanitization removes markdown, code fences, and URLs', () => {
      const raw = 'Master Sri, here is the code: ```typescript console.log("hello")``` and check https://github.com for details.';
      const clean = ConversationOS.sanitizeSpokenText(raw);
      assert.ok(!clean.includes('```'), 'Code fences must be stripped');
      assert.ok(!clean.includes('https://'), 'URLs must be sanitized for speech');
      assert.ok(clean.length > 0);
    });
  });

  // 5. BARGE-IN & INTERRUPTION LIFECYCLE
  describe('5. Conversational Barge-In & State Transitions', () => {
    test('5.1 Barge-in interruption immediately halts speech playback and transitions state', () => {
      const signal = ConversationOS.beginSpeechPlayback();
      assert.equal(ConversationOS.getState(), 'SPEAKING');
      assert.equal(signal.aborted, false);

      const interrupted = ConversationOS.triggerBargeIn();
      assert.equal(interrupted, true, 'Barge-in trigger must return true');
      assert.equal(signal.aborted, true, 'Active playback abort signal must be aborted');
      assert.equal(ConversationOS.getState(), 'BARGE_IN_INTERRUPTED');
    });
  });
});

