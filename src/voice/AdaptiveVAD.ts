/**
 * AdaptiveVAD.ts — Adaptive Voice Activity Detection with Pre-Speech Ring Buffer
 * Assimilated from vision-agents smart_turn, qwen-audio-agent, and SenseVoice.
 *
 * Solves:
 * 1. Mobile AGC low-energy speech cutoff (handles 3-10 RMS without dropping turns)
 * 2. Lookback buffer preserving the first 250ms of speech (consonants / wake words)
 * 3. Dynamic ambient noise floor calibration (adapts in real-time)
 * 4. Human-cadence silence hangover detection
 */

export interface VADConfig {
  preSpeechBufferMs?: number
  silenceHangoverMs?: number
  minSpeechDurationMs?: number
  energyDelta?: number
  minAbsoluteEnergy?: number
}

export interface VADFrameResult {
  isSpeaking: boolean
  turnCompleted: boolean
  avgEnergy: number
  noiseFloor: number
  bands: number[]
}

export class AdaptiveVAD {
  private noiseFloor = 3.0
  private speechDetected = false
  private speechStartTime = 0
  private lastSpeechTimestamp = 0
  private preSpeechChunks: Blob[] = []
  private readonly maxPreSpeechChunks = 4 // ~250ms lookback

  private readonly preSpeechBufferMs: number
  private readonly silenceHangoverMs: number
  private readonly minSpeechDurationMs: number
  private readonly energyDelta: number
  private readonly minAbsoluteEnergy: number

  constructor(config: VADConfig = {}) {
    this.preSpeechBufferMs = config.preSpeechBufferMs ?? 250
    this.silenceHangoverMs = config.silenceHangoverMs ?? 700
    this.minSpeechDurationMs = config.minSpeechDurationMs ?? 250
    this.energyDelta = config.energyDelta ?? 2.8
    this.minAbsoluteEnergy = config.minAbsoluteEnergy ?? 3.5
  }

  public reset() {
    this.speechDetected = false
    this.speechStartTime = 0
    this.lastSpeechTimestamp = 0
    this.preSpeechChunks = []
  }

  /**
   * Feed a new raw audio chunk into the pre-speech ring buffer.
   */
  public pushChunk(chunk: Blob) {
    if (!this.speechDetected) {
      this.preSpeechChunks.push(chunk)
      if (this.preSpeechChunks.length > this.maxPreSpeechChunks) {
        this.preSpeechChunks.shift()
      }
    }
  }

  /**
   * Retrieve pre-speech chunks to prepend to the recording when speech triggers.
   */
  public getPreSpeechChunks(): Blob[] {
    const chunks = [...this.preSpeechChunks]
    this.preSpeechChunks = []
    return chunks
  }

  /**
   * Process a frequency frame from Web Audio AnalyserNode.
   */
  public processFrequencyData(dataArray: Uint8Array, bandsCount: number = 14): VADFrameResult {
    let sum = 0
    const bands: number[] = []
    const step = Math.floor(dataArray.length / bandsCount) || 1

    for (let b = 0; b < bandsCount; b++) {
      let bSum = 0
      for (let k = b * step; k < (b + 1) * step; k++) {
        bSum += dataArray[k] || 0
      }
      bands.push(Math.min(100, Math.max(8, Math.floor(bSum / step))))
      sum += bSum
    }

    const avgEnergy = sum / (dataArray.length || 1)
    const now = Date.now()

    // Smoothly adapt noise floor during silence
    if (!this.speechDetected) {
      this.noiseFloor = 0.95 * this.noiseFloor + 0.05 * avgEnergy
    }

    const speechThreshold = Math.max(this.minAbsoluteEnergy, this.noiseFloor + this.energyDelta)
    const isVoiceAboveThreshold = avgEnergy > speechThreshold

    let turnCompleted = false

    if (isVoiceAboveThreshold) {
      if (!this.speechDetected) {
        this.speechDetected = true
        this.speechStartTime = now
      }
      this.lastSpeechTimestamp = now
    } else if (this.speechDetected) {
      const silenceDuration = now - this.lastSpeechTimestamp
      const spokenDuration = this.lastSpeechTimestamp - this.speechStartTime

      if (silenceDuration > this.silenceHangoverMs && spokenDuration > this.minSpeechDurationMs) {
        turnCompleted = true
      }
    }

    return {
      isSpeaking: this.speechDetected,
      turnCompleted,
      avgEnergy,
      noiseFloor: this.noiseFloor,
      bands,
    }
  }

  public get isSpeechActive(): boolean {
    return this.speechDetected
  }
}
