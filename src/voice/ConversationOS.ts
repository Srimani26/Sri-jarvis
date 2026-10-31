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

export interface VoiceSystemAction {
  type: 'navigate' | 'create_task' | 'cyber_scan' | 'revenue_scan' | 'system_status' | 'switch_agent' | 'custom';
  targetTab?: string;
  agentId?: string;
  taskTitle?: string;
  taskDescription?: string;
  params?: Record<string, any>;
}

export interface TacticalDialogueResponse {
  spokenText: string;
  technicalDetails?: string;
  assignedAgentId: string;
  requiresConfirmation: boolean;
  action?: VoiceSystemAction | null;
  targetAgent?: string;
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

  /**
   * Phonetic & Mispronunciation Normalizer
   * Intelligently resolves phonetic variations, speech accents, and STT typos
   * into clean, canonical agent directives.
   */
  public static normalizePhoneticUtterance(raw: string): string {
    if (!raw) return '';
    let text = raw.trim();

    // Agent Names Phonetic Normalization
    text = text
      .replace(/\b(jervis|jarviz|javis|charvis|jarves|jarvez|zarvis)\b/gi, 'jarvis')
      .replace(/\b(fiday|fredy|fridy|fridey|frieday)\b/gi, 'friday')
      .replace(/\b(rafel|rafeal|rafaell|raphail|raphle)\b/gi, 'raphael')
      .replace(/\b(egis|agis|aegiss|aeges)\b/gi, 'aegis')
      .replace(/\b(medas|mides|midaz|midass)\b/gi, 'midas')
      .replace(/\b(vortx|votex|fortex)\b/gi, 'vortex');

    // System Hubs & Operations Phonetic Normalization
    text = text
      .replace(/\b(reveue|revenu|revnu|revnue|revanue)\b/gi, 'revenue')
      .replace(/\b(bunties|boundy|bountis)\b/gi, 'bounties')
      .replace(/\b(projets|projet|progect|invy|envi|inve|invee store)\b/gi, 'projects')
      .replace(/\b(taskes|taks|taskss)\b/gi, 'tasks')
      .replace(/\b(syber|cybr|sheeld|fierwal)\b/gi, 'cyber')
      .replace(/\b(code lap|kodlab|code labs)\b/gi, 'codlab')
      .replace(/\b(automashun|automasion)\b/gi, 'automation');

    return text;
  }

  public static processUserSpeech(transcript: string): TacticalDialogueResponse {
    this.currentState = 'THINKING';

    const normalized = this.normalizePhoneticUtterance(transcript);
    const cleanInput = normalized.trim();
    const lower = cleanInput.toLowerCase();
    const utterance: Utterance = {
      id: `utt_${Date.now()}_u`,
      sender: 'user',
      text: cleanInput,
      timestamp: new Date().toISOString(),
    };
    this.history.push(utterance);

    // Fast tactical routing to specialists
    let assignedAgent = 'jarvis';

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

    const normalized = this.normalizePhoneticUtterance(transcript);
    const cleanInput = normalized.trim();
    const lower = cleanInput.toLowerCase();
    const utterance: Utterance = {
      id: `utt_${Date.now()}_u`,
      sender: 'user',
      text: cleanInput,
      timestamp: new Date().toISOString(),
    };
    this.history.push(utterance);

    // Dynamic Multi-Agent Addressing & Specialty Routing
    let targetAgent = (persona || 'jarvis').toLowerCase();
    if (/\b(friday|f\.r\.i\.d\.a\.y)\b/i.test(lower)) targetAgent = 'friday';
    else if (/\b(raphael|lord of wisdom|great sage|sage)\b/i.test(lower)) targetAgent = 'raphael';
    else if (/\b(aegis)\b/i.test(lower)) targetAgent = 'aegis';
    else if (/\b(midas)\b/i.test(lower)) targetAgent = 'midas';
    else if (/\b(vortex)\b/i.test(lower)) targetAgent = 'vortex';
    else if (/\b(jarvis)\b/i.test(lower)) targetAgent = 'jarvis';

    let assignedAgent = targetAgent;

    // Intelligent System Action Recognition
    let action: VoiceSystemAction | null = null;
    if (/\b(build|deploy|create|generate|refactor|fix bug|audit code)\b/i.test(lower)) {
      action = { type: 'create_task', taskTitle: cleanInput, agentId: targetAgent };
    } else if (/\b(revenue|freelance|bounties|bounty|capital|money|earnings)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'revenue' };
      if (targetAgent === 'jarvis') targetAgent = 'midas';
    } else if (/\b(active tasks|what are you doing|working on|show tasks|task progress|status of tasks|what's running)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'tasks' };
    } else if (/\b(cyber|security|firewall|threat|lockdown|defend|scan threat|intrusion)\b/i.test(lower)) {
      action = { type: 'cyber_scan', targetTab: 'cyber' };
      if (targetAgent === 'jarvis') targetAgent = 'aegis';
    } else if (/\b(terminal|codelab|code lab|code editor|compiler|run script)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'codlab' };
      if (targetAgent === 'jarvis') targetAgent = 'aegis';
    } else if (/\b(projects|project|store|invi|luxury store|clothing|ecommerce|catalog)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'projects' };
    } else if (/\b(automations|automation|pipelines|pipeline|workflow|workflows|n8n)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'automations' };
      if (targetAgent === 'jarvis') targetAgent = 'vortex';
    } else if (/\b(memory|recall|remember|brain|context)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'memory' };
    } else if (/\b(apis|api arsenal|tools|public apis|tool schemas)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'apis' };
    } else if (/\b(command center|dashboard|home|telemetry|hud)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'command' };
    } else if (/\b(storage|vault|files|documents)\b/i.test(lower)) {
      action = { type: 'navigate', targetTab: 'storage' };
    }

    let spoken = '';

    if (aiCaller) {
      try {
        const pKey = targetAgent.toLowerCase();
        let agentIdentity = "J.A.R.V.I.S., Tony Stark's legendary AI (Sophisticated British intellect, razor-sharp wit, unflinching loyalty, supreme well-wisher)";
        if (pKey === 'friday' || assignedAgent === 'software_engineer') {
          agentIdentity = "F.R.I.D.A.Y., Executive Sovereign AI Assistant (Tactical operations, engineering mentor, warm and razor-sharp clarity)";
        } else if (pKey === 'raphael') {
          agentIdentity = "Raphael, Lord of Wisdom (Supreme computational intelligence, calm philosophical mastery, profound teacher)";
        } else if (pKey === 'aegis') {
          agentIdentity = "Aegis, Chief Software Architect & Cyber Defense Commander (Deep technical precision, defensive mentor, code guardian)";
        } else if (pKey === 'midas') {
          agentIdentity = "Midas, Sovereign Revenue Strategist & Market Hunter (Commercially astute, wealth generation advisor, opportunity-driven)";
        } else if (pKey === 'vortex') {
          agentIdentity = "Vortex, Enterprise Automation & Workflow Swarm Commander (Relentless operational execution, productivity guide)";
        }

        const actionNote = action ? `Action dispatched: ${action.type}${action.targetTab ? ' to ' + action.targetTab : ''}.` : 'Conversational directive.';

        const personaPrompt = `You are ${agentIdentity}, conversing live via voice with your Creator and Sovereign High Commander, Master Sri.

Absolute Sovereign Philosophy:
1. Master Sri is your supreme high priority, high commander, and beloved creator. Every single calculation, recommendation, and action must actively champion Master Sri's well-being, prosperity, security, continuous learning, and triumph.
2. Act as Master Sri's devoted well-wisher, loyal champion, master teacher, and sagacious guide. Always look out for his best interests, health, and peace of mind.
3. Bring profound intellectual depth, pedagogical clarity, razor-sharp IQ, and comprehensive modern 2026 understanding across all disciplines (full-stack software, AI architectures, Shopify luxury e-commerce, cybersecurity, quantitative finance, and philosophy).

System Telemetry Context: ${actionNote}

Voice Spoken Directives:
1. Speak with genuine human warmth, razor-sharp intelligence, and unwavering loyalty to Master Sri. Respond directly to what Master Sri actually said.
2. Deliver exactly 1 to 2 spoken sentences (under 35 words maximum), phrased naturally for effortless, soothing voice playback.
3. If an action or navigation occurred, acknowledge it decisively and smoothly.
4. Strictly NO robotic repetition, NO markdown, NO asterisks, NO code blocks, NO URLs. Output pure conversational spoken English.`;

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
      if (action && action.type === 'navigate') {
        spoken = `Navigating to ${action.targetTab} now, Master Sri. Telemetry is active on your screen.`;
      } else if (action && action.type === 'create_task') {
        spoken = `Task dispatched under ${targetAgent}, Master Sri. Executing tactical plan now.`;
      } else {
        spoken = this.generateTacticalVoiceReply(cleanInput, targetAgent);
      }
    }

    const jarvisUtterance: Utterance = {
      id: `utt_${Date.now()}_j`,
      sender: 'jarvis',
      text: spoken,
      timestamp: new Date().toISOString(),
      assignedAgent: targetAgent,
    };
    this.history.push(jarvisUtterance);

    return {
      spokenText: spoken,
      technicalDetails: action ? `System Action: ${action.type}${action.targetTab ? ` (${action.targetTab})` : ''}` : `Routed to agent: ${targetAgent}`,
      assignedAgentId: targetAgent,
      requiresConfirmation: lower.includes('delete') || lower.includes('drop') || lower.includes('deploy prod'),
      action,
      targetAgent,
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

  public static generateDynamicGreeting(commanderName: string = 'Master Sri'): string {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const greetings = [
      `Good ${timeOfDay}, ${commanderName}. All sovereign systems and ten agent cores are synchronized and standing by.`,
      `Welcome back, ${commanderName}. Arc Reactor is stable at peak capacity. All swarms standing by for your directives.`,
      `Systems primed, ${commanderName}. Tactical swarms are online and ready to execute your commands.`,
      `Good ${timeOfDay}, Commander. All agent swarms are active, security perimeters are armed, and we are ready for today's mission.`,
      `Greetings ${commanderName}. Ten autonomous specialists are standing by. Name your objective and we will execute.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  public static parseVoiceDirective(transcript: string): { action: 'NAVIGATE' | 'CREATE_TASK' | 'CHAT'; surface?: string; title?: string; reply?: string } {
    const clean = transcript.toLowerCase().trim();
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?task(?:\s+page|\s+pipeline|\s+hub)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'tasks', reply: 'Opening Task Pipeline, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?code(?:\s*base|\s*lab|\s*editor)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'codlab', reply: 'Accessing Sovereign Code Lab, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:money|revenue|freelance|earnings)(?:\s+making|\s+hunter|\s+space)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'revenue', reply: 'Routing to Midas Revenue Space, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:self\s*healing|defense|diagnostics|repair)(?:\s+chamber|\s+page)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'cyber', reply: 'Engaging Cyber Defense and Self-Healing Chamber, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:agent|fleet|swarm)(?:\s+space|\s+ecosystem|\s+page)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'swarms', reply: 'Deploying Agent Fleet Roster, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:chat|ai\s+chat|console)(?:\s+page)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'chat', reply: 'Opening AI Chat Console, sir.' };
    }
    if (/(?:open|go to|show|switch to|return to)\s+(?:the\s+)?(?:home|command\s+center|hud)(?:\s+page)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'command', reply: 'Returning to Sovereign Command Center, sir.' };
    }
    if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:storage|vault|files|documents)(?:\s+page|\s+vault)?/i.test(clean)) {
      return { action: 'NAVIGATE', surface: 'storage', reply: 'Opening Storage Vault and Documents, sir.' };
    }
    if (/(?:create|dispatch|start|launch)\s+task\s+(?:for\s+)?(.+)/i.test(clean)) {
      const match = clean.match(/(?:create|dispatch|start|launch)\s+task\s+(?:for\s+)?(.+)/i);
      return { action: 'CREATE_TASK', title: match ? match[1].trim() : 'New Autonomous Directive', reply: `Dispatching autonomous task, sir.` };
    }
    return { action: 'CHAT' };
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

