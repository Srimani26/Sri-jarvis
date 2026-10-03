import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Search, Mic, Bot, User, Sparkles, ArrowUpRight, RotateCcw,
  Loader2, AlertTriangle, Cpu, RefreshCw, Volume2, VolumeX, Shield,
  Code2, Workflow, DollarSign, Brain, Laptop, Layers, Zap, ExternalLink, Play
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import ArcReactorHUD from '@/components/ArcReactorHUD'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  source?: string
  error?: boolean
  detail?: string
  setupHint?: string
  actionTriggered?: {
    type: 'youtube' | 'food' | 'code'
    label: string
    url?: string
  }
}

const QUICK_ACTIONS = [
  { icon: '🛡️', label: 'Build Full-Stack SaaS', agent: 'aegis', query: 'Aegis, scaffold a complete full-stack AI Business OS architecture using Next.js 15, FastAPI, SQLite, and Tailwind CSS. Provide full directory tree and working code.' },
  { icon: '⚡', label: 'Export n8n Automation', agent: 'vortex', query: 'Vortex, generate a complete copy-pasteable n8n workflow JSON that catches website leads, qualifies them using Gemini AI, and generates a quotation in Zoho CRM.' },
  { icon: '💰', label: 'Make Me Money (B2B Retainer)', agent: 'midas', query: 'Midas, generate a high-ticket client acquisition pitch and cold outreach strategy to sell ₹1,50,000 automated CRM quotation engines to construction and roofing companies.' },
  { icon: '🧠', label: 'Global AI & Tech Recon', agent: 'cerebro', query: 'Cerebro, synthesize the top geopolitical and technical AI developments this week, focusing on sovereign AI infrastructure, autonomous swarms, and enterprise automation trends.' },
  { icon: '🎬', label: 'Open YouTube Research', agent: 'stark', query: 'open youtube for AI multi-agent architecture and autonomous swarms' },
  { icon: '🍔', label: 'Order Food in Erode', agent: 'stark', query: 'order food for me in Erode' },
]

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function renderMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3)
      const langMatch = lines.match(/^(\w+)\n/)
      const lang = langMatch ? langMatch[1] : ''
      const code = langMatch ? lines.slice(langMatch[0].length) : lines
      return (
        <div key={i} className="my-2.5 rounded-xl overflow-hidden border border-cyan-500/30 shadow-lg">
          {lang && (
            <div className="px-3.5 py-1.5 bg-slate-900 text-[10px] text-cyan-300 font-mono border-b border-slate-800 flex items-center justify-between">
              <span>{lang.toUpperCase()} // PRODUCTION CODE</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          )}
          <pre className="p-3.5 bg-slate-950/90 overflow-x-auto text-[11px] text-slate-200 font-mono whitespace-pre leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )
    }

    return (
      <div key={i} className="space-y-1.5">
        {part.split('\n').map((line, j) => {
          if (!line.trim()) return <div key={j} className="h-1.5" />

          if (line.match(/^\s*[-*•]\s/)) {
            return <li key={j} className="ml-4 text-xs leading-relaxed list-disc text-slate-200">{line.replace(/^\s*[-*•]\s/, '')}</li>
          }
          if (line.match(/^\s*\d+\.\s/)) {
            return <li key={j} className="ml-4 text-xs leading-relaxed list-decimal text-slate-200">{line.replace(/^\s*\d+\.\s/, '')}</li>
          }
          if (line.startsWith('### ')) return <h4 key={j} className="text-xs font-bold text-cyan-300 mt-2.5 font-mono">{line.slice(4)}</h4>
          if (line.startsWith('## ')) return <h3 key={j} className="text-sm font-bold text-white mt-3 font-mono border-b border-slate-800 pb-1">{line.slice(3)}</h3>
          if (line.startsWith('# ')) return <h2 key={j} className="text-base font-bold text-cyan-400 mt-3 font-mono">{line.slice(2)}</h2>

          const rendered = line.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((token, k) => {
            if (token.startsWith('**') && token.endsWith('**'))
              return <strong key={k} className="text-white font-semibold">{token.slice(2, -2)}</strong>
            if (token.startsWith('`') && token.endsWith('`'))
              return <code key={k} className="px-1 py-0.5 bg-slate-900 text-cyan-300 rounded font-mono text-[11px] border border-cyan-500/20">{token.slice(1, -1)}</code>
            return token
          })

          return <p key={j} className="text-xs leading-relaxed text-slate-200">{rendered}</p>
        })}
      </div>
    )
  })
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [jarvisMode, setJarvisMode] = useState<'active' | 'sleeping'>('active')
  const [hudStatus, setHudStatus] = useState<'online' | 'thinking' | 'speaking' | 'executing'>('online')
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('jarvis_muted') === 'true' } catch { return false }
  })
  const [models, setModels] = useState<Array<{ id: string; name: string; healthy: boolean }>>([])
  const [selectedModel, setSelectedModel] = useState('auto')
  const [selectedAgent, setSelectedAgent] = useState<'all' | 'aegis' | 'vortex' | 'midas' | 'cerebro' | 'stark'>('all')
  const [moaMode, setMoaMode] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const GREETING: Message = {
    id: generateId(),
    role: 'assistant',
    content: "Greetings, Master Sri. I am **J.A.R.V.I.S. Mark-IV** — your personal autonomous AI command center.\n\nThe **Arc Reactor** is primed, the **MoA multi-agent swarm** is standing by, and all operational domains are under your direct command:\n\n- 🛡️ **Aegis (Full-Stack Engineer)** — Builds complete Next.js / FastAPI web apps, databases, and micro-SaaS platforms\n- ⚡ **Vortex (Heavy Automation)** — Generates n8n JSON workflows, 4-layer Zoho CRM Deluge functions, and Google Ads scripts\n- 💰 **Midas (Revenue Engine)** — Formulates high-ticket B2B client acquisition pitches, pricing engines, and lead monetization\n- 🧠 **Cerebro (Deep Intel & Research)** — Real-time geopolitics, market trends, competitive reconnaissance, and reasoning\n- 📱 **Stark OS (Device Concierge)** — Dispatches immediate workstation actions: searches YouTube, orders food in Erode, launches tools\n- 🏭 **Forge (Agent Trainer)** — Spawns and trains new custom subordinate AI agents on your order\n\n**Your wish is my command, Master. What shall we execute today?**",
    timestamp: new Date(),
    source: 'J.A.R.V.I.S. Core (Argon Swarm)',
  }

  // Text-To-Speech (British J.A.R.V.I.S. Audio)
  const speakJarvisResponse = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block generated.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/[#*_-]/g, '')
        .slice(0, 350)
        .trim()

      if (!cleanText) return

      const utterance = new SpeechSynthesisUtterance(cleanText)
      const voices = window.speechSynthesis.getVoices()
      const britishVoice = voices.find(
        (v) => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('Daniel') || v.name.includes('UK')
      ) || voices.find((v) => v.lang.startsWith('en'))

      if (britishVoice) utterance.voice = britishVoice
      utterance.rate = 1.02
      utterance.pitch = 0.95
      utterance.onstart = () => setHudStatus('speaking')
      utterance.onend = () => setHudStatus('online')
      utterance.onerror = () => setHudStatus('online')
      window.speechSynthesis.speak(utterance)
    } catch {
      setHudStatus('online')
    }
  }, [isMuted])

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev
      try { localStorage.setItem('jarvis_muted', String(next)) } catch {}
      if (next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return next
    })
  }

  // Restore history
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/ai/history?limit=40', { headers: authHeaders() })
        const body = await res.json().catch(() => ({}))
        const restored: Message[] = (body?.messages || [])
          .filter((msg: any) => msg?.role === 'user' || msg?.role === 'assistant')
          .map((msg: any) => ({
            id: generateId(),
            role: msg.role as 'user' | 'assistant',
            content: String(msg.content || ''),
            timestamp: new Date(msg.createdAt || Date.now()),
          }))
        if (cancelled) return
        setMessages(restored.length ? restored : [GREETING])
      } catch {
        if (!cancelled) setMessages([GREETING])
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Fetch live models
  useEffect(() => {
    fetch('/api/ai/models')
      .then((r) => r.json())
      .then((d) => setModels(d?.models || []))
      .catch(() => {})
  }, [])

  const selectedLabel = selectedModel === 'auto'
    ? 'Auto (Argon MoA)'
    : (models.find((mm) => mm.id === selectedModel)?.name || selectedModel)

  const resetChat = useCallback(async () => {
    fetch('/api/ai/history', { method: 'DELETE', headers: authHeaders() }).catch(() => {})
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: 'All neural buffers cleared, Master Sri. Arc Reactor at 100%. Standing by for your next strategic directive.',
      timestamp: new Date(),
      source: 'J.A.R.V.I.S. Core',
    }])
  }, [])

  // Voice STT recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setInput(transcript)
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false)
          setTimeout(() => sendMessage(transcript), 300)
        }
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Send message
  const sendMessage = useCallback(async (text: string, opts?: { skipUserEcho?: boolean }) => {
    if (!text.trim() || isTyping) return

    const lower = text.trim().toLowerCase()

    // Standby & Wake commands
    const wakePatterns = ['hey jarvis', 'wake up', 'wake', 'jarvis wake', 'hello jarvis', 'activate', 'jarvis activate', 'online jarvis', 'jarvis online']
    const sleepPatterns = ['rest', 'go to rest', 'go to sleep', 'sleep', 'jarvis rest', 'jarvis sleep', 'you can rest', 'standby']

    if (wakePatterns.some((p) => lower.includes(p))) {
      setJarvisMode('active')
      const wakeReply = "Arc Reactor online, Master Sri. J.A.R.V.I.S. is at full operational readiness. Swarms standing by. What are your orders?"
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'user', content: text.trim(), timestamp: new Date(),
      }, {
        id: generateId(), role: 'assistant', content: wakeReply, timestamp: new Date(), source: 'J.A.R.V.I.S. Core',
      }])
      speakJarvisResponse(wakeReply)
      setInput('')
      return
    }

    if (sleepPatterns.some((p) => lower.includes(p))) {
      setJarvisMode('sleeping')
      const sleepReply = "Entering standby power mode, Master Sri. Peripheral telemetry and security sentinels remain active in the background. Say 'Hey JARVIS' to bring all systems online."
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'user', content: text.trim(), timestamp: new Date(),
      }, {
        id: generateId(), role: 'assistant', content: sleepReply, timestamp: new Date(), source: 'J.A.R.V.I.S. Core',
      }])
      speakJarvisResponse(sleepReply)
      setInput('')
      return
    }

    if (jarvisMode === 'sleeping') {
      setJarvisMode('active')
    }

    // Direct Device Action: YouTube
    let actionTriggered: any = null
    if (lower.includes('youtube') && (lower.includes('open') || lower.includes('search') || lower.includes('play'))) {
      const q = text.replace(/open|youtube|search|play|for|can you|please|jarvis/gi, '').trim() || 'AI agent autonomous swarm'
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
      window.open(url, '_blank', 'noopener,noreferrer')
      actionTriggered = { type: 'youtube', label: `Opening YouTube search for: "${q}"`, url }
    }

    // Direct Device Action: Food Order in Erode
    if (lower.includes('order food') || lower.includes('swiggy') || lower.includes('zomato')) {
      const q = text.replace(/order|food|swiggy|zomato|for me|can you|in erode/gi, '').trim() || 'Food Delivery Restaurants Erode'
      const url = `https://www.google.com/search?q=${encodeURIComponent(q + ' Swiggy Zomato Erode')}`
      window.open(url, '_blank', 'noopener,noreferrer')
      actionTriggered = { type: 'food', label: `Dispatching food logistics in Erode for Master Sri`, url }
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    const newMessages = opts?.skipUserEcho ? messages : [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)
    setHudStatus('thinking')

    const assistantId = generateId()

    const updateAssistant = (content: string, source?: string) => {
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.findIndex((m) => m.id === assistantId)
        if (lastIdx >= 0) {
          updated[lastIdx] = { ...updated[lastIdx], content, source, error: false, actionTriggered }
        } else {
          updated.push({ id: assistantId, role: 'assistant', content, timestamp: new Date(), source, actionTriggered })
        }
        return updated
      })
      speakJarvisResponse(content)
      setHudStatus('online')
    }

    const failAssistant = (content: string, detail?: string, setupHint?: string) => {
      setMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findIndex((mm) => mm.id === assistantId)
        const notice: Message = {
          id: assistantId, role: 'assistant', content, timestamp: new Date(), error: true, detail, setupHint,
        }
        if (idx >= 0) updated[idx] = notice
        else updated.push(notice)
        return updated
      })
      setHudStatus('online')
    }

    // Prepend Sub-Agent Routing Directive if selected
    let promptPayload = text.trim()
    if (selectedAgent === 'aegis') {
      promptPayload = `[SUB-AGENT AEGIS DIRECTIVE // FULL-STACK ARCHITECT]: ${promptPayload}`
    } else if (selectedAgent === 'vortex') {
      promptPayload = `[SUB-AGENT VORTEX DIRECTIVE // HEAVY AUTOMATION SPECIALIST]: ${promptPayload}`
    } else if (selectedAgent === 'midas') {
      promptPayload = `[SUB-AGENT MIDAS DIRECTIVE // REVENUE & MONETIZATION ENGINE]: ${promptPayload}`
    } else if (selectedAgent === 'cerebro') {
      promptPayload = `[SUB-AGENT CEREBRO DIRECTIVE // DEEP REASONING & INTEL]: ${promptPayload}`
    } else if (selectedAgent === 'stark') {
      promptPayload = `[SUB-AGENT STARK OS DIRECTIVE // DEVICE & CONCIERGE CONTROLLER]: ${promptPayload}`
    }

    if (moaMode) {
      promptPayload = `[MoA 3-LAYER DELIBERATION ACTIVE]: ${promptPayload}`
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          messages: newMessages
            .filter((msg) => !msg.error)
            .map((msg, idx) => ({
              role: msg.role,
              content: idx === newMessages.length - 1 ? promptPayload : msg.content,
            })),
          model: selectedModel === 'auto' ? undefined : selectedModel,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data) {
        throw new Error(data?.error || `Server error (${response.status})`)
      }

      if (data.content) {
        updateAssistant(data.content, data.source)
        return
      }

      failAssistant(
        'Systems temporarily unreachable, Master Sri.',
        data?.detail || 'No response returned from the MoA neural engine.',
        data?.setupHint
      )
    } catch (err: any) {
      failAssistant(
        'Neural link timeout, Master Sri.',
        err?.message || 'Network anomaly detected.',
        'J.A.R.V.I.S. is attempting reconnect protocol.'
      )
    } finally {
      setIsTyping(false)
    }
  }, [messages, isTyping, jarvisMode, selectedModel, selectedAgent, moaMode, speakJarvisResponse])

  return (
    <div className="space-y-4">
      {/* Arc Reactor HUD Header */}
      <ArcReactorHUD
        status={hudStatus}
        activeModel={selectedLabel}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onVoiceTrigger={toggleVoice}
      />

      {/* Sub-Agent Delegation Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] font-mono text-slate-500 mr-1 hidden sm:inline">SWARM DELEGATION:</span>
          {[
            { id: 'all', label: 'J.A.R.V.I.S. (Chief)', icon: Shield, color: 'text-cyan-400' },
            { id: 'aegis', label: 'Aegis (Full-Stack)', icon: Code2, color: 'text-cyan-300' },
            { id: 'vortex', label: 'Vortex (Auto)', icon: Workflow, color: 'text-amber-400' },
            { id: 'midas', label: 'Midas (Revenue)', icon: DollarSign, color: 'text-emerald-400' },
            { id: 'cerebro', label: 'Cerebro (Intel)', icon: Brain, color: 'text-purple-400' },
            { id: 'stark', label: 'Stark OS (Device)', icon: Laptop, color: 'text-rose-400' },
          ].map((item) => {
            const Icon = item.icon
            const isSelected = selectedAgent === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSelectedAgent(item.id as any)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all border whitespace-nowrap',
                  isSelected
                    ? 'bg-cyan-500/20 text-white border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-3 h-3', isSelected ? item.color : 'text-slate-500')} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* MoA Toggle & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMoaMode(!moaMode)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono border transition-all',
              moaMode
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            )}
            title="Mixture of Agents: Parallel multi-model consensus"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>MoA 3-LAYER: {moaMode ? 'ARMED' : 'OFF'}</span>
          </button>

          <button
            onClick={resetChat}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 border border-transparent hover:border-red-500/20"
            title="Clear conversation history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="relative min-h-[420px] max-h-[560px] overflow-y-auto rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4 sm:p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-3xl transition-all',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-lg',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-400/50 text-white'
                  : 'bg-gradient-to-br from-slate-900 to-cyan-950 border-cyan-500/40 text-cyan-300'
              )}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-cyan-400" />}
            </div>

            <div
              className={cn(
                'rounded-2xl p-4 border text-xs leading-relaxed space-y-2 max-w-[88%]',
                msg.role === 'user'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : msg.error
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-slate-900/80 border-slate-800/90 text-slate-200 shadow-md'
              )}
            >
              <div className="flex items-center justify-between gap-4 pb-1 border-b border-slate-800/60 text-[10px] font-mono text-slate-400">
                <span className="font-bold text-cyan-400 uppercase">
                  {msg.role === 'user' ? 'Master Sri' : 'J.A.R.V.I.S. Mark-IV'}
                </span>
                <span>{formatTime(msg.timestamp)}</span>
              </div>

              <div>{renderMarkdown(msg.content)}</div>

              {msg.actionTriggered && (
                <div className="mt-2 p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{msg.actionTriggered.label}</span>
                  </div>
                  {msg.actionTriggered.url && (
                    <a
                      href={msg.actionTriggered.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {msg.source && (
                <div className="pt-1.5 text-[9px] font-mono text-slate-500 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                  <span>Synthesized by: {msg.source}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-xl mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>J.A.R.V.I.S. neural swarm deliberating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Directives */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedAgent(action.agent as any)
              sendMessage(action.query)
            }}
            className="flex flex-col items-start p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/70 transition-all text-left group"
          >
            <span className="text-base mb-1">{action.icon}</span>
            <span className="text-[11px] font-mono font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Chat Command Input Bar */}
      <div className="relative rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-2xl">
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          placeholder="Command J.A.R.V.I.S... (e.g. 'Build a Next.js full-stack SaaS', 'Open YouTube for AI tutorial', 'Export n8n workflow')"
          className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-mono"
        />

        <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span>COMMANDER: <strong className="text-slate-300">MASTER SRI</strong></span>
            <span>•</span>
            <span>TARGET: <strong className="text-cyan-400 uppercase">{selectedAgent}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                className={cn(
                  'p-2 rounded-xl border transition-all',
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                )}
                title="Voice Input (Speech-To-Text)"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              disabled={!input.trim() || isTyping}
              onClick={() => sendMessage(input)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all',
                input.trim() && !isTyping
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              )}
            >
              <span>DISPATCH</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
