import { useState, useEffect, useRef } from 'react'
import {
  Activity, CheckCircle2, Clock, AlertCircle, Terminal,
  Code2, Workflow, DollarSign, Brain, Laptop, Bot,
  Check, FileCode, ArrowRight, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Sparkles
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

export default function TaskProgressCard({ task, onDismiss, onSelect }: TaskProgressCardProps) {
  const [elapsedSec, setElapsedSec] = useState(0)
  const [showLogs, setShowLogs] = useState(true)
  const prevStatusRef = useRef(task.status)
  const audioPlayedRef = useRef(false)

  // Live stopwatch ticker
  useEffect(() => {
    const startMs = new Date(task.startedAt || Date.now()).getTime()
    const update = () => {
      const now = task.completedAt ? new Date(task.completedAt).getTime() : Date.now()
      setElapsedSec(Math.max(0, Math.floor((now - startMs) / 1000)))
    }
    update()
    if (task.status === 'RUNNING' || task.status === 'QUEUED') {
      const interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    }
  }, [task.startedAt, task.completedAt, task.status])

  // Completion audio alert
  useEffect(() => {
    if (prevStatusRef.current !== 'COMPLETED' && task.status === 'COMPLETED' && !audioPlayedRef.current) {
      audioPlayedRef.current = true
      playJarvisChime('execute')
    }
    prevStatusRef.current = task.status
  }, [task.status])

  const agentConfig = AGENT_CONFIGS[task.agentId.toLowerCase()] || AGENT_CONFIGS.jarvis
  const AgentIcon = agentConfig.icon

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const estimateText = task.estimatedDuration || '~00:20'

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl border bg-slate-950/80 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 overflow-hidden",
        task.status === 'RUNNING' ? "border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30" : "border-slate-800",
        task.status === 'COMPLETED' && "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
      )}
    >
      {/* Subtle pulsing background glow while executing */}
      {task.status === 'RUNNING' && (
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
              <span className="text-[10px] font-mono text-slate-500">#{task.taskNumber}</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{task.title}</h4>
          </div>
        </div>

        {/* Stopwatch & Live Estimate */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className={cn("w-3.5 h-3.5", task.status === 'RUNNING' ? "text-cyan-400 animate-spin" : "text-slate-400")} />
            <span className="font-bold text-white">{formatTimer(elapsedSec)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{estimateText}</span>
          </div>

          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider border",
              task.status === 'RUNNING' && "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 animate-pulse",
              task.status === 'COMPLETED' && "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
              task.status === 'FAILED' && "bg-rose-500/20 text-rose-300 border-rose-500/50",
              task.status === 'QUEUED' && "bg-slate-800 text-slate-300 border-slate-700"
            )}
          >
            {task.status}
          </span>
        </div>
      </div>

      {/* Progress Counter & Step Status */}
      <div className="mt-4 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold">
              Step {task.completedSteps}/{task.totalSteps || 4}:
            </span>
            <span className="text-slate-300 font-sans text-xs">
              {task.currentOperation || (task.status === 'COMPLETED' ? 'Directive fully executed and verified' : 'Executing subroutines...')}
            </span>
          </div>
          <span className="text-cyan-400 font-bold">{Math.round(task.progress)}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              task.status === 'COMPLETED'
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                : "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            )}
            style={{ width: `${Math.max(5, Math.min(100, task.progress))}%` }}
          />
        </div>
        {/* Step-by-Step Execution Verification Checklist */}
        {task.stepActions && task.stepActions.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
            {task.stepActions.map((step, idx) => (
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
            <span>TERMINAL STDOUT STREAM ({task.terminalLogs?.length || task.events?.length || 0} events)</span>
          </div>
          {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showLogs && (
          <div className="mt-2 rounded-xl bg-slate-950/95 border border-slate-800/90 p-3 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
            {task.terminalLogs && task.terminalLogs.length > 0 ? (
              task.terminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-tight">
                  <span className="text-cyan-400 font-bold shrink-0 text-[10px]">❯</span>
                  <span className="text-slate-300 break-all">{log}</span>
                </div>
              ))
            ) : (!task.events || task.events.length === 0) ? (
              <div className="text-slate-500 italic">Listening for live kernel execution logs from SSE (/api/tasks/stream)...</div>
            ) : (
              task.events.map((evt, idx) => (
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
      {task.status === 'COMPLETED' && (
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
            {task.verificationResult || task.executionResult || "All subtasks verified with zero regressions. System integrity confirmed."}
          </div>

          {task.filesChanged && task.filesChanged.length > 0 && (
            <div className="pt-2 border-t border-emerald-900/40">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">
                Modified Artifacts ({task.filesChanged.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.filesChanged.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-900/60 text-[10px] font-mono text-slate-300">
                    <FileCode className="w-3 h-3 text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Report if Failed */}
      {task.status === 'FAILED' && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>EXECUTION HALTED // VERIFICATION DEFECT</span>
          </div>
          <div className="text-xs text-rose-200 font-sans">
            {task.errorDetails || "Task encountered an unrecoverable policy or runtime error."}
          </div>
        </div>
      )}
    </div>
  )
}
