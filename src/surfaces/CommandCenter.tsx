import { useState, useEffect } from 'react'
import {
  Zap, TrendingUp, Clock, Bot, Code2, Globe, Mail, BarChart3, Target, ArrowUpRight,
  Calendar, Cpu, Workflow, Mic, Shield, Sparkles, Plane, ShoppingBag, Terminal, Activity
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime, playNeuralSpeech } from '@/lib/sound'
import { jsonAuthHeaders } from '@/lib/api'

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

const QUICK_ACTIONS = [
  { icon: <Mic className="w-4 h-4" />, label: 'Voice Comm', action: 'voice', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { icon: <Bot className="w-4 h-4" />, label: 'Sub-Agents', tab: 'swarms', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { icon: <Globe className="w-4 h-4" />, label: 'Omni APIs', tab: 'apis', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { icon: <Shield className="w-4 h-4" />, label: 'Cyber Shield', tab: 'cyber', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { icon: <Code2 className="w-4 h-4" />, label: 'Code Lab', tab: 'codlab', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
]

const TODAY_TASKS = [
  { text: 'Deploy Omni-API Arsenal with 2,001 public endpoints', done: true },
  { text: 'Activate Aegis Zero-Trust cyber perimeter for Master Sri', done: true },
  { text: 'Verify Continuous Voice Transceiver & British Speech Output', done: false },
  { text: 'Execute flight fare & gadget price comparison queries', done: false },
  { text: 'Monitor multi-agent swarm autonomous tasks', done: false },
]

interface CommandCenterProps {
  onNavigate?: (tab: string) => void
  onVoiceTrigger?: () => void
}

export default function CommandCenter({ onNavigate, onVoiceTrigger }: CommandCenterProps) {
  const [clock, setClock] = useState(formatClock())
  const [tasks, setTasks] = useState(TODAY_TASKS)
  const [coreOutput, setCoreOutput] = useState(99.4)

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, done: !t.done } : t))
  }

  const doneCount = tasks.filter(t => t.done).length

  const handleVoiceClick = () => {
    playJarvisChime('wake')
    playNeuralSpeech('Greetings Sovereign Master Sri. J.A.R.V.I.S. online. What can I do for you now?', 'en-GB')
    if (onVoiceTrigger) onVoiceTrigger()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Iron Man J.A.R.V.I.S. Holographic Cockpit Banner */}
      <div className="relative rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Arc Background Glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:1.75rem_1.75rem] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Info & Salutation */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              STARK INDUSTRIES // J.A.R.V.I.S. MARK-IV ACTIVE
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white">
                {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Master Sri</span>.
              </h1>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Arc Reactor at {coreOutput}% | All 8 Sub-Agent Swarms Online | 2,001 Public APIs Armed
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {clock}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {formatDate()}
              </span>
            </div>
          </div>

          {/* Right: Giant Holographic Voice Reactor Trigger */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <button
              onClick={handleVoiceClick}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] group hover:scale-[1.02]"
            >
              <div className="w-8 h-8 rounded-full bg-slate-950 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-4 h-4 animate-pulse text-cyan-300" />
              </div>
              <div className="text-left">
                <div className="text-[11px] leading-tight font-black">INITIALIZE VOICE COMM</div>
                <div className="text-[9px] font-mono text-slate-900 opacity-80">SPEAK TO J.A.R.V.I.S.</div>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Launch Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap gap-2 relative z-10">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                if (action.action === 'voice') handleVoiceClick()
                else if (action.tab && onNavigate) onNavigate(action.tab)
              }}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border shadow-sm",
                action.color
              )}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Telemetry, Projects & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Telemetry & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Core Frequency</div>
              <div className="text-xl font-black text-cyan-400 font-mono mt-1">4.82 GHz</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Ultra-Nominal</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Public APIs</div>
              <div className="text-xl font-black text-blue-400 font-mono mt-1">2,001</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">● GitHub Synced</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Defense Grid</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">LEVEL 10</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Zero-Trust Shield</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Neural Swarms</div>
              <div className="text-xl font-black text-purple-400 font-mono mt-1">8 AGENTS</div>
              <div className="text-[10px] text-purple-300 font-mono mt-0.5">● Autonomous</div>
            </div>
          </div>

          {/* Active Business Projects */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
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
        </div>

        
        {/* 24/7 AUTONOMOUS REVENUE ENGINE & MIDAS RADAR */}
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                AGENT MIDAS // 24x7 AUTONOMOUS REVENUE ENGINE
              </div>
              <h3 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                Autonomous Monetization & Opportunity Scout
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Working 24/7 while Master Sri rests • Formulating high-ticket AI & SaaS offers
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Scout Opportunities Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 01 // B2B AGENCY</span>
                <span className="text-xs font-bold text-emerald-300">₹75,000 / deal</span>
              </div>
              <h4 className="text-xs font-bold text-white">4-Layer Zoho & WhatsApp Automation</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Turnkey client quotation & lead-capture pipelines for Tamil Nadu manufacturers & contractors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 02 // MICRO-SAAS</span>
                <span className="text-xs font-bold text-emerald-300">₹1,50,000 / mo</span>
              </div>
              <h4 className="text-xs font-bold text-white">Standard Roofs AI Estimator</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Instant industrial roofing quote generator for contractors from satellite measurements.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAM 03 // GLOBAL ARBITRAGE</span>
                <span className="text-xs font-bold text-emerald-300">$2,500 / retainer</span>
              </div>
              <h4 className="text-xs font-bold text-white">Autonomous n8n & AI Agent Swarms</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                High-ticket US/UK automation contracts built autonomously by Aegis & Vortex.
              </p>
            </div>
          </div>

          {/* Mobile Gateway & Auto-Update Banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                <strong>MOBILE UPLINK:</strong> Add to Home Screen on your iPhone / Android for 24/7 full-screen access.
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Auto-Sync Gateway Active (Zero Reinstall Needed)
            </div>
          </div>
        </div>

        {/* Right Col: Today's Action Checklist */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Daily High-Priority Operations
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {doneCount}/{tasks.length}
              </span>
            </div>

            <div className="space-y-2">
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
      </div>
    </div>
  )
}
