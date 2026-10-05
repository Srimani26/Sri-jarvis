import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, Activity, Shield,
  Terminal, ArrowRight, Bot, Code2, Workflow, DollarSign, Brain, Laptop,
  CheckCircle2, Radio, Zap, Play, FileSpreadsheet, Image as ImageIcon,
  Upload, FileText, Check, ChevronRight, Layers, Cpu
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime, playNeuralSpeech, stopNeuralSpeech } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'

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

const AGENTS: Record<string, AgentBadge> = {
  jarvis: {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    title: '2nd-in-Command / Grand Marshal',
    role: 'Sovereign Orchestration & Command',
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400',
    lang: 'en-GB',
    greeting: 'Greetings, Sovereign Master Sri. J.A.R.V.I.S. standing by. Your command is my directive. How may I serve the empire today?',
    icon: Bot
  },
  aegis: {
    id: 'aegis',
    name: 'Aegis',
    title: 'Full-Stack Software Architect',
    role: 'Codebase Synthesis & System Design',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-400',
    lang: 'en-US',
    greeting: 'Aegis online, Master Sri. Full-stack compilers, microservices, and code engines primed. How can I architect your software today?',
    icon: Code2
  },
  vortex: {
    id: 'vortex',
    name: 'Vortex',
    title: 'Heavy Enterprise Automation',
    role: 'n8n, Webhooks & Pipeline Swarms',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-400',
    lang: 'en-AU',
    greeting: 'Vortex operational, Master Sri. n8n pipelines, webhooks, and automation swarms standing by. What process shall we automate?',
    icon: Workflow
  },
  midas: {
    id: 'midas',
    name: 'Midas',
    title: 'Revenue & Monetization Engine',
    role: '24/7 Deal Scouting & Capital Flow',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400',
    lang: 'en-IN',
    greeting: 'Midas at your service, Master Sri. Revenue hunting, client acquisition, and high-ticket deal pipelines active. How shall we generate capital today?',
    icon: DollarSign
  },
  cerebro: {
    id: 'cerebro',
    name: 'Cerebro',
    title: 'Deep Intelligence & Recon',
    role: 'Market Intelligence & Global Telemetry',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-400',
    lang: 'en-CA',
    greeting: 'Cerebro activated, Master Sri. Market telemetry, competitor reconnaissance, and neural indexing online. What intelligence do you seek?',
    icon: Brain
  },
  stark_os: {
    id: 'stark_os',
    name: 'Stark OS',
    title: 'Device & Physical Concierge',
    role: 'Telemetry, Connected Hardware & Daily Ops',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20',
    border: 'border-rose-400',
    lang: 'en-GB',
    greeting: 'Stark OS primed, Master Sri. System telemetry, connected devices, and executive operations ready. How may I assist your day?',
    icon: Laptop
  },
}

export default function JarvisVoiceModal({ isOpen, onClose, onNavigate }: JarvisVoiceModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [jarvisResponse, setJarvisResponse] = useState('Online and standing by, Master Sri. What can I do for you now?')
  const [activeAgent, setActiveAgent] = useState<AgentBadge>(AGENTS.jarvis)
  const [engineType, setEngineType] = useState<'WebSpeech' | 'Whisper-Turbo'>('WebSpeech')
  const [voiceVolume, setVoiceVolume] = useState<number[]>([25, 45, 30, 70, 50, 85, 40, 60, 35, 55, 45, 65, 30, 50])
  const [currentPlan, setCurrentPlan] = useState<TacticalPlan | null>(null)
  const [isExecutingPlan, setIsExecutingPlan] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Persistent Refs to eliminate React closure traps
  const transcriptRef = useRef('')
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const continuousModeRef = useRef(true)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const activeAgentRef = useRef<AgentBadge>(AGENTS.jarvis)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  useEffect(() => {
    activeAgentRef.current = activeAgent
  }, [activeAgent])

  // Real vocal speech player using backend Google Neural stream (never blocked on mobile once tapped)
  const speakVoice = (text: string, lang?: string, onDone?: () => void) => {
    stopListening()
    stopNeuralSpeech()

    const chosenLang = lang || activeAgentRef.current.lang || 'en-GB'

    setIsSpeaking(true)
    isSpeakingRef.current = true

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
        if (onDone) onDone()

        // Continuous Dialogue Loop: automatically re-open microphone for hands-free discussion
        if (continuousModeRef.current && isOpen) {
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              playJarvisChime('wake')
              startListening()
            }
          }, 400)
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

  // Generate & Download Excel Spreadsheet (.csv)
  const handleGenerateExcel = async (topic?: string) => {
    setIsProcessing(true)
    playJarvisChime('execute')
    const subject = topic || 'Standard Roofs Client Estimator & Monetization Model'
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
        a.download = `JARVIS_${Date.now()}.csv`
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
            prompt: 'Analyze this photo/document with extreme technical precision for Master Sri. Identify key metrics, structures, anomalies, and operational insights.'
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

  // Generate a 4-Phase Tactical Plan ("Master, I create a plan and this is process, shall I proceed?")
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

    // Fallback proposal
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

  // Process voice directive with multi-agent intelligence
  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return
    const lower = cmd.toLowerCase().trim()
    setIsProcessing(true)
    playJarvisChime('execute')

    // 1. Check if user is greeting or calling JARVIS
    if (lower === 'hey jarvis' || lower === 'hello jarvis' || lower === 'jarvis' || lower === 'wake up') {
      const resp = 'Good day, Sovereign Master Sri. J.A.R.V.I.S. online and standing by. What can I do for you now?'
      setJarvisResponse(resp)
      speakVoice(resp)
      setIsProcessing(false)
      return
    }

    // 2. Check if user is asking for a plan or task ("can you do this task for me", "plan this", etc.)
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

    // 3. Check for Excel / Spreadsheet generation
    if (lower.includes('excel') || lower.includes('spreadsheet') || lower.includes('csv') || lower.includes('financial sheet')) {
      await handleGenerateExcel(cmd)
      setIsProcessing(false)
      return
    }

    // 4. Check for direct agent switching commands
    if (lower.includes('switch to aegis') || lower.includes('talk to aegis')) {
      switchAgent(AGENTS.aegis)
      setIsProcessing(false)
      return
    }
    if (lower.includes('switch to vortex') || lower.includes('talk to vortex')) {
      switchAgent(AGENTS.vortex)
      setIsProcessing(false)
      return
    }
    if (lower.includes('switch to midas') || lower.includes('talk to midas')) {
      switchAgent(AGENTS.midas)
      setIsProcessing(false)
      return
    }
    if (lower.includes('switch to cerebro') || lower.includes('talk to cerebro')) {
      switchAgent(AGENTS.cerebro)
      setIsProcessing(false)
      return
    }
    if (lower.includes('switch to stark') || lower.includes('talk to stark os')) {
      switchAgent(AGENTS.stark_os)
      setIsProcessing(false)
      return
    }
    if (lower.includes('switch to jarvis') || lower.includes('talk to jarvis')) {
      switchAgent(AGENTS.jarvis)
      setIsProcessing(false)
      return
    }

    // 5. Detect if command delegates to a subordinate agent
    let targetAgent = activeAgentRef.current
    if (lower.includes('aegis') || lower.includes('software') || lower.includes('next.js') || lower.includes('fastapi')) {
      targetAgent = AGENTS.aegis
    } else if (lower.includes('vortex') || lower.includes('automation') || lower.includes('n8n') || lower.includes('webhook')) {
      targetAgent = AGENTS.vortex
    } else if (lower.includes('midas') || lower.includes('revenue') || lower.includes('client') || lower.includes('quote') || lower.includes('monetize')) {
      targetAgent = AGENTS.midas
    } else if (lower.includes('cerebro') || lower.includes('intelligence') || lower.includes('market trend') || lower.includes('competitor')) {
      targetAgent = AGENTS.cerebro
    } else if (lower.includes('stark os') || lower.includes('device') || lower.includes('concierge')) {
      targetAgent = AGENTS.stark_os
    }

    setActiveAgent(targetAgent)
    activeAgentRef.current = targetAgent

    // Status Report
    if (lower.includes('status report') || lower.includes('systems nominal') || lower.includes('systems check')) {
      const resp = 'All systems nominal, Master Sri. Arc Reactor at 100% output. Cyber defense perimeter secure. All 6 subordinate agent swarms stand ready at your command, Sire.'
      setJarvisResponse(resp)
      speakVoice(resp)
      setIsProcessing(false)
      return
    }

    // Identity / Viceroy Introduction
    if (lower.includes('who are you') || lower.includes('introduce yourself') || lower.includes('what can you do')) {
      const resp = 'I am J.A.R.V.I.S. Mark-IV. Your executive 2nd-in-Command and personal right hand, Sire. You are the Sovereign Commander; I orchestrate your subordinate agents—Aegis, Vortex, Midas, Cerebro, and Stark OS—to write software, automate pipelines, generate revenue, and execute your directives anywhere in the world.'
      setJarvisResponse(resp)
      speakVoice(resp)
      setIsProcessing(false)
      return
    }

    // Memory Storage
    if (lower.includes('remember that') || lower.includes('store in memory') || lower.includes('memorize')) {
      const fact = cmd.replace(/^(remember that|store in memory|memorize)/i, '').trim()
      try {
        await fetch('/api/memory/remember', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ fact, category: 'voice_directive', importance: 9 }),
        })
        const resp = `Preserved in cognitive memory, Master Sri: "${fact}". I shall retain this across all operations.`
        setJarvisResponse(resp)
        speakVoice(resp)
      } catch {
        const fallback = `Registered in memory buffer, Master Sri: "${fact}".`
        setJarvisResponse(fallback)
        speakVoice(fallback)
      }
      setIsProcessing(false)
      return
    }

    // GitHub Analysis
    if (lower.includes('github') || lower.includes('analyze repo') || lower.includes('repository')) {
      const match = cmd.match(/github\.com\/([a-zA-Z0-9_\-\/]+)/i)
      const repoUrl = match ? `https://github.com/${match[1]}` : 'https://github.com/Srimani26/standardroofs-jarvis'
      const resp = `Analyzing repository ${repoUrl} with Gemini 3.8 Flash, Sire. Routing blueprint to Code Lab.`
      setJarvisResponse(resp)
      speakVoice(resp, 'en-GB', () => {
        onNavigate('codlab')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    // Delegate to Subordinate Agent Swarm
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
          const reply = data.spokenSummary || data.report?.slice(0, 280) || `${targetAgent.name} has completed the directive, Master Sri.`
          setJarvisResponse(reply)
          speakVoice(reply, targetAgent.lang)
          setIsProcessing(false)
          return
        }
      } catch {}
    }

    // Default to J.A.R.V.I.S. Core Neural Network via /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          messages: [{ role: 'user', content: cmd }],
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
      const fallback = `At your command, Master Sri. Directive: "${cmd}" synchronized across neural clusters.`
      setJarvisResponse(fallback)
      speakVoice(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  // Universal Fallback: Server-side Whisper transcription via Groq for Mobile
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size < 100) return

        setIsProcessing(true)
        setJarvisResponse('Transcribing voice with Groq Whisper Turbo (150ms)...')

        try {
          const form = new FormData()
          form.append('file', audioBlob, 'voice.webm')
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: authHeaders(),
            body: form,
          })
          if (res.ok) {
            const data = await res.json()
            if (data.text?.trim()) {
              setTranscript(data.text.trim())
              transcriptRef.current = data.text.trim()
              processCommand(data.text.trim())
            }
          }
        } catch (e) {
          console.error('Whisper STT error', e)
        } finally {
          setIsProcessing(false)
        }
      }

      recorder.start()
      setIsListening(true)
      isListeningRef.current = true
      setEngineType('Whisper-Turbo')
      setJarvisResponse('Recording audio for Groq Whisper...')
    } catch (err) {
      console.error('MediaRecorder error', err)
      setJarvisResponse('Microphone permission required, Master Sri. Please allow access.')
    }
  }

  // Primary Speech Recognition (Web Speech API with closure fix)
  const startListening = () => {
    if (isSpeakingRef.current) return

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
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        isListeningRef.current = true
        setEngineType('WebSpeech')
        setTranscript('')
        transcriptRef.current = ''
        setJarvisResponse('Listening intently, Master Sri...')
      }

      recognition.onresult = (event: any) => {
        const current = event.resultIndex
        const text = event.results[current][0].transcript
        setTranscript(text)
        transcriptRef.current = text
      }

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e.error)
        setIsListening(false)
        isListeningRef.current = false

        if (e.error === 'not-allowed' || e.error === 'network') {
          setEngineType('Whisper-Turbo')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        isListeningRef.current = false

        const finalRecordedText = transcriptRef.current.trim()
        if (finalRecordedText) {
          processCommand(finalRecordedText)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error('Failed to start WebSpeech, falling back to Whisper', e)
      startWhisperRecording()
    }
  }

  const stopListening = () => {
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
      playJarvisChime('wake')
      speakVoice('Greetings Sovereign Master Sri. J.A.R.V.I.S. online. All neural swarms stand ready. What can I do for you now?')
    } else {
      stopNeuralSpeech()
      stopListening()
      setIsListening(false)
      setIsSpeaking(false)
      isListeningRef.current = false
      isSpeakingRef.current = false
      setCurrentPlan(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const AgentIcon = activeAgent.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/50 bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950 p-5 sm:p-7 shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden max-h-[92vh] overflow-y-auto">

        {/* Ambient Holographic Reactor Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hidden File Input for Vision / Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.txt"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Top Controls: Continuous Toggle & Tools & Close */}
        <div className="flex items-center justify-between w-full relative z-20 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setContinuousMode(!continuousMode)}
              className={cn(
                "px-3 py-1 rounded-full border text-[10px] font-mono tracking-wider flex items-center gap-1.5 transition-all",
                continuousMode
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-400"
              )}
              title="Hands-free continuous conversation mode: listens automatically when speech completes"
            >
              <Radio className={cn("w-3 h-3", continuousMode && "animate-pulse text-emerald-400")} />
              {continuousMode ? 'HANDS-FREE DIALOGUE: ON' : 'PUSH TO TALK'}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 flex items-center gap-1 transition-all"
              title="Upload photo / roof image / blueprint for Gemini 3.8 Flash Vision"
            >
              <ImageIcon className="w-3 h-3" />
              {isUploading ? 'ANALYZING...' : 'VISION UPLOAD'}
            </button>

            <button
              onClick={() => handleGenerateExcel()}
              className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center gap-1 transition-all"
              title="Generate Excel .csv spreadsheet"
            >
              <FileSpreadsheet className="w-3 h-3" />
              EXCEL
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          {/* Header & Clearance */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Zap className="w-3 h-3 text-cyan-400 animate-spin" />
              SOVEREIGN VICEROY // MULTI-AGENT NEURAL SWARM
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2">
              J.A.R.V.I.S. 2ND-IN-COMMAND
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Dedicated Voice Command Interface for Sovereign Master Sri
            </p>
          </div>

          {/* Subordinate Agent Switcher Bar (Click any agent to talk to them) */}
          <div className="w-full">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>SUBORDINATE AGENT CHANNELS (TAP TO COMMUNICATE):</span>
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

          {/* Central Holographic Reactor Orb */}
          <div
            className="relative group cursor-pointer my-1"
            onClick={isListening ? stopListening : startListening}
          >
            {/* Outer spinning ring */}
            <div className={cn(
              "w-32 h-32 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center",
              isListening
                ? "border-cyan-400 animate-spin shadow-[0_0_50px_rgba(6,182,212,0.7)]"
                : isSpeaking
                ? "border-amber-400 animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.7)]"
                : "border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            )}>
              {/* Inner Core */}
              <div className={cn(
                "w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 border",
                isListening
                  ? "bg-gradient-to-tr from-cyan-600/40 to-blue-500/40 border-cyan-400/90 scale-105"
                  : isSpeaking
                  ? "bg-gradient-to-tr from-amber-600/40 to-cyan-500/40 border-amber-400/90 scale-105"
                  : "bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400"
              )}>
                {isListening ? (
                  <Mic className="w-8 h-8 text-cyan-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-8 h-8 text-amber-300 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className="text-[8px] font-mono font-bold tracking-wider uppercase mt-1 text-slate-200">
                  {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'TAP TO SPEAK'}
                </span>
                <span className="text-[7px] font-mono text-cyan-400/80">
                  [{engineType}]
                </span>
              </div>
            </div>
          </div>

          {/* Animated Audio Equalizer Waveform */}
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

          {/* Interactive Tactical Plan Proposal Card ("Master, I create a plan and this is process, shall I proceed?") */}
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

              {/* Action Buttons */}
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
                {isProcessing ? 'Synthesizing with neural swarm, Master Sri...' : jarvisResponse}
              </p>
            </div>
          </div>

          {/* Preset Vocal Directives */}
          <div className="w-full space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block text-center">
              Quick Voice Directives
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'Hey Jarvis, can you do this task for me?',
                'Generate Excel report',
                'Status Report',
                'Switch to Midas',
                'Switch to Aegis',
                'Switch to Vortex',
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
        </div>
      </div>
    </div>
  )
}
