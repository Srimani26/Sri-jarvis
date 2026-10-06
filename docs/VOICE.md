# J.A.R.V.I.S. MARK-V — Voice Engine Architecture

## 1. Pipeline Overview
The voice engine (`src/voice/VoiceEngine.ts`) implements real-time audio interaction with zero latency degradation:
1. **Audio Capture & VAD**: Web Audio API with a deterministic 2-second silence cutoff to capture completed user thoughts without premature cutoffs.
2. **Wake Word Detection**: Regex & phonetic matcher detecting "Hey JARVIS", "JARVIS", "Computer".
3. **Intent Parsing**: Direct regex-driven extraction routing directives to specialist workforce agents.
4. **Execution**: Dispatches directly through `ExecutionKernel` and `AgentRuntime`.
5. **TTS & Barge-In**: Generates spoken output via Web Speech / Piper TTS. If user begins speaking during playback, the barge-in detector halts playback instantly (`isSpeaking = false`).
