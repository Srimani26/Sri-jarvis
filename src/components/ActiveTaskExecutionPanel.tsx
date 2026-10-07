import { useState, useEffect, useRef } from 'react'
import {
  Activity, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Terminal, ShieldCheck, ChevronDown, ChevronUp, Bot, Play,
  Code2, Workflow, ArrowRight, Sparkles, Check, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playJarvisChime } from '@/lib/sound'
import TaskProgressCard from '@/components/TaskProgressCard'

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
}

interface ActiveTaskExecutionPanelProps {
  onTriggerTask?: (task: string) => void
}

export default function ActiveTaskExecutionPanel({ onTriggerTask }: ActiveTaskExecutionPanelProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [quickInput, setQuickInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Timer tick for live elapsed calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch tasks
  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        const fetchedTasks: AgentTask[] = data.tasks || []
        setTasks(fetchedTasks)
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
    const poll = setInterval(loadTasks, 4000)

    // Real-Time SSE Event Stream connection
    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/tasks/stream')
      eventSource.onmessage = (event) => {
        try {
          const kernelEvent: TaskEvent = JSON.parse(event.data)
          if (kernelEvent.id || kernelEvent.eventType) {
            loadTasks()
          }
        } catch {}
      }
    } catch {}

    return () => {
      clearInterval(poll)
      if (eventSource) eventSource.close()
    }
  }, [])

  const handleLaunchTask = async (directiveText: string) => {
    if (!directiveText.trim()) return
    setIsSubmitting(true)
    playJarvisChime('execute')

    let targetAgent = 'jarvis'
    const lower = directiveText.toLowerCase()
    if (lower.includes('build') || lower.includes('app') || lower.includes('website') || lower.includes('code') || lower.includes('fix')) {
      targetAgent = 'aegis'
    } else if (lower.includes('automate') || lower.includes('pipeline') || lower.includes('n8n') || lower.includes('scrape')) {
      targetAgent = 'vortex'
    } else if (lower.includes('revenue') || lower.includes('deal') || lower.includes('monetiz')) {
      targetAgent = 'midas'
    } else if (lower.includes('research') || lower.includes('investigate') || lower.includes('competitor')) {
      targetAgent = 'cerebro'
    } else if (lower.includes('health') || lower.includes('device') || lower.includes('diagnostic')) {
      targetAgent = 'stark_os'
    }

    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          agentId: targetAgent,
          task: directiveText.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuickInput('')
        loadTasks()
        if (data.taskId) setSelectedTaskId(data.taskId)
      }
    } catch (err) {
      console.error('[LaunchTask] Failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatElapsed = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() : now
    const totalSecs = Math.max(0, Math.floor((end - start) / 1000))
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const activeTask = tasks.find(t => t.id === selectedTaskId) || tasks[0]

  const getStatusBadge = (status: AgentTask['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 text-[10px] font-mono font-bold animate-pulse">
            <Activity className="w-3 h-3 text-cyan-400" />
            RUNNING
          </span>
        )
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600 text-[10px] font-mono font-bold">
            <Clock className="w-3 h-3 text-slate-400" />
            QUEUED
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            COMPLETED
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400 text-[10px] font-mono font-bold">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            FAILED
          </span>
        )
      case 'VERIFYING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400 text-[10px] font-mono font-bold">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            VERIFYING
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold">
            {status}
          </span>
        )
    }
  }

  const getAgentColor = (agentId: string) => {
    switch (agentId.toLowerCase()) {
      case 'aegis': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'vortex': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'midas': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'cerebro': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      case 'stark_os': return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    }
  }

  return (
    <div className="space-y-4">
      {/* Real-time Task Cockpit Header */}
      <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-950 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.12)] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              LIVE TASK EXECUTION COCKPIT // KERNEL OBSERVABILITY
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Autonomous Agent Execution Engine
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic multi-agent pipeline • Real evidence storage • Zero simulation
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadTasks}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Sync Telemetry
            </button>
          </div>
        </div>

        {/* Quick Directive Command Launcher */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLaunchTask(quickInput)}
            placeholder="Command the swarm: e.g. 'Aegis, build Standard Roof landing page' or 'Fix your voice recognition'..."
            className="flex-1 bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          <button
            onClick={() => handleLaunchTask(quickInput)}
            disabled={isSubmitting || !quickInput.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            {isSubmitting ? 'DISPATCHING...' : 'DISPATCH TASK'}
          </button>
        </div>

        {/* Active Task Card Detail via Live Execution HUD */}
        {activeTask ? (
          <TaskProgressCard task={activeTask} />
        ) : (
          <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2 font-mono">
            <Sparkles className="w-6 h-6 text-cyan-400 mx-auto" />
            <p className="text-xs text-slate-300">
              Swarm standing by with 0 unresolved errors.
            </p>
            <p className="text-[10px] text-slate-500">
              Type or speak a directive above to dispatch Aegis, Vortex, Midas, Cerebro, or Stark OS.
            </p>
          </div>
        )}

        {/* Task Queue Selector Bar */}
        {tasks.length > 1 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Recent Durable Tasks ({tasks.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {tasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border",
                    selectedTaskId === t.id
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  )}
                >
                  <span className="font-bold">{t.taskNumber}</span>
                  <span className="text-[10px] opacity-70 truncate max-w-[120px]">{t.title}</span>
                  {t.status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                  {t.status === 'COMPLETED' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
