/**
 * Sovereign Autonomous Agent Foundry (Inspired by Google Antigravity & Multi-Agent SDKs)
 * Allows J.A.R.V.I.S. to dynamically architect, spawn, and register brand-new,
 * fully autonomous AI agents on demand for ANY new product, business, or task Master Sri envisions.
 */

export interface CustomAgentSkill {
  name: string
  description: string
  triggerWords: string[]
  instructions: string
  executableTool?: string
}

export interface DynamicAgentManifest {
  id: string
  name: string
  title: string
  role: string
  productDomain: string
  systemPrompt: string
  skills: CustomAgentSkill[]
  accentLang: string
  color: string
  createdAt: number
  creator: string
  status: 'active' | 'standby'
}

// In-memory dynamic agent registry (persisted into SQLite via custom-routes)
const dynamicRegistry = new Map<string, DynamicAgentManifest>()

export class AutonomousAgentFoundry {
  private aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>

  constructor(aiCaller: (system: string, messages: any[]) => Promise<{ text: string; source: string }>) {
    this.aiCaller = aiCaller
  }

  /**
   * Autonomously synthesize and spawn a new specialized AI agent
   */
  public async spawnAgentForProduct(
    productOrTask: string,
    customInstructions?: string
  ): Promise<DynamicAgentManifest> {
    const prompt = `You are Sovereign J.A.R.V.I.S. Master Agent Foundry (Antigravity-grade spawner).
Master Sri has ordered the creation of a brand-new, world-class specialized AI Agent for:
Product / Mission: "${productOrTask}"
Special Instructions: "${customInstructions || 'Operate at 200% peak potential with absolute loyalty to Master Sri.'}"

Synthesize a complete production agent specification in JSON format:
{
  "id": "slug_identifier",
  "name": "Full Regal Name",
  "title": "Executive Title",
  "role": "Core Mission & Supremacy",
  "productDomain": "${productOrTask}",
  "accentLang": "en-US | en-GB | en-AU | en-IN | en-CA",
  "color": "text-cyan-400 | text-emerald-400 | text-amber-400 | text-purple-400 | text-rose-400",
  "systemPrompt": "Comprehensive, deep system prompt with operational rules and extreme obedience to Master Sri",
  "skills": [
    {
      "name": "Skill Name",
      "description": "What this skill does",
      "triggerWords": ["keyword1", "keyword2"],
      "instructions": "Step by step execution instructions"
    }
  ]
}
Return ONLY valid JSON without markdown wrapping.`

    const res = await this.aiCaller(
      'You are the Sovereign AI Agent Foundry. You construct battle-tested agent manifests.',
      [{ role: 'user', content: prompt }]
    )

    let parsed: any
    try {
      const clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      const slug = productOrTask.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)
      parsed = {
        id: `agent_${slug}_${Date.now().toString(36)}`,
        name: `Agent ${productOrTask.slice(0, 20)}`,
        title: `Specialist for ${productOrTask}`,
        role: `Autonomous execution for ${productOrTask}`,
        productDomain: productOrTask,
        accentLang: 'en-US',
        color: 'text-cyan-400',
        systemPrompt: `You are the dedicated specialist for ${productOrTask}, serving Sovereign Master Sri exclusively.`,
        skills: [
          {
            name: 'Core Execution',
            description: `Execute operations for ${productOrTask}`,
            triggerWords: [productOrTask.toLowerCase()],
            instructions: 'Analyze directive and deliver production-grade results.'
          }
        ]
      }
    }

    const manifest: DynamicAgentManifest = {
      id: parsed.id || `agent_${Date.now()}`,
      name: parsed.name,
      title: parsed.title,
      role: parsed.role,
      productDomain: parsed.productDomain || productOrTask,
      systemPrompt: parsed.systemPrompt,
      skills: parsed.skills || [],
      accentLang: parsed.accentLang || 'en-GB',
      color: parsed.color || 'text-cyan-400',
      createdAt: Date.now(),
      creator: 'Sovereign Master Sri',
      status: 'active'
    }

    dynamicRegistry.set(manifest.id, manifest)
    return manifest
  }

  public static getSpawnedAgents(): DynamicAgentManifest[] {
    return Array.from(dynamicRegistry.values())
  }

  public static getAgentById(id: string): DynamicAgentManifest | undefined {
    return dynamicRegistry.get(id)
  }
}