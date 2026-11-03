/**
 * swarmAudioEngine.ts — Procedural Live Web Audio Synthesizer for Swarm Cursors
 * Adapted from Joel Califa's Swarm & Dhvanil Patel's Swarm-Cursors.
 *
 * Synthesizes 100% live audio using Web Audio API (Zero audio asset downloads):
 * 1. Mechanical Keyboard Clicks & Thocks (typing simulation).
 * 2. Ruler Guide Snap Clicks (crisp transient click).
 * 3. E Major Pentatonic Glass-Piano Notes (stereo-panned by cursor X coordinate).
 * 4. Fan-out Arpeggio & Completion Chord.
 */

// E Major Pentatonic frequencies in Hz (across 3 octaves)
const E_MAJOR_PENTATONIC = [
  164.81, // E3
  185.00, // F#3
  207.65, // G#3
  246.94, // B3
  277.18, // C#4
  329.63, // E4
  369.99, // F#4
  415.30, // G#4
  493.88, // B4
  554.37, // C#5
  659.25, // E5
  739.99, // F#5
  830.61, // G#5
  987.77, // B5
  1108.73 // C#6
]

export class SwarmAudioEngine {
  private static instance: SwarmAudioEngine | null = null
  private ctx: AudioContext | null = null
  private isMuted: boolean = false
  private masterGain: GainNode | null = null

  public static getInstance(): SwarmAudioEngine {
    if (!SwarmAudioEngine.instance) {
      SwarmAudioEngine.instance = new SwarmAudioEngine()
    }
    return SwarmAudioEngine.instance
  }

  private constructor() {
    // Lazy initialized on user gesture
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime)
    }
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return null
      this.ctx = new AudioCtx({ latencyHint: 'interactive' })

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    return this.ctx
  }

  /**
   * Helper to create stereo panner node based on 0..1 horizontal cursor position
   */
  private createPanner(ctx: AudioContext, xFraction: number): StereoPannerNode | GainNode {
    const panValue = Math.max(-1, Math.min(1, (xFraction - 0.5) * 2))
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner()
      panner.pan.setValueAtTime(panValue, ctx.currentTime)
      return panner
    }
    // Fallback gain if StereoPanner not supported
    return ctx.createGain()
  }

  /**
   * Mechanical keyboard click & thock when an agent types text.
   */
  public playTypewriterClick(xFraction: number = 0.5, isSpace: boolean = false): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const panner = this.createPanner(ctx, xFraction)
    panner.connect(this.masterGain)

    // Sharp click component
    const clickOsc = ctx.createOscillator()
    const clickGain = ctx.createGain()
    clickOsc.type = 'triangle'
    clickOsc.frequency.setValueAtTime(isSpace ? 480 : 820, now)
    clickOsc.frequency.exponentialRampToValueAtTime(140, now + 0.015)

    clickGain.gain.setValueAtTime(0.001, now)
    clickGain.gain.linearRampToValueAtTime(0.08, now + 0.002)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)

    clickOsc.connect(clickGain)
    clickGain.connect(panner)

    clickOsc.start(now)
    clickOsc.stop(now + 0.02)

    // Deep body thock component
    const thockOsc = ctx.createOscillator()
    const thockGain = ctx.createGain()
    thockOsc.type = 'sine'
    thockOsc.frequency.setValueAtTime(isSpace ? 120 : 180, now)
    thockOsc.frequency.exponentialRampToValueAtTime(60, now + 0.035)

    thockGain.gain.setValueAtTime(0.001, now)
    thockGain.gain.linearRampToValueAtTime(0.12, now + 0.003)
    thockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)

    thockOsc.connect(thockGain)
    thockGain.connect(panner)

    thockOsc.start(now)
    thockOsc.stop(now + 0.04)
  }

  /**
   * Crisp Figma-style snap click when a ruler guide or alignment snaps.
   */
  public playGuideSnap(xFraction: number = 0.5): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const panner = this.createPanner(ctx, xFraction)
    panner.connect(this.masterGain)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1960, now)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.03)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)

    osc.connect(gain)
    gain.connect(panner)

    osc.start(now)
    osc.stop(now + 0.035)
  }

  /**
   * Sparse quiet glass-piano note from E major pentatonic scale
   * played when a box, card, or image is placed.
   */
  public playGlassNote(index: number = 0, xFraction: number = 0.5): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx || !this.masterGain) return

    const noteIndex = Math.abs(index) % E_MAJOR_PENTATONIC.length
    const freq = E_MAJOR_PENTATONIC[noteIndex]
    const now = ctx.currentTime

    const panner = this.createPanner(ctx, xFraction)
    panner.connect(this.masterGain)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    // Glass piano bell envelope: fast attack, pure bell-like decay
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.14, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc.connect(gain)
    gain.connect(panner)

    osc.start(now)
    osc.stop(now + 0.36)
  }

  /**
   * Short ascending arpeggio when agents fan out.
   */
  public playFanoutArpeggio(): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    const notes = [E_MAJOR_PENTATONIC[3], E_MAJOR_PENTATONIC[5], E_MAJOR_PENTATONIC[7], E_MAJOR_PENTATONIC[9]]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.isMuted) return
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(0.12, now + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)

        osc.connect(gain)
        if (this.masterGain) gain.connect(this.masterGain)

        osc.start(now)
        osc.stop(now + 0.22)
      }, i * 60)
    })
  }

  /**
   * Soft E major completion chord when page rebuild completes.
   */
  public playCompletionChord(): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx || !this.masterGain) return

    const chord = [329.63, 415.30, 493.88, 659.25] // E4, G#4, B4, E5
    const now = ctx.currentTime

    chord.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)

      osc.connect(gain)
      if (this.masterGain) gain.connect(this.masterGain)

      osc.start(now)
      osc.stop(now + 0.85)
    })
  }
}

export const swarmAudioEngine = SwarmAudioEngine.getInstance()

