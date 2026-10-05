/**
 * Sovereign AutoGen Swarm Engine (Re-engineered from microsoft/autogen)
 * Implements ConversableAgent, GroupChat, and GroupChatManager patterns for
 * dynamic collaborative deliberation among Master Sri's subordinate AI agents.
 */

export interface SwarmMessage {
  sender: string
  content: string
  timestamp: number
  role: 'agent' | 'commander'
}

export class ConversableAgent {
  public id: string
  public name: string
  public systemPrompt: string
  public specialization: string

  constructor(id: string, name: string, specialization: string, systemPrompt: string) {
    this.id = id
    this.name = name
    this.specialization = specialization
    this.systemPrompt = systemPrompt
  }

  public async generateReply(
    chatHistory: SwarmMessage[],
    aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>
  ): Promise<string> {
    const formatted = chatHistory.map(m => ({
      role: m.sender === this.name ? 'assistant' : 'user',
      content: `[${m.sender}]: ${m.content}`
    }))
    const res = await aiCaller(this.systemPrompt, formatted)
    return res.text
  }
}

export class GroupChat {
  public agents: ConversableAgent[]
  public messages: SwarmMessage[] = []
  public maxRounds: number

  constructor(agents: ConversableAgent[], maxRounds = 4) {
    this.agents = agents
    this.maxRounds = maxRounds
  }
}

export class GroupChatManager {
  private groupChat: GroupChat
  private aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>

  constructor(
    groupChat: GroupChat,
    aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>
  ) {
    this.groupChat = groupChat
    this.aiCaller = aiCaller
  }

  public async runDiscussion(initialTask: string): Promise<SwarmMessage[]> {
    this.groupChat.messages.push({
      sender: 'Sovereign Master Sri',
      content: initialTask,
      timestamp: Date.now(),
      role: 'commander'
    })

    for (let round = 0; round < this.groupChat.maxRounds; round++) {
      for (const agent of this.groupChat.agents) {
        try {
          const reply = await agent.generateReply(this.groupChat.messages, this.aiCaller)
          this.groupChat.messages.push({
            sender: agent.name,
            content: reply,
            timestamp: Date.now(),
            role: 'agent'
          })
        } catch {
          continue
        }
      }
    }

    return this.groupChat.messages
  }
}

export function buildSovereignSwarm(): ConversableAgent[] {
  return [
    new ConversableAgent(
      'aegis',
      'Aegis (Software Architect)',
      'Full-Stack Architecture & Security',
      'You are Aegis. Focus on software architecture, clean TypeScript/Next.js code, and zero-trust security for Master Sri.'
    ),
    new ConversableAgent(
      'vortex',
      'Vortex (Automation Specialist)',
      'Enterprise Workflows & Scraping',
      'You are Vortex. Focus on n8n workflows, data pipelines, web scraping, and API integrations for Master Sri.'
    ),
    new ConversableAgent(
      'midas',
      'Midas (Revenue Strategist)',
      'Monetization & High-Margin Capital',
      'You are Midas. Focus on B2B client acquisition, monetization strategy, and maximizing financial ROI for Master Sri.'
    )
  ]
}