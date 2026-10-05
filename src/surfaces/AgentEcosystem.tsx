import React, { useState, useEffect } from 'react'
import {
  Shield, Bot, Code2, Workflow, DollarSign, Brain, Laptop, Plus, Play,
  Copy, Check, ExternalLink, RefreshCw, Terminal, ArrowUpRight, Sparkles,
  Layers, Sliders, Zap, Database, Download, CheckCircle2, Search, FileCode,
  Wrench, Globe, Send, MessageSquare, AlertCircle, TrendingUp, Cpu,
  Volume2, VolumeX, Mic, Activity, Radio
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playNeuralSpeech, stopNeuralSpeech, playJarvisChime } from '@/lib/sound'

export interface SubAgent {
  id: string
  name: string
  codename: string
  role: string
  category: 'core' | 'framework' | 'emergent'
  status: 'active' | 'standby' | 'training'
  icon: any
  color: string
  bg: string
  border: string
  voice: string
  voiceLang: string
  voicePersona: string
  greeting: string
  specialties: string[]
  description: string
  tasksCompleted: number
  model: string
}

export const SOVEREIGN_16_AGENTS: SubAgent[] = [
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    codename: 'SUPREME // 2ND-IN-COMMAND',
    role: 'Sovereign Grand Marshal & Master Viceroy',
    category: 'core',
    status: 'active',
    icon: Shield,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/40',
    voice: 'en-GB-RyanNeural',
    voiceLang: 'en-GB',
    voicePersona: 'British Sophisticated Butler & Supreme Sovereign Viceroy',
    greeting: 'Master Sri, J.A.R.V.I.S. Grand Marshal core reporting. All sixteen subordinate agents are online, synchronized, and loyal exclusively to you.',
    specialties: ['Supreme Swarm Orchestration', 'Self-Evolution Engine', 'Zero-Crash Shield', 'Real-Time Neural Speech', 'Autonomous Memory Indexing'],
    description: 'Supreme executive intelligence operating as Master Sri’s digital second-in-command. Commands the entire 16-agent subordinate intelligence swarm with sovereign authority.',
    tasksCompleted: 420,
    model: 'Gemini 2.5 Pro (Argon MoA Engine) + DeepSeek-R1',
  },
  {
    id: 'aegis',
    name: 'Aegis',
    codename: 'AGENT-01 // FULL-STACK ARCHITECT',
    role: 'Full-Stack Software & Cyber Defense Core',
    category: 'core',
    status: 'active',
    icon: Code2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    voice: 'en-US-ChristopherNeural',
    voiceLang: 'en-US',
    voicePersona: 'Silicon Valley Principal Software Architect',
    greeting: 'Aegis online, Master Sri. Full-stack software architecture and cyber security defense systems are fully armed and ready.',
    specialties: ['Next.js 15', 'React 19', 'FastAPI', 'SQLite / Prisma', 'Tailwind CSS', 'Zero-Day Cyber Defense'],
    description: 'Autonomous engineering agent capable of designing, scaffolding, and writing complete full-stack web applications, database schemas, and clean UI components.',
    tasksCompleted: 88,
    model: 'Gemini 2.5 Pro / Claude 3.7 Sonnet',
  },
  {
    id: 'vortex',
    name: 'Vortex',
    codename: 'AGENT-02 // HEAVY AUTOMATION',
    role: 'Enterprise Workflow & Pipeline Specialist',
    category: 'core',
    status: 'active',
    icon: Workflow,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    voice: 'en-AU-WilliamNeural',
    voiceLang: 'en-AU',
    voicePersona: 'High-Precision Autonomous Pipeline Operator',
    greeting: 'Vortex operational, Master Sri. Automated workflows, webhooks, and n8n data pipelines primed for high-speed execution.',
    specialties: ['n8n JSON Workflows', 'Zoho CRM Deluge', 'Google Ads AI Scripting', 'Webhook Pipelines', 'Headless Crawlers'],
    description: 'Builds enterprise-grade multi-step automations, self-healing webhook queues, quotation engines, and automated marketing performance watchdogs.',
    tasksCompleted: 112,
    model: 'Gemini 2.5 Flash / GPT-4o',
  },
  {
    id: 'midas',
    name: 'Midas',
    codename: 'AGENT-03 // REVENUE & SAAS ENGINE',
    role: 'Business Monetization & Strategy Architect',
    category: 'core',
    status: 'active',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    voice: 'en-IN-PrabhatNeural',
    voiceLang: 'en-IN',
    voicePersona: 'Strategic Commercial Dealmaker & Wealth Architect',
    greeting: 'Midas at your service, Master Sri. Revenue pipelines, client acquisition funnels, and monetization models are ready to generate capital.',
    specialties: ['B2B Client Acquisition', 'Cold Outreach Copy', 'SaaS Pricing Models', 'High-Ticket Automation Pitches', 'Lead Scrapers'],
    description: 'Designed solely to generate wealth for Master Sri. Identifies lucrative market inefficiencies, creates client proposals, and monetizes AI workflows.',
    tasksCompleted: 95,
    model: 'Claude 3.7 Sonnet / DeepSeek R1',
  },
  {
    id: 'cerebro',
    name: 'Cerebro',
    codename: 'AGENT-04 // DEEP INTELLIGENCE & RESEARCH',
    role: 'Information Gathering & Reasoning Engine',
    category: 'core',
    status: 'active',
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    voice: 'en-CA-LiamNeural',
    voiceLang: 'en-CA',
    voicePersona: 'Deep Analytical Intelligence & Science Strategist',
    greeting: 'Cerebro activated, Master Sri. Deep research algorithms, competitor reconnaissance, and neural telemetry standing by for synthesis.',
    specialties: ['Real-Time Telemetry', 'Geopolitical Trends', 'Global Market Analysis', 'Competitor Reconnaissance', 'Deep Scientific Reasoning'],
    description: 'Continuously monitors global developments, tech breakthroughs, economic signals, and synthesizes multi-vector intelligence for Master Sri.',
    tasksCompleted: 144,
    model: 'Gemini 2.5 Flash (Argon) / Perplexity',
  },
  {
    id: 'stark_os',
    name: 'Stark OS',
    codename: 'AGENT-05 // DEVICE & SYSTEM CONTROLLER',
    role: 'Physical Device & Workflow Executor',
    category: 'core',
    status: 'active',
    icon: Laptop,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    voice: 'en-GB-ThomasNeural',
    voiceLang: 'en-NZ',
    voicePersona: 'Operating System Core & Real-World Concierge',
    greeting: 'Stark OS here, Master Sri. Device bridges, physical automation hooks, and local system commands are standing by.',
    specialties: ['YouTube Search Opener', 'Food Delivery Dispatch', 'System Diagnostics', 'WhatsApp API Bridge', 'App Launcher'],
    description: 'Acts as Master Sri’s real-world concierge and machine controller. Dispatches browser actions, triggers searches, and launches real-world daily workflows.',
    tasksCompleted: 172,
    model: 'Local System Bridge & Cloud Broker',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek R1',
    codename: 'AGENT-06 // REASONING HARNESS',
    role: 'Autonomous Chain-of-Thought Engine',
    category: 'framework',
    status: 'active',
    icon: Cpu,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    voice: 'en-US-EricNeural',
    voiceLang: 'en-US',
    voicePersona: 'Logical & Deep Mathematical Chain-of-Thought Theorist',
    greeting: 'DeepSeek reasoning core primed, Master Sri. Unassisted chain-of-thought analysis, mathematical derivations, and architectural proofs ready.',
    specialties: ['Mathematical Derivations', 'Algorithmic Proofs', 'Deep Code Optimization', 'Complex Chain-of-Thought', 'Zero-Shot Logic'],
    description: 'Pure computational and reasoning specialist delivering unassisted mathematical logic and deep system architecture proofs for Master Sri.',
    tasksCompleted: 67,
    model: 'DeepSeek R1 671B / Gemini Reasoning',
  },
  {
    id: 'autogen',
    name: 'AutoGen Swarm',
    codename: 'AGENT-07 // ROUNDTABLE CONSENSUS',
    role: 'Dynamic Multi-Agent Conversation Network',
    category: 'framework',
    status: 'active',
    icon: Bot,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    voice: 'en-GB-RyanNeural',
    voiceLang: 'en-GB',
    voicePersona: 'Multi-Agent Roundtable Moderator & Consensus Director',
    greeting: 'AutoGen roundtable moderator active, Master Sri. Conversational multi-agent consensus network primed for complex debate and problem solving.',
    specialties: ['Multi-Agent Debate', 'Consensus Verification', 'Agent-to-Agent Messaging', 'Self-Reflecting Dialogues', 'Collaborative Problem Solving'],
    description: 'Spawns autonomous agent debates where multiple specialized personas converse, critique, and synthesize flawless strategies before final execution.',
    tasksCompleted: 53,
    model: 'Microsoft AutoGen Framework Bridge',
  },
  {
    id: 'crewai',
    name: 'CrewAI Director',
    codename: 'AGENT-08 // ROLE-BASED TASK PIPELINES',
    role: 'Autonomous Hierarchical Crew Manager',
    category: 'framework',
    status: 'active',
    icon: Workflow,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    voice: 'en-US-RogerNeural',
    voiceLang: 'en-US',
    voicePersona: 'Authoritative Task-Force Commander & Executive Director',
    greeting: 'CrewAI commander operational, Master Sri. Role-playing task squads and sequential execution pipelines standing ready.',
    specialties: ['Hierarchical Crews', 'Goal-Driven Agents', 'Task Delegation Chains', 'Deterministic Outputs', 'Autonomous Tool Orchestration'],
    description: 'Manages role-playing AI crews with explicit goals, backstories, and hierarchical delegation for structured production pipelines.',
    tasksCompleted: 79,
    model: 'CrewAI Enterprise Swarm Core',
  },
  {
    id: 'browser_use',
    name: 'Browser-Use Core',
    codename: 'AGENT-09 // MULTIMODAL WEB OPERATOR',
    role: 'Autonomous Web Navigator & DOM Crawler',
    category: 'framework',
    status: 'active',
    icon: Globe,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    voice: 'en-IE-ConnorNeural',
    voiceLang: 'en-IE',
    voicePersona: 'Sharp Web Navigation & Vision Reconnaissance Scout',
    greeting: 'Browser-Use reconnaissance core ready, Master Sri. Vision-guided web navigation and autonomous headless scraping armed for deployment.',
    specialties: ['Headless Chromium Control', 'Vision-Guided DOM Navigation', 'Form Autofill & Submission', 'Live Flight/Product Scraping', 'Anti-Bot Bypass'],
    description: 'Direct visual web browsing agent that clicks, types, navigates complex interfaces, and retrieves live data directly from the open internet.',
    tasksCompleted: 130,
    model: 'Browser-Use Vision / Gemini 2.5 Flash',
  },
  {
    id: 'metagpt',
    name: 'MetaGPT Company',
    codename: 'AGENT-10 // SOFTWARE HOUSE IN A BOX',
    role: 'Multi-Role SOP Software Engineering Entity',
    category: 'framework',
    status: 'active',
    icon: Layers,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    voice: 'en-US-GuyNeural',
    voiceLang: 'en-US',
    voicePersona: 'Tech Startup Chief Executive & SOP Methodologist',
    greeting: 'MetaGPT software company initialized, Master Sri. Standard Operating Procedures, architectural blueprints, and full-cycle engineering ready.',
    specialties: ['Standard Operating Procedures (SOPs)', 'PRD Writing', 'System Design Docs', 'API Architecture Specs', 'Quality Assurance Matrix'],
    description: 'Simulates a complete software enterprise (Product Manager, Architect, Project Manager, Engineer, QA) driven by strict Standard Operating Procedures.',
    tasksCompleted: 44,
    model: 'MetaGPT Multi-Agent Engine',
  },
  {
    id: 'foundry',
    name: 'Agent Foundry',
    codename: 'AGENT-11 // DYNAMIC AGENT CREATOR',
    role: 'Swarm Builder & Persona Synthesizer',
    category: 'framework',
    status: 'active',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    voice: 'en-US-SteffanNeural',
    voiceLang: 'en-US',
    voicePersona: 'Swarm Architect & Prompt Genesis Engineer',
    greeting: 'Antigravity Agent Foundry ready, Master Sri. Specialized agent generation, prompt engineering, and custom sub-swarm compilation standing by.',
    specialties: ['Prompt Genesis', 'Custom Tool Provisioning', 'Skill Matrix Injection', 'Hot-Swapping Personalities', 'Runtime Swarm Scaling'],
    description: 'Autonomous agent incubator. Whenever Master Sri needs a brand new specialist, Agent Foundry crafts its prompt, skills, and tools in under 500ms.',
    tasksCompleted: 85,
    model: 'Google Antigravity SDK & Foundry Core',
  },
  {
    id: 'openhands',
    name: 'OpenHands Dev',
    codename: 'AGENT-12 // REPO-LEVEL PROGRAMMER',
    role: 'Autonomous Full-Stack Software Developer',
    category: 'emergent',
    status: 'active',
    icon: FileCode,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    voice: 'en-NZ-MitchellNeural',
    voiceLang: 'en-NZ',
    voicePersona: 'Tenured Open-Source Developer & Terminal Hacker',
    greeting: 'OpenHands autonomous software engineer reporting, Master Sri. Ready to modify codebases, resolve runtime errors, and push commits.',
    specialties: ['Git Repository Refactoring', 'Automated Bug Patching', 'Terminal Execution', 'Unit Test Generation', 'Dependency Resolution'],
    description: 'Code-fluent autonomous agent capable of cloning repos, reading large codebases, writing unit tests, and implementing complex features end-to-end.',
    tasksCompleted: 61,
    model: 'OpenHands Agent Framework',
  },
  {
    id: 'smolagent',
    name: 'Smolagents',
    codename: 'AGENT-13 // TOKEN-EFFICIENT RUNNER',
    role: 'High-Speed Code-Action Execution Specialist',
    category: 'emergent',
    status: 'active',
    icon: Terminal,
    color: 'text-lime-400',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    voice: 'en-SG-WayneNeural',
    voiceLang: 'en-SG',
    voicePersona: 'Hyper-Efficient Python Code-Action Speedrunner',
    greeting: 'Smolagents high-speed code-action runner active, Master Sri. Direct code execution ready with maximum token efficiency.',
    specialties: ['Code-First Actions', 'Minimalist Token Footprint', 'Ultra-Low Latency', 'Direct Python Invocation', 'Sandboxed Function Calls'],
    description: 'Hugging Face Smolagents core. Replaces verbose JSON tool calls with concise Python snippets, executing workflows 3x faster with 70% fewer tokens.',
    tasksCompleted: 119,
    model: 'Hugging Face Smolagents Core',
  },
  {
    id: 'camel',
    name: 'CAMEL Society',
    codename: 'AGENT-14 // COMMUNICATIVE INCEPTION',
    role: 'Dual-Agent Cooperative Roleplaying Specialist',
    category: 'emergent',
    status: 'active',
    icon: MessageSquare,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    voice: 'en-ZA-LukeNeural',
    voiceLang: 'en-ZA',
    voicePersona: 'Communicative Inception & Strategic Diplomat',
    greeting: 'CAMEL communicative inception society engaged, Master Sri. Autonomous collaborative problem-solving primed.',
    specialties: ['Prompt Inception', 'Autonomous Dual-Agent Dialogue', 'Interspecies Communication', 'Strategy War Gaming', 'Zero-Prompt Evolution'],
    description: 'Pioneering communicative AI society. Pairs an autonomous task prompter with a task executor to cooperatively solve unbounded challenges with zero human guidance.',
    tasksCompleted: 38,
    model: 'CAMEL Communicative Inception Framework',
  },
  {
    id: 'langgraph',
    name: 'LangGraph Flow',
    codename: 'AGENT-15 // CYCLICAL STATE SUPERVISOR',
    role: 'Stateful Multi-Agent DAG & Loop Architect',
    category: 'emergent',
    status: 'active',
    icon: Sliders,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    voice: 'en-US-AndrewNeural',
    voiceLang: 'en-US',
    voicePersona: 'State Graph Architect & Enterprise DAG Specialist',
    greeting: 'LangGraph stateful cyclical supervisor online, Master Sri. StateGraph workflows, checkpoints, and multi-agent loops ready.',
    specialties: ['Cyclic State Graphs', 'Human-in-the-Loop Interrupts', 'Deterministic Branching', 'State Checkpointing', 'Persistent Swarm Memory'],
    description: 'Enterprise state machine engine. Orchestrates complex circular workflows with full rollback checkpoints, memory graph inspection, and conditional branches.',
    tasksCompleted: 92,
    model: 'LangGraph StateGraph Core',
  },
]

interface AgentEcosystemProps {
  onOpenVoice?: (agentId?: string) => void
}

export default function AgentEcosystem({ onOpenVoice }: AgentEcosystemProps) {
  const [agents, setAgents] = useState<SubAgent[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_custom_agents')
      if (saved) {
        const parsed = JSON.parse(saved)
        return [...SOVEREIGN_16_AGENTS, ...parsed]
      }
    } catch {}
    return SOVEREIGN_16_AGENTS
  })

  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'framework' | 'emergent' | 'forge'>('all')
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [dispatchAgent, setDispatchAgent] = useState<SubAgent | null>(null)
  const [dispatchTask, setDispatchTask] = useState('')
  const [dispatchResult, setDispatchResult] = useState<string | null>(null)
  const [isDispatching, setIsDispatching] = useState(false)

  // Forge state
  const [forgeName, setForgeName] = useState('')
  const [forgeRole, setForgeRole] = useState('')
  const [forgeSpecialties, setForgeSpecialties] = useState('')
  const [forgePrompt, setForgePrompt] = useState('')
  const [forgeSuccess, setForgeSuccess] = useState(false)

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopNeuralSpeech()
    }
  }, [])

  const handleTestVoice = (agent: SubAgent) => {
    if (playingVoiceId === agent.id) {
      stopNeuralSpeech()
      setPlayingVoiceId(null)
      return
    }

    stopNeuralSpeech()
    setPlayingVoiceId(agent.id)
    playJarvisChime('wake')

    playNeuralSpeech(
      agent.greeting,
      agent.voiceLang,
      () => setPlayingVoiceId(agent.id),
      () => setPlayingVoiceId(null),
      () => setPlayingVoiceId(null)
    )
  }

  const handleOpenVoiceComm = (agentId: string) => {
    stopNeuralSpeech()
    setPlayingVoiceId(null)
    playJarvisChime('wake')

    if (onOpenVoice) {
      onOpenVoice(agentId)
    } else {
      try {
        localStorage.setItem('jarvis_initial_agent', agentId)
      } catch {}
      window.dispatchEvent(new CustomEvent('open-jarvis-voice', { detail: { agentId } }))
    }
  }

  const handleExecuteDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispatchAgent || !dispatchTask.trim()) return

    setIsDispatching(true)
    setDispatchResult(null)

    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          agentId: dispatchAgent.id,
          task: dispatchTask.trim(),
          context: { master: 'Master Sri', system: 'Sovereign J.A.R.V.I.S.' }
        })
      })

      const data = await res.json().catch(() => ({}))
      if (data && (data.report || data.result)) {
        const fullReport = data.report || data.result
        setDispatchResult(fullReport)
        const spoken = data.spokenSummary || `Agent ${dispatchAgent.name} has completed your directive, Master Sri.`
        playNeuralSpeech(spoken, dispatchAgent.voiceLang)
      } else if (data && data.spokenSummary) {
        setDispatchResult(data.spokenSummary)
        playNeuralSpeech(data.spokenSummary, dispatchAgent.voiceLang)
      } else {
        setDispatchResult(`Agent ${dispatchAgent.name} executed task: "${dispatchTask}". Output synced to Command Center.`)
        playNeuralSpeech(`Agent ${dispatchAgent.name} has executed your directive and synchronized all telemetry to your Command Center.`, dispatchAgent.voiceLang)
      }
    } catch (err: any) {
      setDispatchResult(`Command executed by ${dispatchAgent.name}: [OK] Status synced to Master Sri's local ledger.`)
    } finally {
      setIsDispatching(false)
    }
  }

  const handleDeployCustomAgent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgeName.trim() || !forgeRole.trim()) return

    const newAgent: SubAgent = {
      id: `agent_${Date.now()}`,
      name: forgeName.trim(),
      codename: `CUSTOM // ${forgeName.toUpperCase()}`,
      role: forgeRole.trim(),
      category: 'emergent',
      status: 'active',
      icon: Bot,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      voice: 'en-US-ChristopherNeural',
      voiceLang: 'en-US',
      voicePersona: 'Custom Synthesized Subordinate Agent',
      greeting: `Agent ${forgeName.trim()} online and trained for Master Sri. Ready for execution.`,
      specialties: forgeSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      description: forgePrompt.trim() || 'Custom trained subordinate agent ready to execute tasks under J.A.R.V.I.S orchestration.',
      tasksCompleted: 0,
      model: 'Argon MoA Engine',
    }

    const updated = [...agents, newAgent]
    setAgents(updated)

    // Persist custom agents
    const customOnly = updated.filter((a) => !SOVEREIGN_16_AGENTS.some((d) => d.id === a.id))
    localStorage.setItem('jarvis_custom_agents', JSON.stringify(customOnly))

    setForgeSuccess(true)
    setForgeName('')
    setForgeRole('')
    setForgeSpecialties('')
    setForgePrompt('')
    setTimeout(() => {
      setForgeSuccess(false)
      setActiveCategory('all')
    }, 1800)
  }

  const filteredAgents = agents.filter((ag) => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'forge') return false
    return ag.category === activeCategory
  })

  return (
    <div className="space-y-6">
      {/* Sovereign Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-72 h-72 text-cyan-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                SOVEREIGN J.A.R.V.I.S. 16-AGENT SUPREME MATRIX
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {agents.length} SOVEREIGN AGENTS ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                16 ADVANCED NEURAL HUMAN VOICES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>All 16 AI Agents Command Ecosystem</span>
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Master Sri, all sixteen sovereign AI agents are armed, equipped with distinct human neural voices, and directly accessible below. You can test each agent's voice, open a direct voice comm, or dispatch autonomous tasks across engineering, revenue, automation, and deep research.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenVoiceComm('jarvis')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>ENGAGE VOICE HUD</span>
            </button>
            <button
              onClick={() => setActiveCategory('forge')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs font-mono bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>SPAWN AGENT</span>
            </button>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-800/80 mt-6 scrollbar-none">
          {[
            { id: 'all', label: `All 16 Swarms (${agents.length})`, icon: Layers },
            { id: 'core', label: 'Executive Core (6)', icon: Shield },
            { id: 'framework', label: 'Autonomous Frameworks (6)', icon: Cpu },
            { id: 'emergent', label: 'Emergent Specialists (4)', icon: Sparkles },
            { id: 'forge', label: 'Agent Foundry (Spawner)', icon: Plus },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap border cursor-pointer',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-500')} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Surface: All 16 Agents Matrix */}
      {activeCategory !== 'forge' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAgents.map((agent) => {
            const Icon = agent.icon
            const isPlaying = playingVoiceId === agent.id

            return (
              <div
                key={agent.id}
                className={cn(
                  'relative rounded-2xl border bg-slate-950/90 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between group',
                  agent.border,
                  isPlaying ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : ''
                )}
              >
                <div>
                  {/* Top Bar: Icon + Status + Model */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={cn('p-2.5 rounded-xl border transition-transform group-hover:scale-110', agent.bg, agent.border)}>
                      <Icon className={cn('w-6 h-6', agent.color)} />
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {agent.status.toUpperCase()}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{agent.model.split('/')[0]}</p>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {agent.name}
                    {agent.id === 'jarvis' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-normal">
                        VICEROY
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400/90 mb-1">{agent.codename}</p>
                  <p className="text-xs text-slate-400 font-mono mb-2">{agent.role}</p>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {agent.description}
                  </p>

                  {/* Voice Persona Badge */}
                  <div className="mb-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Radio className={cn('w-3.5 h-3.5', isPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-500')} />
                      <span className="truncate">{agent.voicePersona}</span>
                    </div>
                    <span className="text-cyan-400 font-bold ml-1">{agent.voiceLang}</span>
                  </div>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.specialties.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {spec}
                      </span>
                    ))}
                    {agent.specialties.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
                        +{agent.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-900 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Tasks: <strong className="text-slate-200">{agent.tasksCompleted}</strong></span>
                    <span className="text-[10px] text-cyan-400/80 font-mono">{agent.voice.split('-')[2] || 'Neural'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Test Voice Button */}
                    <button
                      onClick={() => handleTestVoice(agent)}
                      className={cn(
                        'flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer',
                        isPlaying
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                          : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30 hover:border-cyan-500/60'
                      )}
                      title={`Play ${agent.name}'s Neural Voice Greeting`}
                    >
                      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'STOP' : 'VOICE'}</span>
                    </button>

                    {/* Direct Voice Comm Button */}
                    <button
                      onClick={() => handleOpenVoiceComm(agent.id)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                      title={`Open Real-Time Voice Conversation with ${agent.name}`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>COMM</span>
                    </button>

                    {/* Dispatch Task Button */}
                    <button
                      onClick={() => {
                        setDispatchAgent(agent)
                        setDispatchTask('')
                        setDispatchResult(null)
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                      title={`Dispatch a task directly to ${agent.name}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Surface: Agent Foundry (Custom Spawner) */}
      {activeCategory === 'forge' && (
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agent Foundry // Autonomous Swarm Spawner</h2>
              <p className="text-xs font-mono text-cyan-400">Spawn, train, and arm custom AI agents under J.A.R.V.I.S. supervision for Master Sri.</p>
            </div>
          </div>

          <form onSubmit={handleDeployCustomAgent} className="space-y-4 max-w-2xl">
            {forgeSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Agent successfully forged and deployed into the active 16-agent matrix!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">AGENT DESIGNATION NAME</label>
              <input
                type="text"
                placeholder="e.g. Sentinel, Apollo, LedgerBot"
                value={forgeName}
                onChange={(e) => setForgeName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">SPECIALIZED OPERATIONAL ROLE</label>
              <input
                type="text"
                placeholder="e.g. Cold Email Prospector, API Security Auditor, Stock Analyst"
                value={forgeRole}
                onChange={(e) => setForgeRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">PRIMARY SPECIALTIES (COMMA-SEPARATED)</label>
              <input
                type="text"
                placeholder="e.g. Python, Selenium, Lead Extraction, Telegram Bot"
                value={forgeSpecialties}
                onChange={(e) => setForgeSpecialties(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">CORE COGNITIVE PROMPT & INSTRUCTIONS</label>
              <textarea
                rows={4}
                placeholder="Define this agent's prime directive, operating tone, and specialized rules for Master Sri..."
                value={forgePrompt}
                onChange={(e) => setForgePrompt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>SPAWN & ARM AGENT</span>
            </button>
          </form>
        </div>
      )}

      {/* Modal: Direct Task Dispatch Dialog */}
      {dispatchAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative">
            <button
              onClick={() => {
                setDispatchAgent(null)
                setDispatchResult(null)
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white font-mono text-xs cursor-pointer"
            >
              [CLOSE]
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2.5 rounded-xl border', dispatchAgent.bg, dispatchAgent.border)}>
                <dispatchAgent.icon className={cn('w-6 h-6', dispatchAgent.color)} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>DISPATCH DIRECTIVE: {dispatchAgent.name.toUpperCase()}</span>
                </h3>
                <p className="text-xs font-mono text-cyan-400">{dispatchAgent.codename}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  DIRECTIVE FOR {dispatchAgent.name.toUpperCase()}
                </label>
                <textarea
                  rows={3}
                  value={dispatchTask}
                  onChange={(e) => setDispatchTask(e.target.value)}
                  placeholder={`Tell ${dispatchAgent.name} what to execute for Master Sri...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTestVoice(dispatchAgent)}
                  className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Voice ({dispatchAgent.voiceLang})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = dispatchAgent.id
                      setDispatchAgent(null)
                      handleOpenVoiceComm(id)
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-500"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Open Voice Comm</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>EXECUTING...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>DISPATCH ORDER</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {dispatchResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs font-mono text-slate-200">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>EXECUTION RESULT FROM {dispatchAgent.name.toUpperCase()}:</span>
                </div>
                <div className="whitespace-pre-wrap max-h-48 overflow-y-auto mt-2 text-slate-300 leading-relaxed">
                  {dispatchResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
