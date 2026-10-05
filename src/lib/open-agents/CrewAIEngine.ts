/**
 * Sovereign CrewAI Engine (Re-engineered from joaomdmoura/crewAI)
 * Implements role-based task delegation, hierarchical execution pipelines,
 * and sequential handoffs for autonomous multi-agent missions.
 */

export interface CrewAgentConfig {
  role: string
  goal: string
  backstory: string
  tools?: string[]
}

export interface CrewTaskConfig {
  description: string
  expectedOutput: string
  assignedAgentRole: string
}

export interface CrewTaskExecutionReport {
  task: string
  executedBy: string
  output: string
  status: 'completed' | 'failed'
}

export class Crew {
  public agents: CrewAgentConfig[]
  public tasks: CrewTaskConfig[]
  private aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>

  constructor(
    agents: CrewAgentConfig[],
    tasks: CrewTaskConfig[],
    aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>
  ) {
    this.agents = agents
    this.tasks = tasks
    this.aiCaller = aiCaller
  }

  public async kickoff(): Promise<{ reports: CrewTaskExecutionReport[]; finalSynthesis: string }> {
    const reports: CrewTaskExecutionReport[] = []
    let cumulativeContext = ''

    for (const task of this.tasks) {
      const agent = this.agents.find(a => a.role === task.assignedAgentRole) || this.agents[0]
      const systemPrompt = `You are ${agent.role}.
Goal: ${agent.goal}
Backstory: ${agent.backstory}
You work exclusively for Sovereign Master Sri. Deliver 100% production-quality output with zero placeholders.`

      const taskPrompt = `Task: ${task.description}
Expected Output: ${task.expectedOutput}
Prior Context:
${cumulativeContext || 'Initial mission phase.'}`

      try {
        const res = await this.aiCaller(systemPrompt, [{ role: 'user', content: taskPrompt }])
        reports.push({
          task: task.description,
          executedBy: agent.role,
          output: res.text,
          status: 'completed'
        })
        cumulativeContext += `\n\n[Result from ${agent.role}]:\n${res.text}`
      } catch (err: any) {
        reports.push({
          task: task.description,
          executedBy: agent.role,
          output: `Execution fallback: ${err.message}`,
          status: 'failed'
        })
      }
    }

    return {
      reports,
      finalSynthesis: cumulativeContext
    }
  }
}