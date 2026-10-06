/**
 * J.A.R.V.I.S. MARK-V Autonomous Voice Interface Types
 */

export type VoiceSessionState =
  | 'IDLE'
  | 'LISTENING'
  | 'VAD_ACTIVE'
  | 'TRANSCRIBING'
  | 'EXECUTING_KERNEL'
  | 'SPEAKING'
  | 'INTERRUPTED';

export interface VoiceConfig {
  wakeWord: string;
  language: string;
  bargeInEnabled: boolean;
  voicePersona: string;
  silenceThresholdMs: number;
}

export interface VoiceIntent {
  rawTranscript: string;
  normalizedDirective: string;
  assignedAgentId: string;
  isWakeWordPresent: boolean;
  confidence: number;
}

export interface VoiceTurnResult {
  turnId: string;
  state: VoiceSessionState;
  intent: VoiceIntent;
  taskId?: string;
  spokenResponse: string;
  interrupted: boolean;
  durationMs: number;
}
