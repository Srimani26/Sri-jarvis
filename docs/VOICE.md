# J.A.R.V.I.S. MARK-V — Voice Engine Architecture

## 0. Session timing contract (`src/voice/VoiceSession.ts`)

The voice surface follows one testable contract, enforced by
`tests/voice-session.test.ts`:

1. **Greeting inside 2 seconds.** Opening Jarvis speaks immediately through local
   synthesis (`speakInstantNativeSpeech`); no network round-trip sits in the
   greeting path. `VoiceSession.open()` starts playback synchronously and records
   the greeting.
2. **Standby after the greeting.** When playback finishes — or fails, or stalls —
   the session enters `STANDBY` and arms the microphone exactly once. There is no
   fixed multi-second wait and no greeting/microphone feedback loop.
3. **Only real commands get through.** `handleTranscript()` rejects empty input,
   one-word noise, low-confidence recognition, repeats inside the duplicate
   window, and echo of Jarvis's own greeting or reply.
4. **Barge-in.** Speech detected while Jarvis is talking stops playback and
   returns the session to `LISTENING`.
5. **Recognition restarts back off** (`computeRestartDelay`) so a failing speech
   engine cannot spin the microphone on and off.

Each transcript is normalized phonetically (`ConversationOS.normalizePhoneticUtterance`)
before routing, so accented English for agent names resolves to the right
specialist.

### Speech recognition cascade

1. **Primary:** `/api/voice/transcribe` (Deepgram Nova with keyword boosting).
2. **Second opinion:** `src/voice/NativeRecognition.ts` runs one on-device
   recognition pass when the server is unavailable, rate-limited, or returns
   nothing for a real utterance. The highest-confidence alternative wins and low
   confidence results are dropped rather than guessed at.

Recognition language follows the active agent's profile (for example `en-IN` for
Midas) instead of a hard-coded locale.

### Per-agent voices

`AGENT_VOICE_PROFILES` in `src/voice/VoiceSession.ts` gives every specialist
(jarvis, friday, raphael, aegis, vortex, midas, cerebro, stark_os and all
canonical workforce roles) its own locale, gender, voice name, rate and pitch.
`resolveAgentVoice()` maps aliases such as `F.R.I.D.A.Y.` or `stark os` to the
right profile and falls back to Jarvis for unknown ids.

## 1. Pipeline Overview
The voice engine (`src/voice/VoiceEngine.ts`) implements real-time audio interaction with zero latency degradation:
1. **Audio Capture & VAD**: Web Audio API with a deterministic 2-second silence cutoff to capture completed user thoughts without premature cutoffs.
2. **Wake Word Detection**: Regex & phonetic matcher detecting "Hey JARVIS", "JARVIS", "Computer".
3. **Intent Parsing**: Direct regex-driven extraction routing directives to specialist workforce agents.
4. **Execution**: Dispatches directly through `ExecutionKernel` and `AgentRuntime`.
5. **TTS & Barge-In**: Generates spoken output via Web Speech / Piper TTS. If user begins speaking during playback, the barge-in detector halts playback instantly (`isSpeaking = false`).
