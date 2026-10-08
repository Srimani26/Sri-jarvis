import { useState, useEffect, useRef } from 'react'
import {
  Zap, TrendingUp, Clock, Bot, Code2, Globe, Mail, BarChart3, Target, ArrowUpRight,
  Calendar, Cpu, Workflow, Mic, Shield, Sparkles, Plane, ShoppingBag, Terminal, Activity, Brain,
  Laptop, DollarSign, Layers, ChevronDown, ChevronUp, Play, CheckCircle2, Database, Radio
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

const PROJECTS = [
  { name: 'Omni-API Arsenal Integration', company: 'Standard Roofs', progress: 100, status: 'active', icon: '🌐' },
  { name: 'Zoho CRM Quotation Bot', company: 'Standard Roofs', progress: 88, status: 'active', icon: '⚡' },
  { name: 'AI Google Ads v5.0', company: 'Standard Roofs', progress: 95, status: 'active', icon: '📊' },
  { name: 'Sri AI Business OS', company: 'Personal', progress: 96, status: 'active', icon: '🧠' },
]

const TODAY_TASKS = [
  { text: 'Deploy Omni-API Arsenal with 2,001 public endpoints', done: true },
  { text: 'Activate Aegis Zero-Trust cyber perimeter for Master Sri', done: true },
  { text: 'Verify Continuous Voice Transceiver & British Speech Output', done: false },
  { text: 'Execute flight fare & gadget price comparison queries', done: false },
  { text: 'Monitor multi-agent swarm autonomous tasks', done: false },
]

const SPECIALIST_AGENTS = [
  {
    id: 'aegis',
    name: 'Aegis',
    role: 'Code & Architecture',
    desc: 'Next.js 15, FastAPI, unit tests, code analysis',
    icon: Code2,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/15 text-blue-300'
  },
  {
    id: 'vortex',
    name: 'Vortex',
    role: 'Enterprise Automation',
    desc: 'n8n webhooks, API pipelines, data crawlers',
    icon: Workflow,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/15 text-amber-300'
  },
  {
    id: 'midas',
    name: 'Midas',
    role: 'Revenue & Monetization',
    desc: 'SaaS financial models, unit economics, deal velocity',
    icon: DollarSign,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/15 text-emerald-300'
  },
  {
    id: 'cerebro',
    name: 'Cerebro',
    role: 'Deep Intelligence & RAG',
    desc: 'Technical docs, deep research, multi-vector indexing',
    icon: Brain,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/15 text-purple-300'
  },
  {
    id: 'stark_os',
    name: 'Stark OS',
    role: 'Diagnostics & Telemetry',
    desc: 'Neon PostgreSQL telemetry, memory diagnostics, logistics',
    icon: Laptop,
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/15 text-rose-300'
  }
]

interface CommandCenterProps {
  onNavigate?: (tab: string) => void
  onVoiceTrigger?: () => void
}

export default function CommandCenter({ onNavigate, onVoiceTrigger }: CommandCenterProps) {
  const [clock, setClock] = useState(formatClock())
  const [tasks, setTasks] = useState(TODAY_TASKS)
  const [coreOutput] = useState(99.4)

  // Dispatch & Mode state
  const [activeMode, setActiveMode] = useState<'voice' | 'terminal' | 'dispatch'>('dispatch')
  const [targetAgent, setTargetAgent] = useState('aegis')
  const [commandInput, setCommandInput] = useState('')
  const [isDispatching, setIsDispatching] = useState(false)

  // Active Mission Drawer state
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null)
  const [showRosterDrawer, setShowRosterDrawer] = useState(false)
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false)
  const [rollcallOutput, setRollcallOutput] = useState<string | null>(null)
  const [isRollcalling, setIsRollcalling] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Poll tasks & subscribe to live SSE stream
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
    } catch (err) {
      console.warn('[CommandCenter] Failed to fetch tasks:', err)
    }
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

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, done: !t.done } : t))
  }

  const doneCount = tasks.filter(t => t.done).length

  const handleVoiceClick = () => {
    playJarvisChime('wake')
    playNeuralSpeech('Master Sri, greetings and welcome back. How may I help you? We are ready to assist you.', 'en-GB')
    if (onVoiceTrigger) onVoiceTrigger()
  }

  // Dispatch command from integrated input bar
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
        // Agent Dispatch
        let selected = targetAgent
        // Detect explicit mention in text (e.g., "Vortex, scrape...")
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
            task: directive
          })
        })

        if (res.ok) {
          const data = await res.json()
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

  // Trigger Multi-Agent Rollcall
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
        setRollcallOutput(data.unifiedBrief || 'All 5 specialist agents reporting nominal.')
        playJarvisChime('execute')
      }
    } catch (err) {
      console.warn('Rollcall failed:', err)
    } finally {
      setIsRollcalling(false)
    }
  }

  // Quick Quant & OSINT Tools (TradingAgents & flowsint)
  const [tradingResult, setTradingResult] = useState<any>(null)
  const [isTradingLoading, setIsTradingLoading] = useState(false)
  const [osintResult, setOsintResult] = useState<any>(null)
  const [isOsintLoading, setIsOsintLoading] = useState(false)

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
    } catch (e) {
      console.warn('Trading telemetry error:', e)
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
    } catch (e) {
      console.warn('OSINT error:', e)
    } finally {
      setIsOsintLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 stark-bg text-slate-100 min-h-screen">
      {/* =========================================================================
          STARK GLASSMORPHISM COCKPIT BANNER WITH REACTIVE ARC REACTOR
          ========================================================================= */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-cyan-500/30 p-5 md:p-8 shadow-[0_0_70px_rgba(6,182,212,0.2)] overflow-hidden backdrop-blur-2xl">
        {/* Ambient Arc Core Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:1.75rem_1.75rem] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Info & Salutation */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>SRI'S J.A.R.V.I.S. MARK-V // DUPLEX NEURAL COCKPIT</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white">
                {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">Master Sri</span>.
              </h1>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Arc Core at {coreOutput}% • 20 Autonomous Swarms • Deepgram Nova-2 + ElevenLabs Turbo Online
              </p>
            </div>

            {/* Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                <Shield className="w-3 h-3 text-emerald-400" />
                SOVEREIGN VOICEPRINT: LOCKED TO SRI
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                SIRI DUPLEX VAD: 5S SILENCE GRACE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono">
                <Database className="w-3 h-3 text-blue-400" />
                POSTGRESQL DURABLE CLOUD
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {clock}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {formatDate()}
              </span>
            </div>
          </div>

          {/* Central / Right: Apple Siri Fluid Glowing Liquid Arc Reactor */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto justify-end">
            <div
              onClick={handleVoiceClick}
              className="relative group cursor-pointer flex flex-col items-center select-none"
              title="Tap Liquid Arc Core to initialize J.A.R.V.I.S. Siri duplex voice transceiver"
            >
              {/* Concentric Ambient Blur Halo */}
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity animate-pulse" />

              {/* Dynamic Smooth Neon Fluid Ring (NO DASHED LINES) */}
              <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_45px_rgba(6,182,212,0.6)] group-hover:shadow-[0_0_65px_rgba(6,182,212,0.85)] flex items-center justify-center animate-spin transition-all" style={{ animationDuration: '6s' }}>
                {/* Inner Siri Glass Core */}
                <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-cyan-950/80 flex flex-col items-center justify-center backdrop-blur-xl border border-cyan-400/40 group-hover:border-cyan-300">
                  <Mic className="w-7 h-7 text-cyan-300 group-hover:scale-115 drop-shadow-[0_0_12px_#22d3ee] transition-transform animate-pulse" />
                  <span className="text-[7px] font-mono font-bold text-cyan-300 uppercase mt-0.5 tracking-wider">
                    SIRI VOICE
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-cyan-300 mt-2 uppercase tracking-wider">
                DUPLEX VOICE ENGINE
              </span>
              <span className="text-[8px] font-mono text-slate-400">
                [TAP TO SPEAK // 5S GRACE]
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            UNIFIED COMMAND INPUT BAR WITH MODE TOGGLES (SECTION 5)
            ===================================================================== */}
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
                Agent Dispatch
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
                <span className="text-[10px] font-mono text-slate-400 uppercase">Target Specialist:</span>
                <select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  className="bg-slate-950/80 border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="aegis">Aegis [Code & Architecture]</option>
                  <option value="vortex">Vortex [Enterprise Automation]</option>
                  <option value="midas">Midas [Revenue & Monetization]</option>
                  <option value="cerebro">Cerebro [Deep Intelligence & RAG]</option>
                  <option value="stark_os">Stark OS [System Diagnostics]</option>
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
                  : `Dispatch directive to ${targetAgent.toUpperCase()} (e.g. 'Audit database schemas', 'Check Stripe invoices')...`
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

      {/* =========================================================================
          LIVE EXECUTION HUD & ACTIVE MISSION DRAWER (SECTION 2)
          ========================================================================= */}
      {activeTask && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              ACTIVE MISSION TELEMETRY HUD [LIVE SSE STREAM]
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              TASK: {activeTask.taskNumber}
            </span>
          </div>
          <TaskProgressCard
            task={activeTask}
            onDismiss={() => setActiveTask(null)}
          />
        </div>
      )}

      {/* =========================================================================
          COLLAPSIBLE SPECIALIST AGENT ROSTER & MULTI-AGENT ROLLCALL (SECTION 3)
          ========================================================================= */}
      <div className="rounded-3xl stark-glass-card border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRosterDrawer(!showRosterDrawer)}
            className="flex items-center gap-2.5 text-left text-sm font-bold text-white hover:text-cyan-300 transition-colors"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Specialist Fleet Roster & Domain Routing</span>
            {showRosterDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={handleTriggerRollcall}
            disabled={isRollcalling}
            className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
            title="Command all specialist agents to execute sequential rollcall"
          >
            <Radio className={cn("w-3.5 h-3.5 text-cyan-400", isRollcalling ? "animate-spin" : "animate-pulse")} />
            <span>{isRollcalling ? 'RUNNING ROLLCALL...' : 'MULTI-AGENT ROLLCALL'}</span>
          </button>
        </div>

        {/* Collapsible Content */}
        {showRosterDrawer && (
          <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {SPECIALIST_AGENTS.map((ag) => {
                const Icon = ag.icon
                return (
                  <div
                    key={ag.id}
                    className={cn(
                      "p-3.5 rounded-2xl bg-slate-950/70 border hover:border-cyan-400/50 transition-all space-y-2 cursor-pointer",
                      ag.border
                    )}
                    onClick={() => {
                      setTargetAgent(ag.id)
                      setActiveMode('dispatch')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={cn("w-5 h-5", ag.color)} />
                      <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase", ag.badge)}>
                        {ag.name}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{ag.role}</h4>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">{ag.desc}</p>
                    </div>
                    <button
                      className="w-full mt-2 py-1 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-cyan-300" /> Dispatch
                    </button>
                  </div>
                )
              })}
            </div>

            {rollcallOutput && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <span className="text-cyan-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Unified Multi-Agent Rollcall Status Report
                </span>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {rollcallOutput}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          KEY TELEMETRY METRICS & ACTIVE DIRECTIVES
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl stark-glass-card border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Core Frequency</div>
              <div className="text-xl font-black text-cyan-400 font-mono mt-1">4.82 GHz</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Ultra-Nominal</div>
            </div>

            <div className="p-4 rounded-2xl stark-glass-card border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Neon Cloud DB</div>
              <div className="text-xl font-black text-blue-400 font-mono mt-1">POSTGRES</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">● Durable Verified</div>
            </div>

            <div className="p-4 rounded-2xl stark-glass-card border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Defense Grid</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">LEVEL 10</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Zero-Trust Shield</div>
            </div>

            <div className="p-4 rounded-2xl stark-glass-card border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Autonomous Swarms</div>
              <div className="text-xl font-black text-purple-400 font-mono mt-1">20 AGENTS</div>
              <div className="text-[10px] text-purple-300 font-mono mt-0.5">● Deepgram + ElevenLabs</div>
            </div>
          </div>

          {/* Active Business Projects */}
          <div className="p-6 rounded-2xl stark-glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Active Strategic Directives</h3>
                <p className="text-xs text-slate-400">Empire pipelines actively orchestrated by J.A.R.V.I.S.</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('projects')}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECTS.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                      {p.progress}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500">{p.company}</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${p.progress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SPECIALIST INTELLIGENCE RADAR (TradingAgents & flowsint OSINT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* TradingAgents / FinceptTerminal Quant Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl space-y-3 shadow-[0_0_30px_rgba(245,158,11,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    TradingAgents Quant Deck
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  FinceptTerminal
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-factor technicals, RSI, Bollinger Bands & Volume deltas.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runQuickTrading('NVDA')}
                  disabled={isTradingLoading}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3" />
                  {isTradingLoading ? 'Scanning...' : 'Scan NVDA'}
                </button>
                <button
                  type="button"
                  onClick={() => runQuickTrading('BTC')}
                  disabled={isTradingLoading}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Scan BTC
                </button>
              </div>
              {tradingResult && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-[10px] font-mono text-slate-300 space-y-1 animate-in fade-in">
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>{tradingResult.symbol}: ${tradingResult.price}</span>
                    <span className={tradingResult.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {tradingResult.change >= 0 ? '+' : ''}{tradingResult.change}%
                    </span>
                  </div>
                  <div className="text-slate-400 text-[9px]">{tradingResult.summary}</div>
                </div>
              )}
            </div>

            {/* flowsint OSINT Reconnaissance Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl space-y-3 shadow-[0_0_30px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    flowsint OSINT Radar
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Perimeter Audit
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Autonomous DNS, SSL, MX security and attack-surface reconnaissance.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runQuickOsint('render.com')}
                  disabled={isOsintLoading}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  {isOsintLoading ? 'Auditing...' : 'Audit Cloud'}
                </button>
                <button
                  type="button"
                  onClick={() => runQuickOsint('github.com')}
                  disabled={isOsintLoading}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Audit GitHub
                </button>
              </div>
              {osintResult && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-[10px] font-mono text-slate-300 space-y-1 animate-in fade-in">
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>{osintResult.target}</span>
                    <span className="text-emerald-400">Risk: {osintResult.riskScore}/100</span>
                  </div>
                  <div className="text-slate-400 text-[9px] truncate">IP: {osintResult.ip} • SSL: {osintResult.sslStatus}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 24/7 AUTONOMOUS REVENUE ENGINE & MIDAS RADAR */}
        <div className="rounded-3xl stark-glass-card border border-emerald-500/40 p-6 shadow-[0_0_50px_rgba(16,185,129,0.12)] space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              AGENT MIDAS // 24x7 REVENUE ENGINE
            </div>
            <h3 className="text-lg font-black tracking-wide text-white">
              Autonomous Monetization Scout
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Working 24/7 while Master Sri rests • High-ticket AI offers
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 01 // B2B AGENCY</span>
                <span className="text-xs font-bold text-emerald-300">₹75,000 / deal</span>
              </div>
              <h4 className="text-xs font-bold text-white">Zoho & WhatsApp Automation</h4>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 02 // MICRO-SAAS</span>
                <span className="text-xs font-bold text-emerald-300">₹1,50,000 / mo</span>
              </div>
              <h4 className="text-xs font-bold text-white">Sri's AI Estimator Pipeline</h4>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 03 // GLOBAL ARBITRAGE</span>
                <span className="text-xs font-bold text-emerald-300">$2,500 / retainer</span>
              </div>
              <h4 className="text-xs font-bold text-white">Autonomous n8n Swarms</h4>
            </div>
          </div>

          <button
            onClick={async () => {
              playJarvisChime('wake')
              const res = await fetch('/api/revenue/hunt', {
                method: 'POST',
                headers: jsonAuthHeaders(),
                body: JSON.stringify({ focus: 'High-Ticket Automation for Indian & Global B2B' })
              })
              if (res.ok) {
                playJarvisChime('execute')
                alert('Master Sri, Midas has finished the revenue scout cycle! Blueprints synchronized.')
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Scout Opportunities Now
          </button>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-6 rounded-2xl stark-glass-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Daily High-Priority Operations
          </h3>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {doneCount}/{tasks.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {tasks.map((t, idx) => (
            <div
              key={idx}
              onClick={() => toggleTask(idx)}
              className={cn(
                "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5",
                t.done
                  ? "bg-slate-950/40 border-slate-800/60 text-slate-500 line-through"
                  : "bg-slate-950/80 border-slate-800 text-slate-200 hover:border-cyan-500/40"
              )}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => {}}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs leading-relaxed font-sans">{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
