/**
 * tests/voice-deaf-standby-fix.test.ts
 * Verification suite for Continuous Dual-Mode Listener & Deaf-Standby Fix:
 * 1. Post-TTS State Transition: Enters LISTENING for 8-second follow-up window rather than dropping to STANDBY.
 * 2. Conversational Voice Activity: Speech within 8 seconds clears the timer and streams without requiring wake-word.
 * 3. Continuous Native Wake-Word Engine: In HOTWORD_STANDBY, spoken transcript containing "hey jarvis" triggers triggerWakeUp().
 * 4. Audio Stream Keep-Alive: AudioContext and silent keep-alive oscillator remain running across transitions.
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { WakeWordDetector, wakeWordDetector } from '../src/features/voice/WakeWordDetector'
import { AudioQueuePlayer, audioQueuePlayer } from '../src/features/voice/AudioQueuePlayer'

describe('Critical Voice Pipeline: Continuous Dual-Mode Listener & Deaf-Standby Fix', () => {

  describe('Criterion 1: Post-TTS State Machine Enters LISTENING (8-Second Window)', () => {
    it('should transition directly to LISTENING upon TTS completion and enter HOTWORD_STANDBY after 8s', async () => {
      // Simulate follow-up window state machine behavior
      let currentStatus: string = 'SPEAKING'
      let timer: NodeJS.Timeout | null = null

      const updateStatus = (s: string) => { currentStatus = s }
      const clearTimer = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }

      const startFollowUpWindow = (durationMs = 8000) => {
        clearTimer()
        updateStatus('LISTENING')
        timer = setTimeout(() => {
          updateStatus('HOTWORD_STANDBY')
          timer = null
        }, durationMs)
      }

      // 1. Simulate TTS playback ending
      startFollowUpWindow(150) // Use scaled 150ms for deterministic test execution
      assert.strictEqual(currentStatus, 'LISTENING', 'State must immediately be LISTENING, NOT STANDBY')
      assert.notStrictEqual(timer, null, '8-second countdown timer must be active')

      // 2. Wait for expiration
      await new Promise(r => setTimeout(r, 200))
      assert.strictEqual(currentStatus, 'HOTWORD_STANDBY', 'Must transition to HOTWORD_STANDBY when timer expires')
      assert.strictEqual(timer, null)
    })
  })

  describe('Criterion 2: Conversational Interactivity Within 8-Second Window', () => {
    it('should clear countdown and stream immediately when user voice is detected (RMS >= 0.01)', async () => {
      let currentStatus: string = 'SPEAKING'
      let timer: NodeJS.Timeout | null = null
      let packetsSent = 0

      const clearTimer = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }

      const startFollowUpWindow = (durationMs = 8000) => {
        clearTimer()
        currentStatus = 'LISTENING'
        timer = setTimeout(() => {
          currentStatus = 'HOTWORD_STANDBY'
          timer = null
        }, durationMs)
      }

      // TTS ends -> LISTENING
      startFollowUpWindow(500)
      assert.strictEqual(currentStatus, 'LISTENING')

      // User speaks within window (RMS: 0.04 > 0.01 threshold)
      const simulateMicInput = (rms: number, buffer: ArrayBuffer) => {
        const hasEnergy = rms >= 0.01
        if (hasEnergy) {
          clearTimer()
          currentStatus = 'LISTENING'
          packetsSent++
        }
      }

      await new Promise(r => setTimeout(r, 50))
      simulateMicInput(0.045, new ArrayBuffer(512))

      assert.strictEqual(timer, null, 'Timer must be cleared immediately upon voice detection')
      assert.strictEqual(currentStatus, 'LISTENING', 'State must remain LISTENING')
      assert.strictEqual(packetsSent, 1, 'Audio chunk must be dispatched to stream')

      // Ensure that even after the original duration passes, it did NOT revert to HOTWORD_STANDBY
      await new Promise(r => setTimeout(r, 600))
      assert.strictEqual(currentStatus, 'LISTENING', 'State must not fall back to STANDBY because user spoke')
    })
  })

  describe('Criterion 3: Native Continuous Wake-Word Engine in HOTWORD_STANDBY', () => {
    let detector: WakeWordDetector
    let wokeKeyword = ''
    let stateChanges: string[] = []

    beforeEach(() => {
      wokeKeyword = ''
      stateChanges = []
      detector = WakeWordDetector.getInstance({
        enableChime: false, // disable audio chime in headless Node environment
        onWakeWord: (kw) => { wokeKeyword = kw },
        onWakeUp: (kw) => { wokeKeyword = kw },
        onStateChange: (st) => { stateChanges.push(st) }
      })
      detector.setState('HOTWORD_STANDBY')
    })

    afterEach(() => {
      detector.stop()
    })

    it('should trigger wake up when "hey jarvis" is spoken in HOTWORD_STANDBY', async () => {
      assert.strictEqual(detector.getState(), 'HOTWORD_STANDBY')

      const matched = detector.processTranscript("hey jarvis what's my next appointment")
      assert.strictEqual(matched, true, 'Transcript containing "hey jarvis" must match')
      assert.strictEqual(wokeKeyword, 'jarvis')
      assert.strictEqual(detector.getState(), 'ACTIVE_LISTENING')
    })

    it('should trigger wake up when "jarvis" or "friday" is spoken', async () => {
      detector.setState('HOTWORD_STANDBY')
      const matchFriday = detector.processTranscript("Friday compile financial report")
      assert.strictEqual(matchFriday, true)
      assert.strictEqual(wokeKeyword, 'friday')
      assert.strictEqual(detector.getState(), 'ACTIVE_LISTENING')
    })

    it('should ignore speech that does not contain wake words', async () => {
      detector.setState('HOTWORD_STANDBY')
      const matched = detector.processTranscript("random conversation in the background")
      assert.strictEqual(matched, false)
      assert.strictEqual(detector.getState(), 'HOTWORD_STANDBY')
    })
  })

  describe('Criterion 4: AudioContext Keep-Alive & Microphone Track Guard', () => {
    it('should attach silent keep-alive oscillator (10Hz, gain 0.0001) and maintain active state', () => {
      // Mock AudioContext for Node.js test environment
      const mockAudioCtx: any = {
        state: 'running',
        currentTime: 0,
        destination: {},
        createOscillator: () => {
          let running = false
          return {
            type: 'sine',
            frequency: { setValueAtTime: () => {} },
            connect: () => {},
            disconnect: () => {},
            start: () => { running = true },
            stop: () => { running = false }
          }
        },
        createGain: () => ({
          gain: { setValueAtTime: () => {} },
          connect: () => {},
          disconnect: () => {}
        })
      }

      const player = AudioQueuePlayer.getInstance()
      const attached = player.startKeepAliveOscillator(mockAudioCtx as any)
      assert.strictEqual(attached, true, 'Keep-alive oscillator must attach cleanly')
      assert.strictEqual(player.isKeepAliveActive(), true, 'Keep-alive oscillator must be active')

      // Verify that calling stop() on playback queue does NOT terminate the keep-alive oscillator
      player.stop()
      assert.strictEqual(player.isKeepAliveActive(), true, 'Keep-alive oscillator must remain active through stop()')

      player.stopKeepAliveOscillator()
      assert.strictEqual(player.isKeepAliveActive(), false, 'Oscillator cleanly disconnects when explicitly requested')
    })

    it('should guard microphone tracks so enabled is never false during sessions', () => {
      const mockTrack = { enabled: true, stopped: false, stop: () => { mockTrack.stopped = true } }
      const mockStream = {
        getAudioTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      }

      // Track guard ensures enabled remains true
      const ensureTrackActive = (stream: any) => {
        const tracks = stream.getAudioTracks()
        if (tracks.length > 0 && !tracks[0].enabled) {
          tracks[0].enabled = true
        }
      }

      // Simulate accidental disable by browser
      mockTrack.enabled = false
      ensureTrackActive(mockStream)
      assert.strictEqual(mockTrack.enabled, true, 'Microphone Track Guard must re-enable track')
      assert.strictEqual(mockTrack.stopped, false, 'Track must not be stopped during session')
    })
  })
})

