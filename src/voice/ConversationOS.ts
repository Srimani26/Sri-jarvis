/**
 * J.A.R.V.I.S. MARK-V Phase 21: Advanced Voice / Conversation OS
 * Full conversational state machine with instant barge-in interruption,
 * turn-taking, tactical persona tuning, and seamless specialist handoffs.
 */

export type ConversationState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'BARGE_IN_INTERRUPTED';

export interface Utterance {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  interrupted?: boolean;
  assignedAgent?: string;
}

export interface TacticalDialogueResponse {
  spokenText: string;
  technicalDetails?: string;
  assignedAgentId: string;
  requiresConfirmation: boolean;
}

export class ConversationOS {
  private static currentState: ConversationState = 'IDLE';
  private static history: Utterance[] = [];
  private static activePlaybackAbortController: AbortController | null = null;

  public static getState(): ConversationState {
    return this.currentState;
  }

  public static startListening(): void {
    if (this.currentState === 'SPEAKING') {
      this.triggerBargeIn();
    }
    this.currentState = 'LISTENING';
  }

  public static triggerBargeIn(): boolean {
    if (this.currentState === 'SPEAKING' && this.activePlaybackAbortController) {
      this.activePlaybackAbortController.abort();
      this.activePlaybackAbortController = null;
      this.currentState = 'BARGE_IN_INTERRUPTED';

      // Mark latest jarvis utterance as interrupted
      const last = this.history[this.history.length - 1];
      if (last && last.sender === 'jarvis') {
        last.interrupted = true;
      }
      return true;
    }
    return false;
  }

  public static processUserSpeech(transcript: string): TacticalDialogueResponse {
    this.currentState = 'THINKING';

    const cleanInput = transcript.trim();
    const utterance: Utterance = {
      id: `utt_${Date.now()}_u`,
      sender: 'user',
      text: cleanInput,
      timestamp: new Date().toISOString(),
    };
    this.history.push(utterance);

    // Fast tactical routing to specialists
    let assignedAgent = 'jarvis';
    const lower = cleanInput.toLowerCase();

    if (lower.includes('code') || lower.includes('bug') || lower.includes('function') || lower.includes('refactor')) {
      assignedAgent = 'software_engineer'; // F.R.I.D.A.Y.
    } else if (lower.includes('architecture') || lower.includes('design') || lower.includes('system')) {
      assignedAgent = 'architect'; // D.A.E.D.A.L.U.S.
    } else if (lower.includes('test') || lower.includes('verify') || lower.includes('regression')) {
      assignedAgent = 'qa_engineer'; // S.E.N.T.I.N.E.L.
    } else if (lower.includes('security') || lower.includes('scan') || lower.includes('vulnerability')) {
      assignedAgent = 'security_agent'; // C.E.R.B.E.R.U.S.
    } else if (lower.includes('database') || lower.includes('schema') || lower.includes('migrate')) {
      assignedAgent = 'database_engineer'; // O.R.A.C.L.E.
    } else if (lower.includes('deploy') || lower.includes('docker') || lower.includes('infra')) {
      assignedAgent = 'devops_engineer'; // A.T.L.A.S.
    }

    // Compose tactical response in Jarvis voice
    const spoken = this.generateTacticalVoiceReply(cleanInput, assignedAgent);

    const jarvisUtterance: Utterance = {
      id: `utt_${Date.now()}_j`,
      sender: 'jarvis',
      text: spoken,
      timestamp: new Date().toISOString(),
      assignedAgent,
    };
    this.history.push(jarvisUtterance);

    return {
      spokenText: spoken,
      technicalDetails: `Routed to agent: ${assignedAgent}`,
      assignedAgentId: assignedAgent,
      requiresConfirmation: lower.includes('delete') || lower.includes('drop') || lower.includes('deploy prod'),
    };
  }

  public static beginSpeechPlayback(): AbortSignal {
    this.currentState = 'SPEAKING';
    this.activePlaybackAbortController = new AbortController();
    return this.activePlaybackAbortController.signal;
  }

  public static finishSpeechPlayback(): void {
    if (this.currentState === 'SPEAKING') {
      this.currentState = 'IDLE';
      this.activePlaybackAbortController = null;
    }
  }

  private static generateTacticalVoiceReply(query: string, agentId: string): string {
    if (agentId === 'software_engineer') {
      return `Understood, Master Sri. Routing this directly to F.R.I.D.A.Y. for code execution and testing.`;
    }
    if (agentId === 'architect') {
      return `Analyzing system topology now. D.A.E.D.A.L.U.S. is mapping the architecture.`;
    }
    if (agentId === 'qa_engineer') {
      return `Initiating full test suite verification under S.E.N.T.I.N.E.L.`;
    }
    if (agentId === 'security_agent') {
      return `Engaging C.E.R.B.E.R.U.S. security shield to audit boundaries.`;
    }
    return `At your command, Sir. Initializing mission parameters now.`;
  }

  public static getHistory(): Utterance[] {
    return [...this.history];
  }

  public static reset(): void {
    this.currentState = 'IDLE';
    this.history = [];
    if (this.activePlaybackAbortController) {
      this.activePlaybackAbortController.abort();
      this.activePlaybackAbortController = null;
    }
  }
}
