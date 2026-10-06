import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Search, Mic, Bot, User, Sparkles, ArrowUpRight, RotateCcw,
  Loader2, AlertTriangle, Cpu, RefreshCw, Volume2, VolumeX, Shield,
  Code2, Workflow, DollarSign, Brain, Laptop, Layers, Zap, ExternalLink, Play,
  Plane, ShoppingCart, Radio, PhoneCall, Check, Compass
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playJarvisChime } from '@/lib/sound'
import ArcReactorHUD from '@/components/ArcReactorHUD'

interface FlightDeal {
  airline: string
  route: string
  duration: string
  stops: string
  estimatedPriceINR: string
  badge: string
  bookingUrl: string
}

interface ProductRec {
  name: string
  processor: string
  display: string
  camera: string
  battery: string
  amazonPrice: string
  flipkartPrice: string
  verdict: string
  amazonLink: string
  flipkartLink: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  source?: string
  error?: boolean
  detail?: string
  setupHint?: string
  flightData?: FlightDeal[]
  productData?: ProductRec[]
  actionTriggered?: {
    type: 'youtube' | 'food' | 'flight' | 'product'
    label: string
    url?: string
  }
}

const QUICK_ACTIONS = [
  { icon: '✈️', label: 'Mumbai to Miami Flights', query: 'Hey Jarvis, can you look for flights from Mumbai to Miami today? Find the best deal and direct booking options.' },
  { icon: '📱', label: 'Analyze Flipkart & Amazon Mobiles', query: 'Hey Jarvis, I plan to buy a mobile so analyze Flipkart and Amazon and list out the best mobiles for me with specs and prices.' },
  { icon: '🛡️', label: 'Build Full-Stack SaaS', query: 'Aegis, scaffold a complete full-stack AI Business OS architecture using Next.js 15, FastAPI, SQLite, and Tailwind CSS.' },
  { icon: '⚡', label: 'Export n8n Automation', query: 'Vortex, generate a complete copy-pasteable n8n workflow JSON for lead qualification and Zoho CRM quotation.' },
  { icon: '💰', label: 'Make Me Money (B2B Retainer)', query: 'Midas, generate a high-ticket client acquisition pitch and cold outreach strategy to sell ₹1,50,000 automated CRM quotation engines.' },
  { icon: '🍔', label: 'Order Food in Erode', query: 'Order food for me in Erode' },
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
              <span>{lang.toUpperCase()} // PRODUCTION BLUEPRINT</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Copy Code
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


function cleanAndDeduplicateTranscript(raw: string): string {
  if (!raw) return ''
  let text = raw.trim().replace(/\b([\w']+)(?:\s+\1\b)+/gi, '$1')
  for (let pass = 0; pass < 6; pass++) {
    const words = text.split(/\s+/)
    if (words.length < 2) break
    let changed = false
    for (let n = Math.min(8, Math.floor(words.length / 2)); n >= 1; n--) {
      for (let i = 0; i <= words.length - n * 2; i++) {
        if (words.slice(i, i + n).join(' ').toLowerCase() === words.slice(i + n, i + n * 2).join(' ').toLowerCase()) {
          words.splice(i + n, n)
          text = words.join(' ')
          changed = true
          break
        }
      }
      if (changed) break
    }
  }
  return text.replace(/\s+/g, ' ').trim()
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [sentinelActive, setSentinelActive] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [hudStatus, setHudStatus] = useState<'online' | 'thinking' | 'speaking' | 'executing'>('online')
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('jarvis_muted') === 'true' } catch { return false }
  })
  const [models, setModels] = useState<Array<{ id: string; name: string; healthy: boolean }>>([])
  const [selectedModel, setSelectedModel] = useState('auto')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [moaMode, setMoaMode] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const GREETING: Message = {
    id: generateId(),
    role: 'assistant',
    content: "Greetings, Master Sri. I am **J.A.R.V.I.S. Mark-IV** — your personal autonomous AI right-hand and multi-agent command center.\n\nThe **Arc Reactor** is at 100% power, voice sentinel is primed, and the MoA neural engine understands your workflow, lifestyle, and business goals with deep emotional precision.\n\nSay **'Hey Jarvis'** anytime or command me directly:\n- ✈️ *'Look for flights from Mumbai to Miami today'*\n- 📱 *'Analyze Flipkart and Amazon to find the best mobile for me'*\n- 🛡️ *'Aegis, scaffold a full-stack Next.js + FastAPI SaaS'*\n- ⚡ *'Vortex, generate an n8n quotation workflow JSON'*\n- 💰 *'Midas, make me money: create a ₹1,50,000 CRM client proposal'*\n\n**I am ready for your command, Master. How may I serve you today?**",
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
        .slice(0, 380)
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

  // Live models
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

  
  // Real-time task execution polling
  useEffect(() => {
    let mounted = true
    const pollActiveTasks = async () => {
      try {
        const res = await fetch('/api/tasks/active', { headers: authHeaders() })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setActiveTasks(data.activeTasks || [])
      } catch {}
    }
    pollActiveTasks()
    const interval = setInterval(pollActiveTasks, 2500)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Send message implementation
  const sendMessage = useCallback(async (text: string, opts?: { skipUserEcho?: boolean }) => {
    if (!text.trim() || isTyping) return

    const lower = text.trim().toLowerCase()

    // 1. "Hey Jarvis" Wake-word trigger
    if (lower === 'hey jarvis' || lower === 'hello jarvis' || lower === 'jarvis' || lower === 'wake up jarvis') {
      playJarvisChime('wake')
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40])
      const wakeReply = "Hi Master, how can I help you today? All systems and swarms are standing by for your command."
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'user', content: text.trim(), timestamp: new Date(),
      }, {
        id: generateId(), role: 'assistant', content: wakeReply, timestamp: new Date(), source: 'J.A.R.V.I.S. Core',
      }])
      speakJarvisResponse(wakeReply)
      setInput('')
      return
    }

    // 2. Flight Search Intelligence (Mumbai to Miami / Any Flight)
    let flightData: FlightDeal[] | undefined = undefined
    if (lower.includes('flight') || lower.includes('fly to') || lower.includes('air ticket')) {
      playJarvisChime('execute')
      try {
        const fromMatch = lower.includes('mumbai') ? 'Mumbai' : 'Chennai'
        const toMatch = lower.includes('miami') ? 'Miami' : 'London'
        const res = await fetch(`/api/tools/flights?from=${encodeURIComponent(fromMatch)}&to=${encodeURIComponent(toMatch)}`, { headers: authHeaders() })
        const json = await res.json()
        if (json?.deals) flightData = json.deals
      } catch {}
    }

    // 3. E-Commerce Mobile Comparison (Flipkart vs Amazon)
    let productData: ProductRec[] | undefined = undefined
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('flipkart') || lower.includes('amazon')) {
      if (lower.includes('buy') || lower.includes('best') || lower.includes('analyze') || lower.includes('comparison')) {
        playJarvisChime('execute')
        try {
          const res = await fetch('/api/tools/products?category=mobile', { headers: authHeaders() })
          const json = await res.json()
          if (json?.recommendations) productData = json.recommendations
        } catch {}
      }
    }

    // 4. Direct Device Action: YouTube
    let actionTriggered: any = null
    if (lower.includes('youtube') && (lower.includes('open') || lower.includes('search') || lower.includes('play'))) {
      const q = text.replace(/open|youtube|search|play|for|can you|please|jarvis/gi, '').trim() || 'AI autonomous swarms'
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
      window.open(url, '_blank', 'noopener,noreferrer')
      actionTriggered = { type: 'youtube', label: `Opened YouTube search for: "${q}"`, url }
    }

    // 5. Direct Device Action: Food Order in Erode
    if (lower.includes('order food') || lower.includes('swiggy') || lower.includes('zomato')) {
      const q = text.replace(/order|food|swiggy|zomato|for me|can you|in erode/gi, '').trim() || 'Food Delivery Restaurants Erode'
      const url = `https://www.google.com/search?q=${encodeURIComponent(q + ' Swiggy Zomato Erode')}`
      window.open(url, '_blank', 'noopener,noreferrer')
      actionTriggered = { type: 'food', label: `Dispatched food delivery search in Erode for Master Sri`, url }
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
          updated[lastIdx] = { ...updated[lastIdx], content, source, error: false, flightData, productData, actionTriggered }
        } else {
          updated.push({ id: assistantId, role: 'assistant', content, timestamp: new Date(), source, flightData, productData, actionTriggered })
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

    let promptPayload = text.trim()
    if (moaMode) {
      promptPayload = `[MoA 3-LAYER DELIBERATION ACTIVE // EMPATHETIC PRODUCTION ENGINE]: ${promptPayload}`
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
          agentId: selectedAgent !== 'all' ? selectedAgent : undefined,
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
        'J.A.R.V.I.S. reconnect protocol engaged.'
      )
    } finally {
      setIsTyping(false)
    }
  }, [messages, isTyping, selectedModel, moaMode, speakJarvisResponse])

  // Continuous "Hey Jarvis" Speech Sentinel setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        const lower = transcript.toLowerCase().trim()

        // Check for wake word in speech stream
        if (lower.includes('hey jarvis') || lower.includes('hello jarvis') || lower.includes('jarvis wake up')) {
          playJarvisChime('wake')
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40])
        }

        setInput(transcript)
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false)
          setTimeout(() => sendMessage(transcript), 350)
        }
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => {
        if (sentinelActive) {
          try { recognition.start() } catch {}
        } else {
          setIsListening(false)
        }
      }
      recognitionRef.current = recognition
    }
  }, [sentinelActive, sendMessage])

  const toggleSentinel = () => {
    if (!recognitionRef.current) return
    if (sentinelActive) {
      setSentinelActive(false)
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setSentinelActive(true)
      playJarvisChime('wake')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {}
    }
  }

  const toggleVoiceOnce = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      playJarvisChime('wake')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {}
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="space-y-4">
      {/* Arc Reactor HUD Header */}
      <ArcReactorHUD
        status={hudStatus}
        activeModel={selectedLabel}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onVoiceTrigger={toggleVoiceOnce}
      />

      {/* Sub-Agent Delegation & Sentinel Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={toggleSentinel}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border shrink-0',
              sentinelActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white'
            )}
            title="Continuous Hey Jarvis voice wake detector for mobile & desktop"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>{sentinelActive ? "'HEY JARVIS' WAKE ACTIVE" : "ENABLE 'HEY JARVIS' SENTINEL"}</span>
          </button>

          {[
            { id: 'all', label: 'J.A.R.V.I.S. (Chief)', icon: Shield, color: 'text-cyan-400' },
            { id: 'skynet', label: 'SkyNet (Flights)', icon: Plane, color: 'text-sky-400' },
            { id: 'omnibuy', label: 'OmniBuy (Commerce)', icon: ShoppingCart, color: 'text-amber-400' },
            { id: 'aegis', label: 'Aegis (Full-Stack)', icon: Code2, color: 'text-cyan-300' },
            { id: 'vortex', label: 'Vortex (Auto)', icon: Workflow, color: 'text-amber-400' },
            { id: 'midas', label: 'Midas (Revenue)', icon: DollarSign, color: 'text-emerald-400' },
          ].map((item) => {
            const Icon = item.icon
            const isSelected = selectedAgent === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSelectedAgent(item.id as any)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all border whitespace-nowrap',
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
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="relative min-h-[380px] max-h-[62vh] sm:max-h-[600px] overflow-y-auto rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4 sm:p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
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
                'rounded-2xl p-4 border text-xs leading-relaxed space-y-3 max-w-[92%]',
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

              {/* Interactive Flight Intelligence Card */}
              {msg.flightData && msg.flightData.length > 0 && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-sky-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-sky-400">
                      <Plane className="w-4 h-4" />
                      <span className="font-bold text-xs font-mono">LIVE FLIGHT INTELLIGENCE // MUMBAI (BOM) → MIAMI (MIA)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">BEST PRICES VERIFIED</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.flightData.map((deal, didx) => (
                      <div key={didx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-white">{deal.airline}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {deal.badge}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300">{deal.route}</p>
                          <p className="text-[10px] font-mono text-slate-500">Duration: {deal.duration} • {deal.stops}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black font-mono text-emerald-400">{deal.estimatedPriceINR}</span>
                          <a
                            href={deal.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all cursor-pointer shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                          >
                            <span>BOOK DEAL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive E-Commerce Comparison Card (Amazon vs Flipkart) */}
              {msg.productData && msg.productData.length > 0 && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-amber-400">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="font-bold text-xs font-mono">E-COMMERCE RECON // FLIPKART VS AMAZON BEST MOBILES</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">2026 BENCHMARK</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {msg.productData.map((rec, pidx) => (
                      <div key={pidx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{rec.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-400">{rec.amazonPrice}</span>
                        </div>
                        <p className="text-[11px] font-mono text-cyan-300/90">{rec.verdict}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono text-slate-400">
                          <div><strong>Chip:</strong> {rec.processor}</div>
                          <div><strong>Display:</strong> {rec.display}</div>
                          <div><strong>Camera:</strong> {rec.camera}</div>
                          <div><strong>Battery:</strong> {rec.battery}</div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <a
                            href={rec.amazonLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                          >
                            VIEW ON AMAZON ({rec.amazonPrice})
                          </a>
                          <a
                            href={rec.flipkartLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                          >
                            VIEW ON FLIPKART ({rec.flipkartPrice})
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      
      {/* 16-Agent Dedicated Channel Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none px-1">
        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">CHANNEL:</span>
        {[
          { id: 'all', name: 'Fleet Swarm', icon: '⚡' },
          { id: 'aegis', name: 'Aegis (Dev)', icon: '🛡️' },
          { id: 'vortex', name: 'Vortex (n8n)', icon: '🌀' },
          { id: 'midas', name: 'Midas (Revenue)', icon: '💰' },
          { id: 'cerebro', name: 'Cerebro (Intel)', icon: '🌐' },
          { id: 'stark_os', name: 'Stark OS', icon: '⚙️' },
          { id: 'deepseek_r1', name: 'DeepSeek R1', icon: '🧠' },
          { id: 'browser_use', name: 'Browser-Use', icon: '🔍' },
          { id: 'openhands', name: 'OpenHands', icon: '💻' },
          { id: 'debugger', name: 'Build Error Resolver', icon: '🔧' },
        ].map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all shrink-0 border",
              selectedAgent === agent.id
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            )}
          >
            <span>{agent.icon}</span>
            <span>{agent.name}</span>
          </button>
        ))}
      </div>


      {/* Sleek Horizontal Quick Directive Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>DIRECTIVES:</span>
        </span>
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => sendMessage(action.query)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-[11px] font-mono whitespace-nowrap shrink-0 shadow-sm"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
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
          placeholder="Command J.A.R.V.I.S... (e.g. 'What is the rate of Samsung S26 Ultra', 'Scaffold full-stack app', 'Export n8n automation')..."
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
                onClick={toggleVoiceOnce}
                className={cn(
                  'p-2 rounded-xl border transition-all cursor-pointer',
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
