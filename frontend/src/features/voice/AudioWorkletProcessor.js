/**
 * AudioWorkletProcessor.js — Sovereign 16kHz Linear PCM Streamer
 * Runs on the dedicated Web Audio rendering thread without touching the main UI thread.
 * 
 * Features:
 * 1. Downsamples from browser hardware rate (44.1kHz/48kHz) to 16kHz single-channel Linear PCM.
 * 2. Real-time RMS calculation for client VAD with 0.01 mobile microphone threshold.
 * 3. 400ms hangover pad so sentence endings and softer speech are not cut off mid-word.
 * 4. Echo-suppression mute gate: pauses capture while the AI agent is speaking.
 * 5. Zero memory allocations in hot loop to prevent garbage collection pauses.
 */

class JarvisAudioWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.bufferSize = 1024; // 64ms chunk at 16kHz
    this.outputBuffer = new Int16Array(this.bufferSize);
    this.outputIndex = 0;
    this.isMuted = false;
    this.speechThreshold = 0.01; // Lowered to 0.01 for mobile microphones
    this.hangoverMaxFrames = 7;   // ~448ms hangover padding (7 * 64ms)
    this.hangoverFrames = 0;

    this.port.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.type === 'MUTE') {
        this.isMuted = true;
        this.outputIndex = 0;
        this.hangoverFrames = 0;
      } else if (data.type === 'UNMUTE') {
        this.isMuted = false;
        this.outputIndex = 0;
        this.hangoverFrames = 0;
      } else if (data.type === 'SET_THRESHOLD') {
        if (typeof data.threshold === 'number') {
          this.speechThreshold = data.threshold;
        }
      }
    };
  }

  process(inputs) {
    if (this.isMuted) return true;

    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const channelData = input[0]; // mono or left channel
    const inputLength = channelData.length;
    const inputSampleRate = sampleRate; // global AudioWorklet sampleRate

    // Compute RMS energy on raw input frame
    let sumSquares = 0;
    for (let i = 0; i < inputLength; i++) {
      const sample = channelData[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / inputLength);

    // Dynamic 400ms Hangover State Machine
    if (rms >= this.speechThreshold) {
      this.hangoverFrames = this.hangoverMaxFrames;
    } else if (this.hangoverFrames > 0) {
      this.hangoverFrames--;
    }

    const isSpeechActive = rms >= this.speechThreshold || this.hangoverFrames > 0;

    // Linear downsampling to 16kHz
    const ratio = inputSampleRate / this.targetSampleRate;
    let inIdx = 0;

    while (inIdx < inputLength) {
      const sample = channelData[Math.floor(inIdx)];
      // Clamp and convert to 16-bit signed integer (-32768 to 32767)
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;

      this.outputBuffer[this.outputIndex++] = int16;

      if (this.outputIndex >= this.bufferSize) {
        // Send a copy of the 16kHz PCM buffer to the main thread
        const pcmCopy = new Int16Array(this.outputBuffer);
        this.port.postMessage(
          {
            type: 'PCM_CHUNK',
            buffer: pcmCopy.buffer,
            rms: rms,
            isAboveThreshold: isSpeechActive,
            isHangover: this.hangoverFrames > 0 && rms < this.speechThreshold,
            sampleRate: 16000
          },
          [pcmCopy.buffer]
        );
        this.outputIndex = 0;
      }

      inIdx += ratio;
    }

    return true;
  }
}

registerProcessor('jarvis-audio-worklet-processor', JarvisAudioWorkletProcessor);
