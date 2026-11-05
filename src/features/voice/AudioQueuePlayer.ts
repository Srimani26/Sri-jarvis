/**
 * AudioQueuePlayer.ts — Low-Latency Mobile-Resilient Audio Queue & Monotonic Scheduler
 * Target: src/features/voice/AudioQueuePlayer.ts & frontend/src/features/voice/AudioQueuePlayer.ts
 *
 * Implements:
 * 1. Mobile Voice Playback Stabilization:
 *    - HTML5 Audio queue playback with strict 1.0x playback rate and pitch preservation:
 *      audio.playbackRate = 1.0; audio.preservesPitch = true;
 *    - Converts raw buffers to Blob([buffer], { type: 'audio/mpeg' }) + URL.createObjectURL.
 *    - Sequential queue playback: waits for audio.onended before playing the next segment.
 * 2. Turn-Taking State Machine:
 *    - Explicitly manages states: IDLE -> SPEAKING -> LISTENING -> PROCESSING.
 *    - While state === 'SPEAKING', microphone is paused/muted.
 * 3. Monotonic Web Audio Scheduling & User-Gesture Priming:
 *    - Retains Web Audio fallback, keep-alive 10Hz oscillator, and WAV header generation for raw 16kHz PCM.
 */

export type TurnTakingState = 'IDLE' | 'SPEAKING' | 'LISTENING' | 'PROCESSING'

let nextStartTime = 0

/**
 * Monotonic scheduling helper conforming to the master directive specification:
 * Schedules audioBuffer playback without overlapping or gap artifacts.
 */
export function playAudioChunk(audioBuffer: AudioBuffer, audioCtx: AudioContext): AudioBufferSourceNode {
  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioCtx.destination)

  const startTime = Math.max(audioCtx.currentTime, nextStartTime)
  source.start(startTime)
  nextStartTime = startTime + audioBuffer.duration

  return source
}

/**
 * Prepend a standard 44-byte RIFF WAV header to raw 16-bit linear PCM bytes
 * so that window.AudioContext.decodeAudioData can decode and resample it cleanly.
 */
export function wrapPcmInWavHeader(pcmBytes: Uint8Array, sampleRate = 16000, channels = 1): ArrayBuffer {
  const dataLength = pcmBytes.byteLength
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // RIFF identifier
  view.setUint32(0, 0x52494646, false) // 'RIFF'
  view.setUint32(4, 36 + dataLength, true)
  view.setUint32(8, 0x57415645, false) // 'WAVE'

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false) // 'fmt '
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true)  // AudioFormat (1 = Linear PCM)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * 2, true) // ByteRate
  view.setUint16(32, channels * 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample

  // data subchunk
  view.setUint32(36, 0x64617461, false) // 'data'
  view.setUint32(40, dataLength, true)

  new Uint8Array(buffer, 44).set(pcmBytes)
  return buffer
}

export interface AudioQueueItem {
  id: string
  objectUrl: string
  onChunkStart?: () => void
  onChunkEnd?: () => void
}

export class AudioQueuePlayer {
  private static instance: AudioQueuePlayer | null = null
  private audioCtx: AudioContext | null = null
  private activeSources: Set<AudioBufferSourceNode> = new Set()
  private pendingDecodeCount = 0
  private sessionId = 0
  private isUnlocked = false
  private keepAliveOscillator: OscillatorNode | null = null
  private keepAliveGain: GainNode | null = null

  // Turn-Taking State Machine
  private currentState: TurnTakingState = 'IDLE'
  private stateChangeListeners: Set<(state: TurnTakingState) => void> = new Set()

  // HTML5 Sequential Audio Queue
  private queue: AudioQueueItem[] = []
  private activeAudio: HTMLAudioElement | null = null
  private activeObjectUrl: string | null = null
  private isPlayingQueue = false
  private onAllEndedCallback: (() => void) | null = null

  public static getInstance(): AudioQueuePlayer {
    if (!AudioQueuePlayer.instance) {
      AudioQueuePlayer.instance = new AudioQueuePlayer()
    }
    return AudioQueuePlayer.instance
  }

  // ---------------------------------------------------------------------------
  // Turn-Taking State Machine Management
  // ---------------------------------------------------------------------------

  public getState(): TurnTakingState {
    return this.currentState
  }

  public setState(state: TurnTakingState): void {
    if (this.currentState === state) return
    this.currentState = state
    for (const listener of this.stateChangeListeners) {
      try {
        listener(state)
      } catch (err) {
        console.warn('[AudioQueuePlayer] State listener error:', err)
      }
    }
  }

  public onStateChange(listener: (state: TurnTakingState) => void): () => void {
    this.stateChangeListeners.add(listener)
    return () => {
      this.stateChangeListeners.delete(listener)
    }
  }

  // ---------------------------------------------------------------------------
  // Keep-Alive & Priming (iOS Safari & Android Chrome Hardware Audio Clock)
  // ---------------------------------------------------------------------------

  public startKeepAliveOscillator(audioCtx?: AudioContext): boolean {
    const ctx = audioCtx || this.audioCtx
    if (!ctx || ctx.state === 'closed') return false
    if (this.keepAliveOscillator) return true

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(10, ctx.currentTime) // 10Hz inaudible tone
      gain.gain.setValueAtTime(0.0001, ctx.currentTime) // 0.0001 gain prevents sleep

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()

      this.keepAliveOscillator = osc
      this.keepAliveGain = gain
      return true
    } catch (err) {
      console.warn('[AudioQueuePlayer] Keep-alive oscillator note:', err)
      return false
    }
  }

  public stopKeepAliveOscillator(): void {
    if (this.keepAliveOscillator) {
      try {
        this.keepAliveOscillator.stop()
        this.keepAliveOscillator.disconnect()
      } catch {}
      this.keepAliveOscillator = null
    }
    if (this.keepAliveGain) {
      try {
        this.keepAliveGain.disconnect()
      } catch {}
      this.keepAliveGain = null
    }
  }

  public isKeepAliveActive(): boolean {
    return this.keepAliveOscillator !== null
  }

  public async prime(providedCtx?: AudioContext): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      if (providedCtx) {
        this.audioCtx = providedCtx
      } else if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          this.audioCtx = new AudioCtx({ latencyHint: 'interactive' })
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      if (this.audioCtx) {
        const silent = this.audioCtx.createBuffer(1, 1, 22050)
        const src = this.audioCtx.createBufferSource()
        src.buffer = silent
        src.connect(this.audioCtx.destination)
        src.start(0)
        this.startKeepAliveOscillator(this.audioCtx)
      }

      this.isUnlocked = true
      return true
    } catch (err) {
      console.warn('[AudioQueuePlayer] prime failed:', err)
      return false
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx
  }

  public isSpeaking(): boolean {
    return (
      this.currentState === 'SPEAKING' ||
      this.activeAudio !== null ||
      this.queue.length > 0 ||
      this.activeSources.size > 0 ||
      this.pendingDecodeCount > 0
    )
  }

  public isPlaying(): boolean {
    return this.isSpeaking()
  }

  public getPlaybackRate(): number {
    return this.activeAudio ? this.activeAudio.playbackRate : 1.0
  }

  public getPreservesPitch(): boolean {
    return this.activeAudio ? (this.activeAudio.preservesPitch ?? true) : true
  }

  public getActiveAudio(): HTMLAudioElement | null {
    return this.activeAudio
  }

  public getQueueLength(): number {
    return this.queue.length
  }

  // ---------------------------------------------------------------------------
  // HTML5 Audio Queue & Strict 1.0x Playback Rate Lockdown
  // ---------------------------------------------------------------------------

  /**
   * Enqueues an audio segment (ArrayBuffer, Uint8Array, or base64 MP3/WAV string)
   * into the sequential HTML5 Audio playback queue.
   *
   * Enforces:
   * - Blob([buffer], { type: 'audio/mpeg' }) + URL.createObjectURL
   * - audio.playbackRate = 1.0
   * - audio.preservesPitch = true
   * - Strict sequential playback waiting for audio.onended before next item
   */
  public async playQueue(
    audioData: ArrayBuffer | Uint8Array | string,
    onChunkStart?: () => void,
    onAllEnded?: () => void
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      let buffer: Uint8Array
      if (typeof audioData === 'string') {
        // Base64 string decode
        const binaryString = typeof atob === 'function'
          ? atob(audioData)
          : Buffer.from(audioData, 'base64').toString('binary')
        const len = binaryString.length
        buffer = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          buffer[i] = binaryString.charCodeAt(i)
        }
      } else if (audioData instanceof Uint8Array) {
        buffer = audioData
      } else {
        buffer = new Uint8Array(audioData)
      }

      // Convert audio bytes to Blob([buffer], { type: 'audio/mpeg' }) and construct ObjectURL
      const blob = new Blob([buffer as any], { type: 'audio/mpeg' })
      const objectUrl = URL.createObjectURL(blob)

      if (onAllEnded) {
        this.onAllEndedCallback = onAllEnded
      }

      const item: AudioQueueItem = {
        id: `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        objectUrl,
        onChunkStart,
        onChunkEnd: () => {
          try {
            URL.revokeObjectURL(objectUrl)
          } catch {}
        }
      }

      this.queue.push(item)

      if (!this.isPlayingQueue) {
        this.processNextQueueItem()
      }

      return true
    } catch (err) {
      console.error('[AudioQueuePlayer] playQueue error:', err)
      return false
    }
  }

  private processNextQueueItem(): void {
    if (this.queue.length === 0) {
      this.isPlayingQueue = false
      this.activeAudio = null
      this.activeObjectUrl = null
      this.setState('LISTENING')
      if (this.onAllEndedCallback) {
        const cb = this.onAllEndedCallback
        this.onAllEndedCallback = null
        try { cb() } catch {}
      }
      return
    }

    this.isPlayingQueue = true
    this.setState('SPEAKING')

    const item = this.queue.shift()!
    this.activeObjectUrl = item.objectUrl

    try {
      const AudioConstructor = (typeof Audio !== 'undefined')
        ? Audio
        : (typeof window !== 'undefined' && (window as any).Audio)

      if (!AudioConstructor) {
        // Fallback for non-browser/test mocking environments
        item.onChunkStart?.()
        item.onChunkEnd?.()
        this.processNextQueueItem()
        return
      }

      const audio = new AudioConstructor(item.objectUrl)

      // Playback Rate & Pitch Preservation Lockdown:
      // Prevents 3x fast-forward chipmunk glitches across iOS Safari & Android Chrome
      audio.playbackRate = 1.0
      audio.preservesPitch = true
      this.activeAudio = audio

      const cleanupAndNext = () => {
        item.onChunkEnd?.()
        this.activeAudio = null
        this.activeObjectUrl = null
        this.processNextQueueItem()
      }

      audio.onplay = () => {
        this.setState('SPEAKING')
        item.onChunkStart?.()
      }

      audio.onended = () => {
        cleanupAndNext()
      }

      audio.onerror = (e) => {
        console.warn('[AudioQueuePlayer] HTML5 audio playback error:', e)
        cleanupAndNext()
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[AudioQueuePlayer] Play failed or was blocked by autoplay:', err)
          cleanupAndNext()
        })
      }
    } catch (err) {
      console.warn('[AudioQueuePlayer] Exception in processNextQueueItem:', err)
      item.onChunkEnd?.()
      this.processNextQueueItem()
    }
  }

  // ---------------------------------------------------------------------------
  // Web Audio Monotonic Enqueue (Dual Pipeline Support)
  // ---------------------------------------------------------------------------

  public async enqueueChunk(
    rawBuffer: ArrayBuffer,
    onChunkStart?: () => void,
    onAllEnded?: () => void
  ): Promise<boolean> {
    // Route into the HTML5 queue for mobile playback stabilization
    return this.playQueue(rawBuffer, onChunkStart, onAllEnded)
  }

  // ---------------------------------------------------------------------------
  // Conversational Barge-In & Complete Stop
  // ---------------------------------------------------------------------------

  public stop(): void {
    this.sessionId++
    this.pendingDecodeCount = 0
    nextStartTime = this.audioCtx ? this.audioCtx.currentTime : 0

    // Stop active HTML5 Audio playback
    if (this.activeAudio) {
      try {
        this.activeAudio.pause()
        this.activeAudio.currentTime = 0
        this.activeAudio.src = ''
      } catch {}
      this.activeAudio = null
    }

    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl)
      } catch {}
      this.activeObjectUrl = null
    }

    // Drain queued items and revoke their ObjectURLs
    for (const item of this.queue) {
      try {
        URL.revokeObjectURL(item.objectUrl)
      } catch {}
    }
    this.queue = []
    this.isPlayingQueue = false
    this.onAllEndedCallback = null

    // Stop active Web Audio buffer sources
    for (const src of this.activeSources) {
      try {
        src.stop(0)
        src.disconnect()
      } catch {}
    }
    this.activeSources.clear()

    this.setState('IDLE')
  }

  public stopAll(): void {
    this.stop()
  }
}

export const audioQueuePlayer = AudioQueuePlayer.getInstance()
