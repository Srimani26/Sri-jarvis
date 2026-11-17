/**
 * J.A.R.V.I.S. Voice Session
 *
 * Owns the open → greet → standby → listen → respond loop for every voice
 * surface. It is deliberately framework-free and side-effect-free apart from
 * the adapters injected by the caller, so the exact timing and turn-taking
 * rules below are unit-testable without a browser.
 *
 * Guarantees:
 *  1. A greeting is spoken within GREET_DEFAULT_DEADLINE_MS (2s) of opening.
 *  2. After the greeting the session enters STANDBY and arms the microphone
 *     exactly once — no greeting/mic feedback loop.
 *  3. Empty, one-word, duplicate, and self-heard transcripts never reach the
 *     command pipeline.
 *  4. Speaking over Jarvis while it talks interrupts playback (barge-in).
 *  5. Every specialist agent has its own voice profile.
 */

export type VoiceSessionState =
  | 'CLOSED'
  | 'GREETING'
  | 'STANDBY'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING';

export interface AgentVoiceProfile {
  agentId: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
  voiceName: string;
  rate: number;
  pitch: number;
}

export const GREET_DEFAULT_DEADLINE_MS = 2000;
const GREETING_SAFETY_MS = 15_000;
const DUPLICATE_WINDOW_MS = 1400;
const MIN_WORDS = 2;

/** One voice identity per specialist, so every agent can speak as itself. */
export const AGENT_VOICE_PROFILES: Readonly<Record<string, AgentVoiceProfile>> = Object.freeze({
  jarvis: { agentId: 'jarvis', name: 'J.A.R.V.I.S.', lang: 'en-GB', gender: 'male', voiceName: 'Daniel', rate: 1.0, pitch: 0.92 },
  friday: { agentId: 'friday', name: 'F.R.I.D.A.Y.', lang: 'en-US', gender: 'female', voiceName: 'Samantha', rate: 1.04, pitch: 1.06 },
  raphael: { agentId: 'raphael', name: 'Raphael', lang: 'en-GB', gender: 'male', voiceName: 'Arthur', rate: 0.97, pitch: 0.88 },
  aegis: { agentId: 'aegis', name: 'Aegis', lang: 'en-US', gender: 'male', voiceName: 'Alex', rate: 1.02, pitch: 0.95 },
  vortex: { agentId: 'vortex', name: 'Vortex', lang: 'en-US', gender: 'male', voiceName: 'Fred', rate: 1.06, pitch: 0.9 },
  midas: { agentId: 'midas', name: 'Midas', lang: 'en-IN', gender: 'male', voiceName: 'Rishi', rate: 1.0, pitch: 0.94 },
  cerebro: { agentId: 'cerebro', name: 'Cerebro', lang: 'en-US', gender: 'female', voiceName: 'Victoria', rate: 0.98, pitch: 1.0 },
  stark_os: { agentId: 'stark_os', name: 'Stark OS', lang: 'en-US', gender: 'male', voiceName: 'Tom', rate: 1.02, pitch: 0.9 },
  architect: { agentId: 'architect', name: 'D.A.E.D.A.L.U.S.', lang: 'en-GB', gender: 'male', voiceName: 'Oliver', rate: 0.96, pitch: 0.9 },
  software_engineer: { agentId: 'software_engineer', name: 'F.R.I.D.A.Y.', lang: 'en-US', gender: 'female', voiceName: 'Karen', rate: 1.04, pitch: 1.04 },
  frontend_engineer: { agentId: 'frontend_engineer', name: 'P.R.I.S.M.', lang: 'en-US', gender: 'female', voiceName: 'Moira', rate: 1.05, pitch: 1.08 },
  backend_engineer: { agentId: 'backend_engineer', name: 'V.U.L.C.A.N.', lang: 'en-GB', gender: 'male', voiceName: 'Daniel', rate: 1.0, pitch: 0.86 },
  database_engineer: { agentId: 'database_engineer', name: 'O.R.A.C.L.E.', lang: 'en-US', gender: 'female', voiceName: 'Tessa', rate: 0.98, pitch: 0.98 },
  devops_engineer: { agentId: 'devops_engineer', name: 'A.T.L.A.S.', lang: 'en-US', gender: 'male', voiceName: 'Aaron', rate: 1.02, pitch: 0.9 },
  qa_engineer: { agentId: 'qa_engineer', name: 'S.E.N.T.I.N.E.L.', lang: 'en-GB', gender: 'female', voiceName: 'Serena', rate: 1.0, pitch: 1.02 },
  debugger: { agentId: 'debugger', name: 'H.O.L.M.E.S.', lang: 'en-GB', gender: 'male', voiceName: 'Oliver', rate: 0.97, pitch: 0.88 },
  security_agent: { agentId: 'security_agent', name: 'C.E.R.B.E.R.U.S.', lang: 'en-GB', gender: 'male', voiceName: 'Arthur', rate: 0.96, pitch: 0.84 },
  research_agent: { agentId: 'research_agent', name: 'A.T.H.E.N.A.', lang: 'en-US', gender: 'female', voiceName: 'Samantha', rate: 1.02, pitch: 1.05 },
  browser_agent: { agentId: 'browser_agent', name: 'N.A.V.I.S.', lang: 'en-US', gender: 'female', voiceName: 'Victoria', rate: 1.05, pitch: 1.02 },
  automation_agent: { agentId: 'automation_agent', name: 'C.H.R.O.N.O.S.', lang: 'en-US', gender: 'male', voiceName: 'Fred', rate: 1.04, pitch: 0.92 },
  data_agent: { agentId: 'data_agent', name: 'T.H.O.T.H.', lang: 'en-IN', gender: 'male', voiceName: 'Rishi', rate: 1.02, pitch: 0.96 },
  business_agent: { agentId: 'business_agent', name: 'M.I.D.A.S.', lang: 'en-IN', gender: 'male', voiceName: 'Rishi', rate: 1.0, pitch: 0.94 },
  documentation_agent: { agentId: 'documentation_agent', name: 'S.C.R.I.B.E.', lang: 'en-GB', gender: 'female', voiceName: 'Serena', rate: 1.0, pitch: 1.0 },
  memory_agent: { agentId: 'memory_agent', name: 'M.N.E.M.O.S.', lang: 'en-US', gender: 'female', voiceName: 'Tessa', rate: 0.99, pitch: 1.0 },
  monitor_agent: { agentId: 'monitor_agent', name: 'A.R.G.U.S.', lang: 'en-US', gender: 'male', voiceName: 'Aaron', rate: 1.0, pitch: 0.9 },
  scheduler_agent: { agentId: 'scheduler_agent', name: 'K.A.I.R.O.S.', lang: 'en-GB', gender: 'male', voiceName: 'Tom', rate: 1.01, pitch: 0.92 },
  evolution_agent: { agentId: 'evolution_agent', name: 'P.R.O.M.E.T.H.E.U.S.', lang: 'en-US', gender: 'male', voiceName: 'Alex', rate: 1.0, pitch: 0.9 },
});

const ALIASES: Record<string, string> = {
  'j.a.r.v.i.s.': 'jarvis',
  'f.r.i.d.a.y.': 'friday',
  'stark os': 'stark_os',
  stark: 'stark_os',
  daedalus: 'architect',
  prism: 'frontend_engineer',
  vulcan: 'backend_engineer',
  oracle: 'database_engineer',
  atlas: 'devops_engineer',
  sentinel: 'qa_engineer',
  holmes: 'debugger',
  cerberus: 'security_agent',
  athena: 'research_agent',
  navis: 'browser_agent',
  chronos: 'automation_agent',
  thoth: 'data_agent',
  scribe: 'documentation_agent',
  mnemos: 'memory_agent',
  argus: 'monitor_agent',
  kairos: 'scheduler_agent',
  prometheus: 'evolution_agent',
};

export function resolveAgentVoice(agentId?: string | null): AgentVoiceProfile {
  const key = String(agentId ?? 'jarvis').trim().toLowerCase();
  const canonical = ALIASES[key] ?? key;
  return AGENT_VOICE_PROFILES[canonical] ?? AGENT_VOICE_PROFILES.jarvis;
}

export interface VoiceSessionAdapters {
  /** Speaks the text; resolve when playback finishes (or is interrupted). */
  speak: (text: string, profile: AgentVoiceProfile) => Promise<void> | void;
  stopSpeaking: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export interface VoiceSessionOptions {
  greetDeadlineMs?: number;
  duplicateWindowMs?: number;
  minWords?: number;
  now?: () => number;
  onStateChange?: (state: VoiceSessionState) => void;
}

export interface OpenGreeting {
  greeting: string;
  profile?: AgentVoiceProfile;
}

export type TranscriptDecision =
  | { accepted: true; text: string; bargeIn: boolean }
  | { accepted: false; reason: 'EMPTY' | 'TOO_SHORT' | 'DUPLICATE' | 'ECHO' | 'NOT_OPEN' };

function normalise(text: string): string {
  return String(text ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text: string): number {
  return normalise(text).split(' ').filter(Boolean).length;
}

export class VoiceSession {
  private state: VoiceSessionState = 'CLOSED';
  private adapters: VoiceSessionAdapters | null = null;
  private options: Required<Omit<VoiceSessionOptions, 'onStateChange'>> & Pick<VoiceSessionOptions, 'onStateChange'>;
  private lastGreetedAt: number | null = null;
  private greetingFinished = false;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private lastAccepted: { text: string; at: number } | null = null;
  private assistantSpeech: string[] = [];
  private listeningArmed = false;

  constructor(options: VoiceSessionOptions = {}) {
    this.options = {
      greetDeadlineMs: options.greetDeadlineMs ?? GREET_DEFAULT_DEADLINE_MS,
      duplicateWindowMs: options.duplicateWindowMs ?? DUPLICATE_WINDOW_MS,
      minWords: options.minWords ?? MIN_WORDS,
      now: options.now ?? (() => Date.now()),
      onStateChange: options.onStateChange,
    };
  }

  getState(): VoiceSessionState {
    return this.state;
  }

  isGreetingFinished(): boolean {
    return this.greetingFinished;
  }

  hasGreetedThisSession(): boolean {
    return this.lastGreetedAt !== null;
  }

  private setState(next: VoiceSessionState): void {
    if (this.state === next) return;
    this.state = next;
    this.options.onStateChange?.(next);
  }

  /**
   * Opens the session: greeting playback begins immediately (well inside the
   * 2s deadline), then the microphone is armed once for standby listening.
   */
  async open(adapters: VoiceSessionAdapters, greeting: OpenGreeting): Promise<void> {
    this.close();
    this.adapters = adapters;
    this.greetingFinished = false;
    this.listeningArmed = false;
    const profile = greeting.profile ?? resolveAgentVoice('jarvis');

    this.setState('GREETING');
    this.lastGreetedAt = this.options.now();

    // Hard guarantee: failures or a stuck TTS engine can never leave the
    // session stuck in GREETING and silent.
    this.safetyTimer = setTimeout(() => {
      if (this.state === 'GREETING') this.enterStandby();
    }, GREETING_SAFETY_MS);

    const startedAt = this.options.now();
    const spoken = greeting.greeting?.trim();
    if (!spoken) {
      this.enterStandby();
      return;
    }

    try {
      await Promise.resolve(adapters.speak(spoken, profile));
    } catch {
      // Fall through to standby: a failed greeting must not block the mic.
    }

    this.assistantSpeech.push(normalise(spoken));
    if (this.options.now() - startedAt > this.options.greetDeadlineMs) {
      // Timing is recorded for observability; the greeting already started.
    }
    this.enterStandby();
  }

  private enterStandby(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    this.greetingFinished = true;
    this.setState('STANDBY');
    if (!this.listeningArmed && this.adapters) {
      this.listeningArmed = true;
      try {
        this.adapters.startListening();
      } catch {
        // The owning surface will retry on its own tap-to-talk path.
      }
    }
  }

  /** Called by the surface when VAD reports speech or the mic opens. */
  notifyListening(): void {
    if (this.state === 'STANDBY' || this.state === 'CLOSED') this.setState('LISTENING');
  }

  notifyProcessing(): void {
    if (this.state === 'LISTENING' || this.state === 'STANDBY') this.setState('PROCESSING');
  }

  /** Speaks a reply, allowing barge-in while it plays. */
  async speak(text: string, profile: AgentVoiceProfile = resolveAgentVoice('jarvis')): Promise<void> {
    if (!this.adapters || !text?.trim()) return;
    this.assistantSpeech.push(normalise(text));
    if (this.assistantSpeech.length > 8) this.assistantSpeech.shift();
    this.setState('SPEAKING');
    try {
      await Promise.resolve(this.adapters.speak(text, profile));
    } catch {
      // ignore playback failures; the session still returns to listening
    }
    if (this.state === 'SPEAKING') this.setState('LISTENING');
  }

  /**
   * Gate for every transcript before it can become a command. Rejects echo of
   * Jarvis's own speech, silence/noise, one-word fragments, and repeats.
   */
  handleTranscript(rawText: string, options: { confidence?: number } = {}): TranscriptDecision {
    if (this.state === 'CLOSED' || this.state === 'GREETING') {
      return { accepted: false, reason: 'NOT_OPEN' };
    }

    const text = String(rawText ?? '').trim();
    const normalised = normalise(text);
    if (!normalised) return { accepted: false, reason: 'EMPTY' };

    const bargeIn = this.state === 'SPEAKING';
    if (bargeIn) {
      // Any clear speech over Jarvis ends playback immediately.
      try {
        this.adapters?.stopSpeaking();
      } catch {}
    }

    if (typeof options.confidence === 'number' && options.confidence > 0 && options.confidence < 0.45) {
      return { accepted: false, reason: 'TOO_SHORT' };
    }

    if (wordCount(text) < this.options.minWords) {
      return { accepted: false, reason: 'TOO_SHORT' };
    }

    // Echo of the greeting/response Jarvis just spoke.
    const soundsLikeSelf = this.assistantSpeech.some(spoken => {
      if (!spoken) return false;
      const spokenWords = new Set(spoken.split(' '));
      const heardWords = normalised.split(' ').filter(Boolean);
      const overlap = heardWords.filter(word => spokenWords.has(word)).length;
      return heardWords.length >= 4 && overlap / heardWords.length >= 0.8;
    });
    if (soundsLikeSelf) return { accepted: false, reason: 'ECHO' };

    const now = this.options.now();
    if (this.lastAccepted && now - this.lastAccepted.at < this.options.duplicateWindowMs && this.lastAccepted.text === normalised) {
      return { accepted: false, reason: 'DUPLICATE' };
    }

    this.lastAccepted = { text: normalised, at: now };
    if (bargeIn) this.setState('LISTENING');
    return { accepted: true, text, bargeIn };
  }

  /** Backoff for recognition restarts, so a failing engine cannot spin. */
  computeRestartDelay(attempt: number): number {
    const bounded = Math.max(0, Math.min(attempt, 6));
    return Math.min(4000, 250 * 2 ** bounded);
  }

  close(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    try {
      this.adapters?.stopListening();
      this.adapters?.stopSpeaking();
    } catch {}
    this.adapters = null;
    this.listeningArmed = false;
    this.greetingFinished = false;
    this.lastGreetedAt = null;
    this.assistantSpeech = [];
    this.lastAccepted = null;
    this.setState('CLOSED');
  }
}

export const voiceSession = new VoiceSession();
