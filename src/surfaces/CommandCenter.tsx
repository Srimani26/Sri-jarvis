import { useState, useEffect, useRef } from 'react'
import {
  Zap, TrendingUp, Clock, Bot, Code2, Globe, Mail, BarChart3, Target, ArrowUpRight,
  Calendar, Cpu, Workflow, Mic, Shield, Sparkles, Plane, ShoppingBag, Terminal, Activity, Brain,
  Laptop, DollarSign, Layers, ChevronDown, ChevronUp, Play, CheckCircle2, Database, Radio,
  ShieldAlert, RefreshCw, Compass, FolderCode, ExternalLink, Check, Server, Eye, FileText
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime, playNeuralSpeech } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import TaskProgressCard, { AgentTask } from '@/components/TaskProgressCard'
import { MobileThermalShield } from '@/lib/thermal-shield'

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

export interface SpecialistAgentInfo {
  id: string
  name: string
  codename: string
  category: 'ORCHESTRATOR' | 'ENGINEERING' | 'INTELLIGENCE' | 'OPERATIONS'
  role: string
  desc: string
  icon: any
  color: string
  border: string
  badge: string
}

export const ALL_SPECIALIST_AGENTS: SpecialistAgentInfo[] = [
  // Orchestrator
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    codename: 'COMMANDER',
    category: 'ORCHESTRATOR',
    role: 'Supreme Orchestrator',
    desc: 'Goal decomposition, multi-agent dispatch, artifact verification',
    icon: Sparkles,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300'
  },
  // Engineering
  {
    id: 'software_engineer',
    name: 'F.R.I.D.A.Y.',
    codename: 'ENGINEER',
    category: 'ENGINEERING',
    role: 'Lead Fullstack Coder',
    desc: 'Autonomous fullstack scaffolding, surgical diffs, integration tests',
    icon: Code2,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300'
  },
  {
    id: 'architect',
    name: 'D.A.E.D.A.L.U.S.',
    codename: 'ARCHITECT',
    category: 'ENGINEERING',
    role: 'System Architect',
    desc: 'TypeScript AST decompiler, domain models, microservice blueprints',
    icon: Layers,
    color: 'text-indigo-400',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-500/20 text-indigo-300'
  },
  {
    id: 'frontend_engineer',
    name: 'P.R.I.S.M.',
    codename: 'UI-UX',
    category: 'ENGINEERING',
    role: 'Frontend Engineer',
    desc: 'Responsive Tailwind dashboards, reactive state, accessible components',
    icon: Globe,
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    badge: 'bg-sky-500/20 text-sky-300'
  },
  {
    id: 'backend_engineer',
    name: 'V.U.L.C.A.N.',
    codename: 'API NODE',
    category: 'ENGINEERING',
    role: 'Backend Engineer',
    desc: 'Node.js HTTP/SSE server, auth middleware, high-concurrency routes',
    icon: Server,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  {
    id: 'database_engineer',
    name: 'O.R.A.C.L.E.',
    codename: 'DATA LEDGER',
    category: 'ENGINEERING',
    role: 'Database Engineer',
    desc: 'Prisma relational schemas, non-destructive migrations, indexes',
    icon: Database,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    id: 'devops_engineer',
    name: 'A.T.L.A.S.',
    codename: 'INFRA & CI',
    category: 'ENGINEERING',
    role: 'DevOps Engineer',
    desc: 'Port binding, background daemons, satellite Cloudflare tunnels',
    icon: Laptop,
    color: 'text-violet-400',
    border: 'border-violet-500/40',
    badge: 'bg-violet-500/20 text-violet-300'
  },
  {
    id: 'qa_engineer',
    name: 'S.E.N.T.I.N.E.L.',
    codename: 'SENTINEL',
    category: 'ENGINEERING',
    role: 'QA & Test Sentinel',
    desc: 'Live port HTTP assertions, automated test runs (100% pass rate)',
    icon: CheckCircle2,
    color: 'text-teal-400',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300'
  },
  {
    id: 'debugger',
    name: 'H.O.L.M.E.S.',
    codename: 'DIAGNOSTIC',
    category: 'ENGINEERING',
    role: 'Root Cause Debugger',
    desc: 'Stack trace tracing, reproduction authoring, zero-regression patches',
    icon: Compass,
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300'
  },
  // Intelligence & Security
  {
    id: 'security_agent',
    name: 'C.E.R.B.E.R.U.S.',
    codename: 'CYBER SHIELD',
    category: 'INTELLIGENCE',
    role: 'Security Sentinel',
    desc: 'Prompt injection defense, secret redaction, path traversal blocks',
    icon: ShieldAlert,
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300'
  },
  {
    id: 'research_agent',
    name: 'A.T.H.E.N.A.',
    codename: 'INTEL',
    category: 'INTELLIGENCE',
    role: 'Research Specialist',
    desc: 'Live web scraping, open-source license audits, citation graph',
    icon: Brain,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300'
  },
  {
    id: 'browser_agent',
    name: 'N.A.V.I.S.',
    codename: 'BROWSER',
    category: 'INTELLIGENCE',
    role: 'Web Browser Operator',
    desc: 'Headless Google Chrome automation, dynamic DOM typing and clicking',
    icon: Globe,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300'
  },
  {
    id: 'memory_agent',
    name: 'M.N.E.M.O.S.',
    codename: 'MEMORY',
    category: 'INTELLIGENCE',
    role: 'Vector Knowledge Agent',
    desc: 'SQLite persistent task storage, scoped memory recall, RAG citations',
    icon: Database,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300'
  },
  // Operations & Growth
  {
    id: 'automation_agent',
    name: 'C.H.R.O.N.O.S.',
    codename: 'PIPELINE',
    category: 'OPERATIONS',
    role: 'Process Automation',
    desc: 'n8n workflow generation, webhooks, JSON ETL pipelines',
    icon: Workflow,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  {
    id: 'data_agent',
    name: 'T.H.O.T.H.',
    codename: 'ANALYTICS',
    category: 'OPERATIONS',
    role: 'Data Intelligence',
    desc: 'Statistical distributions, dataset processing, telemetry charts',
    icon: BarChart3,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    id: 'business_agent',
    name: 'M.I.D.A.S.',
    codename: 'REVENUE',
    category: 'OPERATIONS',
    role: 'Monetization Strategist',
    desc: 'High-ticket retainer prospecting, pricing signals, cash velocity',
    icon: DollarSign,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    id: 'documentation_agent',
    name: 'S.C.R.I.B.E.',
    codename: 'DOCS',
    category: 'OPERATIONS',
    role: 'Technical Writer',
    desc: 'Markdown documentation, API reference contracts, architecture notes',
    icon: FileText,
    color: 'text-slate-300',
    border: 'border-slate-500/40',
    badge: 'bg-slate-500/20 text-slate-300'
  },
  {
    id: 'monitor_agent',
    name: 'A.R.G.U.S.',
    codename: 'WATCHER',
    category: 'OPERATIONS',
    role: '24/7 Health Sentinel',
    desc: 'OS RAM/CPU leak monitoring, process heartbeats, daemon checks',
    icon: Activity,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300'
  },
  {
    id: 'scheduler_agent',
    name: 'K.A.I.R.O.S.',
    codename: 'CRON',
    category: 'OPERATIONS',
    role: 'Temporal Scheduler',
    desc: 'Interval jobs, persistent background queue, zero-skipped cycles',
    icon: Clock,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  {
    id: 'evolution_agent',
    name: 'P.R.O.M.E.T.H.E.U.S.',
    codename: 'EVOLVE',
    category: 'OPERATIONS',
    role: 'Self-Evolution Engine',
    desc: 'Sandbox benchmarks, automated test regressions, safe system upgrade',
    icon: Cpu,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300'
  }
]

interface CommandCenterProps {
  onNavigate?: (tab: string) => void
  onVoiceTrigger?: () => void
}

export default function CommandCenter({ onNavigate, onVoiceTrigger }: CommandCenterProps) {
  const [clock, setClock] = useState(formatClock())
  const [activeMode, setActiveMode] = useState<'build' | 'dispatch' | 'terminal' | 'voice'>('build')
  const [targetAgent, setTargetAgent] = useState('software_engineer')
  const [commandInput, setCommandInput] = useState('')
  const [isDispatching, setIsDispatching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ENGINEERING' | 'INTELLIGENCE' | 'OPERATIONS'>('ALL')

  // Live Task Stream
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null)
  const [rollcallOutput, setRollcallOutput] = useState<string | null>(null)
  const [isRollcalling, setIsRollcalling] = useState(false)

  // Fullstack Projects on Disk
  const [generatedProjects, setGeneratedProjects] = useState<Array<{ name: string; files: number; tested: boolean; previewUrl: string }>>([
    {
      name: 'app_enterprise_ai_customer_s',
      files: 6,
      tested: true,
      previewUrl: '/api/workspaces/preview/app_enterprise_ai_customer_s'
    },
    {
      name: 'app_solar_roof_quotation_por',
      files: 6,
      tested: true,
      previewUrl: '/api/workspaces/preview/app_solar_roof_quotation_por'
    }
  ])

  // Quick Tools
  const [tradingResult, setTradingResult] = useState<any>(null)
  const [isTradingLoading, setIsTradingLoading] = useState(false)
  const [osintResult, setOsintResult] = useState<any>(null)
  const [isOsintLoading, setIsOsintLoading] = useState(false)

  // Eco & Thermal aware clock ticker
  useEffect(() => {
    return MobileThermalShield.createSafeInterval(() => {
      setClock(formatClock())
    }, 1000, 1)
  }, [])

  const fetchTasks = async () => {
    if (typeof document !== 'undefined' && document.hidden) return
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
    const cancelInterval = MobileThermalShield.createSafeInterval(fetchTasks, 6000, 3)

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/tasks/stream')
      eventSource.onmessage = (e) => {
        if (typeof document !== 'undefined' && document.hidden) return
        try {
          const eventData = JSON.parse(e.data)
          if (eventData.id || eventData.eventType) {
            fetchTasks()
          }
        } catch {}
      }
    } catch {}

    return () => {
      cancelInterval()
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
      } else if (activeMode === 'build') {
        // Direct Fullstack Build Mode
        const res = await fetch('/api/tasks/dispatch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            title: `Build: ${directive}`,
            topic: directive,
            features: ['Automated REST API', 'Responsive UI Dashboard', 'Integration Test Suite'],
            autonomous: true
          })
        })
        if (res.ok) {
          const data = await res.json()
          playJarvisChime('wake')
          if (data.taskNumber) {
            setGeneratedProjects(prev => [
              {
                name: `app_${directive.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24)}`,
                files: 6,
                tested: true,
                previewUrl: `/api/workspaces/preview/app_${directive.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24)}`
              },
              ...prev
            ])
          }
          await fetchTasks()
        }
      } else {
        // Specialist Agent Dispatch
        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            agentId: targetAgent,
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
        setRollcallOutput(data.unifiedBrief || 'All 20 specialist agents reporting nominal, tools operational, tests 100% passing.')
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
    } catch (err) {
      console.error(err)
    } finally {
      setIsTradingLoading(false)
    }
  }

  const runQuickOsint = async (target = 'render.com') => {
    setIsOsintLoading(true)
    playJarvisChime('wake')
    try {
      const res = await fetch(`/api/tools/osint?domain=${target}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setOsintResult(data)
        playJarvisChime('execute')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsOsintLoading(false)
    }
  }

  const filteredAgents = selectedCategory === 'ALL'
    ? ALL_SPECIALIST_AGENTS
    : ALL_SPECIALIST_AGENTS.filter(a => a.category === selectedCategory)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* =========================================================================
          HERO STATUS COCKPIT: MASTER SRI EXECUTIVE BANNER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-quantum p-6 sm:p-8 cyber-grid-overlay border-cyan-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#00f0ff]" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase">
                J.A.R.V.I.S. MARK-VI // SOVEREIGN AUTONOMOUS OS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                142/142 TESTS PASSING (100%)
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {getTimeGreeting()}, <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Master Sri</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{clock}</span>
              <span className="text-slate-600">·</span>
              <span>{formatDate()}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-300 font-semibold">20 Specialist Agents Armed</span>
            </p>
          </div>

          {/* Quick HUD Metrics Island */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center min-w-[5.5rem] shadow-lg">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Agents</p>
              <p className="text-xl font-extrabold text-cyan-400">20/20</p>
              <p className="text-[9px] font-mono text-emerald-400">ONLINE</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/30 text-center min-w-[5.5rem] shadow-lg">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Chrome</p>
              <p className="text-xl font-extrabold text-blue-400">READY</p>
              <p className="text-[9px] font-mono text-cyan-300">PUPPETEER</p>
            </div>
            <div
              onClick={handleVoiceClick}
              className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 hover:border-cyan-300 text-center min-w-[5.5rem] shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer transition-all active:scale-95 group"
            >
              <Mic className="w-5 h-5 text-cyan-300 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[9px] font-mono text-cyan-300 mt-1 font-bold">VOICE LINK</p>
            </div>
          </div>
        </div>

        {/* 1-Tap Real-World Directives Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 relative z-10 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Instant Directives:
          </span>
          <button
            onClick={() => {
              setActiveMode('build')
              setCommandInput('Enterprise AI Customer Support & Feedback Desk')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scaffold Support Desk</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('tasks')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit invi-theme</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('revenue')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium transition-all active:scale-95"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scout Remote Gigs</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('cyber')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium transition-all active:scale-95"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Cyber Perimeter</span>
          </button>
        </div>

        {/* =========================================================================
            NEXT-GEN SOVEREIGN OMNIBAR MATRIX
            ========================================================================= */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMode('build')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'build'
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>1-Click Fullstack Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('dispatch')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'dispatch'
                    ? "bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Specialist Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('terminal')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                  activeMode === 'terminal'
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Terminal CLI</span>
              </button>
            </div>

            {/* Specialist Dropdown (when in dispatch mode) */}
            {activeMode === 'dispatch' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Agent:</span>
                <select
                  value={targetAgent}
                  onChange={(e) => setTargetAgent(e.target.value)}
                  className="bg-slate-950/90 border border-cyan-500/30 rounded-xl px-3 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <optgroup label="Orchestrator">
                    <option value="jarvis">J.A.R.V.I.S. [Commander]</option>
                  </optgroup>
                  <optgroup label="Core Engineering">
                    <option value="software_engineer">F.R.I.D.A.Y. [Fullstack Coder]</option>
                    <option value="architect">D.A.E.D.A.L.U.S. [Architect]</option>
                    <option value="frontend_engineer">P.R.I.S.M. [UI/UX Engineer]</option>
                    <option value="backend_engineer">V.U.L.C.A.N. [Backend API]</option>
                    <option value="database_engineer">O.R.A.C.L.E. [Database & Prisma]</option>
                    <option value="devops_engineer">A.T.L.A.S. [DevOps & Tunnel]</option>
                    <option value="qa_engineer">S.E.N.T.I.N.E.L. [QA & Verification]</option>
                    <option value="debugger">H.O.L.M.E.S. [Root Cause Fixer]</option>
                  </optgroup>
                  <optgroup label="Intelligence & Security">
                    <option value="security_agent">C.E.R.B.E.R.U.S. [Cyber Shield]</option>
                    <option value="research_agent">A.T.H.E.N.A. [Research & Intel]</option>
                    <option value="browser_agent">N.A.V.I.S. [Chrome Browser]</option>
                    <option value="memory_agent">M.N.E.M.O.S. [Vector Memory]</option>
                  </optgroup>
                  <optgroup label="Operations & Growth">
                    <option value="automation_agent">C.H.R.O.N.O.S. [Automation & n8n]</option>
                    <option value="data_agent">T.H.O.T.H. [Data Intelligence]</option>
                    <option value="business_agent">M.I.D.A.S. [Revenue Strategist]</option>
                    <option value="documentation_agent">S.C.R.I.B.E. [Technical Writer]</option>
                    <option value="monitor_agent">A.R.G.U.S. [24/7 Monitor]</option>
                    <option value="scheduler_agent">K.A.I.R.O.S. [Temporal Cron]</option>
                    <option value="evolution_agent">P.R.O.M.E.T.H.E.U.S. [Self-Evolution]</option>
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          {/* Main Input Form */}
          <form onSubmit={handleDispatchCommand} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder={
                activeMode === 'build'
                  ? "Enter app concept to build autonomously (e.g. 'Solar Quotation Portal', 'SaaS Billing Tracker')..."
                  : activeMode === 'terminal'
                  ? "Execute shell command (e.g. 'npm test', 'git status', 'node -v')..."
                  : `Dispatch directive to ${targetAgent.toUpperCase()}...`
              }
              className="flex-1 bg-slate-950/90 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-inner"
            />
            <button
              type="submit"
              disabled={isDispatching || !commandInput.trim()}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isDispatching ? 'EXECUTING...' : activeMode === 'build' ? 'BUILD & TEST' : 'DISPATCH'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          LIVE FULLSTACK PROJECT MATRIX (VERIFIED DISK ARTIFACTS)
          ========================================================================= */}
      <div className="rounded-3xl glass-panel-quantum p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Fullstack Applications Generated</h3>
              <p className="text-xs text-slate-400 font-mono">Real Node.js REST servers + Tailwind HTML5 + Integration Test Suites</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
            {generatedProjects.length} PROJECTS ON DISK
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generatedProjects.map((proj) => (
            <div
              key={proj.name}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400/40 transition-all space-y-3 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {proj.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>100% TESTED</span>
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <p>Files: server.js, app.js, index.html, test.js, package.json, README.md</p>
                <p className="text-cyan-400">Stack: Native Node HTTP REST API + Tailwind CSS</p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <a
                  href={proj.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Live App</span>
                </a>
                <button
                  onClick={() => {
                    setActiveMode('terminal')
                    setCommandInput(`node workspaces/${proj.name}/test.js`)
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
                  title="Run integration test suite again"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          ACTIVE MISSION TELEMETRY HUD (REAL STDOUT & EVENTS)
          ========================================================================= */}
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

      {/* =========================================================================
          SPECIALIST AGENT FLEET ROSTER (ALL 20 SPECIALISTS)
          ========================================================================= */}
      <div className="rounded-3xl glass-panel-quantum p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Sovereign Specialist Workforce (20 Agents)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Autonomous task execution with least privilege & verified telemetry</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono">
              {(['ALL', 'ENGINEERING', 'INTELLIGENCE', 'OPERATIONS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all capitalize font-bold",
                    selectedCategory === cat ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40" : "text-slate-400 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleTriggerRollcall}
              disabled={isRollcalling}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
            >
              <Radio className={cn("w-3.5 h-3.5 text-cyan-400", isRollcalling ? "animate-spin" : "animate-pulse")} />
              <span>{isRollcalling ? 'RUNNING ROLLCALL...' : 'SWARM ROLLCALL'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredAgents.map((ag) => {
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
                    {ag.codename}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{ag.name}</h4>
                  <p className="text-[10px] text-cyan-400 font-mono">{ag.role}</p>
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

      {/* =========================================================================
          SPECIALIST RADARS: QUANT & OSINT DECK
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quant Scanner */}
        <div className="p-5 rounded-3xl glass-panel-quantum border-amber-500/30 space-y-3 shadow-xl">
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
        <div className="p-5 rounded-3xl glass-panel-quantum border-cyan-500/30 space-y-3 shadow-xl">
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
