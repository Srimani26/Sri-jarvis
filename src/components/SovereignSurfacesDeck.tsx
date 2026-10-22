import React, { useState, useMemo } from 'react'
import {
  LayoutDashboard, MessageSquare, HardDrive, DollarSign, ShieldAlert,
  Bot, Globe, Workflow, Brain, Sparkles, Code2, Layers, Mail,
  CalendarCheck, Target, BookOpen, BarChart3, UserRound, Activity,
  Search, X, ArrowUpRight, CheckCircle2, ChevronRight, Zap
} from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SurfaceItem {
  id: string
  label: string
  mobileLabel: string
  desc: string
  category: 'core' | 'swarms' | 'tools'
  icon: React.ComponentType<{ className?: string }>
  color: string
  border: string
  bg: string
  badge?: string
}

export const SOVEREIGN_SURFACES: SurfaceItem[] = [
  // Core Operations & Workspaces
  {
    id: 'command',
    label: 'HQ Core',
    mobileLabel: 'HQ',
    desc: 'Tactical command dashboard, live telemetry & system health',
    category: 'core',
    icon: LayoutDashboard,
    color: 'text-cyan-400',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/15',
    badge: 'HQ',
  },
  {
    id: 'chat',
    label: 'AI Chat',
    mobileLabel: 'Chat',
    desc: 'Multi-turn neural reasoning with J.A.R.V.I.S., Friday & Raphael',
    category: 'core',
    icon: MessageSquare,
    color: 'text-sky-400',
    border: 'border-sky-500/30 hover:border-sky-400/60',
    bg: 'bg-sky-500/10 hover:bg-sky-500/15',
    badge: 'VOICE & REASON',
  },
  {
    id: 'tasks',
    label: 'Missions & Tasks',
    mobileLabel: 'Tasks',
    desc: 'Autonomous heavy workload engine with factual stdout logs',
    category: 'core',
    icon: Activity,
    color: 'text-blue-400',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    bg: 'bg-blue-500/10 hover:bg-blue-500/15',
    badge: 'AUTONOMOUS',
  },
  {
    id: 'storage',
    label: 'Storage Vault',
    mobileLabel: 'Vault',
    desc: 'Print-ready PDFs, Word .DOC reports & compiled deliverables',
    category: 'core',
    icon: HardDrive,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    badge: 'PDF / DOC',
  },
  {
    id: 'revenue',
    label: 'Revenue Engine',
    mobileLabel: 'Revenue',
    desc: 'Live freelance contracts, remote gigs & deal radar telemetry',
    category: 'core',
    icon: DollarSign,
    color: 'text-teal-400',
    border: 'border-teal-500/30 hover:border-teal-400/60',
    bg: 'bg-teal-500/10 hover:bg-teal-500/15',
    badge: 'CONTRACTS',
  },
  {
    id: 'cyber',
    label: 'Cyber Defense',
    mobileLabel: 'Defense',
    desc: 'Live port scans, SSL certificates, perimeter audit & AST checks',
    category: 'core',
    icon: ShieldAlert,
    color: 'text-rose-400',
    border: 'border-rose-500/30 hover:border-rose-400/60',
    bg: 'bg-rose-500/10 hover:bg-rose-500/15',
    badge: 'PERIMETER',
  },

  // Swarms & Intelligence
  {
    id: 'swarms',
    label: 'Agent Fleet',
    mobileLabel: 'Fleet',
    desc: '20 Specialist swarms & Raphael Lord of Wisdom coordinator',
    category: 'swarms',
    icon: Bot,
    color: 'text-purple-400',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    bg: 'bg-purple-500/10 hover:bg-purple-500/15',
    badge: '20 AGENTS',
  },
  {
    id: 'apis',
    label: 'Omni APIs',
    mobileLabel: 'APIs',
    desc: '2,180+ Public endpoints with typed integration SDKs',
    category: 'swarms',
    icon: Globe,
    color: 'text-indigo-400',
    border: 'border-indigo-500/30 hover:border-indigo-400/60',
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/15',
    badge: '2,180 APIs',
  },
  {
    id: 'automations',
    label: 'Automations',
    mobileLabel: 'Auto',
    desc: 'Visual multi-step event pipelines & n8n webhook webhooks',
    category: 'swarms',
    icon: Workflow,
    color: 'text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    bg: 'bg-amber-500/10 hover:bg-amber-500/15',
    badge: 'PIPELINES',
  },
  {
    id: 'knowledge',
    label: 'Knowledge Hub',
    mobileLabel: 'Docs',
    desc: 'Assimilated open-source architecture blueprints & RAG vectors',
    category: 'swarms',
    icon: Brain,
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/60',
    bg: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/15',
    badge: 'RAG INTEL',
  },
  {
    id: 'techrader',
    label: 'Tech Radar',
    mobileLabel: 'Radar',
    desc: 'Emerging frameworks, GitHub trending repos & library tools',
    category: 'swarms',
    icon: Sparkles,
    color: 'text-cyan-300',
    border: 'border-cyan-400/30 hover:border-cyan-400/60',
    bg: 'bg-cyan-400/10 hover:bg-cyan-400/15',
    badge: 'TRENDS',
  },

  // Developer Lab & Operator Utilities
  {
    id: 'codlab',
    label: 'Code Lab',
    mobileLabel: 'Code',
    desc: 'High-speed AST sandbox, diff engine & terminal execution',
    category: 'tools',
    icon: Code2,
    color: 'text-blue-400',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    bg: 'bg-blue-500/10 hover:bg-blue-500/15',
    badge: 'AST ENGINE',
  },
  {
    id: 'projects',
    label: 'Projects',
    mobileLabel: 'Projects',
    desc: 'Deliverables Kanban board, milestone tracking & sprint health',
    category: 'tools',
    icon: Layers,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    badge: 'DELIVERABLES',
  },
  {
    id: 'inbox',
    label: 'Inbox & Alerts',
    mobileLabel: 'Inbox',
    desc: 'Autonomous mission briefs, alerts & agent notifications',
    category: 'tools',
    icon: Mail,
    color: 'text-violet-400',
    border: 'border-violet-500/30 hover:border-violet-400/60',
    bg: 'bg-violet-500/10 hover:bg-violet-500/15',
    badge: 'BRIEFS',
  },
  {
    id: 'planner',
    label: 'Daily Planner',
    mobileLabel: 'Plan',
    desc: 'Executive agenda, priority scheduling & mission deadlines',
    category: 'tools',
    icon: CalendarCheck,
    color: 'text-yellow-400',
    border: 'border-yellow-500/30 hover:border-yellow-400/60',
    bg: 'bg-yellow-500/10 hover:bg-yellow-500/15',
    badge: 'AGENDA',
  },
  {
    id: 'habits',
    label: 'Habits Tracker',
    mobileLabel: 'Habits',
    desc: 'Operator discipline, routine telemetry & streak tracking',
    category: 'tools',
    icon: Target,
    color: 'text-orange-400',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    bg: 'bg-orange-500/10 hover:bg-orange-500/15',
    badge: 'STREAKS',
  },
  {
    id: 'journal',
    label: 'Tactical Journal',
    mobileLabel: 'Journal',
    desc: 'Daily engineering reflections & strategic observations',
    category: 'tools',
    icon: BookOpen,
    color: 'text-teal-400',
    border: 'border-teal-500/30 hover:border-teal-400/60',
    bg: 'bg-teal-500/10 hover:bg-teal-500/15',
    badge: 'LOGS',
  },
  {
    id: 'analytics',
    label: 'Analytics & SLA',
    mobileLabel: 'Stats',
    desc: 'Model latencies, token consumption & durable task throughput',
    category: 'tools',
    icon: BarChart3,
    color: 'text-sky-400',
    border: 'border-sky-500/30 hover:border-sky-400/60',
    bg: 'bg-sky-500/10 hover:bg-sky-500/15',
    badge: 'TELEMETRY',
  },
  {
    id: 'profile',
    label: 'Profile & Keys',
    mobileLabel: 'Profile',
    desc: 'API keys, security tokens, credentials & operator preferences',
    category: 'tools',
    icon: UserRound,
    color: 'text-slate-300',
    border: 'border-slate-500/30 hover:border-slate-400/60',
    bg: 'bg-slate-500/10 hover:bg-slate-500/15',
    badge: 'SECURITY',
  },
]

interface SovereignSurfacesDeckProps {
  activeTab: string
  onNavigate: (tabId: string) => void
  onClose?: () => void
  onVoiceTrigger?: () => void
}

export default function SovereignSurfacesDeck({
  activeTab,
  onNavigate,
  onClose,
  onVoiceTrigger,
}: SovereignSurfacesDeckProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'swarms' | 'tools'>('all')

  const filteredSurfaces = useMemo(() => {
    return SOVEREIGN_SURFACES.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      if (!matchesCategory) return false

      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    })
  }, [query, categoryFilter])

  const categories = [
    { id: 'all', label: 'All Modules', count: SOVEREIGN_SURFACES.length },
    { id: 'core', label: 'Core Workspaces', count: 6 },
    { id: 'swarms', label: 'Swarms & APIs', count: 5 },
    { id: 'tools', label: 'Developer & Tools', count: 8 },
  ] as const

  return (
    <div className="space-y-4 text-white">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-950 border border-cyan-500/30 p-4 sm:p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-mono text-white">
                  All Sovereign Surfaces
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  19 SYSTEMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Every tactical surface, autonomous tool, and file pipeline at your fingertips.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 active:scale-95 transition-all"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 1-Tap Quick Action Row */}
        <div className="pt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Real Directives:
          </span>
          <button
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium transition-all active:scale-95"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Audit Shopify Dawn Theme</span>
          </button>
          <button
            onClick={() => onNavigate('storage')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-all active:scale-95"
          >
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span>Storage Vault PDF Reports</span>
          </button>
          {onVoiceTrigger && (
            <button
              onClick={onVoiceTrigger}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-medium transition-all active:scale-95"
            >
              <Bot className="w-3 h-3 text-purple-400" />
              <span>Duplex Voice (J.A.R.V.I.S. & Raphael)</span>
            </button>
          )}
        </div>

        {/* Search Bar & Category Filters */}
        <div className="pt-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by surface name or purpose (e.g. 'theme', 'tasks', 'revenue', 'pdf', 'git')..."
              className="w-full bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border',
                  categoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Surface Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {filteredSurfaces.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl flex flex-col justify-between select-none active:scale-[0.98]',
                isActive
                  ? 'bg-gradient-to-br from-cyan-950/40 to-slate-950 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl border transition-all duration-300',
                      item.bg,
                      item.border,
                      isActive && 'scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        'text-xs sm:text-sm font-bold font-mono tracking-tight',
                        isActive ? 'text-cyan-200' : 'text-white group-hover:text-cyan-300'
                      )}
                    >
                      {item.label}
                    </h3>
                    {item.badge && (
                      <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>

                {isActive ? (
                  <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/40">
                    <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-2.5 font-sans leading-relaxed line-clamp-2">
                {item.desc}
              </p>
            </div>
          )
        })}
      </div>

      {filteredSurfaces.length === 0 && (
        <div className="text-center py-12 rounded-3xl bg-slate-950/60 border border-slate-800 p-6 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 font-mono">No matching surfaces found for "{query}"</p>
          <button
            onClick={() => {
              setQuery('')
              setCategoryFilter('all')
            }}
            className="text-xs text-cyan-400 underline font-mono"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
