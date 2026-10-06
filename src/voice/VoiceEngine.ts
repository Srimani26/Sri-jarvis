/**
 * J.A.R.V.I.S. MARK-V Autonomous Voice Execution Engine
 * VAD turn detection, Wake-word extraction, Barge-in interruption,
 * and direct routing into the Execution Kernel and Agent Workforce.
 */

import { VoiceConfig, VoiceIntent, VoiceSessionState, VoiceTurnResult } from './types';
import { ExecutionKernel } from '../kernel/ExecutionKernel';
import { TaskStore } from '../kernel/TaskStore';
import { AgentRuntime } from '../agents/AgentRuntime';

export class VoiceEngine {
  private state: VoiceSessionState = 'IDLE';
  private config: VoiceConfig = {
    wakeWord: 'Jarvis',
    language: 'en-GB',
    bargeInEnabled: true,
    voicePersona: 'British Sophisticated Butler',
    silenceThresholdMs: 800,
  };
  private isSpeaking = false;

  public getState(): VoiceSessionState {
    return this.state;
  }

  /**
   * Voice Activity Detection (VAD) on raw PCM audio energy
   */
  public detectVoiceActivity(samples: number[], energyThreshold: number = 0.02): boolean {
    if (samples.length === 0) return false;
    const sumSquares = samples.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sumSquares / samples.length);
    return rms >= energyThreshold;
  }

  /**
   * Wake word detection ("Jarvis", "Hey Jarvis", "Ok Jarvis")
   */
  public detectWakeWord(transcript: string): boolean {
    const clean = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const wakeRegex = new RegExp(`\\b(hey\\s+|ok\\s+|hi\\s+)?${this.config.wakeWord.toLowerCase()}\\b`, 'i');
    return wakeRegex.test(clean);
  }

  /**
   * Parse speech transcript into actionable intent and route to specialist agent
   */
  public parseIntent(rawTranscript: string): VoiceIntent {
    const isWakeWordPresent = this.detectWakeWord(rawTranscript);

    // Strip wake word to extract core directive
    const stripped = rawTranscript.replace(new RegExp(`^(hey|ok|hi)?\\s*${this.config.wakeWord}[,\\s]*`, 'i'), '').trim();
    const normalized = ExecutionKernel.normalizeInput(stripped);

    // Route to appropriate specialist agent
    let assignedAgentId = 'jarvis';
    const lower = normalized.toLowerCase();

    if (/database|migration|sql|prisma|query|index/i.test(lower)) {
      assignedAgentId = 'database_engineer';
    } else if (/code|bug|function|refactor|test|compile|ts|typescript/i.test(lower)) {
      assignedAgentId = 'software_engineer';
    } else if (/architecture|blueprint|design system|domain/i.test(lower)) {
      assignedAgentId = 'architect';
    } else if (/security|threat|vulnerability|audit|token/i.test(lower)) {
      assignedAgentId = 'security_agent';
    } else if (/browse|website|click|scrape|webpage/i.test(lower)) {
      assignedAgentId = 'browser_agent';
    } else if (/research|paper|compare|find tools/i.test(lower)) {
      assignedAgentId = 'research_agent';
    } else if (/health|monitor|server status|cpu|memory/i.test(lower)) {
      assignedAgentId = 'monitor_agent';
    }

    return {
      rawTranscript,
      normalizedDirective: normalized,
      assignedAgentId,
      isWakeWordPresent,
      confidence: 0.95,
    };
  }

  /**
   * Execute voice turn through the Execution Kernel and Agent Workforce
   */
  public async handleVoiceInput(rawTranscript: string): Promise<VoiceTurnResult> {
    const startTime = Date.now();
    const intent = this.parseIntent(rawTranscript);

    // If active speech is happening, trigger barge-in interruption
    if (this.isSpeaking && this.config.bargeInEnabled) {
      this.bargeIn();
    }

    this.state = 'EXECUTING_KERNEL';

    // 1. Create real task in TaskStore
    const task = await TaskStore.createTask({
      title: `[Voice Command] ${intent.normalizedDirective.slice(0, 80)}`,
      description: `Voice directive from Master Sri: "${rawTranscript}"`,
      agentId: intent.assignedAgentId,
      totalSteps: 3,
    });

    // 2. Dispatch to Specialist Agent
    const agentResult = await AgentRuntime.executeAgentTask({
      taskId: task.id,
      agentId: intent.assignedAgentId,
      objective: intent.normalizedDirective,
    });

    // 3. Synthesize spoken response
    this.state = 'SPEAKING';
    this.isSpeaking = true;

    const spokenResponse = agentResult.success
      ? `Certainly, Master Sri. I have assigned ${intent.assignedAgentId} to ${intent.normalizedDirective}. Verification passed with zero errors.`
      : `Master Sri, I encountered an issue executing your command: ${agentResult.errors?.[0] || 'Unknown error'}.`;

    const durationMs = Date.now() - startTime;
    const turnId = `turn_${Date.now()}`;

    return {
      turnId,
      state: this.state,
      intent,
      taskId: task.id,
      spokenResponse,
      interrupted: false,
      durationMs,
    };
  }

  /**
   * Barge-in interruption: cancel active TTS playback immediately
   */
  public bargeIn(): void {
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.state = 'INTERRUPTED';
    }
  }

  public finishSpeaking(): void {
    this.isSpeaking = false;
    this.state = 'IDLE';
  }
}
