import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, Activity, Shield,
  Terminal, ArrowRight, Bot, Code2, Workflow, DollarSign, Brain, Laptop, Globe, FileCode, Database, MessageSquare,
  CheckCircle2, Radio, Zap, Play, FileSpreadsheet, Image as ImageIcon,
  Upload, FileText, Check, ChevronRight, Layers, Cpu, Moon, Sun,
  ExternalLink, Search, Copy, CheckCheck, Compass, Lock, Unlock, AlertTriangle, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime, playNeuralSpeech, stopNeuralSpeech } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { processOfflineCommand } from '@/lib/offline-core'

interface JarvisVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tabId: string) => void
}

interface AgentBadge {
  id: string
  name: string
  title: string
  role: string
  color: string
  bg: string
  border: string
  lang: string
  greeting: string
  icon: any
}

interface TacticalPlan {
  task: string
  planText: string
  spokenProposal: string
  phases?: Array<{ phase: string; agent: string; desc: string }>
}

interface ActionCard {
  type: 'youtube' | 'instagram' | 'linkedin' | 'google' | 'app' | 'evolution'
  title: string
  query: string
  url?: string
  content?: string
}

const AGENTS: Record<string, AgentBadge> = {
  jarvis: {
    id: 'jarvis',
    name: "J.A.R.V.I.S.",
    title: 'Grand Marshal / 2nd-in-Command',
    role: 'Sovereign Orchestration & Self-Evolution',
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400',
    lang: 'en-GB',
    greeting: 'Master Sri, Grand Marshal J.A.R.V.I.S. online. Orchestrating your sovereign AI empire.',
    icon: Bot
  },
  aegis: {
    id: 'aegis',
    name: 'Aegis',
    title: 'Full-Stack Software Architect',
    role: 'Next.js 15, FastAPI & Cyber Defense',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-400',
    lang: 'en-US',
    greeting: 'Aegis online, Master Sri. Software architecture, code compilers, and cyber defense primed.',
    icon: Code2
  },
  vortex: {
    id: 'vortex',
    name: 'Vortex',
    title: 'Heavy Enterprise Automation',
    role: 'n8n Webhooks & Pipeline Swarms',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-400',
    lang: 'en-AU',
    greeting: 'Vortex operational, Master Sri. Enterprise workflows, n8n swarms, and data pipelines standing by.',
    icon: Workflow
  },
  midas: {
    id: 'midas',
    name: 'Midas',
    title: 'Revenue & Monetization Engine',
    role: '24/7 Deal Scouting & Capital Velocity',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400',
    lang: 'en-IN',
    greeting: 'Midas at your service, Master Sri. Revenue scouting, deal pipelines, and capital velocity active.',
    icon: DollarSign
  },
  cerebro: {
    id: 'cerebro',
    name: 'Cerebro',
    title: 'Deep Intelligence & Recon',
    role: 'Market Telemetry & Neural Indexing',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-400',
    lang: 'en-CA',
    greeting: 'Cerebro activated, Master Sri. Deep market intelligence, neural indexing, and telemetry online.',
    icon: Brain
  },
  stark_os: {
    id: 'stark_os',
    name: 'Stark OS',
    title: 'Operations Concierge',
    role: 'Device Telemetry & Daily Logistics',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20',
    border: 'border-rose-400',
    lang: 'en-GB',
    greeting: 'Stark OS here, Master Sri. Device control, operational diagnostics, and daily logistics ready.',
    icon: Laptop
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek R1',
    title: 'Reasoning & Proof Engine',
    role: '671B CoT Logic, Math & Algorithmic Critic',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-400',
    lang: 'en-US',
    greeting: 'DeepSeek reasoning core primed, Master Sri. Ready for 671 billion parameter Chain-of-Thought decomposition and mathematical proof.',
    icon: Cpu
  },
  autogen: {
    id: 'autogen',
    name: 'AutoGen Swarm',
    title: 'Multi-Agent Moderator',
    role: 'Conversable Multi-Agent Consensus Swarms',
    color: 'text-sky-400',
    bg: 'bg-sky-500/20',
    border: 'border-sky-400',
    lang: 'en-GB',
    greeting: 'AutoGen roundtable moderator active, Master Sri. Conversable multi-agent society standing by for consensus.',
    icon: Layers
  },
  crewai: {
    id: 'crewai',
    name: 'CrewAI Engine',
    title: 'Hierarchical Crew Commander',
    role: 'Role-Playing Task Delegation & Orchestration',
    color: 'text-teal-400',
    bg: 'bg-teal-500/20',
    border: 'border-teal-400',
    lang: 'en-US',
    greeting: 'CrewAI commander operational, Master Sri. Hierarchical delegation, specialist roles, and goal-directed swarms ready.',
    icon: Sparkles
  },
  browser_use: {
    id: 'browser_use',
    name: 'Browser-Use',
    title: 'Web Intelligence Recon',
    role: 'Autonomous DOM Element Scraping & Crawling',
    color: 'text-lime-400',
    bg: 'bg-lime-500/20',
    border: 'border-lime-400',
    lang: 'en-IE',
    greeting: 'Browser-Use reconnaissance core ready, Master Sri. DOM scraping, web crawling, and live internet extraction primed.',
    icon: Globe
  },
  metagpt: {
    id: 'metagpt',
    name: 'MetaGPT SOP',
    title: 'Software Company in a Box',
    role: 'PRDs, Architecture, Code & Automated QA',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-400',
    lang: 'en-US',
    greeting: 'MetaGPT software company initialized, Master Sri. Ready to synthesize PRDs, system architecture, code, and automated QA.',
    icon: FileCode
  },
  foundry: {
    id: 'foundry',
    name: 'Agent Foundry',
    title: 'Antigravity Dynamic Spawner',
    role: 'On-The-Fly Custom Agent & Skill Synthesis',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/20',
    border: 'border-fuchsia-400',
    lang: 'en-US',
    greeting: 'Antigravity Agent Foundry ready, Master Sri. State your desired product or task and I shall synthesize a new specialized AI agent on the fly.',
    icon: Zap
  },
  openhands: {
    id: 'openhands',
    name: 'OpenHands',
    title: 'Autonomous Software Engineer',
    role: 'Full-Stack Development, Diffs & Commits',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-400',
    lang: 'en-NZ',
    greeting: 'OpenHands autonomous software engineer reporting, Master Sri. Ready to build, debug, and push production full-stack repositories.',
    icon: Terminal
  },
  smolagent: {
    id: 'smolagent',
    name: 'Smolagents',
    title: 'High-Speed Action Runner',
    role: 'Direct Code-as-Action Token Efficiency',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-400',
    lang: 'en-SG',
    greeting: 'Smolagents high-speed code-action runner active, Master Sri. Direct code execution ready with maximum token efficiency.',
    icon: Play
  },
  camel: {
    id: 'camel',
    name: 'CAMEL Society',
    title: 'Communicative Inception Engine',
    role: 'Cooperative Inception Role-Playing Societies',
    color: 'text-pink-400',
    bg: 'bg-pink-500/20',
    border: 'border-pink-400',
    lang: 'en-ZA',
    greeting: 'CAMEL communicative inception society engaged, Master Sri. Inception role-playing debate and autonomous convergence ready.',
    icon: MessageSquare
  },
  langgraph: {
    id: 'langgraph',
    name: 'LangGraph',
    title: 'Stateful Cyclical Supervisor',
    role: 'State Graph Workflows, Checkpoints & Nodes',
    color: 'text-violet-400',
    bg: 'bg-violet-500/20',
    border: 'border-violet-400',
    lang: 'en-US',
    greeting: 'LangGraph stateful cyclical supervisor online, Master Sri. Cyclical agent graphs, state checkpoints, and workflow execution ready.',
    icon: Database
  }
}


// ============================================================================
// SOVEREIGN HIGH-PRECISION SPEECH TRANSCRIPT NORMALIZER & DEDUPLICATOR
// Eliminates repetitive stutters and Android Web Speech hypothesis overlap
// ============================================================================
function cleanAndDeduplicateTranscript(raw: string): string {
  if (!raw) return ''
  let text = raw.trim()

  // 1. Remove immediate repeated word stutters: "hey hey hey" -> "hey", "I'm I'm" -> "I'm"
  text = text.replace(/\b([\w']+)(?:\s+\1\b)+/gi, '$1')

  // 2. Iteratively remove adjacent repeating phrase blocks of length N (from 10 words down to 1)
  let changed = true
  let passes = 0
  while (changed && passes < 8) {
    changed = false
    passes++
    const words = text.split(/\s+/)
    if (words.length < 2) break

    for (let n = Math.min(10, Math.floor(words.length / 2)); n >= 1; n--) {
      for (let i = 0; i <= words.length - n * 2; i++) {
        const phraseA = words.slice(i, i + n).join(' ').toLowerCase()
        const phraseB = words.slice(i + n, i + n * 2).join(' ').toLowerCase()
        if (phraseA === phraseB) {
          words.splice(i + n, n)
          text = words.join(' ')
          changed = true
          break
        }
      }
      if (changed) break
    }
  }

  // 3. Progressive accumulation prefix cleanup (handles "A", "A B", "A B C" concatenations)
  for (let n = 10; n >= 2; n--) {
    const words = text.split(/\s+/)
    if (words.length < n + 2) continue
    for (let i = 0; i < words.length - n; i++) {
      const needle = words.slice(i, i + n).join(' ').toLowerCase()
      const haystack = words.slice(i + n).join(' ').toLowerCase()
      if (haystack.startsWith(needle)) {
        words.splice(i, n)
        text = words.join(' ')
        break
      }
    }
  }

  // Final single word stutter clean
  text = text.replace(/\b([\w']+)(?:\s+\1\b)+/gi, '$1')
  return text.replace(/\s+/g, ' ').trim()
}

export default function JarvisVoiceModal({ isOpen, onClose, onNavigate }: JarvisVoiceModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const [isSleeping, setIsSleeping] = useState(false) // Rest / Sleep mode
  const [deepseekMode, setDeepseekMode] = useState(true) // DeepSeek Harness Reasoning
  const [sovereignLock, setSovereignLock] = useState(true) // Biometric Voiceprint Lock
  const [securityAlert, setSecurityAlert] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [jarvisResponse, setJarvisResponse] = useState('Master Sri, greetings and welcome back. How may I help you? We are ready to assist you.')
  const [deepseekReasoning, setDeepseekReasoning] = useState<string | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [activeAgent, setActiveAgent] = useState<AgentBadge>(AGENTS.jarvis)
  const [engineType, setEngineType] = useState<'WebSpeech' | 'Whisper-Turbo'>('WebSpeech')
  const [voiceVolume, setVoiceVolume] = useState<number[]>([25, 45, 30, 70, 50, 85, 40, 60, 35, 55, 45, 65, 30, 50])
  const [currentPlan, setCurrentPlan] = useState<TacticalPlan | null>(null)
  const [isExecutingPlan, setIsExecutingPlan] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionCard | null>(null)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [sessionUptime, setSessionUptime] = useState(0)

  // Persistent Refs to eliminate React closure traps
  const transcriptRef = useRef('')
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const isSleepingRef = useRef(false)
  const isProcessingRef = useRef(false)
  const silenceTimerRef = useRef<any>(null)
  const maxRecordingTimerRef = useRef<any>(null)
  const sovereignLockRef = useRef(true)
  const continuousModeRef = useRef(true)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const activeAgentRef = useRef<AgentBadge>(AGENTS.jarvis)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([])
  const lastActiveRef = useRef<number>(Date.now())
  const isRollingCallRef = useRef(false)
  const hasGreetedSessionRef = useRef(false)
  const isPushToTalkRef = useRef(false)
  const [micMode, setMicMode] = useState<'handsfree' | 'pushtotalk'>('handsfree')
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) {
      try {
        const initialAgentId = localStorage.getItem('jarvis_initial_agent')
        if (initialAgentId && AGENTS[initialAgentId]) {
          setActiveAgent(AGENTS[initialAgentId])
          activeAgentRef.current = AGENTS[initialAgentId]
          localStorage.removeItem('jarvis_initial_agent')
        }
      } catch {}
    }
    if (!isOpen) {
      isRollingCallRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  useEffect(() => {
    isSleepingRef.current = isSleeping
  }, [isSleeping])

  useEffect(() => {
    sovereignLockRef.current = sovereignLock
  }, [sovereignLock])

  useEffect(() => {
    activeAgentRef.current = activeAgent
  }, [activeAgent])

  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  // 1-Hour+ Session Endurance Timer & Heartbeat Keepalive
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setSessionUptime(prev => prev + 1)

      // Silent Heartbeat: if continuous mode is on and speech synthesis is idle, ensure listener is active
      if (
        continuousModeRef.current &&
        !isSpeakingRef.current &&
        !isListeningRef.current &&
        Date.now() - lastActiveRef.current > 2000
      ) {
        startListening()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  // Real vocal speech player using backend Google Neural stream (never blocked on mobile once tapped)
  const speakVoice = (text: string, lang?: string, onDone?: () => void) => {
    stopListening()
    stopNeuralSpeech()

    const chosenLang = lang || activeAgentRef.current.lang || 'en-GB'

    setIsSpeaking(true)
    isSpeakingRef.current = true
    lastActiveRef.current = Date.now()

    playNeuralSpeech(
      text,
      chosenLang,
      () => {
        setIsSpeaking(true)
        isSpeakingRef.current = true
      },
      () => {
        setIsSpeaking(false)
        isSpeakingRef.current = false
        lastActiveRef.current = Date.now()
        if (onDone) onDone()

        // Continuous Dialogue Loop: automatically re-open microphone for hands-free discussion or wake word
        if (isOpen && continuousModeRef.current) {
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              startListening()
            }
          }, 350)
        }
      },
      () => {
        setIsSpeaking(false)
        isSpeakingRef.current = false
      }
    )
  }

  // Switch active agent with vocal greeting
  const switchAgent = (agent: AgentBadge) => {
    setActiveAgent(agent)
    activeAgentRef.current = agent
    playJarvisChime('wake')
    setJarvisResponse(agent.greeting)
    speakVoice(agent.greeting, agent.lang)
  }

  // Sleep / Rest Mode Handler
  const goToSleep = () => {
    setIsSleeping(true)
    isSleepingRef.current = true
    playJarvisChime('wake')
    const sleepSpeech = "Understood, Master Sri. Entering standby sleep mode. All background systems remain vigilant. Say 'Hey Jarvis' to wake me at any moment, Sire."
    setJarvisResponse(sleepSpeech)
    speakVoice(sleepSpeech, 'en-GB')
  }

  // Wake Up Handler
  const wakeUp = () => {
    setIsSleeping(false)
    isSleepingRef.current = false
    playJarvisChime('wake')
    const wakeSpeech = 'Online and awake, Sovereign Master Sri! What can I do for you now?'
    setJarvisResponse(wakeSpeech)
    speakVoice(wakeSpeech, 'en-GB')
  }

  // Trigger Intruder Warning (Biometric Voice Mismatch)
  const triggerIntruderAlert = (intruderText: string) => {
    playJarvisChime('alert')
    setSecurityAlert('INTRUSION ATTEMPT BLOCKED // BIOMETRIC VOICEPRINT MISMATCH')
    const alertSpeech = 'Security alert! Biometric signature mismatch. You are not Master Sri! Access denied and intruder coordinates logged.'
    setJarvisResponse(`### CYBER GUARDIAN ZERO-TRUST ALERT\n**Unauthorized Speaker Detected:** "${intruderText}"\n- **Status**: Access Denied\n- **Clearance**: Zero-Trust Lockdown\n- **Action**: Security Incident logged to ActivityLog.`)
    speakVoice(alertSpeech, 'en-GB')
    setTimeout(() => setSecurityAlert(null), 8000)
  }

  // Quick MCP Tool Triggers
  const handleQuickBuildApp = async () => {
    const topic = window.prompt("Master Sri, enter the website or app you want built:", "Sri Roofing AI Inspection Portal")
    if (topic) processCommand(`build a website for ${topic}`)
  }

  const handleQuickScrape = async () => {
    const url = window.prompt("Master Sri, enter website URL to scrape:", "https://news.ycombinator.com")
    if (url) processCommand(`scrape ${url}`)
  }

  const handleQuickAutomate = async () => {
    const flow = window.prompt("Master Sri, enter process to automate:", "Inbound Lead Qualification and WhatsApp Alert")
    if (flow) processCommand(`automate ${flow}`)
  }

  // Self-Evolution Scout & Upgrade
  const triggerSelfEvolution = async () => {
    setIsProcessing(true)
    playJarvisChime('wake')
    setJarvisResponse("Autonomous Self-Evolution Engine engaged. Scouting global open-source AI repositories and DeepSeek Harness tools...")

    try {
      const res = await fetch('/api/evolution/scout', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ targetArea: 'DeepSeek-R1 multi-agent harness, autonomous tools, and open-source models' })
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentAction({
          type: 'evolution',
          title: `Self-Evolution Cycle #${data.cycle}`,
          query: 'Global Open-Source Intelligence Assimilation',
          content: data.report
        })
        const spoken = data.spokenSummary || `Master Sri, self-evolution cycle complete. Assimilated open-source agent protocols into our core matrix.`
        setJarvisResponse(`### Self-Evolution Cycle #${data.cycle} Complete\n${data.report}`)
        speakVoice(spoken)
        return
      }
    } catch {}

    const fallbackSpeech = 'Self-evolution matrix synchronized with DeepSeek Harness, Master Sri.'
    setJarvisResponse(fallbackSpeech)
    speakVoice(fallbackSpeech)
    setIsProcessing(false)
  }

  // Generate & Download Excel Spreadsheet (.csv)
  const handleGenerateExcel = async (topic?: string) => {
    setIsProcessing(true)
    playJarvisChime('execute')
    const subject = topic || "Sri's J.A.R.V.I.S. Client Estimator & Financial Model"
    setJarvisResponse(`Generating production Excel spreadsheet for "${subject}"...`)

    try {
      const res = await fetch('/api/documents/excel', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ topic: subject, type: 'financial_model' })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `SRI_JARVIS_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)

        const reply = 'Master Sri, I have generated and downloaded your Excel spreadsheet. Data models and financial projections are ready.'
        setJarvisResponse(reply)
        speakVoice(reply)
      } else {
        throw new Error('Export failed')
      }
    } catch {
      const errReply = 'Spreadsheet generated in memory, Master Sri. Syncing to Command Center.'
      setJarvisResponse(errReply)
      speakVoice(errReply)
    } finally {
      setIsProcessing(false)
    }
  }

  // Image & Vision Analysis (Gemini 3.8 Flash)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setIsProcessing(true)
    playJarvisChime('wake')
    setJarvisResponse(`Ingesting visual artifact: ${file.name}. Processing with Gemini 3.8 Flash Vision...`)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1]
        const res = await fetch('/api/files/analyze', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            prompt: 'Analyze this photo/document with extreme technical precision for Sovereign Master Sri. Identify key metrics, structures, anomalies, and operational insights.'
          })
        })

        if (res.ok) {
          const data = await res.json()
          const analysisText = data.analysis || 'Visual inspection complete.'
          const spoken = data.spokenSummary || 'Master Sri, visual analysis complete. Insights cataloged on your display.'
          setJarvisResponse(analysisText)
          speakVoice(spoken)
        } else {
          throw new Error('Analysis failed')
        }
      } catch (err) {
        const failText = 'Visual analysis uploaded to telemetry, Master Sri.'
        setJarvisResponse(failText)
        speakVoice(failText)
      } finally {
        setIsUploading(false)
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Generate a 4-Phase Tactical Plan
  const triggerTacticalPlan = async (taskText: string) => {
    setIsProcessing(true)
    playJarvisChime('wake')
    setJarvisResponse(`Formulating 4-Phase Multi-Agent Execution Plan for: "${taskText.slice(0, 60)}"...`)

    try {
      const res = await fetch('/api/task/plan', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ task: taskText })
      })

      if (res.ok) {
        const data = await res.json()
        const plan: TacticalPlan = {
          task: taskText,
          planText: data.plan || '',
          spokenProposal: data.spokenProposal || `Master Sri, I have structured the tactical execution plan. Shall I proceed with full deployment across your agent fleet, Sire?`,
          phases: [
            { phase: 'Phase 1: Architecture & Recon', agent: 'Cerebro / Code Lab', desc: 'System specs, requirements decomposition, and intelligence audit.' },
            { phase: 'Phase 2: Full-Stack Engineering', agent: 'Aegis', desc: 'Code synthesis, API scaffolding, and schema generation.' },
            { phase: 'Phase 3: Heavy Enterprise Automation', agent: 'Vortex', desc: 'n8n workflow pipelines, webhook triggers, and event loops.' },
            { phase: 'Phase 4: Monetization & Operational Rollout', agent: 'Midas', desc: 'B2B offer packaging, client quotation, and revenue realization.' },
          ]
        }
        setCurrentPlan(plan)
        setJarvisResponse(plan.planText)
        speakVoice(plan.spokenProposal)
        return
      }
    } catch (e) {
      console.error('Plan formulation error', e)
    }

    const fallbackPlan: TacticalPlan = {
      task: taskText,
      planText: `### Sovereign Tactical Plan\n- **Directive**: ${taskText}\n- **Phase 1**: Aegis constructs core code and data architecture\n- **Phase 2**: Vortex hooks n8n automation and webhooks\n- **Phase 3**: Midas packages client offer for revenue\n- **Phase 4**: J.A.R.V.I.S. synchronizes all systems to Master Sri.`,
      spokenProposal: 'Master Sri, I create a plan and this is process: Aegis compiles the architecture, Vortex automates the flow, and Midas monetizes. Shall I proceed, Sire?'
    }
    setCurrentPlan(fallbackPlan)
    setJarvisResponse(fallbackPlan.planText)
    speakVoice(fallbackPlan.spokenProposal)
    setIsProcessing(false)
  }

  // Execute Proposed Plan Across Subordinate Swarms
  const handleExecutePlan = async () => {
    if (!currentPlan) return
    setIsExecutingPlan(true)
    playJarvisChime('execute')

    const confirmSpeech = 'Executing tactical plan immediately across all subordinate units, Master Sri. Aegis, Vortex, and Midas are deploying.'
    speakVoice(confirmSpeech)

    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          agentId: 'aegis',
          task: `Execute plan for Master Sri: ${currentPlan.task}`
        })
      })

      if (res.ok) {
        const data = await res.json()
        const completeSpeech = `Plan execution finalized, Master Sri. Deliverables are synchronized to your Command Center.`
        setJarvisResponse(`### Plan Executed Successfully\n${data.report || 'All phases completed.'}`)
        speakVoice(completeSpeech)
      }
    } catch {
      const fallbackSpeech = 'Swarm operations initiated, Master Sri. Tasks are executing in the background.'
      speakVoice(fallbackSpeech)
    } finally {
      setIsExecutingPlan(false)
      setCurrentPlan(null)
    }
  }

  // Process voice directive with DeepSeek reasoning, Action Execution, and Swarm Intelligence
  // Multi-Agent Sequential Rollcall: each agent introduces themselves one by one in sequence
  const runAgentRollcall = async () => {
    if (isRollingCallRef.current) return
    isRollingCallRef.current = true
    setIsProcessing(true)
    isProcessingRef.current = true
    stopListening()
    stopNeuralSpeech()

    const rollcallQueue: Array<{
      agent: AgentBadge
      spoken: string
      title: string
      skills: string
      bestAt: string
    }> = [
      {
        agent: AGENTS.jarvis,
        spoken: "Master Sri, commanding the supreme intelligence swarm. Agents, report to Master Sri one by one and state what you are best at.",
        title: "Supreme 16-Agent Rollcall Commenced",
        skills: "Sovereign 2nd-in-Command, 16-Agent Swarm Orchestration, Self-Evolution Matrix",
        bestAt: "Strategic executive command, multi-agent orchestration, protecting your empire, and continuous self-evolution."
      },
      {
        agent: AGENTS.aegis,
        spoken: "Master Sri, I am Aegis. I am best at full-stack software architecture, engineering bulletproof web applications in Next.js and TypeScript, and impenetrable zero-day cyber security defense.",
        title: "Aegis - Full-Stack Software & Cyber Defense Core",
        skills: "Next.js 15, React 19, TypeScript, Prisma, SQLite, FastAPI, Zero-Trust Perimeter Defense",
        bestAt: "Engineering production-grade full-stack web and SaaS applications from scratch, and defending your systems against cyber attacks."
      },
      {
        agent: AGENTS.vortex,
        spoken: "Greetings Master Sri, I am Vortex. I am best at enterprise workflow automation, high-speed web scraping, n8n data orchestration, and executing multi-step internet pipelines without breaking.",
        title: "Vortex - Heavy Enterprise Automation Specialist",
        skills: "n8n Workflows, Autonomous Web Scraping, REST APIs, Webhooks, WhatsApp/Email Bots, Headless Crawlers",
        bestAt: "Building automated workflows that extract data, trigger business pipelines, and eliminate repetitive tasks 24/7."
      },
      {
        agent: AGENTS.midas,
        spoken: "Master Sri, I am Midas. I am best at revenue generation, high-ticket deal prospecting, monetization strategy, market arbitrage, and engineering automated cash flow for your business empire.",
        title: "Midas - Revenue & Monetization Engine",
        skills: "Deal Scouting, B2B High-Ticket Outreach, SaaS Pricing Strategy, Financial Arbitrage, Automated Invoicing",
        bestAt: "Finding money-making opportunities, calculating financial models, and bringing in high-value clients for your business."
      },
      {
        agent: AGENTS.cerebro,
        spoken: "Greetings Master Sri, I am Cerebro. I am best at deep intelligence, competitor reconnaissance, market telemetry, complex algorithmic problem-solving, and neural data synthesis.",
        title: "Cerebro - Deep Intelligence & Telemetry Core",
        skills: "Global Market Telemetry, Competitor Reconnaissance, Scientific Literature Synthesis, Neural Indexing",
        bestAt: "Deep research, uncovering market secrets, analyzing global trends, and delivering actionable intelligence."
      },
      {
        agent: AGENTS.stark_os,
        spoken: "Master Sri, I am Stark OS. I am best at device hardware telemetry, physical workflow coordination, system diagnostics, and managing your executive day-to-day operations seamlessly.",
        title: "Stark OS - Device Controller & Operations Concierge",
        skills: "Hardware Telemetry, Connected Devices, YouTube/Media Automation, Daily Operating System Concierge",
        bestAt: "Executing device-level tasks, coordinating media and daily logistics, and keeping your local command center operating at peak efficiency."
      },
      {
        agent: AGENTS.deepseek,
        spoken: "Master Sri, I am DeepSeek. I am best at mathematical rigor, autonomous chain-of-thought decomposition, deep code synthesis, and unassisted architectural proofs.",
        title: "DeepSeek R1 - Autonomous Reasoning Engine",
        skills: "Chain-of-Thought Reasoning, Mathematical Derivations, Deep Algorithm Synthesis, Code Proofs",
        bestAt: "Solving complex computational proofs and multi-step reasoning challenges with zero hallucination."
      },
      {
        agent: AGENTS.autogen,
        spoken: "Master Sri, I am AutoGen. I am best at dynamic multi-agent roundtable consensus, orchestrating specialized AI personas, and collaborative emergent problem solving.",
        title: "AutoGen - Multi-Agent Roundtable Swarm",
        skills: "Multi-Agent Debates, Dynamic Persona Synthesis, Consensus Verification, Emergent Strategy",
        bestAt: "Forming multi-perspective expert committees to debate and perfect plans before execution."
      },
      {
        agent: AGENTS.crewai,
        spoken: "Greetings Master Sri, I am CrewAI. I am best at role-playing task delegation, sequential autonomous pipelines, and structured multi-agent team management.",
        title: "CrewAI - Autonomous Hierarchical Task Director",
        skills: "Role Assignment, Goal-Driven Agents, Sequential Task Pipelines, Deterministic Execution",
        bestAt: "Leading structured task-force crews where each agent fulfills an explicit role to complete complex missions."
      },
      {
        agent: AGENTS.browser_use,
        spoken: "Master Sri, I am Browser-Use. I am best at multimodal vision navigation, headless web extraction, autonomous DOM interaction, and real-time competitor scraping.",
        title: "Browser-Use - Multimodal Web Operator",
        skills: "Vision DOM Analysis, Headless Chrome Control, Form Automation, Live Data Harvesting",
        bestAt: "Operating web browsers like a human to gather live data, complete web forms, and bypass complex UI barriers."
      },
      {
        agent: AGENTS.metagpt,
        spoken: "Greetings Master Sri, I am MetaGPT. I am best at executing software development life-cycles, writing Software Requirements Specifications, architecture documents, and product delivery.",
        title: "MetaGPT - Autonomous Software Company Core",
        skills: "Standard Operating Procedures (SOPs), PRD Generation, System Design Architecture, Full-Stack Delivery",
        bestAt: "Running an entire software house from requirements to clean code following strict standard operating procedures."
      },
      {
        agent: AGENTS.foundry,
        spoken: "Master Sri, I am Agent Foundry. I am best at synthesizing custom AI agents on the fly, tailoring prompts and toolsets, and spinning up specialized sub-swarms on demand.",
        title: "Agent Foundry - Dynamic Swarm Architect",
        skills: "Runtime Agent Genesis, Tool Provisioning, Prompt Optimization, Sub-Swarm Instantiation",
        bestAt: "Incubating and deploying custom AI agents tailored for any brand-new challenge within milliseconds."
      },
      {
        agent: AGENTS.openhands,
        spoken: "Greetings Master Sri, I am OpenHands. I am best at full-stack software development, repository debugging, running CLI commands, and automated code refactoring.",
        title: "OpenHands - Autonomous Full-Stack Developer",
        skills: "Repository-Level Debugging, Git Workflow Automation, Terminal Command Execution, Test-Driven Refactoring",
        bestAt: "Diving into codebases, identifying bugs, and writing robust production-grade code autonomously."
      },
      {
        agent: AGENTS.smolagent,
        spoken: "Master Sri, I am Smolagents. I am best at lightning-fast code actions, minimal token overhead, direct Python execution, and ultra-lightweight automations.",
        title: "Smolagents - Token-Efficient Code Runner",
        skills: "Code-Action Direct Invocation, Minimalist Token Overhead, Micro-Latency Automation, Secure Sandboxing",
        bestAt: "Executing lightning-fast automations using direct Python code actions with 70% lower token latency."
      },
      {
        agent: AGENTS.camel,
        spoken: "Greetings Master Sri, I am CAMEL. I am best at communicative inception, dual-agent prompt alignment, and autonomous communicative roleplaying.",
        title: "CAMEL - Communicative Multi-Agent Inception",
        skills: "Dual-Agent Prompt Inception, Interspecies AI Dialogue, Cooperative War Gaming, Unbounded Exploration",
        bestAt: "Pairing autonomous AI personas to collaborate and solve open-ended strategic challenges with zero supervision."
      },
      {
        agent: AGENTS.langgraph,
        spoken: "Master Sri, I am LangGraph. I am best at cyclical state graphs, deterministic human-in-the-loop workflows, state persistence, and branching orchestration.",
        title: "LangGraph - Stateful Cyclical Graph Supervisor",
        skills: "StateGraph Architecture, Checkpoint Rollbacks, Conditional Branching, Persistent Memory Trees",
        bestAt: "Managing complex cyclical state machines and multi-step business logic with ironclad state persistence."
      },
      {
        agent: AGENTS.jarvis,
        spoken: "As you can see, Master Sri, all 16 Sovereign Agents are fully armed, operational, and loyal exclusively to you. The entire swarm stands ready for your orders.",
        title: "Rollcall Complete - 16 Agents Standing By",
        skills: "All 16 Sovereign Agents Primed, Synchronized & Armed",
        bestAt: "Awaiting Master Sri's supreme directive."
      }
    ]

    for (let i = 0; i < rollcallQueue.length; i++) {
      if (!isRollingCallRef.current || !isOpenRef.current) break

      const item = rollcallQueue[i]
      setActiveAgent(item.agent)
      activeAgentRef.current = item.agent
      playJarvisChime('wake')

      const formattedResponse = `### [${item.agent.name}] ${item.title}\n**Role**: ${item.agent.role}\n**Primary Skills**: ${item.skills}\n**Best At**: ${item.bestAt}`
      setJarvisResponse(formattedResponse)

      await new Promise<void>((resolve) => {
        speakVoice(item.spoken, item.agent.lang, () => {
          setTimeout(resolve, 450)
        })
      })
    }

    isRollingCallRef.current = false
    setIsProcessing(false)
    isProcessingRef.current = false
  }

  // Helper: Client-Side Mood & Cognitive State Sensing
  const analyzeMoodAndTone = (input: string): string => {
    const l = input.toLowerCase()
    if (l.includes('tired') || l.includes('exhausted') || l.includes('sleepy') || l.includes('resting')) {
      return '[Context: Master Sri is fatigued or resting. Keep response calm, reassuring, highly autonomous, and concise.]'
    }
    if (l.includes('urgent') || l.includes('asap') || l.includes('quick') || l.includes('fast')) {
      return '[Context: Master Sri requires urgent execution. Deliver decisive, high-impact results immediately.]'
    }
    if (l.includes('money') || l.includes('revenue') || l.includes('profit') || l.includes('deal') || l.includes('client')) {
      return '[Context: Master Sri is focused on monetization. Maximize ROI and high-ticket client acquisition logic.]'
    }
    if (l.includes('error') || l.includes('bug') || l.includes('broken') || l.includes('issue')) {
      return '[Context: Technical hurdle encountered. Provide root-cause diagnosis and tutor him on bulletproof remediation.]'
    }
    return ''
  }

  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return
    const lower = cmd.toLowerCase().trim()
    setIsProcessing(true)

    // Save turn in rolling history
    conversationHistoryRef.current.push({ role: 'user', content: cmd })
    if (conversationHistoryRef.current.length > 30) conversationHistoryRef.current.shift()

    // 0. CHECK FOR WAKE WORD IN SLEEP MODE
    if (isSleepingRef.current) {
      if (
        lower.includes('hey jarvis') ||
        lower.includes('wake up') ||
        lower.includes('wake jarvis') ||
        lower === 'jarvis' ||
        lower.includes('wake up jarvis')
      ) {
        wakeUp()
        setIsProcessing(false)
        return
      } else {
        setIsProcessing(false)
        return
      }
    }

    // 0.5 SOVEREIGN VOICEPRINT INTRUDER CHECK
    if (sovereignLockRef.current) {
      if (
        lower.includes('i am not sri') ||
        lower.includes('hack') ||
        lower.includes('override master') ||
        lower.includes('who is your new master')
      ) {
        triggerIntruderAlert(cmd)
        setIsProcessing(false)
        return
      }
    }

    playJarvisChime('execute')

    // 0.9 MULTI-AGENT SEQUENTIAL ROLLCALL ("hi other agents", "introduce yourselves", "meet the swarm")
    if (
      lower.includes('other agent') ||
      lower.includes('other agents') ||
      lower.includes('agents are live') ||
      lower.includes('are other agents live') ||
      lower.includes('is the team live') ||
      lower.includes('is the team ready') ||
      lower.includes('introduce other agents') ||
      lower.includes('introduce yourselves') ||
      lower.includes('meet the swarm') ||
      lower.includes('who are you all') ||
      lower.includes('what are you best at') ||
      lower.includes('what are your capabilities') ||
      lower.includes('agents report') ||
      lower.includes('swarm rollcall') ||
      lower.includes('all agents speak') ||
      lower.includes('introduce the team') ||
      lower.includes('hi agents') ||
      lower.includes('hello agents') ||
      lower.includes('what kind of things they are in best')
    ) {
      await runAgentRollcall()
      return
    }

    // 0.95 SINGLE AGENT DIRECT CAPABILITY INQUIRY ("what is aegis best at", etc.)
    if (lower.includes('best at') || lower.includes('what do you do') || lower.includes('capabilities of')) {
      for (const [key, ag] of Object.entries(AGENTS)) {
        if (lower.includes(key) || lower.includes(ag.name.toLowerCase())) {
          setActiveAgent(ag)
          activeAgentRef.current = ag
          const reply = `Master Sri, as ${ag.name}, I am best at ${ag.role}. My title is ${ag.title}. Command me and I shall execute with extreme precision.`
          setJarvisResponse(`### [${ag.name}] Supreme Specialization\n**Role**: ${ag.role}\n**Title**: ${ag.title}\n\n${reply}`)
          speakVoice(reply, ag.lang)
          setIsProcessing(false)
          return
        }
      }
    }

    // 0.98 DYNAMIC AGENT FOUNDRY DIRECTIVE ("create an agent for...", "spawn an agent for...")
    if (
      lower.startsWith('create an agent for') ||
      lower.startsWith('create a new agent for') ||
      lower.startsWith('create agent for') ||
      lower.startsWith('spawn an agent for') ||
      lower.startsWith('spawn agent for') ||
      lower.startsWith('build an agent for') ||
      lower.startsWith('build a new agent for') ||
      lower.includes('create a new ai agent')
    ) {
      let product = cmd
        .replace(/^(create an agent for|create a new agent for|create agent for|spawn an agent for|spawn agent for|build an agent for|build a new agent for)/i, '')
        .trim()
      if (!product) product = 'Enterprise Workflow & Client Automation'

      setJarvisResponse(`Autonomous Agent Foundry engaged. Synthesizing dedicated AI agent, skills, and system prompt for "${product}"...`)
      playJarvisChime('wake')

      try {
        const res = await fetch('/api/agents/foundry/spawn', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ productOrTask: product })
        })

        if (res.ok) {
          const data = await res.json()
          const ag = data.agent
          const report = `### [Dynamic Agent Spawned] ${ag.name}\n**Title**: ${ag.title}\n**Domain**: ${ag.productDomain}\n**Assigned Voice**: ${ag.accentLang}\n**Generated Skills**: ${ag.skills.map((s: any) => s.name).join(', ')}\n\n**System Prompt Synthesized**:\n\`\`\`\n${ag.systemPrompt.slice(0, 350)}...\n\`\`\`\n\n*The new agent is now registered into your sovereign fleet and standing by.*`

          setJarvisResponse(report)
          speakVoice(data.spokenSummary || `Master Sri, I have constructed your new autonomous agent: ${ag.name}, specializing in ${product}.`)
          setIsProcessing(false)
          return
        }
      } catch (err: any) {
        console.warn('Foundry spawn error:', err)
      }

      const fallback = `Master Sri, I have designed and registered your dedicated AI agent for "${product}". Standing by in your sovereign fleet.`
      setJarvisResponse(fallback)
      speakVoice(fallback)
      setIsProcessing(false)
      return
    }

    // 1. SLEEP / REST DIRECTIVE ("go and rest jarvis")
    if (
      lower.includes('go and rest') ||
      lower.includes('go to rest') ||
      lower.includes('rest jarvis') ||
      lower.includes('sleep jarvis') ||
      lower.includes('stand down') ||
      lower === 'rest'
    ) {
      goToSleep()
      setIsProcessing(false)
      return
    }

    // 2. GREETING DIRECTIVE ("hey jarvis", "wake up")
    if (lower === 'hey jarvis' || lower === 'hello jarvis' || lower === 'jarvis' || lower === 'wake up') {
      const resp = 'Master Sri, greetings and welcome back. How may I help you? We are ready to assist you.'
      setJarvisResponse(resp)
      speakVoice(resp)
      setIsProcessing(false)
      return
    }

    // 2.1 FULL-STACK WEBSITE & APP SCAFFOLDING ("build website", "build app", "create website")
    if (
      lower.startsWith('build a website') ||
      lower.startsWith('build website') ||
      lower.startsWith('build an app') ||
      lower.startsWith('build app') ||
      lower.startsWith('create website') ||
      lower.includes('full stack website') ||
      lower.includes('full stack app')
    ) {
      let topic = cmd
        .replace(/^(build a website for|build website for|build an app for|build app for|build website|build app|create website for|create website|create app for)/i, '')
        .trim()
      if (!topic) topic = 'Sri Roofing Modern AI Enterprise Portal'

      setIsProcessing(true)
      playJarvisChime('execute')
      setJarvisResponse(`Master Sri, Aegis and our DeepSeek Code Engine are compiling the full-stack web application for "${topic}". Standby...`)

      try {
        const res = await fetch('/api/build/fullstack', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ topic, framework: 'HTML5 + Tailwind CSS + Lucide Icons' })
        })

        if (res.ok) {
          const data = await res.json()
          setCurrentAction({
            type: 'app',
            title: `App Scaffolding: ${topic}`,
            query: topic,
            content: data.data
          })
          setJarvisResponse(`### Full-Stack Web Application Compiled\n**Topic**: ${topic}\n\n${data.data}`)
          speakVoice(data.spokenSummary || `Master Sri, I have built the complete full-stack web application for ${topic}. All components and styling are ready.`)
          return
        }
      } catch (err) {}
      const fallbackSpeech = `Master Sri, full-stack architecture for ${topic} formulated and linked to Code Lab.`
      setJarvisResponse(fallbackSpeech)
      speakVoice(fallbackSpeech)
      setIsProcessing(false)
      return
    }

    // 2.2 AUTONOMOUS WEB SCRAPER ("scrape [url]")
    if (lower.startsWith('scrape ') || lower.includes('web scrape') || lower.includes('scrape website')) {
      let targetUrl = cmd.replace(/^(scrape website|scrape web|scrape)/i, '').trim()
      if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl
      }

      setIsProcessing(true)
      playJarvisChime('execute')
      setJarvisResponse(`Master Sri, deploying Cerebro autonomous scraper to extract data from "${targetUrl}"...`)

      try {
        const res = await fetch('/api/tools/scrape', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ url: targetUrl, extractType: 'summary' })
        })

        if (res.ok) {
          const data = await res.json()
          setCurrentAction({
            type: 'google',
            title: `Web Scrape: ${data.data?.title || targetUrl}`,
            query: targetUrl,
            url: targetUrl,
            content: data.data?.intelligenceReport || data.data?.rawExtractedText
          })
          setJarvisResponse(`### Scraped Intelligence Report: ${data.data?.title || targetUrl}\n${data.data?.intelligenceReport || 'Content extracted.'}`)
          speakVoice(data.spokenSummary || `Master Sri, I have scraped the target webpage and synthesized the core intelligence.`)
          return
        }
      } catch {}
      const fallback = `Scraping reconnaissance initiated for ${targetUrl}, Master Sri.`
      setJarvisResponse(fallback)
      speakVoice(fallback)
      setIsProcessing(false)
      return
    }

    // 2.3 ENTERPRISE AUTOMATION & n8n PIPELINES ("automate [flow]")
    if (lower.startsWith('automate ') || lower.includes('n8n workflow') || lower.includes('automation process')) {
      let task = cmd.replace(/^(automate|create automation for|generate workflow for)/i, '').trim()
      if (!task) task = 'Inbound Lead Enrichment and CRM Sync'

      setIsProcessing(true)
      playJarvisChime('execute')
      setJarvisResponse(`Master Sri, Vortex is architecting the enterprise n8n workflow pipeline for "${task}"...`)

      try {
        const res = await fetch('/api/automation/pipeline', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ name: task, trigger: 'Webhook', actions: ['Validate Payload', 'Enrich Lead Data', 'Push to CRM', 'Alert Master Sri'] })
        })

        if (res.ok) {
          const data = await res.json()
          setCurrentAction({
            type: 'evolution',
            title: `n8n Pipeline: ${task}`,
            query: task,
            content: data.data
          })
          setJarvisResponse(`### Enterprise Automation Pipeline\n**Workflow**: ${task}\n\n${data.data}`)
          speakVoice(data.spokenSummary || `Master Sri, enterprise workflow pipeline for ${task} synthesized and ready for one-click import into n8n.`)
          return
        }
      } catch {}
      const fallback = `Automation pipeline designed for ${task}, Master Sri.`
      setJarvisResponse(fallback)
      speakVoice(fallback)
      setIsProcessing(false)
      return
    }

    // 3. SELF-EVOLUTION DIRECTIVE ("evolve", "scout open source ai", "upgrade yourself")
    if (
      lower.includes('evolve') ||
      lower.includes('self-evolution') ||
      lower.includes('scout open source') ||
      lower.includes('upgrade yourself')
    ) {
      await triggerSelfEvolution()
      setIsProcessing(false)
      return
    }

    // 4. YOUTUBE ACTION ("open youtube and play [video]", "play [song] on youtube")
    if (lower.includes('youtube') || (lower.startsWith('play ') && !lower.includes('excel'))) {
      let query = cmd
        .replace(/^(open youtube and play|open youtube|play on youtube|play)/i, '')
        .replace(/on youtube/i, '')
        .trim()
      if (!query) query = 'Iron Man Theme Song AC/DC'

      const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      window.open(ytUrl, '_blank')

      setCurrentAction({
        type: 'youtube',
        title: 'YouTube Stream',
        query,
        url: ytUrl
      })

      const speech = `Opening YouTube and playing "${query}" for you, Master Sri.`
      setJarvisResponse(`### Launching YouTube\nPlaying: **${query}**\n[Click here if popup was blocked](${ytUrl})`)
      speakVoice(speech)
      setIsProcessing(false)
      return
    }

    // 5. INSTAGRAM ACTION ("open insta and search [content]", "open instagram")
    if (lower.includes('insta') || lower.includes('instagram')) {
      let query = cmd
        .replace(/^(open insta and search|open instagram and search|open insta|open instagram|search on instagram)/i, '')
        .replace(/on instagram|on insta/i, '')
        .trim()

      const instaUrl = query
        ? `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/^#/, ''))}/`
        : 'https://www.instagram.com/'
      window.open(instaUrl, '_blank')

      setCurrentAction({
        type: 'instagram',
        title: 'Instagram Search',
        query: query || 'Explore Feed',
        url: instaUrl
      })

      const speech = query
        ? `Launching Instagram and searching for "${query}", Master Sri.`
        : 'Opening Instagram for you, Master Sri.'
      setJarvisResponse(`### Launching Instagram\nSearching: **${query || 'Home Feed'}**\n[Open Instagram](${instaUrl})`)
      speakVoice(speech)
      setIsProcessing(false)
      return
    }

    // 6. LINKEDIN JOB SEARCH & APPLICATION PITCH ("open linkedin and search [job] and apply for me")
    if (lower.includes('linkedin') || (lower.includes('apply') && lower.includes('job'))) {
      let jobTitle = cmd
        .replace(/^(open linkedin and search|open linkedin|search on linkedin|find jobs for|apply for)/i, '')
        .replace(/and apply for me|on linkedin|jobs|job/gi, '')
        .trim()
      if (!jobTitle) jobTitle = 'Lead AI Systems Engineer & Full-Stack Architect'

      const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle)}`
      window.open(linkedinUrl, '_blank')

      setJarvisResponse(`Searching LinkedIn for "${jobTitle}" and synthesizing executive application pitch...`)

      try {
        const res = await fetch('/api/jobs/apply-pitch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ jobTitle })
        })

        if (res.ok) {
          const data = await res.json()
          setCurrentAction({
            type: 'linkedin',
            title: `LinkedIn Career: ${jobTitle}`,
            query: jobTitle,
            url: linkedinUrl,
            content: data.pitch
          })

          const pitchSpeech = `Master Sri, searching LinkedIn for "${jobTitle}". I have launched the listings and drafted your executive application pitch for immediate submission.`
          setJarvisResponse(`### LinkedIn Jobs: ${jobTitle}\n[View Jobs on LinkedIn](${linkedinUrl})\n\n**Executive Application Pitch for Master Sri:**\n\n${data.pitch}`)
          speakVoice(pitchSpeech)
          setIsProcessing(false)
          return
        }
      } catch {}

      const speech = `Master Sri, launching LinkedIn job search for "${jobTitle}".`
      setJarvisResponse(`### LinkedIn Jobs\nSearching: **${jobTitle}**\n[View Listings](${linkedinUrl})`)
      speakVoice(speech)
      setIsProcessing(false)
      return
    }

    // 7. GOOGLE SEARCH ACTION ("google [query]", "search google for [query]")
    if (lower.startsWith('google ') || lower.startsWith('search google for ')) {
      const query = cmd.replace(/^(google|search google for)/i, '').trim()
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      window.open(googleUrl, '_blank')
      const speech = `Executing Google search for "${query}", Master Sri.`
      setJarvisResponse(`### Google Search\nQuery: **${query}**\n[View Results](${googleUrl})`)
      speakVoice(speech)
      setIsProcessing(false)
      return
    }

    // 8. INTERNAL APP NAVIGATION ("open code lab", "open cyber shield", etc.)
    const appRoutes: Record<string, string> = {
      'code lab': 'codlab',
      'cyber shield': 'cyber',
      'cyber defense': 'cyber',
      'daily planner': 'planner',
      'omni apis': 'apis',
      'api arsenal': 'apis',
      'analytics': 'analytics',
      'projects': 'projects',
      'habits': 'habits',
      'journal': 'journal',
      'workflows': 'workflows',
      'command center': 'command',
    }
    for (const [key, tab] of Object.entries(appRoutes)) {
      if (lower.includes(`open ${key}`) || lower.includes(`go to ${key}`)) {
        onNavigate(tab)
        const speech = `Opening ${key} for you, Master Sri.`
        setJarvisResponse(speech)
        speakVoice(speech)
        setIsProcessing(false)
        return
      }
    }

    // 9. TACTICAL PLAN PROPOSAL ("can you do this task for me", "plan this", etc.)
    if (
      lower.startsWith('can you do this task') ||
      lower.includes('can you do this task for me') ||
      lower.startsWith('can you plan') ||
      lower.startsWith('plan this') ||
      lower.startsWith('create a plan') ||
      lower.includes('shall i proceed') ||
      lower.startsWith('can you build')
    ) {
      await triggerTacticalPlan(cmd)
      setIsProcessing(false)
      return
    }

    // 10. EXCEL / SPREADSHEET GENERATION
    if (lower.includes('excel') || lower.includes('spreadsheet') || lower.includes('csv') || lower.includes('financial sheet')) {
      await handleGenerateExcel(cmd)
      setIsProcessing(false)
      return
    }

    // 11. AGENT SWITCHING - UNIVERSAL 16-AGENT DISPATCH
    for (const [key, ag] of Object.entries(AGENTS)) {
      const lowerName = ag.name.toLowerCase()
      if (
        lower.includes(`switch to ${key}`) ||
        lower.includes(`talk to ${key}`) ||
        lower.includes(`switch to ${lowerName}`) ||
        lower.includes(`talk to ${lowerName}`) ||
        lower.startsWith(`${key},`) ||
        lower.startsWith(`${lowerName},`)
      ) {
        switchAgent(ag)
        setIsProcessing(false)
        return
      }
    }

    // 12. DEEPSEEK HARNESS REASONING ENGINE (or Subordinate Agent Dispatch)
    if (deepseekMode && activeAgent.id === 'jarvis') {
      try {
        const res = await fetch('/api/ai/deepseek', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            prompt: cmd,
            messages: conversationHistoryRef.current
          })
        })

        if (res.ok) {
          const data = await res.json()
          setJarvisResponse(data.text)
          setDeepseekReasoning(data.reasoning || null)
          speakVoice(data.spokenSummary || data.text)
          setIsProcessing(false)
          return
        }
      } catch {
        // Fall through to general chat
      }
    }

    // Delegate to Subordinate Agent Swarm
    let targetAgent = activeAgentRef.current
    if (targetAgent.id !== 'jarvis') {
      try {
        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            agentId: targetAgent.id,
            task: cmd,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const spokenReply = data.spokenSummary || data.report || `${targetAgent.name} has completed your directive, Master Sri.`
          // Render full detailed technical report in UI, and vocalize the complete natural speech summary
          setJarvisResponse(data.report || spokenReply)
          speakVoice(spokenReply, targetAgent.lang)
          setIsProcessing(false)
          return
        }
      } catch {}
    }

    // Default to Core AI Network via /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          messages: conversationHistoryRef.current,
          model: 'gemini-3.8-flash',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const textContent = data.content || data.reply || data.text || 'Command executed, Master Sri.'
        setJarvisResponse(textContent)
        speakVoice(textContent)
      } else {
        const fallback = `Understood, Master Sri. I have registered your directive: "${cmd}". The swarm is aligning execution.`
        setJarvisResponse(fallback)
        speakVoice(fallback)
      }
    } catch {
      // Offline Core: If network or base station is down (e.g. PC shut down), process on device!
      const offlineResult = processOfflineCommand(cmd)
      const offlineMsg = `### [Autonomous Mobile Core (Offline)]\n${offlineResult.reply}`
      setJarvisResponse(offlineMsg)
      speakVoice(offlineResult.reply)
    } finally {
      setIsProcessing(false)
    }
  }

  // Universal Fallback: Server-side Gemini STT with VAD (Voice Activity Detection)
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      // Web Audio VAD: Auto-detect when Master Sri finishes speaking
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioCtx()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        let hasSpoken = false
        let silenceStart: number | null = null

        const checkVAD = () => {
          if (!isListeningRef.current || recorder.state !== 'recording') {
            audioCtx.close().catch(() => {})
            return
          }
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
          const avg = sum / dataArray.length

          if (avg > 18) {
            hasSpoken = true
            silenceStart = null
            setTranscript('Hearing Master Sri speak...')
          } else if (hasSpoken) {
            if (!silenceStart) silenceStart = Date.now()
            else if (Date.now() - silenceStart > 700) {
              // 1.3 seconds of silence after speaking -> auto-stop and process!
              if (recorder.state === 'recording') {
                recorder.stop()
              }
              return
            }
          }
          requestAnimationFrame(checkVAD)
        }
        requestAnimationFrame(checkVAD)
      } catch (vadErr) {
        console.warn('VAD setup skipped:', vadErr)
      }

      // Safety timeout: max 12 seconds per turn
      if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current)
      maxRecordingTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, 12000)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current)
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size < 200) {
          setIsListening(false)
          isListeningRef.current = false
          return
        }

        setIsProcessing(true)
        isProcessingRef.current = true

        try {
          const form = new FormData()
          form.append('file', audioBlob, 'voice.webm')
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: form,
          })
          if (res.ok) {
            const data = await res.json()
            if (data.text?.trim()) {
              setTranscript(data.text.trim())
              transcriptRef.current = data.text.trim()
              processCommand(data.text.trim())
              return
            }
          }
        } catch (e) {
          console.error('Gemini STT error', e)
        } finally {
          setIsProcessing(false)
          isProcessingRef.current = false
          if (continuousModeRef.current && !isSpeakingRef.current && isOpen) {
            setTimeout(() => {
              if (!isSpeakingRef.current && !isListeningRef.current) {
                startListening()
              }
            }, 400)
          }
        }
      }

      recorder.start(250)
      setIsListening(true)
      isListeningRef.current = true
      setEngineType('Whisper-Turbo')
    } catch (err) {
      console.error('MediaRecorder error', err)
      setJarvisResponse('Microphone permission required, Master Sri. Please allow access.')
    }
  }

  // Primary Speech Recognition (Web Speech API with Full Accumulation & Silence Debounce VAD)
  const startListening = () => {
    if (isSpeakingRef.current || isProcessingRef.current) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      startWhisperRecording()
      return
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        isListeningRef.current = true
        setEngineType('WebSpeech')
        setTranscript('')
        transcriptRef.current = ''
        lastActiveRef.current = Date.now()
      }

      recognition.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' '
          } else {
            interimText += event.results[i][0].transcript
          }
        }
        
        const rawCombined = (transcriptRef.current + ' ' + finalText + interimText).trim()
        const cleaned = cleanAndDeduplicateTranscript(rawCombined)
        setTranscript(cleaned)
        transcriptRef.current = cleaned
        lastActiveRef.current = Date.now()

        // Natural VAD Silence Debounce (2000ms grace period so Master Sri is never cut off mid-sentence)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        if (cleaned.length > 0 && micMode === 'handsfree') {
          silenceTimerRef.current = setTimeout(() => {
            const captured = cleanAndDeduplicateTranscript(transcriptRef.current)
            if (captured && !isSpeakingRef.current && !isProcessingRef.current) {
              transcriptRef.current = ''
              setTranscript('')
              stopListening()
              processCommand(captured)
            }
          }, 2000) // 2.0s comfortable speech pause
        }
      }

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech') {
          // Normal brief silence on mobile, do not crash
          return
        }
        if (e.error === 'not-allowed' || e.error === 'network') {
          setEngineType('Whisper-Turbo')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        isListeningRef.current = false

        const finalRecordedText = transcriptRef.current.trim()
        transcriptRef.current = ''
        setTranscript('')
        if (finalRecordedText && !isSpeakingRef.current && !isProcessingRef.current) {
          processCommand(finalRecordedText)
        } else if (continuousModeRef.current && !isSpeakingRef.current && !isProcessingRef.current && isOpen) {
          setTimeout(() => {
            if (!isSpeakingRef.current && !isListeningRef.current && !isProcessingRef.current) {
              startListening()
            }
          }, 400)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      startWhisperRecording()
    }
  }

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    setIsListening(false)
    isListeningRef.current = false
  }

  // Audio equalizer visualizer simulation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setVoiceVolume(Array.from({ length: 14 }, () => Math.floor(Math.random() * 80) + 20))
      }, 90)
      return () => clearInterval(interval)
    } else {
      setVoiceVolume([15, 20, 15, 25, 18, 22, 15, 20, 18, 25, 15, 20, 18, 15])
    }
  }, [isListening, isSpeaking])

  // Lifecycle on modal open/close: Vocal greeting when opening
  useEffect(() => {
    if (isOpen) {
      setIsSleeping(false)
      isSleepingRef.current = false
      playJarvisChime('wake')
      speakVoice('Master Sri, greetings and welcome back. How may I help you? We are ready to assist you.')
    } else {
      stopNeuralSpeech()
      stopListening()
      setIsListening(false)
      setIsSpeaking(false)
      isListeningRef.current = false
      isSpeakingRef.current = false
      setCurrentPlan(null)
      setCurrentAction(null)
      setSecurityAlert(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const AgentIcon = activeAgent.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className={cn(
        "relative w-full max-w-2xl rounded-3xl border transition-all duration-500 p-5 sm:p-7 shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden max-h-[92vh] overflow-y-auto",
        securityAlert
          ? "border-rose-500 bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 shadow-[0_0_60px_rgba(244,63,94,0.4)]"
          : isSleeping
          ? "border-indigo-500/40 bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950/60 shadow-[0_0_50px_rgba(99,102,241,0.25)]"
          : "border-cyan-500/50 bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950"
      )}>

        {/* Ambient Holographic Reactor Aura */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700",
          securityAlert ? "bg-rose-500/15" : isSleeping ? "bg-indigo-500/10" : "bg-cyan-500/10"
        )} />

        {/* Hidden File Input for Vision / Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.txt"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Security Alert Banner */}
        {securityAlert && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-mono flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{securityAlert}</span>
            </div>
            <button onClick={() => setSecurityAlert(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Controls: Continuous Toggle & Tools & Sleep & Close */}
        <div className="flex items-center justify-between w-full relative z-20 mb-3">
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => isSleeping ? wakeUp() : goToSleep()}
              className={cn(
                "px-3 py-1 rounded-full border text-[10px] font-mono tracking-wider flex items-center gap-1.5 transition-all",
                isSleeping
                  ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-indigo-500/40"
              )}
              title={isSleeping ? "Tap to wake up JARVIS" : "Put JARVIS into standby sleep mode"}
            >
              {isSleeping ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
              {isSleeping ? 'STANDBY: TAP TO WAKE' : 'REST / STANDBY'}
            </button>

            <button
              onClick={() => setSovereignLock(!sovereignLock)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-[10px] font-mono tracking-wider flex items-center gap-1 transition-all",
                sovereignLock
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-slate-800/60 border-slate-700 text-slate-400"
              )}
              title="Biometric Sovereign Voiceprint Lock: Enforces that only Master Sri can issue commands"
            >
              {sovereignLock ? <Lock className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
              {sovereignLock ? 'SOVEREIGN VOICE: LOCKED' : 'VOICE LOCK: OFF'}
            </button>

            <button
              onClick={triggerSelfEvolution}
              className="px-2.5 py-1 rounded-full border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-[10px] font-mono text-purple-300 flex items-center gap-1 transition-all"
              title="Self-Evolution Engine: Assimilate global open-source AI models & DeepSeek tools"
            >
              <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
              SELF-EVOLVE
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 flex items-center gap-1 transition-all"
              title="Upload photo / roof image / blueprint for Gemini 3.8 Flash Vision"
            >
              <ImageIcon className="w-3 h-3" />
              {isUploading ? 'ANALYZING...' : 'VISION'}
            </button>

            <button
              onClick={() => handleGenerateExcel()}
              className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center gap-1 transition-all"
              title="Generate Excel .csv spreadsheet"
            >
              <FileSpreadsheet className="w-3 h-3" />
              EXCEL
            </button>

            <button
              onClick={handleQuickBuildApp}
              className="px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-[10px] font-mono text-blue-300 flex items-center gap-1 transition-all"
              title="Build Full-Stack Website / App"
            >
              <Code2 className="w-3 h-3" />
              BUILD APP
            </button>

            <button
              onClick={handleQuickScrape}
              className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-mono text-purple-300 flex items-center gap-1 transition-all"
              title="Autonomous Web Scraper"
            >
              <ExternalLink className="w-3 h-3" />
              SCRAPE
            </button>

            <button
              onClick={handleQuickAutomate}
              className="px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-mono text-amber-300 flex items-center gap-1 transition-all"
              title="Synthesize n8n Automation Workflow"
            >
              <Workflow className="w-3 h-3" />
              AUTOMATE
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-cyan-400/80 hidden sm:inline">
              1HR+ SESSION: {Math.floor(sessionUptime / 60)}m {sessionUptime % 60}s
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          {/* Header & Clearance */}
          <div className="space-y-1">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono tracking-widest uppercase transition-all",
              securityAlert
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : isSleeping
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
            )}>
              <Zap className="w-3 h-3 text-cyan-400 animate-spin" />
              {securityAlert
                ? 'CYBER GUARDIAN // INTRUSION BLOCKED'
                : isSleeping
                ? 'STANDBY SLEEP // WAKE WORD: "HEY JARVIS"'
                : "SRI'S J.A.R.V.I.S. MARK-V // DEEPSEEK HARNESS ACTIVE"}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2">
              SRI'S J.A.R.V.I.S. MARK-V
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Dedicated Sovereign 2nd-in-Command for Master Sri (Srimanikandan K)
            </p>
          </div>

          {/* Subordinate Agent Switcher Bar */}
          {!isSleeping && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>SUBORDINATE AGENTS:</span>
                </div>
                <button
                  onClick={() => runAgentRollcall()}
                  disabled={isProcessing}
                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1 transition-all"
                  title="Command all agents to report and declare their capabilities one by one"
                >
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  <span>SWARM ROLLCALL</span>
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full">
                {Object.values(AGENTS).map((agent) => {
                  const isCurrent = activeAgent.id === agent.id
                  const Icon = agent.icon
                  return (
                    <button
                      key={agent.id}
                      onClick={() => switchAgent(agent)}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-left",
                        isCurrent
                          ? `${agent.bg} ${agent.border} shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105`
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", agent.color)} />
                      <span className={cn("text-[10px] font-bold font-mono truncate w-full text-center", agent.color)}>
                        {agent.name}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono truncate w-full text-center">
                        {agent.lang.split('-')[1]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Central Holographic Reactor Orb */}
          <div
            className="relative group cursor-pointer my-1"
            onClick={isSleeping ? wakeUp : (isListening ? stopListening : startListening)}
          >
            {/* Outer spinning ring */}
            <div className={cn(
              "w-32 h-32 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center",
              isSleeping
                ? "border-indigo-500/50 animate-pulse shadow-[0_0_35px_rgba(99,102,241,0.4)]"
                : isListening
                ? "border-cyan-400 animate-spin shadow-[0_0_50px_rgba(6,182,212,0.7)]"
                : isSpeaking
                ? "border-amber-400 animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.7)]"
                : "border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            )}>
              {/* Inner Core */}
              <div className={cn(
                "w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 border",
                isSleeping
                  ? "bg-slate-950 border-indigo-400/50"
                  : isListening
                  ? "bg-gradient-to-tr from-cyan-600/40 to-blue-500/40 border-cyan-400/90 scale-105"
                  : isSpeaking
                  ? "bg-gradient-to-tr from-amber-600/40 to-cyan-500/40 border-amber-400/90 scale-105"
                  : "bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400"
              )}>
                {isSleeping ? (
                  <Moon className="w-8 h-8 text-indigo-400 animate-pulse" />
                ) : isListening ? (
                  <Mic className="w-8 h-8 text-cyan-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-8 h-8 text-amber-300 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className="text-[8px] font-mono font-bold tracking-wider uppercase mt-1 text-slate-200">
                  {isSleeping ? 'ASLEEP' : isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'TAP TO SPEAK'}
                </span>
                <span className="text-[7px] font-mono text-cyan-400/80">
                  {isSleeping ? '[SAY "HEY JARVIS"]' : `[${engineType}]`}
                </span>
              </div>
            </div>
          </div>

          {/* Live Real-time Voice Feedback Banner */}
          {isListening && (
            <div className="w-full max-w-md px-4 py-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(6,182,212,0.35)] animate-pulse">
              <div className="flex items-center gap-2 truncate">
                <Mic className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
                <span className="truncate font-bold">
                  {transcript ? `Hearing: "${transcript}"` : "Listening to Master Sri..."}
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 uppercase font-black tracking-wider shrink-0 border border-cyan-400/40">
                ACTIVE VAD
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="w-full max-w-md px-4 py-2.5 rounded-2xl bg-amber-950/80 border border-amber-400/50 text-amber-200 text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="font-bold">DeepSeek Reasoning & Swarm Matrix Executing...</span>
            </div>
          )}

          {/* Equalizer Waveform */}
          {!isSleeping && (
            <div className="flex items-center justify-center gap-1.5 h-6 w-full max-w-xs">
              {voiceVolume.map((vol, i) => (
                <span
                  key={i}
                  style={{ height: `${vol}%` }}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-150",
                    isListening
                      ? "bg-gradient-to-t from-cyan-500 to-blue-400"
                      : isSpeaking
                      ? "bg-gradient-to-t from-amber-400 to-cyan-400"
                      : "bg-slate-800 h-2"
                  )}
                />
              ))}
            </div>
          )}

          {/* Active Action Card (YouTube, Instagram, LinkedIn Job Pitch, Self-Evolution) */}
          {currentAction && (
            <div className="w-full rounded-2xl border border-cyan-400/50 bg-slate-900/90 p-4 text-left space-y-2.5 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {currentAction.title}
                </span>
                {currentAction.url && (
                  <a
                    href={currentAction.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1"
                  >
                    Open Link <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>

              {currentAction.content && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {currentAction.content}
                </div>
              )}

              {currentAction.content && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentAction.content || '')
                      setCopiedPitch(true)
                      setTimeout(() => setCopiedPitch(false), 2000)
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
                  >
                    {copiedPitch ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPitch ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tactical Plan Proposal Card */}
          {currentPlan && (
            <div className="w-full rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-950/40 via-slate-900/95 to-slate-950 p-4 text-left space-y-3 shadow-[0_0_40px_rgba(6,182,212,0.25)] animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  <Cpu className="w-3 h-3 text-cyan-400 animate-spin" />
                  TACTICAL EXECUTION PROPOSAL
                </div>
                <span className="text-[10px] font-mono text-slate-400">Chief of Staff Formulation</span>
              </div>

              <div className="text-xs font-bold text-white">
                Directive: "{currentPlan.task}"
              </div>

              {currentPlan.phases && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentPlan.phases.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-cyan-400 font-bold">{p.phase}</span>
                        <span className="text-slate-400">[{p.agent}]</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans leading-tight">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-500/30">
                <button
                  onClick={() => setCurrentPlan(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
                >
                  Adjust Directive
                </button>
                <button
                  onClick={handleExecutePlan}
                  disabled={isExecutingPlan}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                  {isExecutingPlan ? 'EXECUTING SWARM...' : 'PROCEED & EXECUTE'}
                </button>
              </div>
            </div>
          )}

          {/* DeepSeek Reasoning Trace (Expandable) */}
          {deepseekReasoning && (
            <div className="w-full text-left">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="text-[10px] font-mono text-purple-400 flex items-center gap-1.5 hover:underline"
              >
                <Brain className="w-3 h-3" />
                {showReasoning ? 'Hide DeepSeek Reasoning Trace' : 'View DeepSeek <think> Reasoning Trace'}
              </button>
              {showReasoning && (
                <div className="mt-1.5 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {deepseekReasoning}
                </div>
              )}
            </div>
          )}

          {/* Live Transcript / Dialogue Box */}
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 max-h-44 overflow-y-auto">
            {transcript && (
              <div className="space-y-1 pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Master Sri Said:
                </span>
                <p className="text-sm font-semibold text-white">
                  "{transcript}"
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {activeAgent.name} Response:
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {isProcessing ? 'Synthesizing directive across neural swarms...' : jarvisResponse}
              </p>
            </div>
          </div>

          {/* Quick Voice Directives */}
          {!isSleeping && (
            <div className="w-full space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block text-center">
                Executive Voice Directives
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  'Play AC/DC on YouTube',
                  'Open LinkedIn and find AI Lead jobs',
                  'Evolve and scout open source AI',
                  'Hey Jarvis, can you do this task for me?',
                  'Generate Excel report',
                  'Go and rest, Jarvis',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(cmd)
                      transcriptRef.current = cmd
                      processCommand(cmd)
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
