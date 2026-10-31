/**
 * WebAudioPlayer.ts — High-Fidelity Mobile-Resilient Web Audio Pipeline
 * Assimilated from qwen-audio-agent, livekit, and alan-sdk-web.
 *
 * Provides:
 * 1. Persistent pre-warmed AudioContext unlocked via direct user interaction
 * 2. Complete immunity to mobile Safari / Android Chrome autoplay restrictions
 * 3. Sample-accurate gapless chunk playback for streaming TTS
 * 4. Realtime hardware frequency analysis for visualizer reactivity
 * 5. Instant zero-latency cancellation for conversational barge-in
 */

export class WebAudioPlayer {
  private static instance: WebAudioPlayer | null = null
  private ctx: AudioContext | null = null
  private gainNode: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private activeSources: Set<AudioBufferSourceNode> = new Set()
  private nextScheduleTime = 0
  private currentSessionId = 0
  private isUnlocked = false
  private queuePendingCount = 0

  private constructor() {
    // Lazy initialized on first user interaction
  }

  public static getInstance(): WebAudioPlayer {
    if (!WebAudioPlayer.instance) {
      WebAudioPlayer.instance = new WebAudioPlayer()
    }
    return WebAudioPlayer.instance
  }

  /**
   * Must be called in direct response to user gesture (e.g. modal open, button click, mic tap).
   * Unlocks Web Audio permanently for this session so asynchronous TTS fetches can play anytime.
   */
  public async prime(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return false
        this.ctx = new AudioCtx({ latencyHint: 'interactive' })
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }

      if (!this.gainNode) {
        this.gainNode = this.ctx.createGain()
        this.gainNode.gain.setValueAtTime(1.0, this.ctx.currentTime)

        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 128
        this.analyser.smoothingTimeConstant = 0.8

        this.gainNode.connect(this.analyser)
        this.analyser.connect(this.ctx.destination)
      }

      // Play 1-sample silent buffer to seal browser user-gesture unlock token
      const silentBuffer = this.ctx.createBuffer(1, 1, 22050)
      const silentSource = this.ctx.createBufferSource()
      silentSource.buffer = silentBuffer
      silentSource.connect(this.ctx.destination)
      silentSource.start(0)

      this.isUnlocked = true
      return true
    } catch (e) {
      console.warn('[WebAudioPlayer] prime failed:', e)
      return false
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  public isSpeaking(): boolean {
    return this.activeSources.size > 0 || this.queuePendingCount > 0
  }

  /**
   * Stop all active and scheduled audio immediately (barge-in / interrupt).
   */
  public stop() {
    this.currentSessionId++
    this.queuePendingCount = 0
    this.nextScheduleTime = 0

    for (const src of this.activeSources) {
      try {
        src.stop(0)
        src.disconnect()
      } catch {}
    }
    this.activeSources.clear()
  }

  /**
   * Decodes an ArrayBuffer (MP3 / WAV) and plays it immediately.
   */
  public async playBuffer(
    arrayBuffer: ArrayBuffer,
    onStart?: () => void,
    onEnded?: () => void
  ): Promise<boolean> {
    const sessionId = ++this.currentSessionId
    this.stop()
    this.currentSessionId = sessionId

    const ok = await this.prime()
    if (!ok || !this.ctx || !this.gainNode) return false

    try {
      // decodeAudioData detaches the arrayBuffer, so we clone if necessary
      const copy = arrayBuffer.slice(0)
      const audioBuffer = await this.ctx.decodeAudioData(copy)

      if (this.currentSessionId !== sessionId) return false

      const source = this.ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.gainNode)

      this.activeSources.add(source)

      let startedFired = false
      source.onended = () => {
        this.activeSources.delete(source)
        try { source.disconnect() } catch {}
        if (this.currentSessionId === sessionId) {
          onEnded?.()
        }
      }

      const now = this.ctx.currentTime
      source.start(now)
      startedFired = true
      onStart?.()

      return true
    } catch (err) {
      console.error('[WebAudioPlayer] playBuffer decode error:', err)
      return false
    }
  }

  /**
   * Queues an audio chunk for seamless, gapless back-to-back playback.
   * Ideal for streaming sentence-level TTS synthesis chunks.
   */
  public async queueChunk(
    arrayBuffer: ArrayBuffer,
    isLast: boolean = false,
    onChunkStart?: () => void,
    onAllEnded?: () => void
  ): Promise<boolean> {
    const sessionId = this.currentSessionId
    const ok = await this.prime()
    if (!ok || !this.ctx || !this.gainNode) return false

    this.queuePendingCount++

    try {
      const copy = arrayBuffer.slice(0)
      const audioBuffer = await this.ctx.decodeAudioData(copy)

      if (this.currentSessionId !== sessionId) {
        this.queuePendingCount = Math.max(0, this.queuePendingCount - 1)
        return false
      }

      const source = this.ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.gainNode)

      this.activeSources.add(source)

      const now = this.ctx.currentTime
      // Schedule immediately or seamlessly attach to the end of previous chunk
      const startTime = Math.max(now + 0.015, this.nextScheduleTime)
      const duration = audioBuffer.duration
      this.nextScheduleTime = startTime + duration

      source.onended = () => {
        this.activeSources.delete(source)
        this.queuePendingCount = Math.max(0, this.queuePendingCount - 1)
        try { source.disconnect() } catch {}

        if (this.currentSessionId === sessionId) {
          if (isLast && this.queuePendingCount === 0 && this.activeSources.size === 0) {
            onAllEnded?.()
          }
        }
      }

      source.start(startTime)

      // Notify start shortly before or at schedule
      const delayMs = Math.max(0, (startTime - now) * 1000)
      setTimeout(() => {
        if (this.currentSessionId === sessionId) {
          onChunkStart?.()
        }
      }, delayMs)

      return true
    } catch (err) {
      this.queuePendingCount = Math.max(0, this.queuePendingCount - 1)
      console.error('[WebAudioPlayer] queueChunk decode error:', err)
      return false
    }
  }

  /**
   * Retrieve live frequency data for equalizer visualization.
   */
  public getFrequencyBands(bandsCount: number = 14): number[] {
    if (!this.analyser || !this.isSpeaking()) {
      return new Array(bandsCount).fill(8)
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)

    const bands: number[] = []
    const step = Math.floor(dataArray.length / bandsCount) || 1

    for (let b = 0; b < bandsCount; b++) {
      let sum = 0
      for (let k = b * step; k < (b + 1) * step; k++) {
        sum += dataArray[k] || 0
      }
      bands.push(Math.min(100, Math.max(8, Math.floor(sum / step))))
    }

    return bands
  }
}

export const webAudioPlayer = WebAudioPlayer.getInstance()
