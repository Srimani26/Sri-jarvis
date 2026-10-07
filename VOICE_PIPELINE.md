# J.A.R.V.I.S. Voice Pipeline Architecture
**Document**: Speech Recognition, Synthesis & Audio State Specification  
**System**: J.A.R.V.I.S. MARK-V Sovereign Voice Subsystem  
**Owner**: Master Sri  
**Status**: Production Verified  

---

## 1. Architectural Principles

The J.A.R.V.I.S. voice pipeline is engineered to eliminate real-world audio bugs:
1. **Zero Self-Hearing / Feedback Loops**: Microphone stream is explicitly stopped/detached while TTS audio is speaking.
2. **Deterministic State Progression**: Transitions are unidirectional and predictable; on speech completion, the system transitions to `IDLE`, not `LISTENING`.
3. **Single Session Greeting**: One dynamic greeting per browser session guarded by `sessionStorage`.
4. **Resilient STT Cascade**: Multi-provider failover ensures transcription survives provider outages.
5. **Real-Time Barge-In (Interruption)**: User speech or reactor tap instantly halts speech synthesis and prepares recognition.

---

## 2. Audio Processing Topology

```
[Microphone Input] (WebRTC 16kHz Mono)
       │
       ▼
[Acoustic Conditioning]
  ├── Acoustic Echo Cancellation (AEC: true)
  ├── Noise Suppression (NS: true)
  └── Automatic Gain Control (AGC: true)
       │
       ▼
[VAD & Noise Gate Engine]
  ├── RMS Amplitude Threshold: > 0.15
  └── Silence Reject: < 0.10 -> drop frame
       │
       ▼
[Speech Segmentation & Transport]
  ├── WebSpeech API (Low-latency local continuous transcript)
  └── Webm/WAV Audio Chunks (Server cascade STT)
       │
       ▼
[STT Provider Cascade (/api/voice/transcribe)]
  ├── Primary: Groq Whisper-large-v3-turbo (Sub-350ms)
  ├── Secondary: OpenAI Whisper-1
  └── Tertiary: Gemini 2.5 Flash Audio
       │
       ▼
[Intent & Directive Normalization]
  ├── Wake Word Filter ('Jarvis', 'Hey Jarvis', 'Aegis', etc.)
  ├── Task Classifier (CHAT vs TASK vs DELEGATION)
  └── Execution Dispatcher
       │
       ▼
[TTS Playback & Output Gate]
  ├── Hard Mic Gate: Mic = OFF during playback
  ├── WebSpeechSynthesis / Kokoro / ElevenLabs
  └── On Audio End: State = IDLE (Strict non-listening)
```

---

## 3. Strict State Machine

The voice subsystem operates exclusively within 7 deterministic states:

| State | Mic Status | Visual Indicator | Audio Capture | Permitted Next States |
| :--- | :--- | :--- | :--- | :--- |
| `OFF` | Inactive | Gray / Dim | Blocked | `GREETING`, `IDLE` |
| `GREETING` | Inactive | Cyan Pulsing | **Hard Blocked** | `IDLE` |
| `IDLE` | Inactive | Cyan Static Ring | Blocked | `ARMED`, `LISTENING` |
| `ARMED` | Inactive | Amber Halo | Hotword Ready | `LISTENING`, `IDLE` |
| `LISTENING` | **Active** | Emerald Waveform | **Capturing** | `PROCESSING`, `IDLE` |
| `PROCESSING` | Inactive | Purple Rotation | Blocked | `SPEAKING`, `IDLE` |
| `SPEAKING` | Inactive | Gold Soundwave | **Hard Blocked** | `IDLE`, `LISTENING` (on barge-in) |

### Transition Invariants
- **$\text{SPEAKING} \longrightarrow \text{IDLE}$**: On speech synthesis conclusion, mic remains **OFF**. The user must explicitly speak wake word or click the reactor to open a new listening turn.
- **$\text{GREETING} \longrightarrow \text{IDLE}$**: On session initial mount, the greeting plays once. Mic is strictly off.
- **$\text{SPEAKING} \xrightarrow{\text{Barge-In}} \text{LISTENING}$**: If user clicks the reactor core or triggers barge-in during speech, `window.speechSynthesis.cancel()` executes synchronously, the speech stream drops, and mic activates.

---

## 4. Multi-Provider STT Cascade

When server-side audio transcription is invoked via `POST /api/voice/transcribe`, the backend executes the following failover protocol:

```typescript
// Pseudocode of production cascade in custom-routes.ts
try {
  // 1. Primary Engine: Groq Whisper Large v3 Turbo
  return await transcribeWithGroq(audioFile);
} catch (groqErr) {
  logger.warn('Primary STT (Groq) failed, falling back to OpenAI Whisper', groqErr);
  try {
    // 2. Secondary Engine: OpenAI Whisper-1
    return await transcribeWithOpenAI(audioFile);
  } catch (openAiErr) {
    logger.warn('Secondary STT (OpenAI) failed, falling back to Gemini Flash', openAiErr);
    // 3. Tertiary Engine: Gemini 2.5 Flash Multimodal
    return await transcribeWithGemini(audioFile);
  }
}
```

*Note: In no circumstance will the system fabricate or invent transcripts when all providers fail. It explicitly returns an error state: `"Voice recognition failed — please try again or type your command."`*

---

## 5. Visualizer Truthfulness

- **Idle State**: Waveform array remains pinned at baseline minimums (`[8, 8, 8, 8, ...]`). No artificial jitter or fake perpetual animation is rendered.
- **Capturing State**: Waveform reflects real audio frequency bins sampled via `Web Audio API` `AnalyserNode` (`fftSize = 64`).
- **Speaking State**: Equalizer bars animate proportionally to synthetic speech synthesis buffer events.
