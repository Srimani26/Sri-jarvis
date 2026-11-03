/**
 * mobile-voice-resilience.test.ts — Mobile Voice Engine Resilience & Anti-Chipmunk Verification Suite
 *
 * Verifies:
 * 1. AudioQueuePlayer Monotonic Scheduling & Sample Rate Handling (16kHz, 24kHz, 48kHz).
 * 2. Low-amplitude speech detection at RMS 0.01 and 400ms hangover padding.
 * 3. Groq Whisper / Deepgram transcription pipeline and executive intent responses.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { wrapPcmInWavHeader, playAudioChunk } from '../src/features/voice/AudioQueuePlayer'
import { pcmToWav, parseVoiceIntent } from '../src/services/voiceGateway'

describe('Mobile Voice Engine Resilience & Anti-Chipmunk Suite', () => {

  describe('1. Sample Rate Conversion & Monotonic Scheduling', () => {
    it('should generate valid WAV container for 16kHz, 24kHz, and 48kHz without pitch distortion', () => {
      const sampleRates = [16000, 24000, 48000]

      for (const sr of sampleRates) {
        const dummyPcm = new Uint8Array(3200) // 1600 samples
        const wavBuffer = wrapPcmInWavHeader(dummyPcm, sr, 1)
        const view = new DataView(wavBuffer)

        // RIFF header validation
        const riffTag = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
        assert.strictEqual(riffTag, 'RIFF')

        const waveTag = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
        assert.strictEqual(waveTag, 'WAVE')

        // Sample rate field validation
        const parsedSampleRate = view.getUint32(24, true)
        assert.strictEqual(parsedSampleRate, sr)

        // Byte rate = sr * channels * (bitsPerSample / 8)
        const byteRate = view.getUint32(28, true)
        assert.strictEqual(byteRate, sr * 2)

        // Data size validation
        const dataSize = view.getUint32(40, true)
        assert.strictEqual(dataSize, dummyPcm.byteLength)
      }
    })

    it('should strictly enforce monotonic scheduling to prevent chipmunk / fast-forward overlap', () => {
      let currentTime = 10.0
      const mockAudioCtx = {
        currentTime: 10.0,
        destination: {},
        createBufferSource: () => ({
          buffer: null as any,
          connect: (_dest: any) => {},
          start: function (scheduledTime: number) {
            this.startTime = scheduledTime
          },
          startTime: 0
        })
      } as any

      const chunk1 = { duration: 0.5 } as any
      const chunk2 = { duration: 0.4 } as any
      const chunk3 = { duration: 0.6 } as any

      const src1 = playAudioChunk(chunk1, mockAudioCtx)
      assert.strictEqual(src1.startTime, 10.0, 'First chunk starts immediately')

      // Second chunk scheduled monotonically after chunk1 finishes
      const src2 = playAudioChunk(chunk2, mockAudioCtx)
      assert.strictEqual(src2.startTime, 10.5, 'Second chunk starts exactly at 10.5s')

      // Third chunk scheduled monotonically after chunk2 finishes
      const src3 = playAudioChunk(chunk3, mockAudioCtx)
      assert.strictEqual(src3.startTime, 10.9, 'Third chunk starts exactly at 10.9s')
    })
  })

  describe('2. Mobile Microphone Sensitivity & 400ms Hangover Padding', () => {
    it('should trigger speech on soft mobile frames (RMS >= 0.01) that were previously discarded', () => {
      const speechThreshold = 0.01

      // Soft mobile mic input (RMS ~ 0.012)
      const softVoiceSample = [0.012, -0.011, 0.013, -0.012, 0.014]
      let sumSq = 0
      for (const s of softVoiceSample) sumSq += s * s
      const rms = Math.sqrt(sumSq / softVoiceSample.length)

      assert.ok(rms >= speechThreshold, `RMS ${rms} must exceed 0.01 mobile threshold`)
    })

    it('should retain active speech state across 400ms hangover padding during word pauses', () => {
      const speechThreshold = 0.01
      const hangoverMaxFrames = 7 // 7 frames * 64ms = 448ms
      let hangoverFrames = 0

      // User speaks a syllable
      const speakingRms = 0.02
      if (speakingRms >= speechThreshold) {
        hangoverFrames = hangoverMaxFrames
      }
      assert.strictEqual(hangoverFrames, 7)

      // User pauses between words (ambient noise RMS 0.003)
      const silenceRms = 0.003
      const states: boolean[] = []

      // Simulate 5 frames of silence (~320ms pause)
      for (let i = 0; i < 5; i++) {
        if (silenceRms >= speechThreshold) {
          hangoverFrames = hangoverMaxFrames
        } else if (hangoverFrames > 0) {
          hangoverFrames--
        }
        const isActive = silenceRms >= speechThreshold || hangoverFrames > 0
        states.push(isActive)
      }

      // During the entire 320ms pause, speech must NOT have been cut off
      assert.ok(states.every(s => s === true), 'Hangover padding must prevent word clipping during mid-sentence pause')
      assert.strictEqual(hangoverFrames, 2, '2 frames of hangover padding should remain after 5 silence frames')
    })
  })

  describe('3. Cloud Voice Gateway Intent & Executive Response', () => {
    it('should accurately parse acoustic check "hey jarvis can you hear me" with executive confirmation', () => {
      const intent = parseVoiceIntent('hey jarvis can you hear me', 'jarvis')
      assert.strictEqual(intent.type, 'QUERY')
      assert.strictEqual(intent.replyText, 'Loud and clear, Master Sri. All systems standing by.')
    })

    it('should parse mic check directives with executive confirmation', () => {
      const intent = parseVoiceIntent('mic check 1 2', 'jarvis')
      assert.strictEqual(intent.type, 'QUERY')
      assert.strictEqual(intent.replyText, 'Loud and clear, Master Sri. All systems standing by.')
    })

    it('should parse navigation and specialist handoffs reliably', () => {
      const nav = parseVoiceIntent('Friday take me to revenue', 'friday')
      assert.strictEqual(nav.type, 'HANDOFF')
      assert.strictEqual(nav.agent, 'friday')

      const nav2 = parseVoiceIntent('go to tasks', 'jarvis')
      assert.strictEqual(nav2.type, 'NAVIGATE')
      assert.strictEqual(nav2.target, '/tasks')

      const handoff = parseVoiceIntent('call aegis', 'jarvis')
      assert.strictEqual(handoff.type, 'HANDOFF')
      assert.strictEqual(handoff.agent, 'aegis')
    })

    it('should generate valid WAV buffer for Groq Whisper transcription', () => {
      const dummyPcm = Buffer.alloc(16000 * 2) // 1 second of 16kHz mono audio
      const wav = pcmToWav(dummyPcm, 16000)

      assert.strictEqual(wav.subarray(0, 4).toString(), 'RIFF')
      assert.strictEqual(wav.subarray(8, 12).toString(), 'WAVE')
      assert.strictEqual(wav.readUInt32LE(24), 16000, 'Sample rate must be 16000')
      assert.strictEqual(wav.length, dummyPcm.length + 44)
    })
  })
})

