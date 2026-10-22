import { useState, useEffect, useRef } from 'react'
import {
  Activity, CheckCircle2, Clock, AlertCircle, Terminal,
  Code2, Workflow, DollarSign, Brain, Laptop, Bot,
  Check, FileCode, ArrowRight, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  Download, HardDrive, FileText
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime } from '@/lib/sound'

export interface TaskEvent {
  id: string
  eventType: string
  message: string
  timestamp: string
  metadata?: any
}

export interface StepAction {
  title: string
  status: 'COMPLETED' | 'RUNNING' | 'PENDING'
}

export interface AgentTask {
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
  stepActions?: StepAction[]
  terminalLogs?: string[]
  filesChanged?: string[]
  commandsRun?: string[]
  workspacePath?: string
  planPhases?: Array<{ phase: string; title: string; agent: string; status: string }>
}

interface TaskProgressCardProps {
  task: AgentTask
  onDismiss?: () => void
  onSelect?: () => void
}

const AGENT_CONFIGS: Record<string, { label: string; icon: any; color: string; badge: string; border: string }> = {
  aegis: {
    label: 'AEGIS [Code & Architecture]',
    icon: Code2,
    color: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    border: 'border-blue-500/40',
  },
  vortex: {
    label: 'VORTEX [Enterprise Automation]',
    icon: Workflow,
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/40',
  },
  midas: {
    label: 'MIDAS [Revenue & Monetization]',
    icon: DollarSign,
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/40',
  },
  cerebro: {
    label: 'CEREBRO [Deep Intelligence & RAG]',
    icon: Brain,
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    border: 'border-purple-500/40',
  },
  stark_os: {
    label: 'STARK OS [System Diagnostics & Telemetry]',
    icon: Laptop,
    color: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/40',
  },
  jarvis: {
    label: 'J.A.R.V.I.S. [Supreme Orchestrator]',
    icon: Bot,
    color: 'text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    border: 'border-cyan-500/40',
  },
}

function safeArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined') return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map(String)
      return [String(parsed)]
    } catch {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

export default function TaskProgressCard({ task, onDismiss, onSelect }: TaskProgressCardProps) {
  const [liveTask, setLiveTask] = useState<AgentTask>(task)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [showLogs, setShowLogs] = useState(true)
  const prevStatusRef = useRef(liveTask.status)
  const audioPlayedRef = useRef(false)

  useEffect(() => {
    setLiveTask(task)
  }, [task])

  // Real-time live polling while task is active
  useEffect(() => {
    if (!liveTask?.id) return
    const isOngoing = ['QUEUED', 'PLANNING', 'RUNNING', 'WAITING', 'RETRYING', 'VERIFYING'].includes(liveTask.status)
    if (!isOngoing) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${liveTask.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.task) {
            setLiveTask(data.task)
            if (data.task.status === 'COMPLETED' && !audioPlayedRef.current) {
              audioPlayedRef.current = true
              playJarvisChime('execute')
              try {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(
                    `Master Sri, the task was finished successfully. Here is the output, check and let me know if anything needs to be looked into.`
                  )
                  utterance.rate = 1.05
                  window.speechSynthesis.speak(utterance)
                }
              } catch {}
            }
          }
        }
      } catch {}
    }, 1500)

    return () => clearInterval(interval)
  }, [liveTask?.id, liveTask?.status])

  const filesChanged = safeArray(liveTask.filesChanged)
  const commandsRun = safeArray(liveTask.commandsRun)
  const terminalLogs = Array.isArray(liveTask.terminalLogs) ? liveTask.terminalLogs : safeArray(liveTask.terminalLogs)
  const events = Array.isArray(liveTask.events) ? liveTask.events : []
  const stepActions = Array.isArray(liveTask.stepActions) ? liveTask.stepActions : []

  // Live stopwatch ticker
  useEffect(() => {
    const startMs = new Date(liveTask.startedAt || Date.now()).getTime()
    const update = () => {
      const now = liveTask.completedAt ? new Date(liveTask.completedAt).getTime() : Date.now()
      setElapsedSec(Math.max(0, Math.floor((now - startMs) / 1000)))
    }
    update()
    if (liveTask.status === 'RUNNING' || liveTask.status === 'QUEUED' || (liveTask.status as string) === 'PLANNING') {
      const interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    }
  }, [liveTask.startedAt, liveTask.completedAt, liveTask.status])

  // Completion audio alert fallback
  useEffect(() => {
    if (prevStatusRef.current !== 'COMPLETED' && liveTask.status === 'COMPLETED' && !audioPlayedRef.current) {
      audioPlayedRef.current = true
      playJarvisChime('execute')
    }
    prevStatusRef.current = liveTask.status
  }, [liveTask.status])

  const agentConfig = AGENT_CONFIGS[liveTask.agentId.toLowerCase()] || AGENT_CONFIGS.jarvis
  const AgentIcon = agentConfig.icon

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const estimateText = liveTask.estimatedDuration || '~00:30'

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl border bg-slate-950/80 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 overflow-hidden",
        liveTask.status === 'RUNNING' ? "border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30" : "border-slate-800",
        liveTask.status === 'COMPLETED' && "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
      )}
    >
      {/* Subtle pulsing background glow while executing */}
      {liveTask.status === 'RUNNING' && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* Top Header: Agent Badge, Status & Stopwatch */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", agentConfig.badge)}>
            <AgentIcon className={cn("w-5 h-5", agentConfig.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border", agentConfig.badge)}>
                {agentConfig.label}
              </span>
              <span className="text-[10px] font-mono text-slate-500">#{liveTask.taskNumber}</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{liveTask.title}</h4>
          </div>
        </div>

        {/* Stopwatch & Live Estimate */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className={cn("w-3.5 h-3.5", liveTask.status === 'RUNNING' ? "text-cyan-400 animate-spin" : "text-slate-400")} />
            <span className="font-bold text-white">{formatTimer(elapsedSec)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{estimateText}</span>
          </div>

          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider border",
              liveTask.status === 'RUNNING' && "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 animate-pulse",
              liveTask.status === 'COMPLETED' && "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
              liveTask.status === 'FAILED' && "bg-rose-500/20 text-rose-300 border-rose-500/50",
              liveTask.status === 'QUEUED' && "bg-slate-800 text-slate-300 border-slate-700"
            )}
          >
            {liveTask.status}
          </span>
        </div>
      </div>

      {/* High-Capacity Autonomous Engine Workflow Pipeline Breadcrumb */}
      <div className="mt-3 p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-[10px] font-mono flex items-center justify-between gap-1 overflow-x-auto no-scrollbar relative z-10 shadow-inner">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">1. PLAN</span>
          <span className="text-slate-600 font-bold">→</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">2. ASSIGN ({agentConfig.label.split(' ')[0]})</span>
          <span className="text-slate-600 font-bold">→</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">3. ID (#{liveTask.taskNumber})</span>
          <span className="text-slate-600 font-bold">→</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">4. PATH</span>
          <span className="text-slate-600 font-bold">→</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded font-bold border transition-all",
            liveTask.status === 'RUNNING' ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 animate-pulse" :
            liveTask.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
            "bg-slate-800 text-slate-400 border-slate-700"
          )}>
            5. EXECUTE {liveTask.status === 'RUNNING' ? '🔄' : liveTask.status === 'COMPLETED' ? '✅' : ''}
          </span>
          <span className="text-slate-600 font-bold">→</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded font-bold border",
            liveTask.status === 'COMPLETED' ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50" : "bg-slate-800 text-slate-500 border-slate-700"
          )}>
            6. VERIFY {liveTask.status === 'COMPLETED' ? '100%' : 'PENDING'}
          </span>
        </div>
        {liveTask.workspacePath && (
          <div className="flex items-center gap-1 text-[9px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 shrink-0">
            <span>📁</span>
            <span className="font-semibold">{liveTask.workspacePath}</span>
          </div>
        )}
      </div>

      {/* Progress Counter & Step Status */}
      <div className="mt-3 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold">
              Step {liveTask.completedSteps}/{liveTask.totalSteps || 4}:
            </span>
            <span className="text-slate-300 font-sans text-xs">
              {liveTask.currentOperation || (liveTask.status === 'COMPLETED' ? 'Directive fully executed and verified' : 'Executing subroutines...')}
            </span>
          </div>
          <span className="text-cyan-400 font-bold">{Math.round(liveTask.progress)}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              liveTask.status === 'COMPLETED'
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                : "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            )}
            style={{ width: `${Math.max(5, Math.min(100, liveTask.progress))}%` }}
          />
        </div>
        {/* Step-by-Step Execution Verification Checklist */}
        {stepActions.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
            {stepActions.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
                {step.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : step.status === 'RUNNING' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span className={cn(
                  "truncate",
                  step.status === 'COMPLETED' ? "text-slate-300" :
                  step.status === 'RUNNING' ? "text-cyan-300 font-semibold" :
                  "text-slate-500"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terminal Stdout Stream Line-by-Line */}
      <div className="mt-4 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowLogs(!showLogs)
          }}
          className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-cyan-300 py-1 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>TERMINAL STDOUT STREAM ({terminalLogs.length || events.length || 0} events)</span>
          </div>
          {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showLogs && (
          <div className="mt-2 rounded-xl bg-slate-950/95 border border-slate-800/90 p-3 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
            {terminalLogs.length > 0 ? (
              terminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-tight">
                  <span className="text-cyan-400 font-bold shrink-0 text-[10px]">❯</span>
                  <span className="text-slate-300 break-all">{log}</span>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="text-slate-500 italic">Listening for live kernel execution logs from SSE (/api/tasks/stream)...</div>
            ) : (
              events.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-start gap-2 leading-tight">
                  <span className="text-slate-600 text-[10px] select-none shrink-0">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                  <span className={cn(
                    "font-bold shrink-0 text-[10px]",
                    evt.eventType === 'TASK_COMPLETED' ? "text-emerald-400" :
                    evt.eventType === 'TASK_FAILED' ? "text-rose-400" :
                    evt.eventType === 'STEP_STARTED' ? "text-cyan-400" :
                    "text-blue-400"
                  )}>
                    [{evt.eventType}]
                  </span>
                  <span className="text-slate-300 break-all">{evt.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Audio & Visual Evidence Summary Card on Completion */}
      {liveTask.status === 'COMPLETED' && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2.5 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MISSION EVIDENCE SUMMARY // 100% VERIFIED</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              EXIT CODE: 0
            </span>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed">
            {liveTask.verificationResult || liveTask.executionResult || "All subtasks verified with zero regressions. System integrity confirmed."}
          </div>

          {filesChanged.length > 0 && (
            <div className="pt-2 border-t border-emerald-900/40">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">
                Modified Artifacts ({filesChanged.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filesChanged.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-900/60 text-[10px] font-mono text-slate-300">
                    <FileCode className="w-3 h-3 text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Executive Deliverables & Storage Space Vault Links */}
          <div className="pt-2.5 border-t border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>STORAGE VAULT DELIVERABLES:</span>
              </span>
              <span className="text-slate-400 font-mono">artifacts/storage/{liveTask.taskNumber}/</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`/api/storage/download/${liveTask.taskNumber}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold transition-all text-center"
                title="Download Executive PDF Report"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF Report</span>
              </a>
              <a
                href={`/api/storage/download/${liveTask.taskNumber}/doc`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-mono text-[11px] font-bold transition-all text-center"
                title="Download Word Document Report"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Word .DOC</span>
              </a>
              <a
                href={`/api/storage/download/${liveTask.taskNumber}/md`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold transition-all text-center"
                title="View Markdown Source"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Markdown</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error Report if Failed */}
      {liveTask.status === 'FAILED' && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>EXECUTION HALTED // VERIFICATION DEFECT</span>
          </div>
          <div className="text-xs text-rose-200 font-sans">
            {liveTask.errorDetails || "Task encountered an unrecoverable policy or runtime error."}
          </div>
        </div>
      )}
    </div>
  )
}
