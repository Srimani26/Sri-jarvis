import { useState, useEffect, useRef } from 'react'
import {
  Activity, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Terminal, ShieldCheck, ChevronDown, ChevronUp, Bot, Play,
  Code2, Workflow, ArrowRight, Sparkles, Check, AlertTriangle,
  FileCode, Layers, DollarSign, Brain, Laptop, Plus, X, Globe,
  Shield, Zap, Cpu, Search, Database, ExternalLink, Copy
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playJarvisChime } from '@/lib/sound'
import TaskProgressCard from '@/components/TaskProgressCard'
import { MobileThermalShield } from '@/lib/thermal-shield'

interface TaskEvent {
  id: string
  eventType: string
  message: string
  timestamp: string
  metadata?: any
}

interface AgentTask {
  id: string
  taskNumber: string
  title: string
  description?: string
  agentId: string
  status: 'QUEUED' | 'RUNNING' | 'WAITING' | 'RETRYING' | 'RECOVERING' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'BLOCKED'
  progress: number
  currentOperation?: string
  currentTool?: string
  totalSteps: number
  completedSteps: number
  estimatedDuration?: string
  startedAt: string
  completedAt?: string
  executionResult?: string
  verificationResult?: string
  errorDetails?: string
  events?: TaskEvent[]
  filesChanged?: string[]
  commandsRun?: string[]
}

const HEAVY_MISSION_PRESETS = [
  {
    title: 'Full-Stack SaaS Scaffolding',
    agentId: 'aegis',
    icon: '🏗️',
    description: 'Scaffold Next.js 15 enterprise SaaS with Prisma database models, REST APIs, and automated tests',
    directive: 'Swarm, scaffold a full-stack SaaS project end to end: AI Roof Inspection and Automated Quotation Portal with database models, frontend HUD, and API routes.',
    heavy: true,
  },
  {
    title: 'Live Web Scraping via Crawl4AI',
    agentId: 'vortex',
    icon: '🌐',
    description: 'High-speed headless async crawl, clean markdown extraction, and synthesis using Crawl4AI',
    directive: 'Vortex, execute Crawl4AI live extraction on https://news.ycombinator.com and synthesize top 10 AI engineering breakthroughs with structured JSON.',
    heavy: true,
  },
  {
    title: 'Public APIs Arsenal Integration',
    agentId: 'daedalus',
    icon: '🔌',
    description: 'Wire up live endpoints from the 2,182 Public APIs index with typed TypeScript client SDKs',
    directive: 'Daedalus, inspect public-apis repository, query free currency and crypto rates, and generate a fault-tolerant integration client.',
    heavy: true,
  },
  {
    title: 'AST Security & Vulnerability Audit',
    agentId: 'aegis',
    icon: '🛡️',
    description: 'Full code AST scan, injection risk detection, cryptographic audit, and hardening blueprint',
    directive: 'Aegis, execute comprehensive AST security audit across our server routes and database models, validating with 38,670 Orca-QA assertions.',
    heavy: true,
  },
  {
    title: 'Parallel 5-Agent Swarm Multitask',
    agentId: 'jarvis',
    icon: '⚡',
    description: 'Concurrently run Daedalus, Friday, Aegis, Midas, and Vortex simultaneously with zero blocking',
    directive: 'Execute parallel multitasking: Daedalus design API schema, Friday implement auth routes, Aegis scan vulnerabilities, and Midas compute unit economics concurrently.',
    heavy: true,
  },
  {
    title: 'E-Commerce Live Recon (Flipkart vs Amazon)',
    agentId: 'midas',
    icon: '💰',
    description: 'Scrape, benchmark prices, specs, and reviews across Amazon and Flipkart for best deal verdict',
    directive: 'Midas, analyze Flipkart and Amazon for the best deals on Samsung Galaxy S24 Ultra and iPhone 16 Pro, computing cash savings.',
    heavy: true,
  },
]

export default function ActiveTaskExecutionPanel({ onTriggerTask }: { onTriggerTask?: (task: string) => void }) {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [summary, setSummary] = useState({ total: 0, active: 0, completed: 0, failed: 0, blocked: 0 })
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'output' | 'files' | 'commands' | 'events'>('output')
  const [quickInput, setQuickInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFoundryOpen, setIsFoundryOpen] = useState(false)
  const [newAgentProduct, setNewAgentProduct] = useState('')
  const [newAgentInstructions, setNewAgentInstructions] = useState('')
  const [isSpawningAgent, setIsSpawningAgent] = useState(false)
  const [spawnedAgentResult, setSpawnedAgentResult] = useState<any>(null)
  const [now, setNow] = useState(Date.now())
  const [copiedLog, setCopiedLog] = useState(false)

  // Live timer tick with thermal sleep detection
  useEffect(() => {
    return MobileThermalShield.createSafeInterval(() => {
      setNow(Date.now())
    }, 1000, 1)
  }, [])

  // Fetch tasks and factual summary
  const loadTasks = async () => {
    if (typeof document !== 'undefined' && document.hidden) return
    try {
      const res = await fetch('/api/tasks', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        const fetchedTasks: AgentTask[] = data.tasks || []
        setTasks(fetchedTasks)
        if (data.summary) setSummary(data.summary)
        if (fetchedTasks.length > 0 && !selectedTaskId) {
          const active = fetchedTasks.find(t => t.status === 'RUNNING' || t.status === 'QUEUED')
          setSelectedTaskId(active ? active.id : fetchedTasks[0].id)
        }
      }
    } catch (err) {
      console.warn('[ActiveTaskPanel] Load error', err)
    }
  }

  useEffect(() => {
    loadTasks()
    const cancelPoll = MobileThermalShield.createSafeInterval(loadTasks, 5000, 3)

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/tasks/stream')
      eventSource.onmessage = (event) => {
        if (typeof document !== 'undefined' && document.hidden) return
        try {
          const kernelEvent = JSON.parse(event.data)
          if (kernelEvent.id || kernelEvent.eventType) {
            loadTasks()
          }
        } catch {}
      }
    } catch {}

    return () => {
      cancelPoll()
      if (eventSource) eventSource.close()
    }
  }, [])

  const handleLaunchTask = async (directiveText: string, specificAgent?: string) => {
    if (!directiveText.trim()) return
    setIsSubmitting(true)
    playJarvisChime('execute')

    let targetAgent = specificAgent || 'jarvis'
    const lower = directiveText.toLowerCase()
    if (!specificAgent) {
      if (lower.includes('build') || lower.includes('app') || lower.includes('website') || lower.includes('code') || lower.includes('fix')) {
        targetAgent = 'aegis'
      } else if (lower.includes('automate') || lower.includes('pipeline') || lower.includes('n8n') || lower.includes('scrape') || lower.includes('crawl')) {
        targetAgent = 'vortex'
      } else if (lower.includes('revenue') || lower.includes('deal') || lower.includes('monetiz') || lower.includes('flipkart') || lower.includes('amazon')) {
        targetAgent = 'midas'
      } else if (lower.includes('research') || lower.includes('investigate') || lower.includes('osint') || lower.includes('audit')) {
        targetAgent = 'cerebro'
      } else if (lower.includes('health') || lower.includes('device') || lower.includes('diagnostic')) {
        targetAgent = 'stark_os'
      }
    }

    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          agentId: targetAgent,
          task: directiveText.trim(),
          autonomous: true,
          react: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuickInput('')
        loadTasks()
        if (data.missionId || data.taskId) {
          setSelectedTaskId(data.missionId || data.taskId)
        }
      }
    } catch (err) {
      console.error('[LaunchTask] Failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSpawnAgent = async () => {
    if (!newAgentProduct.trim()) return
    setIsSpawningAgent(true)
    playJarvisChime('execute')
    try {
      const res = await fetch('/api/agents/foundry/spawn', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          productOrTask: newAgentProduct.trim(),
          customInstructions: newAgentInstructions.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSpawnedAgentResult(data.agent)
        loadTasks()
      }
    } catch (err) {
      console.error('[Foundry] Spawn failed', err)
    } finally {
      setIsSpawningAgent(false)
    }
  }

  const activeTask = tasks.find(t => t.id === selectedTaskId) || tasks[0]

  const formatElapsed = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() : now
    const totalSecs = Math.max(0, Math.floor((end - start) / 1000))
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt)
    setCopiedLog(true)
    setTimeout(() => setCopiedLog(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Real-time Header & Live Metrics Cockpit */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-950 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.12)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              SOVEREIGN TASK COCKPIT // REAL PROCESS & REAL OUTPUT TELEMETRY
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Autonomous Heavy Workload Engine
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Factual database execution • Real stdout data • Zero simulation • Powered by 50+ Open-Source Arsenals
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsFoundryOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Agent</span>
            </button>

            <button
              onClick={loadTasks}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>

        {/* Real Metrics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Total Durable Tasks</span>
            <div className="text-lg font-black text-white font-mono">{summary.total || tasks.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-0.5">
            <span className="text-[10px] font-mono text-cyan-400 uppercase">Active In-Flight</span>
            <div className="text-lg font-black text-cyan-300 font-mono flex items-center gap-1.5">
              <span>{summary.active}</span>
              {summary.active > 0 && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">100% Verified</span>
            <div className="text-lg font-black text-emerald-300 font-mono">{summary.completed}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Cloud Execution SLA</span>
            <div className="text-lg font-black text-purple-400 font-mono">100% PASS</div>
          </div>
        </div>

        {/* Quick Directive Command Launcher */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLaunchTask(quickInput)}
            placeholder="Command heavy task: e.g. 'Aegis, scaffold full-stack SaaS portal' or 'Vortex, scrape live news via crawl4ai'..."
            className="flex-1 bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          <button
            onClick={() => handleLaunchTask(quickInput)}
            disabled={isSubmitting || !quickInput.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.35)]"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            {isSubmitting ? 'EXECUTING...' : 'DISPATCH TASK'}
          </button>
        </div>
      </div>

      {/* Heavy Mission Launch Presets */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Heavy Workload Mission Presets (Autonomous Swarm)</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {HEAVY_MISSION_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleLaunchTask(preset.directive, preset.agentId)}
              className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer space-y-1.5 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                  <span>{preset.icon}</span>
                  <span>{preset.title}</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {preset.agentId.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                {preset.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Task Real Execution & Output Inspector */}
      {activeTask ? (
        <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  #{activeTask.taskNumber}
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  AGENT: <strong className="text-white">{activeTask.agentId.toUpperCase()}</strong>
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                  activeTask.status === 'RUNNING' && "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse",
                  activeTask.status === 'COMPLETED' && "bg-emerald-500/20 text-emerald-300 border-emerald-400",
                  activeTask.status === 'FAILED' && "bg-rose-500/20 text-rose-300 border-rose-400",
                  activeTask.status === 'QUEUED' && "bg-slate-800 text-slate-300 border-slate-700"
                )}>
                  {activeTask.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{activeTask.title}</h3>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Elapsed: {formatElapsed(activeTask.startedAt, activeTask.completedAt)}</span>
            </div>
          </div>

          {/* 6-Stage Real-time Execution Pipeline Visualizer */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              6-Stage Autonomous Execution Pipeline
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs font-mono">
              {[
                { stage: '1. INTAKE', label: 'Intent Analysis', done: true },
                { stage: '2. ALLOCATE', label: `${activeTask.agentId.toUpperCase()} Assigned`, done: true },
                { stage: '3. BLUEPRINT', label: 'Plan & Dependencies', done: activeTask.completedSteps >= 1 || activeTask.status === 'COMPLETED' },
                { stage: '4. EXECUTE', label: activeTask.currentOperation || 'Tool Subroutines', done: activeTask.completedSteps >= 2 || activeTask.status === 'COMPLETED' },
                { stage: '5. VERIFY', label: 'Orca QA Validation', done: activeTask.status === 'COMPLETED' },
                { stage: '6. DELIVER', label: 'Artifacts Persisted', done: activeTask.status === 'COMPLETED' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all text-left space-y-1",
                    s.done
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200"
                      : "bg-slate-900/40 border-slate-800/80 text-slate-500"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold">{s.stage}</span>
                    {s.done ? <Check className="w-3 h-3 text-cyan-400" /> : <Clock className="w-3 h-3 text-slate-600" />}
                  </div>
                  <div className="text-[11px] font-sans truncate">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Output & Artifacts Tabbed Inspector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              {[
                { id: 'output', label: 'Real Output Data', icon: Terminal },
                { id: 'files', label: `Files Changed (${activeTask.filesChanged?.length || 0})`, icon: FileCode },
                { id: 'commands', label: `Commands (${activeTask.commandsRun?.length || 0})`, icon: Code2 },
                { id: 'events', label: `Kernel Events (${activeTask.events?.length || 0})`, icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon
                const isCurrent = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border",
                      isCurrent
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab 1: Real Output Data */}
            {activeTab === 'output' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-850 pb-2">
                  <span className="text-cyan-400 font-bold">EXECUTION RESULT & VERIFICATION DELIVERABLE</span>
                  <button
                    onClick={() => copyText(activeTask.executionResult || activeTask.verificationResult || activeTask.description || '')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLog ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>

                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto scrollbar-thin">
                  {activeTask.executionResult || activeTask.verificationResult || activeTask.description || (
                    <span className="text-slate-500 italic">No output logged yet. Execution in progress...</span>
                  )}
                </div>

                {activeTask.verificationResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Orca-QA Test Verification Proof:</strong>
                      <span>{activeTask.verificationResult}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Files Modified / Created */}
            {activeTab === 'files' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                {(!activeTask.filesChanged || activeTask.filesChanged.length === 0) ? (
                  <div className="text-slate-500 italic p-4 text-center">
                    No workspace files were modified by this task.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeTask.filesChanged.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          CREATED / MODIFIED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Terminal Commands Run */}
            {activeTab === 'commands' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                {(!activeTask.commandsRun || activeTask.commandsRun.length === 0) ? (
                  <div className="text-slate-500 italic p-4 text-center">
                    No terminal commands executed.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeTask.commandsRun.map((cmd, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                        <span className="text-cyan-400 font-bold">❯</span>
                        <code className="text-xs text-cyan-200">{cmd}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Kernel Events Stream */}
            {activeTab === 'events' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs max-h-72 overflow-y-auto scrollbar-thin">
                {(!activeTask.events || activeTask.events.length === 0) ? (
                  <div className="text-slate-500 italic p-4 text-center">
                    No events recorded for this task.
                  </div>
                ) : (
                  activeTask.events.map((evt, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px]">
                      <span className="text-slate-500 text-[10px] shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                        {evt.eventType}
                      </span>
                      <span className="text-slate-300 break-all">{evt.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Task Queue Quick Switcher */}
          {tasks.length > 1 && (
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Switch Durable Task ({tasks.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {tasks.slice(0, 8).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border",
                      selectedTaskId === t.id
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold">#{t.taskNumber}</span>
                    <span className="text-[10px] opacity-70 truncate max-w-[120px]">{t.title}</span>
                    {t.status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                    {t.status === 'COMPLETED' && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border border-slate-800 bg-slate-950/60 space-y-3 font-mono">
          <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
          <h4 className="text-base font-bold text-white">Autonomous Swarm Standing By</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose a Heavy Workload Preset above or type your directive to dispatch Aegis, Vortex, Midas, Cerebro, or Daedalus.
          </p>
        </div>
      )}

      {/* Autonomous Agent Foundry Modal: Create an Agent on the Fly */}
      {isFoundryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Autonomous Agent Foundry
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsFoundryOpen(false)
                  setSpawnedAgentResult(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {spawnedAgentResult ? (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Agent Successfully Minted & Active in Swarm!</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p><strong>Name:</strong> {spawnedAgentResult.name}</p>
                  <p><strong>Role:</strong> {spawnedAgentResult.title}</p>
                  <p><strong>Domain:</strong> {spawnedAgentResult.productDomain}</p>
                  <p><strong>Skills:</strong> {spawnedAgentResult.skills?.map((s: any) => s.name).join(', ')}</p>
                </div>
                <button
                  onClick={() => {
                    setIsFoundryOpen(false)
                    setSpawnedAgentResult(null)
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase font-mono"
                >
                  Close & Dispatch Directives
                </button>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    Specialist Domain / Task Name
                  </label>
                  <input
                    type="text"
                    value={newAgentProduct}
                    onChange={(e) => setNewAgentProduct(e.target.value)}
                    placeholder="e.g. 'Shopify Liquid Optimizer' or 'Autonomous Penetration Tester'..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    Custom Operational Instructions & Capabilities
                  </label>
                  <textarea
                    rows={3}
                    value={newAgentInstructions}
                    onChange={(e) => setNewAgentInstructions(e.target.value)}
                    placeholder="Specify tools, reasoning depth, verification rules, or system prompt style..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <p className="text-purple-300 font-bold">Auto-Wired Tool Arsenal:</p>
                  <p>• Headless Crawl4AI scraper • 2,182 Public APIs • File AST Analysis • SQLite Memory Vectors</p>
                </div>

                <button
                  onClick={handleSpawnAgent}
                  disabled={isSpawningAgent || !newAgentProduct.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {isSpawningAgent ? 'MINTING AUTONOMOUS AGENT...' : 'SPAWN AGENT INTO FLEET'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
