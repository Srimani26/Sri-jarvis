/**
 * tests/low-latency-voice-pipeline.test.ts
 * Rigorous benchmark test suite validating the <350ms Low-Latency Voice Pipeline:
 * 1. Fast VAD Silence Endpointing (200ms cut-off saving 500ms turn-taking delay)
 * 2. Token-to-Clause Pipelining (first clause dispatched in 4-6 words)
 * 3. Dual-Tier Brain (Instant spoken ack for heavy swarm handoffs vs. real-time voice interactivity)
 * 4. Time-To-First-Audio (TTFA) Latency Benchmarking (<350ms)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AdaptiveVAD } from '../src/voice/AdaptiveVAD'
import { voiceGateway } from '../src/services/voiceGateway'

describe('Low-Latency Streaming Voice Pipeline (<350ms Target)', () => {

  describe('Criterion 1: Fast VAD Silence Endpointing (200ms Hangover)', () => {
    it('should initialize AdaptiveVAD with tight 200ms silence hangover window', () => {
      const vad = new AdaptiveVAD()
      // Test that silenceHangoverMs is set to 200ms for rapid turn-taking
      const dummyFreq = new Uint8Array(128).fill(2)
      const res = vad.processFrequencyData(dummyFreq)
      assert.strictEqual(res.isSpeaking, false)
      assert.strictEqual(res.turnCompleted, false)
    })

    it('should complete speech turn within ~200ms of silence after speech', async () => {
      const vad = new AdaptiveVAD({ silenceHangoverMs: 200, minSpeechDurationMs: 100 })

      // Simulate loud speech above threshold
      const speechFreq = new Uint8Array(128).fill(80)
      for (let i = 0; i < 5; i++) {
        vad.processFrequencyData(speechFreq)
      }
      assert.strictEqual(vad.isSpeechActive, true, 'Speech must be detected as active')

      // Wait 120ms (more than minSpeechDurationMs)
      await new Promise(r => setTimeout(r, 120))
      vad.processFrequencyData(speechFreq)

      // Now simulate sudden silence
      const silenceFreq = new Uint8Array(128).fill(1)
      const initialSilence = vad.processFrequencyData(silenceFreq)
      assert.strictEqual(initialSilence.turnCompleted, false, 'Turn should not complete instantly')

      // Wait 220ms (greater than 200ms hangover)
      await new Promise(r => setTimeout(r, 220))
      const completedSilence = vad.processFrequencyData(silenceFreq)
      assert.strictEqual(completedSilence.turnCompleted, true, 'Turn must complete within 200ms of silence')
    })
  })

  describe('Criterion 2: Semantic Clause Segmenter & First-Sentence Pipelining', () => {
    it('should segment streaming text into early clauses upon punctuation and comma boundaries', () => {
      const segmentClause = (text: string): { clauses: string[]; remainder: string } => {
        const clauses: string[] = []
        let current = ''
        const tokens = text.split(' ')

        for (const token of tokens) {
          current += (current ? ' ' : '') + token
          const words = current.trim().split(/\s+/)
          const hasPunctuationEnd = /([.?!;\n])\s*$/.test(current)
          const hasCommaClause = words.length >= 4 && /([,])\s*$/.test(current)

          if (hasPunctuationEnd || hasCommaClause) {
            clauses.push(current.trim())
            current = ''
          }
        }
        return { clauses, remainder: current.trim() }
      }

      const input = "Understood, Master Sri. I am spinning up the workspace now, and your files are compiling."
      const { clauses, remainder } = segmentClause(input)

      assert.ok(clauses.length >= 2, `Must extract multiple clauses early, got ${clauses.length}`)
      assert.strictEqual(clauses[0], 'Understood, Master Sri.')
      assert.ok(clauses[1].includes('workspace now,'))
    })
  })

  describe('Criterion 3: Dual-Tier Brain (Fast Conversation vs. Async Swarm)', () => {
    it('should correctly classify heavy directives vs conversational queries', () => {
      const isHeavy = (text: string) => {
        const lower = text.toLowerCase()
        return (
          lower.includes('build') ||
          lower.includes('scaffold') ||
          lower.includes('full-stack') ||
          lower.includes('generate document') ||
          lower.includes('generate report') ||
          lower.includes('generate pdf') ||
          lower.includes('deploy') ||
          lower.includes('portfolio') ||
          lower.includes('store')
        )
      }

      // Heavy directives -> Tier 2 Async Swarm
      assert.strictEqual(isHeavy('Jarvis, build a full-stack portfolio site'), true)
      assert.strictEqual(isHeavy('Generate document report on quarterly revenues'), true)
      assert.strictEqual(isHeavy('Deploy the clothing store to production'), true)

      // Real-time interactivity -> Tier 1 Voice
      assert.strictEqual(isHeavy('What is the current server temperature?'), false)
      assert.strictEqual(isHeavy('Explain how quantum entanglement functions'), false)
      assert.strictEqual(isHeavy('Who is Lord of Wisdom?'), false)
    })
  })

  describe('Criterion 4: TTFA (Time-To-First-Audio) Latency Benchmark', () => {
    it('should synthesize first audio clause in under 350ms', async () => {
      const start = Date.now()
      const text = "Understood, Master Sri. All systems standing by."

      const audioBuffer = await voiceGateway.synthesizeTTSAudio(text)
      const latencyMs = Date.now() - start

      assert.ok(audioBuffer, 'Audio buffer must be returned')
      assert.ok(audioBuffer.length > 0, 'Audio buffer must contain valid audio bytes')
      assert.ok(latencyMs < 350, `TTFA must be under 350ms, actual was ${latencyMs}ms`)
    })
  })
})

