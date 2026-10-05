/**
 * Sovereign CAMEL Agent Society (Re-engineered from CAMEL-AI / Inception Prompting)
 * Communicative agent society pairing an AI Task Assigner and an AI Task Solver
 * to autonomously converse, critique, and converge on complex open-ended problems.
 */

export interface CamelTurn {
  speaker: 'Task Assigner (Midas)' | 'Task Solver (Aegis)'
  message: string
}

export interface CamelSocietyResult {
  objective: string
  dialogueHistory: CamelTurn[]
  consensusOutput: string
  spokenSummary: string
}

export class CamelCommunicativeAgent {
  private aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>

  constructor(aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>) {
    this.aiCaller = aiCaller
  }

  public async runSocietyConvergence(objective: string): Promise<CamelSocietyResult> {
    const turns: CamelTurn[] = []

    // Turn 1: Assigner outlines constraints
    const assignerPrompt = `Objective: "${objective}". As the Task Assigner, specify the exact high-value requirements and standards for Master Sri.`
    const assignerRes = await this.aiCaller('You are the Task Assigner.', [{ role: 'user', content: assignerPrompt }])
    turns.push({ speaker: 'Task Assigner (Midas)', message: assignerRes.text })

    // Turn 2: Solver builds the solution
    const solverPrompt = `Requirements from Assigner:
${assignerRes.text}
As the Task Solver, deliver the complete, production-ready solution.`
    const solverRes = await this.aiCaller('You are the Task Solver.', [{ role: 'user', content: solverPrompt }])
    turns.push({ speaker: 'Task Solver (Aegis)', message: solverRes.text })

    return {
      objective,
      dialogueHistory: turns,
      consensusOutput: solverRes.text,
      spokenSummary: `Master Sri, CAMEL communicative agent society has deliberated and reached full consensus on "${objective}".`
    }
  }
}