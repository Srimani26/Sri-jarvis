/**
 * AudioQueuePlayer.ts — Low-Latency Mobile-Resilient Audio Queue & Monotonic Scheduler
 *
 * Implements:
 * 1. Monotonic Scheduling: Eliminates fast-forward / chipmunk audio overlap by strictly
 *    scheduling chunk playback times sequentially: nextStartTime = Math.max(currentTime, nextStartTime).
 * 2. Automatic Sample Rate Normalization: Uses native decodeAudioData (or auto-wrapped WAV header for raw PCM)
 *    to let the browser's native C++ resampler match the device's hardware sample rate (16kHz / 24kHz -> 44.1kHz / 48kHz).
 * 3. User-Gesture Priming: Explicitly unlocks and resumes AudioContext on user interaction to prevent iOS/Android suspended audio clock drift.
 * 4. Conversational Barge-In: Instantly halts active and queued sources upon interruption.
 */

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

export class AudioQueuePlayer {
  private static instance: AudioQueuePlayer | null = null
  private audioCtx: AudioContext | null = null
  private activeSources: Set<AudioBufferSourceNode> = new Set()
  private pendingDecodeCount = 0
  private sessionId = 0
  private isUnlocked = false
  private keepAliveOscillator: OscillatorNode | null = null
  private keepAliveGain: GainNode | null = null

  public static getInstance(): AudioQueuePlayer {
    if (!AudioQueuePlayer.instance) {
      AudioQueuePlayer.instance = new AudioQueuePlayer()
    }
    return AudioQueuePlayer.instance
  }

  /**
   * Attaches an inaudible 10Hz oscillator node with microscopic gain (0.0001)
   * connected to destination. This prevents Android Chrome and iOS Safari from
   * releasing the microphone hardware and suspending the audio clock when speech finishes.
   */
  public startKeepAliveOscillator(audioCtx?: AudioContext): boolean {
    const ctx = audioCtx || this.audioCtx
    if (!ctx || ctx.state === 'closed') return false
    if (this.keepAliveOscillator) return true

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(10, ctx.currentTime) // 10Hz inaudible sub-audible tone
      gain.gain.setValueAtTime(0.0001, ctx.currentTime) // 0.0001 gain to prevent sleep without audible noise

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()

      this.keepAliveOscillator = osc
      this.keepAliveGain = gain
      console.log('🔊 [AudioQueuePlayer] Silent keep-alive oscillator (10Hz, gain 0.0001) connected.')
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

  /**
   * Must be called on first user touch/mic interaction to unlock audio clock
   * on iOS Safari and mobile Chrome.
   */
  public async prime(providedCtx?: AudioContext): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      if (providedCtx) {
        this.audioCtx = providedCtx
      } else if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return false
        this.audioCtx = new AudioCtx({ latencyHint: 'interactive' })
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      // Play 1 silent frame to register user-gesture token
      const silent = this.audioCtx.createBuffer(1, 1, 22050)
      const src = this.audioCtx.createBufferSource()
      src.buffer = silent
      src.connect(this.audioCtx.destination)
      src.start(0)

      // Start continuous silent keep-alive oscillator
      this.startKeepAliveOscillator(this.audioCtx)

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
    return this.activeSources.size > 0 || this.pendingDecodeCount > 0
  }

  public isPlaying(): boolean {
    return this.isSpeaking()
  }

  /**
   * Instantly stops all current speech and resets schedule timeline (barge-in).
   */
  public stop() {
    this.sessionId++
    this.pendingDecodeCount = 0
    nextStartTime = this.audioCtx ? this.audioCtx.currentTime : 0

    for (const src of this.activeSources) {
      try {
        src.stop(0)
        src.disconnect()
      } catch {}
    }
    this.activeSources.clear()
  }

  /**
   * Alias for barge-in interruption.
   */
  public stopAll() {
    this.stop()
  }

  /**
   * Enqueues an ArrayBuffer (MP3, WAV, or raw 16kHz PCM) and schedules it gaplessly.
   */
  public async enqueueChunk(
    rawBuffer: ArrayBuffer,
    onChunkStart?: () => void,
    onAllEnded?: () => void
  ): Promise<boolean> {
    const currentSession = this.sessionId
    await this.prime()
    if (!this.audioCtx) return false

    this.pendingDecodeCount++

    try {
      let decodeBuffer = rawBuffer.slice(0)

      // Inspect first 4 bytes to check if it has a container header (RIFF, ID3, or MP3 frame sync 0xFF)
      const u8 = new Uint8Array(decodeBuffer)
      const isRiff = u8.length > 4 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46
      const isId3 = u8.length > 3 && u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33
      const isMp3Sync = u8.length > 2 && u8[0] === 0xFF && (u8[1] & 0xE0) === 0xE0

      // If raw headerless PCM, wrap into WAV format so decodeAudioData resamples to hardware rate cleanly
      if (!isRiff && !isId3 && !isMp3Sync) {
        decodeBuffer = wrapPcmInWavHeader(u8, 16000, 1)
      }

      const audioBuffer = await this.audioCtx.decodeAudioData(decodeBuffer)

      if (this.sessionId !== currentSession) {
        this.pendingDecodeCount = Math.max(0, this.pendingDecodeCount - 1)
        return false
      }

      const source = playAudioChunk(audioBuffer, this.audioCtx)
      this.activeSources.add(source)

      source.onended = () => {
        this.activeSources.delete(source)
        this.pendingDecodeCount = Math.max(0, this.pendingDecodeCount - 1)
        try { source.disconnect() } catch {}

        if (this.sessionId === currentSession && this.activeSources.size === 0 && this.pendingDecodeCount === 0) {
          nextStartTime = 0
          onAllEnded?.()
        }
      }

      onChunkStart?.()
      return true
    } catch (err) {
      this.pendingDecodeCount = Math.max(0, this.pendingDecodeCount - 1)
      console.warn('[AudioQueuePlayer] decodeAudioData error, attempting raw PCM fallback:', err)

      // Emergency fallback: If decodeAudioData failed, create native buffer directly with 16kHz
      try {
        const int16 = new Int16Array(rawBuffer)
        const fallbackBuf = this.audioCtx.createBuffer(1, int16.length, 16000)
        const channel = fallbackBuf.getChannelData(0)
        for (let i = 0; i < int16.length; i++) {
          channel[i] = int16[i] / 32768.0
        }
        const source = playAudioChunk(fallbackBuf, this.audioCtx)
        this.activeSources.add(source)
        source.onended = () => {
          this.activeSources.delete(source)
          if (this.activeSources.size === 0) {
            nextStartTime = 0
            onAllEnded?.()
          }
        }
        return true
      } catch (fallbackErr) {
        console.error('[AudioQueuePlayer] Playback completely failed:', fallbackErr)
        return false
      }
    }
  }
}

export const audioQueuePlayer = AudioQueuePlayer.getInstance()

