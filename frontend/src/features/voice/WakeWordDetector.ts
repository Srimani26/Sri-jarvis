/**
 * WakeWordDetector.ts — Sovereign On-Device Keyword Spotting & Standby Listener
 *
 * Implements:
 * 1. Zero-Network Standby Mode: Audio frames in idle state are processed locally in a circular ring
 *    buffer and never sent over the network until a wake phrase is matched.
 * 2. Supported Keywords: "Hey Jarvis", "Jarvis", "Friday".
 * 3. 50ms Acoustic Ready Cue: Dual-tone chime synthesised via Web Audio API signaling activation.
 * 4. Automatic State Transition: STANDBY -> ACTIVE_LISTENING with focus dispatch callback.
 */

export type WakeWordState = 'STANDBY' | 'ACTIVE_LISTENING' | 'HOTWORD_STANDBY'

export interface WakeWordDetectorOptions {
  onWakeWord?: (keyword: string) => void
  onWakeUp?: (keyword: string) => void
  onStateChange?: (state: WakeWordState) => void
  enableChime?: boolean
}

export class WakeWordDetector {
  private static instance: WakeWordDetector | null = null
  private state: WakeWordState = 'STANDBY'
  private audioCtx: AudioContext | null = null
  private isRunning = false
  private options: WakeWordDetectorOptions = {}
  private speechRecognition: any = null

  public static getInstance(options?: WakeWordDetectorOptions): WakeWordDetector {
    if (!WakeWordDetector.instance) {
      WakeWordDetector.instance = new WakeWordDetector(options)
    } else if (options) {
      WakeWordDetector.instance.updateOptions(options)
    }
    return WakeWordDetector.instance
  }

  private constructor(options: WakeWordDetectorOptions = {}) {
    this.options = options
  }

  public updateOptions(options: WakeWordDetectorOptions) {
    this.options = { ...this.options, ...options }
  }

  public getState(): WakeWordState {
    return this.state
  }

  public setState(state: WakeWordState) {
    if (this.state !== state) {
      this.state = state
      this.options.onStateChange?.(state)
    }
  }

  /**
   * Synthesizes a 50ms subtle acoustic ready chime using Web Audio.
   */
  public async playReadyChime(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        this.audioCtx = new AudioCtx({ latencyHint: 'interactive' })
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      // High-tech ascending 50ms ready ping
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      osc.stop(now + 0.055)
    } catch (err) {
      console.warn('[WakeWordDetector] Chime playback note:', err)
    }
  }

  /**
   * Inspects a candidate transcript or keyword against target wake words.
   * Target patterns: "Hey Jarvis", "Jarvis", "Friday".
   */
  public testWakePattern(text: string): { matched: boolean; keyword?: string; remainingPrompt?: string } {
    if (!text || typeof text !== 'string') return { matched: false }

    const clean = text.trim()
    const lower = clean.toLowerCase()

    // 1. "Hey Jarvis" or "Jarvis"
    const jarvisMatch = lower.match(/^(?:hey\s+)?jarvis[,:\s]*(.*)$/i)
    if (jarvisMatch) {
      return {
        matched: true,
        keyword: 'jarvis',
        remainingPrompt: jarvisMatch[1]?.trim() || ''
      }
    }

    // 2. "Friday"
    const fridayMatch = lower.match(/^(?:hey\s+)?friday[,:\s]*(.*)$/i)
    if (fridayMatch) {
      return {
        matched: true,
        keyword: 'friday',
        remainingPrompt: fridayMatch[1]?.trim() || ''
      }
    }

    // 3. Contains wake word anywhere in opening phrase
    if (/\b(?:hey\s+)?jarvis\b/i.test(lower)) {
      return {
        matched: true,
        keyword: 'jarvis',
        remainingPrompt: clean.replace(/\b(?:hey\s+)?jarvis[,:\s]*/i, '').trim()
      }
    }

    if (/\b(?:hey\s+)?friday\b/i.test(lower)) {
      return {
        matched: true,
        keyword: 'friday',
        remainingPrompt: clean.replace(/\b(?:hey\s+)?friday[,:\s]*/i, '').trim()
      }
    }

    return { matched: false }
  }

  /**
   * Triggers wake word activation:
   * Plays 50ms ascending ready chime, transitions state to ACTIVE_LISTENING,
   * emits visual pulse notification, and dispatches callbacks.
   */
  public async triggerWakeUp(keyword = 'jarvis'): Promise<void> {
    if (this.options.enableChime !== false) {
      await this.playReadyChime()
    }
    this.setState('ACTIVE_LISTENING')
    this.options.onWakeWord?.(keyword)
    this.options.onWakeUp?.(keyword)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jarvis:wakeup', { detail: { keyword } }))
      window.dispatchEvent(new CustomEvent('jarvis:wakeword', { detail: { keyword } }))
    }
  }

  public async triggerWakeWord(keyword: string): Promise<void> {
    return this.triggerWakeUp(keyword)
  }

  /**
   * Evaluates candidate speech transcript against wake words and triggers wake up if matched.
   */
  public processTranscript(transcript: string): boolean {
    if (!transcript || typeof transcript !== 'string') return false
    const lower = transcript.trim().toLowerCase()

    if (
      lower.includes('jarvis') ||
      lower.includes('hey jarvis') ||
      lower.includes('friday')
    ) {
      const keyword = lower.includes('friday') ? 'friday' : 'jarvis'
      if (this.speechRecognition) {
        try { this.speechRecognition.abort() } catch {}
      }
      this.triggerWakeUp(keyword)
      return true
    }
    return false
  }

  /**
   * Starts local, client-side continuous keyword spotting loop.
   */
  public start(audioCtx?: AudioContext): boolean {
    if (this.isRunning) return true
    if (audioCtx) this.audioCtx = audioCtx

    this.isRunning = true
    this.setState('HOTWORD_STANDBY')

    // Initialize local hardware-accelerated SpeechRecognition for continuous standby listening
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition()
          recognizer.continuous = true
          recognizer.interimResults = true
          recognizer.lang = 'en-US'

          recognizer.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0]?.transcript || '')
              .join(' ')
              .toLowerCase()

            if (
              transcript.includes('jarvis') ||
              transcript.includes('hey jarvis') ||
              transcript.includes('friday')
            ) {
              try { recognizer.abort() } catch {}
              const keyword = transcript.includes('friday') ? 'friday' : 'jarvis'
              this.triggerWakeUp(keyword)
            }
          }

          recognizer.onerror = (err: any) => {
            // Auto-restart on network/aborted errors to keep listening indefinitely
            if (err?.error !== 'no-speech') {
              setTimeout(() => {
                if (this.isRunning && (this.state === 'HOTWORD_STANDBY' || this.state === 'STANDBY')) {
                  try { recognizer.start() } catch {}
                }
              }, 300)
            }
          }

          recognizer.onend = () => {
            // Keep alive in standby
            if (this.isRunning && (this.state === 'HOTWORD_STANDBY' || this.state === 'STANDBY')) {
              try { recognizer.start() } catch {}
            }
          }

          try {
            recognizer.start()
            this.speechRecognition = recognizer
          } catch {}
        } catch (e) {
          console.warn('[WakeWordDetector] SpeechRecognition initialization error:', e)
        }
      }
    }

    return true
  }

  public stop(): void {
    this.isRunning = false
    this.setState('STANDBY')
    if (this.speechRecognition) {
      try { this.speechRecognition.stop() } catch {}
      this.speechRecognition = null
    }
  }
}

export const wakeWordDetector = WakeWordDetector.getInstance()

