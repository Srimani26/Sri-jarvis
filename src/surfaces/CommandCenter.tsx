import { useState, useEffect, useRef } from 'react'
import {
  Zap, TrendingUp, Clock, Bot, Code2, Globe, Mail, BarChart3, Target, ArrowUpRight,
  Calendar, Cpu, Workflow, Mic, Shield, Sparkles, Plane, ShoppingBag, Terminal, Activity, Brain,
  Laptop, DollarSign, Layers, ChevronDown, ChevronUp, Play, CheckCircle2, Database, Radio,
  ShieldAlert, RefreshCw, Compass
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime, playNeuralSpeech } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import TaskProgressCard, { AgentTask } from '@/components/TaskProgressCard'

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatClock() {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const SPECIALIST_AGENTS = [
  {
    id: 'aegis',
    name: 'Aegis',
    role: 'Code & Architecture',
    desc: 'Next.js 15, REST APIs, unit tests, code AST scan',
    icon: Code2,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-300'
  },
  {
    id: 'vortex',
    name: 'Vortex',
    role: 'Enterprise Automation',
    desc: 'Crawl4AI web extraction, n8n webhooks, API pipelines',
    icon: Workflow,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-300'
  },
  {
    id: 'midas',
    name: 'Midas',
    role: 'Revenue & Monetization',
    desc: 'SaaS cash flow models, deal velocity, Telegram leads',
    icon: DollarSign,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-300'
  },
  {
    id: 'cerebro',
    name: 'Cerebro',
    role: 'Deep Intel & Research',
    desc: 'Multi-vector RAG, technical intelligence, OSINT',
    icon: Brain,
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/15 text-purple-300'
  },
  {
    id: 'stark_os',
    name: 'Stark OS',
    role: 'Diagnostics & Health',
    desc: 'SQLite durable storage, memory vectors, server logs',
    icon: Laptop,
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/15 text-rose-300'
  }
]

interface CommandCenterProps {
  onNavigate?: (tab: string) => void
  onVoiceTrigger?: () => void
}

export default function CommandCenter({ onNavigate, onVoiceTrigger }: CommandCenterProps) {
  const [clock, setClock] = useState(formatClock())
  const [activeMode, setActiveMode] = useState<'dispatch' | 'terminal' | 'voice'>('dispatch')
  const [targetAgent, setTargetAgent] = useState('aegis')
  const [commandInput, setCommandInput] = useState('')
  const [isDispatching, setIsDispatching] = useState(false)

  // Live Task Stream
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null)
  const [rollcallOutput, setRollcallOutput] = useState<string | null>(null)
  const [isRollcalling, setIsRollcalling] = useState(false)

  // Quick Tools
  const [tradingResult, setTradingResult] = useState<any>(null)
  const [isTradingLoading, setIsTradingLoading] = useState(false)
  const [osintResult, setOsintResult] = useState<any>(null)
  const [isOsintLoading, setIsOsintLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        const fetched: AgentTask[] = data.tasks || []
        setAgentTasks(fetched)
        if (fetched.length > 0) {
          const running = fetched.find(t => t.status === 'RUNNING' || t.status === 'QUEUED')
          if (running) {
            setActiveTask(running)
          } else if (!activeTask) {
            setActiveTask(fetched[0])
          }
        }
      }
    } catch {}
  }

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/tasks/stream')
      eventSource.onmessage = (e) => {
        try {
          const eventData = JSON.parse(e.data)
          if (eventData.id || eventData.eventType) {
            fetchTasks()
          }
        } catch {}
      }
    } catch {}

    return () => {
      clearInterval(interval)
      if (eventSource) eventSource.close()
    }
  }, [])

  const handleVoiceClick = () => {
    playJarvisChime('wake')
    if (onVoiceTrigger) onVoiceTrigger()
  }

  const handleDispatchCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!commandInput.trim() || isDispatching) return

    const directive = commandInput.trim()
    setIsDispatching(true)
    playJarvisChime('execute')

    try {
      if (activeMode === 'voice') {
        if (onVoiceTrigger) onVoiceTrigger()
        setIsDispatching(false)
        setCommandInput('')
        return
      }

      if (activeMode === 'terminal') {
        const res = await fetch('/api/terminal/execute', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ command: directive })
        })
        if (res.ok) {
          playJarvisChime('wake')
          fetchTasks()
        }
      } else {
        let selected = targetAgent
        const lower = directive.toLowerCase()
        if (lower.startsWith('aegis')) selected = 'aegis'
        else if (lower.startsWith('vortex')) selected = 'vortex'
        else if (lower.startsWith('midas')) selected = 'midas'
        else if (lower.startsWith('cerebro')) selected = 'cerebro'
        else if (lower.startsWith('stark')) selected = 'stark_os'

        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            agentId: selected,
            task: directive,
            autonomous: true,
            react: true
          })
        })

        if (res.ok) {
          playJarvisChime('wake')
          await fetchTasks()
        }
      }
    } catch (err) {
      console.error('[CommandCenter] Dispatch error:', err)
    } finally {
      setIsDispatching(false)
      setCommandInput('')
    }
  }

  const handleTriggerRollcall = async () => {
    if (isRollcalling) return
    setIsRollcalling(true)
    playJarvisChime('wake')
    try {
      const res = await fetch('/api/agents/rollcall', {
        method: 'POST',
        headers: jsonAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setRollcallOutput(data.unifiedBrief || 'All specialist agents reporting nominal.')
        playJarvisChime('execute')
      }
    } catch (err) {
      console.warn('Rollcall failed:', err)
    } finally {
      setIsRollcalling(false)
    }
  }

  const runQuickTrading = async (symbol = 'NVDA') => {
    setIsTradingLoading(true)
    playJarvisChime('wake')
    try {
      const res = await fetch(`/api/tools/trading?symbol=${symbol}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTradingResult(data)
        playJarvisChime('execute')
      }
    } catch {
    } finally {
      setIsTradingLoading(false)
    }
  }

  const runQuickOsint = async (target = 'render.com') => {
    setIsOsintLoading(true)
    playJarvisChime('wake')
    try {
      const res = await fetch(`/api/tools/osint?target=${target}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setOsintResult(data)
        playJarvisChime('execute')
      }
    } catch {
    } finally {
      setIsOsintLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-100 min-h-screen">
      
      {/* Hero Portal Deck */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-950 border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left Greeting & Salutation */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>J.A.R.V.I.S. MARK-V // COMMAND PORTAL</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">Master Sri</span>.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-sans leading-relaxed">
                Your sovereign multi-agent OS is primed. 20 specialist agents armed, with 2,182 Public APIs and frontier cloud reasoning standing by.
              </p>
            </div>

            {/* Live Telemetry Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                CLOUD 70B+ (GROQ / GEMINI / CLAUDE)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Database className="w-3 h-3 text-cyan-400" />
                SQLITE KERNEL: 1,850+ TASKS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <Brain className="w-3 h-3 text-purple-400" />
                259 COGNITIVE VECTORS
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {clock}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {formatDate()}
              </span>
            </div>
          </div>

          {/* Fluid Apple Siri / Cyberpunk Liquid Arc Reactor */}
          <div className="flex flex-col items-center justify-center w-full lg:w-auto">
            <div
              onClick={handleVoiceClick}
              className="relative group cursor-pointer flex flex-col items-center select-none"
              title="Click to initialize J.A.R.V.I.S. duplex neural voice comms"
            >
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 blur-2xl opacity-60 group-hover:opacity-95 transition-opacity animate-pulse" />

              <div
                className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_50px_rgba(6,182,212,0.55)] group-hover:shadow-[0_0_70px_rgba(6,182,212,0.9)] flex items-center justify-center animate-spin transition-all"
                style={{ animationDuration: '6s' }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-900/95 to-slate-950 flex flex-col items-center justify-center backdrop-blur-xl border border-cyan-400/40 group-hover:border-cyan-300">
                  <Mic className="w-7 h-7 text-cyan-300 group-hover:scale-115 drop-shadow-[0_0_12px_#22d3ee] transition-transform animate-pulse" />
                  <span className="text-[8px] font-mono font-bold text-cyan-300 uppercase mt-0.5 tracking-wider">
                    SIRI VOICE
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold text-cyan-300 mt-2.5 uppercase tracking-wider">
                DUPLEX VOICE TRANSCEIVER
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                Tap to speak with British Neural Voice
              </span>
            </div>
          </div>
        </div>

        {/* Unified Command Input Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMode('dispatch')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'dispatch'
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Bot className="w-3.5 h-3.5" />
                Swarm Dispatch
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('terminal')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'terminal'
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                Terminal CLI
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('voice')
                  handleVoiceClick()
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'voice'
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Mic className="w-3.5 h-3.5" />
                Voice Comm
              </button>
            </div>

            {activeMode === 'dispatch' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Specialist:</span>
                <select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  className="bg-slate-950/80 border border-cyan-500/30 rounded-xl px-3 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="aegis">Aegis [Code & Architecture]</option>
                  <option value="vortex">Vortex [Automation & Crawl4AI]</option>
                  <option value="midas">Midas [Revenue & Monetization]</option>
                  <option value="cerebro">Cerebro [Deep Intelligence & RAG]</option>
                  <option value="stark_os">Stark OS [Diagnostics & Telemetry]</option>
                </select>
              </div>
            )}
          </div>

          <form onSubmit={handleDispatchCommand} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder={
                activeMode === 'terminal'
                  ? "Execute shell command (e.g. 'npm test', 'git status', 'node -v')..."
                  : activeMode === 'voice'
                  ? "Type or tap the microphone to command J.A.R.V.I.S...."
                  : `Dispatch directive to ${targetAgent.toUpperCase()} (e.g. 'Scaffold full-stack app', 'Best TWS deal under 2000')...`
              }
              className="flex-1 bg-slate-950/90 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 shadow-inner"
            />
            <button
              type="submit"
              disabled={isDispatching || !commandInput.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              {isDispatching ? 'EXECUTING...' : 'DISPATCH'}
            </button>
          </form>
        </div>
      </div>

      {/* 4 Core Executive Action Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Pillar 1: AI Chat & Persistent Memory */}
        <div
          onClick={() => onNavigate && onNavigate('chat')}
          className="p-5 rounded-3xl bg-slate-950/70 hover:bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-xl transition-all duration-300 cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
              CHATGPT / CLAUDE
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
              <span>AI Chat & Memory</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Persistent conversation history, 1-click code copying, and 259 cognitive memory vectors.
            </p>
          </div>
        </div>

        {/* Pillar 2: Real-Output Task Cockpit */}
        <div
          onClick={() => onNavigate && onNavigate('tasks')}
          className="p-5 rounded-3xl bg-slate-950/70 hover:bg-slate-900/90 border border-blue-500/30 hover:border-blue-400/60 backdrop-blur-xl transition-all duration-300 cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-bold">
              REAL OUTPUT
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
              <span>Tasks & Missions</span>
              <ArrowUpRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              6-stage deterministic execution pipeline with real stdout logs, modified files, and QA proof.
            </p>
          </div>
        </div>

        {/* Pillar 3: B2B Revenue Hunter */}
        <div
          onClick={() => onNavigate && onNavigate('revenue')}
          className="p-5 rounded-3xl bg-slate-950/70 hover:bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 backdrop-blur-xl transition-all duration-300 cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
              MONETIZATION
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
              <span>Revenue Hunter</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Scouts high-ticket freelance retainers, Telegram deals, and automated CRM quotation pipelines.
            </p>
          </div>
        </div>

        {/* Pillar 4: Cyber Shield & OSINT */}
        <div
          onClick={() => onNavigate && onNavigate('cyber')}
          className="p-5 rounded-3xl bg-slate-950/70 hover:bg-slate-900/90 border border-purple-500/30 hover:border-purple-400/60 backdrop-blur-xl transition-all duration-300 cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
              SECURITY
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
              <span>Cyber Shield</span>
              <ArrowUpRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              OSINT perimeter scanning, DNS, SSL certificate checks, and AST vulnerability defense.
            </p>
          </div>
        </div>

      </div>

      {/* Active Mission Telemetry HUD */}
      {activeTask && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE TASK TELEMETRY HUD // KERNEL OBSERVABILITY</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              TASK: #{activeTask.taskNumber}
            </span>
          </div>
          <TaskProgressCard
            task={activeTask}
            onDismiss={() => setActiveTask(null)}
          />
        </div>
      )}

      {/* Specialist Agent Fleet Roster */}
      <div className="rounded-3xl bg-slate-950/70 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Specialist Agent Fleet</h3>
          </div>

          <button
            onClick={handleTriggerRollcall}
            disabled={isRollcalling}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
          >
            <Radio className={cn("w-3.5 h-3.5 text-cyan-400", isRollcalling ? "animate-spin" : "animate-pulse")} />
            <span>{isRollcalling ? 'RUNNING ROLLCALL...' : 'SWARM ROLLCALL'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SPECIALIST_AGENTS.map((ag) => {
            const Icon = ag.icon
            return (
              <div
                key={ag.id}
                onClick={() => {
                  setTargetAgent(ag.id)
                  setActiveMode('dispatch')
                }}
                className={cn(
                  "p-4 rounded-2xl bg-slate-900/60 border hover:border-cyan-400/50 transition-all space-y-2 cursor-pointer group shadow-md",
                  ag.border
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn("w-5 h-5", ag.color)} />
                  <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase", ag.badge)}>
                    {ag.name}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{ag.role}</h4>
                  <p className="text-[10px] text-slate-400 font-sans leading-tight mt-1 line-clamp-2">{ag.desc}</p>
                </div>
                <button className="w-full mt-2 py-1 rounded-lg bg-slate-950 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-cyan-300" /> Dispatch
                </button>
              </div>
            )
          })}
        </div>

        {rollcallOutput && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono space-y-1.5 animate-in fade-in">
            <span className="text-cyan-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Unified Fleet Rollcall Output
            </span>
            <p className="text-slate-200 whitespace-pre-line leading-relaxed">
              {rollcallOutput}
            </p>
          </div>
        )}
      </div>

      {/* Specialist Intelligence Radar (TradingAgents Quant & flowsint OSINT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quant Scanner */}
        <div className="p-5 rounded-3xl bg-slate-950/70 border border-amber-500/30 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                TradingAgents Quant Deck
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              FinceptTerminal
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Multi-factor technical scan: RSI, MACD, Bollinger Bands, and Volume deltas.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => runQuickTrading('NVDA')}
              disabled={isTradingLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 transition-all flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {isTradingLoading ? 'Scanning...' : 'Scan NVDA'}
            </button>
            <button
              type="button"
              onClick={() => runQuickTrading('BTC')}
              disabled={isTradingLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              Scan BTC
            </button>
          </div>
          {tradingResult && (
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-[10px] font-mono text-slate-300 space-y-1 animate-in fade-in">
              <div className="flex justify-between text-amber-300 font-bold">
                <span>{tradingResult.symbol}: ${tradingResult.price}</span>
                <span className={tradingResult.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {tradingResult.change >= 0 ? '+' : ''}{tradingResult.change}%
                </span>
              </div>
              <div className="text-slate-400 text-[9px] leading-relaxed">{tradingResult.summary}</div>
            </div>
          )}
        </div>

        {/* OSINT Radar */}
        <div className="p-5 rounded-3xl bg-slate-950/70 border border-cyan-500/30 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                flowsint OSINT Recon Radar
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Perimeter Audit
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Autonomous DNS, SSL certificates, MX records, and perimeter attack surface reconnaissance.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => runQuickOsint('render.com')}
              disabled={isOsintLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              {isOsintLoading ? 'Auditing...' : 'Audit Cloud'}
            </button>
            <button
              type="button"
              onClick={() => runQuickOsint('github.com')}
              disabled={isOsintLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              Audit GitHub
            </button>
          </div>
          {osintResult && (
            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-[10px] font-mono text-slate-300 space-y-1 animate-in fade-in">
              <div className="flex justify-between text-cyan-300 font-bold">
                <span>{osintResult.target}</span>
                <span className="text-emerald-400">Risk Score: {osintResult.riskScore}/100</span>
              </div>
              <div className="text-slate-400 text-[9px] leading-relaxed">{osintResult.summary}</div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
