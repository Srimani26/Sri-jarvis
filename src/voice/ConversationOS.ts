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

  /**
   * Advanced Intelligent Conversational Voice Processing
   * Uses real LLM context and Tony Stark / Paul Bettany persona prompts to formulate
   * articulate, dynamic, witty, high-IQ spoken responses rather than static canned strings.
   */
  public static async processUserSpeechAsync(
    transcript: string,
    aiCaller?: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string }>,
    persona: string = 'jarvis'
  ): Promise<TacticalDialogueResponse> {
    this.currentState = 'THINKING';

    const cleanInput = transcript.trim();
    const utterance: Utterance = {
      id: `utt_${Date.now()}_u`,
      sender: 'user',
      text: cleanInput,
      timestamp: new Date().toISOString(),
    };
    this.history.push(utterance);

    // Fast tactical specialist routing
    let assignedAgent = 'jarvis';
    const lower = cleanInput.toLowerCase();

    if (lower.includes('code') || lower.includes('bug') || lower.includes('function') || lower.includes('refactor') || lower.includes('build') || lower.includes('software')) {
      assignedAgent = 'software_engineer'; // F.R.I.D.A.Y.
    } else if (lower.includes('architecture') || lower.includes('design') || lower.includes('system') || lower.includes('topology')) {
      assignedAgent = 'architect'; // D.A.E.D.A.L.U.S.
    } else if (lower.includes('test') || lower.includes('verify') || lower.includes('regression') || lower.includes('qa')) {
      assignedAgent = 'qa_engineer'; // S.E.N.T.I.N.E.L.
    } else if (lower.includes('security') || lower.includes('scan') || lower.includes('vulnerability') || lower.includes('auth')) {
      assignedAgent = 'security_agent'; // C.E.R.B.E.R.U.S.
    } else if (lower.includes('database') || lower.includes('schema') || lower.includes('migrate') || lower.includes('sql') || lower.includes('prisma')) {
      assignedAgent = 'database_engineer'; // O.R.A.C.L.E.
    } else if (lower.includes('deploy') || lower.includes('docker') || lower.includes('infra') || lower.includes('kubernetes')) {
      assignedAgent = 'devops_engineer'; // A.T.L.A.S.
    }

    let spoken = '';

    if (aiCaller) {
      try {
        const personaPrompt = `You are J.A.R.V.I.S., Tony Stark's legendary AI, serving Sovereign Master Sri.
Persona: Sophisticated British intellect, razor-sharp wit, unflinching loyalty, and absolute operational clarity.
Operational Context: The user's directive has been routed to specialist: ${assignedAgent}.
${assignedAgent === 'software_engineer' ? 'Explicitly reference F.R.I.D.A.Y. coordinating code synthesis and verification.' : ''}
${assignedAgent === 'architect' ? 'Explicitly reference D.A.E.D.A.L.U.S. architecting the system blueprint.' : ''}
${assignedAgent === 'qa_engineer' ? 'Explicitly reference S.E.N.T.I.N.E.L. executing test coverage.' : ''}
${assignedAgent === 'security_agent' ? 'Explicitly reference C.E.R.B.E.R.U.S. locking down threat perimeters.' : ''}
Rules for Spoken Output:
1. Provide a direct, highly intelligent, articulate spoken reply to Master Sri.
2. Deliver exactly 1 to 2 spoken sentences (under 45 words maximum).
3. NO markdown formatting, no code blocks, no asterisks, no bullet points, no URLs. Formatted strictly for natural speech synthesis.`;

        const recentMessages = this.history.slice(-6).map(u => ({
          role: u.sender === 'user' ? 'user' : 'assistant',
          content: u.text
        }));

        const aiResponse = await aiCaller(personaPrompt, recentMessages);
        if (aiResponse?.text && aiResponse.text.trim()) {
          spoken = this.sanitizeSpokenText(aiResponse.text);
        }
      } catch (err) {
        console.warn('[ConversationOS] AI voice synthesis fallback:', err);
      }
    }

    if (!spoken) {
      spoken = this.generateTacticalVoiceReply(cleanInput, assignedAgent);
    }

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

  public static sanitizeSpokenText(raw: string): string {
    return raw
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~>]/g, '')
      .replace(/https?:\/\/\S+/g, 'link provided')
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
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
    if (agentId === 'database_engineer') {
      return `Accessing O.R.A.C.L.E. data repository to verify schema integrity.`;
    }
    if (agentId === 'devops_engineer') {
      return `Deploying A.T.L.A.S. infrastructure pipeline for cloud provisioning.`;
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
