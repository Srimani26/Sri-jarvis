import { useState, useEffect, useCallback } from 'react'
import LoginScreen from './components/LoginScreen'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import CommandCenter from './surfaces/CommandCenter'
import AgentEcosystem from './surfaces/AgentEcosystem'
import ArcReactorHUD from './components/ArcReactorHUD'
import AIChat from './surfaces/AIChat'
import Projects from './surfaces/Projects'
import CodeLab from './surfaces/CodeLab'
import WorkflowBuilder from './surfaces/WorkflowBuilder'
import DailyPlanner from './surfaces/DailyPlanner'
import HabitsTracker from './surfaces/HabitsTracker'
import Journal from './surfaces/Journal'
import Analytics from './surfaces/Analytics'
import KnowledgeHub from './surfaces/KnowledgeHub'
import TechRadar from './surfaces/TechRadar'
import Profile from './surfaces/Profile'
import Inbox from './surfaces/Inbox'
import CyberThreatDefense from './surfaces/CyberThreatDefense'
import OmniApiArsenal from './surfaces/OmniApiArsenal'
import { RevenueHunter } from './surfaces/RevenueHunter'
import JarvisVoiceModal from './components/JarvisVoiceModal'
import ActiveTaskExecutionPanel from './components/ActiveTaskExecutionPanel'
import {
  LayoutDashboard, MessageSquare, Layers, Code2, Workflow,
  CalendarCheck, Target, BookOpen, BarChart3, Brain, Globe,
  Menu, X, Settings, Lock, Shield, ShieldAlert, LogOut, Eye, EyeOff, AlertTriangle,
  ChevronRight, ChevronDown, MemoryStick, Link2, Fingerprint, UserRound, Bot, Mic, Sparkles, Activity, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders, attemptTokenRefresh, setRefreshToken } from '@/lib/api'
import { playJarvisChime, playNeuralSpeech } from '@/lib/sound'

const primaryNav = [
  { id: 'command', icon: <LayoutDashboard className="w-4 h-4" />, label: 'HQ Core', mobileLabel: 'HQ' },
  { id: 'revenue', icon: <DollarSign className="w-4 h-4 text-emerald-400" />, label: 'Revenue ($)', mobileLabel: 'Revenue' },
  { id: 'tasks', icon: <Activity className="w-4 h-4" />, label: 'Missions & Tasks', mobileLabel: 'Tasks' },
  { id: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'AI Chat', mobileLabel: 'Chat' },
  { id: 'swarms', icon: <Bot className="w-4 h-4" />, label: 'Agent Swarm', mobileLabel: 'Swarm' },
  { id: 'cyber', icon: <ShieldAlert className="w-4 h-4" />, label: 'Cyber Shield', mobileLabel: 'Defense' },
]

const arsenalNav = [
  { id: 'projects', icon: <Layers className="w-4 h-4" />, label: 'Projects', mobileLabel: 'Projects' },
  { id: 'apis', icon: <Globe className="w-4 h-4" />, label: 'Omni APIs', mobileLabel: 'APIs' },
  { id: 'inbox', icon: <Globe className="w-4 h-4" />, label: 'Inbox', mobileLabel: 'Inbox' },
  { id: 'codlab', icon: <Code2 className="w-4 h-4" />, label: 'Code Lab', mobileLabel: 'Code' },
  { id: 'automations', icon: <Workflow className="w-4 h-4" />, label: 'Automations', mobileLabel: 'Auto' },
  { id: 'knowledge', icon: <Brain className="w-4 h-4" />, label: 'Knowledge Hub', mobileLabel: 'Learn' },
  { id: 'techrader', icon: <Globe className="w-4 h-4" />, label: 'Tech Radar', mobileLabel: 'Tech' },
  { id: 'planner', icon: <CalendarCheck className="w-4 h-4" />, label: 'Daily Planner', mobileLabel: 'Tasks' },
  { id: 'habits', icon: <Target className="w-4 h-4" />, label: 'Habits Tracker', mobileLabel: 'Habits' },
  { id: 'journal', icon: <BookOpen className="w-4 h-4" />, label: 'Journal', mobileLabel: 'Journal' },
  { id: 'analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics', mobileLabel: 'Stats' },
  { id: 'profile', icon: <UserRound className="w-4 h-4" />, label: 'Profile', mobileLabel: 'Profile' },
]

const navItems = [...primaryNav, ...arsenalNav]

const bottomTabs = [
  { id: 'command', icon: <LayoutDashboard className="w-5 h-5" />, label: 'HQ' },
  { id: 'tasks', icon: <Activity className="w-5 h-5" />, label: 'Tasks' },
  { id: 'voice', icon: <Mic className="w-5 h-5" />, label: 'Voice' },
  { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Chat' },
  { id: 'more', icon: <Menu className="w-5 h-5" />, label: 'Arsenal' },
]

function MemoryView() {
  const [stats, setStats] = useState<any>(null)
  const [timeline, setTimeline] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [tab, setTab] = useState<'timeline' | 'search' | 'stats'>('timeline')

  useEffect(() => {
    fetch('/api/memory/stats', { headers: authHeaders() }).then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/memory/timeline', { headers: authHeaders() }).then(r => r.json()).then(setTimeline).catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!searchQuery) return
    const res = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}`, { headers: authHeaders() })
    const data = await res.json()
    setSearchResults(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['timeline', 'search', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              tab === t ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-white")}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Conversations', value: stats.totalConversations, color: 'cyan' },
            { label: 'Memories', value: stats.totalMemories, color: 'purple' },
            { label: 'Notes', value: stats.totalNotes, color: 'green' },
            { label: 'Today Activities', value: stats.todayActivities, color: 'amber' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-3">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search conversations, memories..."
            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500" />
          {searchResults?.memories?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-mono">MEMORIES ({searchResults.memories.length})</p>
              {searchResults.memories.map((m: any) => (
                <div key={m.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <p className="text-sm text-white">{m.content}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'timeline' && timeline?.timeline && (
        <div className="space-y-4">
          {Object.entries(timeline.timeline).map(([day, logs]: [string, any]) => (
            <div key={day}>
              <p className="text-xs text-slate-400 font-mono mb-2">{day}</p>
              <div className="space-y-1">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{log.action}</p>
                      {log.details && <p className="text-xs text-slate-400 truncate">{log.details}</p>}
                    </div>
                    <p className="text-[10px] text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConnectionsView() {
  const [connections, setConnections] = useState<any[]>([])
  const [repos, setRepos] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/connections', { headers: authHeaders() }).then(r => r.json()).then(d => setConnections(d.connections || [])).catch(() => {})
    fetch('/api/github/repos', { headers: authHeaders() }).then(r => r.json()).then(d => setRepos(d.repos || [])).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">System Connections</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {connections.map((c: any) => (
          <div key={c.name} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-slate-400">{c.detail}</p>
            </div>
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0",
              c.status === 'connected' ? 'bg-emerald-400' : c.status === 'degraded' ? 'bg-amber-400' : 'bg-slate-500')} />
          </div>
        ))}
      </div>
      {repos.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-white mt-4">GitHub Repositories</h3>
          <div className="space-y-2">
            {repos.map((r: any) => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener"
                className="block bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  {r.language && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{r.language}</span>}
                  {r.stars > 0 && <span className="text-[10px] text-amber-400">★ {r.stars}</span>}
                </div>
                {r.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{r.description}</p>}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('jarvis_token') || '')
  const [username, setUsername] = useState(() => localStorage.getItem('jarvis_user') || '')
  const [activeTab, setActiveTab] = useState('command')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [arsenalOpen, setArsenalOpen] = useState(false)
  // Auto-welcome managed exclusively by voice transceiver

  const [sovereignAwakened, setSovereignAwakened] = useState(true)

  const handleAwakenSovereign = () => {
    setSovereignAwakened(true)
    playJarvisChime('wake')
    // Open voice modal which initiates a single, clear neural greeting without voice collision
    setVoiceModalOpen(true)
  }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  // Global listener to open voice comm with specific agent from anywhere in UI
  useEffect(() => {
    const handler = (e: any) => {
      const agentId = e.detail?.agentId
      if (agentId) {
        try { localStorage.setItem('jarvis_initial_agent', agentId) } catch {}
      }
      setVoiceModalOpen(true)
    }
    window.addEventListener('open-jarvis-voice', handler)
    return () => window.removeEventListener('open-jarvis-voice', handler)
  }, [])

  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [newKey, setNewKey] = useState('')
  const [keyMsg, setKeyMsg] = useState('')
  const [keyBusy, setKeyBusy] = useState(false)
  const [authenticated, setAuthenticated] = useState(() =>
    typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('jarvis_token'))
  )
  const [inviteCode, setInviteCode] = useState('')

  const loadProviders = useCallback(() => {
    fetch('/api/settings/keys', { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setProviders(d.providers || []))
      .catch(() => {})
  }, [token])

  const loadInviteCode = useCallback(() => {
    fetch('/api/auth/invite-code', { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : {}) as Promise<{ inviteCode?: string }>)
      .then(d => setInviteCode(d.inviteCode || ''))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!settingsOpen) return
    loadProviders()
    loadInviteCode()
  }, [settingsOpen, loadProviders, loadInviteCode])

  const saveProviderKey = async () => {
    if (!newKey.trim()) return
    setKeyBusy(true)
    setKeyMsg('')
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ provider: selectedProvider, key: newKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setKeyMsg(`✅ ${selectedProvider} connected — JARVIS now has a backup AI link`)
      setNewKey('')
      loadProviders()
    } catch (err: any) {
      setKeyMsg(`⚠️ ${err.message}`)
    } finally {
      setKeyBusy(false)
    }
  }

  const removeProviderKey = async (provider: string) => {
    await fetch(`/api/settings/keys/${provider}`, { method: 'DELETE', headers: authHeaders() })
    loadProviders()
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const keepSession = (name?: string) => {
      if (cancelled) return
      setAuthenticated(true)
      setUsername(u => u || name || localStorage.getItem('jarvis_user') || '')
    }
    fetch('/api/auth/status', { headers: authHeaders() })
      .then(async r => ({ ok: r.ok, body: (await r.json().catch(() => ({}))) as { authenticated?: boolean; username?: string } }))
      .then(async ({ ok, body }) => {
        if (cancelled) return
        // The server explicitly rejected the token — attempt refresh before giving up
        if (ok && body.authenticated === false) {
          const refreshed = await attemptTokenRefresh()
          if (cancelled) return
          if (refreshed) {
            setToken(refreshed)
            keepSession()
            return
          }
          localStorage.removeItem('jarvis_token')
          localStorage.removeItem('jarvis_refresh_token')
          localStorage.removeItem('jarvis_user')
          setToken('')
          setUsername('')
          setAuthenticated(false)
          return
        }
        // Anything unexpected (5xx, server restarting) keeps the session.
        keepSession(body.username)
      })
      .catch(() => keepSession())
    return () => { cancelled = true }
  }, [])

  const handleLogin = (newToken: string, user: string, refreshToken?: string) => {
    setToken(newToken)
    setUsername(user)
    localStorage.setItem('jarvis_token', newToken)
    localStorage.setItem('jarvis_user', user)
    if (refreshToken) {
      setRefreshToken(refreshToken)
    }
    setAuthenticated(true)
  }

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() }) } catch {}
    localStorage.removeItem('jarvis_token')
    localStorage.removeItem('jarvis_refresh_token')
    localStorage.removeItem('jarvis_user')
    setToken('')
    setUsername('')
    setAuthenticated(false)
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess('')
    if (!currentPw || !newPw) { setPwError('Fill all fields'); return }
    if (newPw.length < 6) { setPwError('Min 6 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
      // Other devices are signed out server-side; this device stays logged in,
      // so Sri can change his password without being kicked out.
      setPwSuccess(data?.message || 'Password changed.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) { setPwError(err?.message || 'Could not change password') }
  }

  const handleNavigate = (tab: string) => { setActiveTab(tab); setMobileMenuOpen(false) }

  if (!authenticated) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-[#030712] text-white safe-area-bottom antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar — Desktop */}
      <div className="sticky top-0 z-50 bg-[#030712]/85 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigate('command')}>
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-transparent border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:border-cyan-400 group-hover:scale-105 transition-all">
              <span className="text-xl">⚡</span>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider text-white font-mono">J.A.R.V.I.S.</h1>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  MARK-V SOVEREIGN
                </span>
              </div>
              <p className="text-[9px] text-cyan-400/80 font-mono tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                20 AGENTS ARMED // NEON DURABLE // 42ms
              </p>
            </div>
          </div>

          {/* Primary Navigation Pillars */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-cyan-500/25 backdrop-blur-xl shadow-inner">
            {primaryNav.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-300",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)] font-bold scale-[1.02]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Secondary Arsenal Dropdown */}
            <div className="relative">
              <button
                onClick={() => setArsenalOpen(!arsenalOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200",
                  arsenalNav.some(a => a.id === activeTab)
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Arsenal</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform text-cyan-400", arsenalOpen && "rotate-180")} />
              </button>
              {arsenalOpen && (
                <div
                  onMouseLeave={() => setArsenalOpen(false)}
                  className="absolute left-0 mt-2 z-50 w-56 p-2 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-2.5 py-1 text-[9px] font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Secondary Systems</span>
                    <span className="text-[8px] text-slate-500 font-bold">12 MODULES</span>
                  </div>
                  {arsenalNav.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setArsenalOpen(false); handleNavigate(item.id); }}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-mono font-medium text-left transition-all",
                        activeTab === item.id
                          ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Deck */}
          <div className="flex items-center gap-2.5">
            {/* Direct Voice Comms Trigger */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 text-xs font-mono font-black tracking-wider transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95"
              title="Open J.A.R.V.I.S. Mark-V Neural Voice Comms"
            >
              <Mic className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              <span>VOICE LINK</span>
            </button>

            {/* Master Sri Biometric Profile */}
            <button
              onClick={() => handleNavigate('profile')}
              title={`${username} — Sovereign Master Biometrics`}
              className={cn(
                "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border transition-all",
                activeTab === 'profile'
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/40"
              )}
            >
              <span className="w-6 h-6 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner">
                {(username || 'S').charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-mono max-w-[6.5rem] truncate font-bold">{username || 'Master Sri'}</span>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-800 transition-all"
              title="Settings & Sovereign Keys"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20 transition-all"
              title="Lock Console / Sign Out"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-[#030712]/90 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5" onClick={() => handleNavigate('command')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <span className="text-base">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black tracking-wider text-white font-mono">J.A.R.V.I.S.</h1>
                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">v5.0</span>
              </div>
              <p className="text-[8px] text-emerald-400 font-mono tracking-tight flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE // 20 SWARMS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Quick Voice Trigger on Mobile Header */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-[10px] font-mono font-black flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
              aria-label="Open Neural Voice"
            >
              <Mic className="w-3 h-3 text-slate-950" />
              <span>VOICE</span>
            </button>
            <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 active:scale-95" aria-label="Settings">
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleNavigate('profile')} aria-label="Profile" className="p-0.5 rounded-xl active:scale-95">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner">
                {(username || 'S').charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile More Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#030712]/98 backdrop-blur-3xl overflow-auto p-4 animate-in fade-in">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-mono">All Sovereign Surfaces</h2>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all text-center",
                  activeTab === item.id
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                )}
              >
                <div className={cn("p-2 rounded-xl", activeTab === item.id ? "bg-cyan-500/30 text-cyan-300" : "bg-slate-800/80 text-slate-400")}>
                  {item.icon}
                </div>
                <span className="text-xs font-mono font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-28 md:pb-6">
        {activeTab === 'command' && <CommandCenter onNavigate={handleNavigate} onVoiceTrigger={() => setVoiceModalOpen(true)} />}
        {activeTab === 'revenue' && <RevenueHunter />}
        {activeTab === 'tasks' && <ActiveTaskExecutionPanel onTriggerTask={(t) => console.log('task triggered', t)} />}
        {activeTab === 'chat' && <AIChat />}
        {activeTab === 'swarms' && (
          <AgentEcosystem
            onOpenVoice={(agentId?: string) => {
              if (agentId) {
                try { localStorage.setItem('jarvis_initial_agent', agentId) } catch {}
              }
              setVoiceModalOpen(true)
            }}
          />
        )}
        {activeTab === 'cyber' && <CyberThreatDefense />}
        {activeTab === 'apis' && <OmniApiArsenal />}
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'inbox' && <Inbox />}
        {activeTab === 'codlab' && <CodeLab />}
        {activeTab === 'automations' && <WorkflowBuilder />}
        {activeTab === 'knowledge' && <KnowledgeHub />}
        {activeTab === 'techrader' && <TechRadar />}
        {activeTab === 'planner' && <DailyPlanner />}
        {activeTab === 'habits' && <HabitsTracker />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'profile' && <Profile onLogout={handleLogout} />}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'connections' && <ConnectionsView />}
        {activeTab === 'more' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavigate(item.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all">
                {item.icon}
                <span className="text-xs font-medium font-mono">{item.mobileLabel}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav Dock — Mobile (Floating Ergonomic Glass Dock) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#030712]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {bottomTabs.map(tab => {
            const isVoice = tab.id === 'voice'
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'more') setMobileMenuOpen(true)
                  else if (tab.id === 'voice') {
                    // Pre-unlock mobile browser AudioContext & SpeechSynthesis on physical user tap
                    try {
                      if (typeof window !== 'undefined') {
                        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
                        if (AudioCtx) {
                          const ctx = new AudioCtx()
                          if (ctx.state === 'suspended') ctx.resume().catch(() => {})
                        }
                        if (window.speechSynthesis) {
                          window.speechSynthesis.resume()
                        }
                      }
                    } catch {}
                    setVoiceModalOpen(true)
                  }
                  else handleNavigate(tab.id)
                }}
                className={cn(
                  "flex flex-col items-center justify-center transition-all touch-feedback",
                  isVoice
                    ? "-mt-5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 font-black shadow-[0_0_25px_rgba(6,182,212,0.8)] border border-cyan-300/60"
                    : "flex-1 py-1"
                )}
              >
                {isVoice ? (
                  <Mic className="w-5 h-5 text-slate-950 animate-pulse" />
                ) : (
                  <>
                    <div className={cn("transition-colors", isActive ? "text-cyan-400 scale-110" : "text-slate-500")}>
                      {tab.icon}
                    </div>
                    <span className={cn("text-[9px] font-mono mt-0.5", isActive ? "text-cyan-300 font-bold" : "text-slate-500")}>
                      {tab.label}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sovereign Welcome & Auto-Wake Overlay on First Open */}
      {!sovereignAwakened && (
        <div
          onClick={handleAwakenSovereign}
          className="fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none animate-in fade-in duration-500"
        >
          <div className="relative mb-8 group">
            <div className="w-36 h-36 rounded-full border-2 border-cyan-400/50 flex items-center justify-center animate-spin-slow shadow-[0_0_80px_rgba(6,182,212,0.6)]">
              <div className="w-28 h-28 rounded-full border border-cyan-300/70 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-[inset_0_0_30px_rgba(6,182,212,0.8)]">
                  <Mic className="w-10 h-10 text-cyan-300 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-mono tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" /> Sovereign Master Sri Recognized
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              J.A.R.V.I.S. MARK-V
            </h1>
            <p className="text-sm text-cyan-300/90 font-mono">
              ⚡ Sovereign Autonomous Engine Active • 20 Specialist Swarms Synchronized • Durable Neon Cloud PostgreSQL Online
            </p>
            <div className="pt-2">
              <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-slate-950 font-black text-sm font-mono tracking-widest uppercase shadow-[0_0_50px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all">
                TAP ANYWHERE TO ACTIVATE & SPEAK
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              AUTOPLAY COMPLIANT // UNLOCKS HIGH-FIDELITY NEURAL SPEECH & CONTINUOUS VAD
            </p>
          </div>
        </div>
      )}

      {/* Floating Arc Reactor Voice Comm Button (Desktop Dock Access) */}
      <button
        onClick={() => {
          playJarvisChime('wake')
          setVoiceModalOpen(true)
        }}
        className="hidden md:flex fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.9)] hover:scale-105 transition-all items-center gap-2.5"
        title="Engage J.A.R.V.I.S. Voice Transceiver"
      >
        <div className="relative">
          <Mic className="w-5 h-5 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-mono hidden sm:inline font-black tracking-wider">TALK TO J.A.R.V.I.S.</span>
      </button>

      {/* Sovereign J.A.R.V.I.S. Neural Voice Transceiver Modal */}
      <JarvisVoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-cyan-400" /> Security Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">Change password, manage 2FA, view sessions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Two-Factor Auth</p>
                <p className="text-xs text-slate-400">Extra security layer for login</p>
              </div>
              <span className="text-xs text-emerald-400">Available</span>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 flex items-start gap-3">
              <Link2 className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Invite Code</p>
                <p className="text-xs text-slate-400">Share this to let someone create an account</p>
                <p className="text-sm font-mono text-cyan-300 mt-1 break-all">
                  {inviteCode || '••••••••••'}
                </p>
              </div>
              {inviteCode && (
                <button
                  onClick={() => navigator.clipboard?.writeText(inviteCode).then(() => setKeyMsg('✅ Invite code copied')).catch(() => {})}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 px-2 py-1 shrink-0">
                  Copy
                </button>
              )}
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <p className="text-xs text-slate-400 font-mono mb-2">AI PROVIDERS — BACKUP MODELS (24/7 UPTIME)</p>
              <div className="space-y-2">
                {providers.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {p.configured ? p.masked : `not connected · ${p.models}`}
                      </p>
                    </div>
                    {p.configured ? (
                      <button onClick={() => removeProviderKey(p.id)} className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1">Remove</button>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
                  className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-2 py-2 text-xs text-white">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Gemini</option>
                </select>
                <input type="password" value={newKey} onChange={e => { setNewKey(e.target.value); setKeyMsg('') }}
                  placeholder="Paste API key"
                  className="flex-1 min-w-0 bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50" />
                <button onClick={saveProviderKey} disabled={keyBusy || !newKey.trim()}
                  className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold disabled:opacity-40">
                  {keyBusy ? '...' : 'Add'}
                </button>
              </div>
              {keyMsg && <p className="text-[10px] text-slate-300 mt-2 font-mono">{keyMsg}</p>}
            </div>

            <div className="border-t border-slate-700/50 pt-4 space-y-3">
              <label className="text-xs text-slate-400 font-mono">CHANGE PASSWORD</label>
              <input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwError(''); setPwSuccess('') }}
                placeholder="Enter current password"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono">NEW PASSWORD</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwError(''); setPwSuccess('') }}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 pr-10 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50" />
                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono">CONFIRM NEW PASSWORD</label>
              <input type="password" value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwError(''); setPwSuccess('') }}
                placeholder="Confirm new password"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50" />
            </div>
            {pwError && <div className="flex items-center gap-2 text-red-400 text-xs font-mono"><AlertTriangle className="w-3 h-3" />{pwError}</div>}
            {pwSuccess && <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">✅ {pwSuccess}</div>}
            <button onClick={handleChangePassword}
              className="w-full py-2.5 rounded-lg bg-cyan-600 text-white font-semibold text-sm hover:bg-cyan-700 transition-all">
              Change Password
            </button>

            <div className="border-t border-slate-700/50 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Logged in as</p>
                  <p className="text-xs text-slate-400 font-mono">{username}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
