import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send, Search, Mic, Bot, User, Sparkles, ArrowUpRight, RotateCcw,
  Loader2, AlertTriangle, Cpu, RefreshCw, Volume2, VolumeX, Shield,
  Code2, Workflow, DollarSign, Brain, Laptop, Layers, Zap, ExternalLink, Play,
  Plane, ShoppingCart, Radio, PhoneCall, Check, Compass, MessageSquare, Plus,
  History, X, Trash2, Copy, PanelLeftClose, PanelLeft, ChevronDown, Clock
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playJarvisChime, playNeuralSpeech, stopNeuralSpeech } from '@/lib/sound'
import ArcReactorHUD from '@/components/ArcReactorHUD'
import TaskProgressCard, { AgentTask } from '@/components/TaskProgressCard'
import { ConversationOS } from '@/voice/ConversationOS'

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
  taskData?: AgentTask
  actionTriggered?: {
    type: 'youtube' | 'food' | 'flight' | 'product' | 'shopify'
    label: string
    url?: string
    embedUrl?: string
  }
}

const QUICK_ACTIONS = [
  { icon: '📅', label: "Today's Live Date & Time", query: "What is today's exact date and current live time?" },
  { icon: '🎨', label: 'Generate 4K Visual Concept', query: 'Generate 4K image of a futuristic hyper-advanced AI cyber command portal with holographic neon HUD' },
  { icon: '🏗️', label: 'Full-Stack SaaS Scaffolding', query: 'Swarm, build a full-stack SaaS project end to end: AI Roof Inspection and Automated Quotation Portal with database models, frontend HUD, and API routes.' },
  { icon: '⚡', label: 'Build N8N Automation', query: 'Vortex, generate a complete copy-pasteable n8n workflow JSON for automated webhook lead intake, CRM synchronization, and email alerts.' },
  { icon: '🏢', label: 'Enterprise ERP Architecture', query: 'Daedalus, design a full-stack multi-tenant ERP system architecture with role-based access, inventory tracking, and invoice pipelines.' },
  { icon: '⚡', label: 'Parallel Swarm Multitask', query: 'Execute parallel multitasking: Daedalus design API schema, Friday implement auth routes, Aegis scan vulnerabilities, and Midas compute unit economics concurrently.' },
  { icon: '🎧', label: 'Best TWS Under ₹2,000', query: 'I plan to buy a new TWS in this festival season so can you analyze in Flipkart and Amazon for the best deal and my budget is 2000 rupees' },
  { icon: '📱', label: 'Flagship Mobile Recon', query: 'Analyze Flipkart and Amazon for the best deals on Samsung Galaxy S26 Ultra and iPhone 16 Pro with true market pricing.' },
  { icon: '💰', label: 'Make Me Money (B2B Retainer)', query: 'Midas, generate a high-ticket client acquisition pitch and cold outreach strategy to sell ₹1,50,000 automated CRM quotation engines.' },
]

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const isHtml = (
    lang.toLowerCase() === 'html' ||
    lang.toLowerCase() === 'markup' ||
    code.includes('<!DOCTYPE') ||
    code.includes('<html') ||
    (code.includes('<div') && (code.includes('function ') || code.includes('class=') || code.includes('id='))) ||
    code.includes('<script')
  )
  const [viewMode, setViewMode] = useState<'preview' | 'code'>(isHtml ? 'preview' : 'code')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate self-contained, styled HTML document for iframe execution
  const previewDoc = useMemo(() => {
    if (!isHtml) return ''
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #02040a;
      color: #f8fafc;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`
  }, [code, isHtml])

  const openInNewTab = () => {
    const blob = new Blob([previewDoc || code], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/90 shadow-2xl">
      <div className="px-4 py-2.5 bg-slate-900/90 text-[10px] text-cyan-300 font-mono border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isHtml && (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-cyan-500/20">
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                  viewMode === 'preview'
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <span>⚡ LIVE APP PREVIEW</span>
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                  viewMode === 'code'
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <span>💻 CODE</span>
              </button>
            </div>
          )}
          {!isHtml && (
            <span className="font-bold tracking-wider">{lang ? lang.toUpperCase() : 'CODE'} // PRODUCTION READY</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHtml && (
            <button
              onClick={openInNewTab}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer text-[10px] font-bold"
              title="Open working app in a separate full-size tab"
            >
              <span>🚀 OPEN FULLSCREEN</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {isHtml && viewMode === 'preview' ? (
        <div className="relative w-full h-[420px] bg-slate-950 overflow-hidden">
          <iframe
            srcDoc={previewDoc}
            title="Interactive App Preview"
            className="w-full h-full border-0 bg-transparent"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          />
        </div>
      ) : (
        <pre className="p-4 bg-slate-950/95 overflow-x-auto text-xs text-slate-200 font-mono whitespace-pre leading-relaxed max-h-[460px]">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

function renderMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3)
      const langMatch = lines.match(/^(\w+)\n/)
      const lang = langMatch ? langMatch[1] : ''
      const code = langMatch ? lines.slice(langMatch[0].length) : lines
      return <CodeBlock key={i} code={code} lang={lang} />
    }

    return (
      <div key={i} className="space-y-2">
        {part.split('\n').map((line, j) => {
          if (!line.trim()) return <div key={j} className="h-1.5" />

          // Inline Markdown Image Rendering (4K Visual Examples & Diagrams)
          const imgMatch = line.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/)
          if (imgMatch) {
            const alt = imgMatch[1] || 'Visual Generation'
            const src = imgMatch[2]
            return (
              <div key={j} className="my-3 rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/80 shadow-2xl">
                <div className="relative group overflow-hidden">
                  <img
                    src={src}
                    alt={alt}
                    className="w-full max-h-[480px] object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-xs font-mono text-cyan-300 font-bold truncate pr-2">{alt}</span>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shrink-0 hover:bg-cyan-400"
                    >
                      <span>Full 4K Res</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
                  <span className="font-semibold truncate">🎨 {alt}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Visual Core // 4K</span>
                </div>
              </div>
            )
          }

          if (line.match(/^\s*[-*•]\s/)) {
            return (
              <div key={j} className="flex items-start gap-2 ml-2 text-xs leading-relaxed text-slate-200">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{line.replace(/^\s*[-*•]\s/, '')}</span>
              </div>
            )
          }
          if (line.match(/^\s*\d+\.\s/)) {
            const num = line.match(/^\s*(\d+)\.\s/)?.[1]
            return (
              <div key={j} className="flex items-start gap-2 ml-2 text-xs leading-relaxed text-slate-200">
                <span className="text-cyan-400 font-mono font-bold shrink-0">{num}.</span>
                <span>{line.replace(/^\s*\d+\.\s/, '')}</span>
              </div>
            )
          }
          if (line.startsWith('### ')) return <h4 key={j} className="text-xs font-bold text-cyan-300 mt-3 font-mono">{line.slice(4)}</h4>
          if (line.startsWith('## ')) return <h3 key={j} className="text-sm font-bold text-white mt-3.5 font-mono border-b border-slate-800 pb-1">{line.slice(3)}</h3>
          if (line.startsWith('# ')) return <h2 key={j} className="text-base font-black text-cyan-400 mt-4 font-mono">{line.slice(2)}</h2>

          const rendered = line.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((token, k) => {
            if (token.startsWith('**') && token.endsWith('**'))
              return <strong key={k} className="text-white font-semibold">{token.slice(2, -2)}</strong>
            if (token.startsWith('`') && token.endsWith('`'))
              return <code key={k} className="px-1.5 py-0.5 bg-slate-900 text-cyan-300 rounded font-mono text-[11px] border border-cyan-500/20">{token.slice(1, -1)}</code>
            return token
          })

          return <p key={j} className="text-xs leading-relaxed text-slate-200">{rendered}</p>
        })}
      </div>
    )
  })
}

function applyVoiceTypeDictionary(raw: string): string {
  let t = raw
  const replacements: [RegExp, string][] = [
    [/\b(down\s*theme|dawn\s*teme|don\s*theme)\b/gi, 'Dawn theme'],
    [/\b(shopify|shop\s*fi|shotify)\b/gi, 'Shopify'],
    [/\b(liquid|liqud|likwid)\b/gi, 'Liquid'],
    [/\b(c\s*s\s*s|see\s*ss)\b/gi, 'CSS'],
    [/\b(z\s*index|zed\s*index)\b/gi, 'z-index'],
    [/\b(u\s*p\s*i)\b/gi, 'UPI'],
    [/\b(atonoumus|autonomus|atonumus)\b/gi, 'autonomous'],
    [/\b(cart\s*drower|card\s*drawer)\b/gi, 'cart drawer'],
    [/\b(scout\s*lid|scout\s*lead|scout\s*leads)\b/gi, 'scout leads'],
    [/\b(e\s*o\s*d)\b/gi, 'EOD audit'],
    [/\b(make\s*money|money\s*making)\b/gi, 'make money'],
    [/\b(freelance|free\s*lancing)\b/gi, 'freelance'],
    [/\b(standard\s*roofs|standard\s*roof)\b/gi, 'Standard Roofs'],
    [/\b(task\s*tier|tasc\s*tier)\b/gi, 'task tier'],
  ]
  for (const [re, rep] of replacements) {
    t = t.replace(re, rep)
  }
  return t
}

function HeaderClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    // Ticks gently every 30 seconds to conserve battery and CPU
    const timer = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])
  return (
    <span>
      {time.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} • {time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })} IST
    </span>
  )
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
  const [selectedModel, setSelectedModel] = useState('auto')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [moaMode, setMoaMode] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try { return localStorage.getItem('jarvis_active_session') || `session_${Date.now().toString().slice(-6)}` } catch { return `session_${Date.now().toString().slice(-6)}` }
  })
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; messageCount: number; updatedAt?: string; lastActive?: string }>>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const sendMessageRef = useRef<(text: string, opts?: any) => Promise<void>>(() => Promise.resolve())
  const isSendingSpeechRef = useRef(false)
  const silenceDebounceTimerRef = useRef<any>(null)

  const getDynamicGreeting = useCallback((): Message => {
    const hour = new Date().getHours()
    const timeStr = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const agentName = selectedAgent !== 'all' ? selectedAgent.toUpperCase() : 'J.A.R.V.I.S. Mark-VI'

    const dynamicEndings = [
      '**I am ready for your command. What can I do, Master?**',
      '**All autonomous systems locked onto your directive. What can I do, Master?**',
      '**Mixture-of-Agents consensus primed. What can I do, Master?**',
      '**Storage vaults verified and specialist swarms armed. What can I do, Master?**'
    ]
    const chosenEnding = dynamicEndings[Math.floor(Math.random() * dynamicEndings.length)]

    return {
      id: generateId(),
      role: 'assistant',
      content: `${timeStr}, Master Sri. I am **${agentName}** — your sovereign autonomous operating system.

The **Mark-VI Quantum Arc Reactor Core** is operating at 100% nominal capacity. All 20 specialist swarms are armed, with live neural duplex channels and real-time tool execution active.

${chosenEnding}`,
      timestamp: new Date(),
      source: `${agentName} Quantum Matrix`,
    }
  }, [selectedAgent])

  const GREETING = useMemo(() => getDynamicGreeting(), [getDynamicGreeting])

  // Bulletproof Continuous Text-To-Speech
  const speakJarvisResponse = useCallback((text: string, customAgentId?: string) => {
    if (isMuted || typeof window === 'undefined') return
    try {
      stopNeuralSpeech()
      setHudStatus('speaking')
      const targetAgent = customAgentId || (selectedAgent !== 'all' ? selectedAgent : 'jarvis')
      playNeuralSpeech(
        text,
        'en-GB',
        () => setHudStatus('speaking'),
        () => setHudStatus('online'),
        () => setHudStatus('online'),
        targetAgent
      )
    } catch {
      setHudStatus('online')
    }
  }, [isMuted, selectedAgent])

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev
      try { localStorage.setItem('jarvis_muted', String(next)) } catch {}
      if (next) stopNeuralSpeech()
      return next
    })
  }

  // Fetch all saved sessions (ChatGPT / Claude style history)
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/sessions', { headers: authHeaders() })
      if (res.ok) {
        const body = await res.json()
        setSessions(body.sessions || [])
      }
    } catch {}
  }, [])

  // Switch to a chosen session
  const switchSession = useCallback(async (targetSessionId: string) => {
    setCurrentSessionId(targetSessionId)
    try { localStorage.setItem('jarvis_active_session', targetSessionId) } catch {}
    try {
      const res = await fetch(`/api/ai/history?sessionId=${encodeURIComponent(targetSessionId)}&limit=60`, { headers: authHeaders() })
      if (res.ok) {
        const body = await res.json()
        const restored: Message[] = (body?.messages || [])
          .filter((msg: any) => msg?.role === 'user' || msg?.role === 'assistant')
          .map((msg: any) => ({
            id: generateId(),
            role: msg.role as 'user' | 'assistant',
            content: String(msg.content || ''),
            timestamp: new Date(msg.createdAt || Date.now()),
          }))
        setMessages(restored)
      }
    } catch {
      setMessages([])
    }
  }, [])

  // Create brand-new ChatGPT/Claude style conversation
  const createNewChat = useCallback(() => {
    const newSessionId = `session_${Date.now().toString().slice(-6)}`
    setCurrentSessionId(newSessionId)
    try { localStorage.setItem('jarvis_active_session', newSessionId) } catch {}
    setMessages([])
    setInput('')
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setSessions((prev) => [
      { id: newSessionId, title: 'New Conversation', messageCount: 0, updatedAt: new Date().toISOString() },
      ...prev.filter((s) => s.id !== newSessionId),
    ])
    setSearchFilter('')
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 50)
  }, [])

  // Delete a specific session
  const deleteSession = useCallback(async (e: React.MouseEvent, targetSessionId: string) => {
    e.stopPropagation()
    try {
      await fetch(`/api/ai/history?sessionId=${encodeURIComponent(targetSessionId)}`, { method: 'DELETE', headers: authHeaders() })
      if (targetSessionId === currentSessionId) {
        createNewChat()
      } else {
        fetchSessions()
      }
    } catch {}
  }, [currentSessionId, createNewChat, fetchSessions])

  // Restore active session history on mount
  useEffect(() => {
    let cancelled = false
    fetchSessions()
    ;(async () => {
      try {
        const res = await fetch(`/api/ai/history?sessionId=${encodeURIComponent(currentSessionId)}&limit=50`, { headers: authHeaders() })
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
        setMessages(restored)
      } catch {
        if (!cancelled) setMessages([])
      }
    })()
    return () => { cancelled = true }
  }, [currentSessionId, fetchSessions])

  // Reset chat / neural buffer
  const resetChat = useCallback(async () => {
    fetch(`/api/ai/history?sessionId=${encodeURIComponent(currentSessionId)}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {})
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: 'All neural buffers cleared, Master Sri. Arc Reactor at 100%. Standing by for your next strategic directive.',
      timestamp: new Date(),
      source: 'J.A.R.V.I.S. Core',
    }])
    fetchSessions()
  }, [currentSessionId, fetchSessions])

  // Copy message text to clipboard
  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(msgId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  // Send message implementation
  const sendMessage = useCallback(async (text: string) => {
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

    // 3. E-Commerce Multi-Platform Recon (Flipkart vs Amazon)
    let productData: ProductRec[] | undefined = undefined
    if (
      (lower.includes('flipkart') && lower.includes('amazon')) ||
      (lower.includes('best deal') && (lower.includes('flipkart') || lower.includes('amazon') || lower.includes('product') || lower.includes('search'))) ||
      (lower.includes('analyze') && (lower.includes('flipkart') || lower.includes('amazon') || lower.includes('price') || lower.includes('mobile') || lower.includes('phone') || lower.includes('laptop'))) ||
      lower.includes('flipkart and amazon search this product') ||
      lower.includes('search this product and give me which is best deal')
    ) {
      playJarvisChime('execute')
      try {
        const queryClean = text.replace(/analyze|flipkart|amazon|best deal|search|give me/gi, '').trim() || 'TWS Earbuds under 2000'
        const res = await fetch(`/api/tools/ecommerce/recon?q=${encodeURIComponent(queryClean)}`, { headers: authHeaders() })
        const json = await res.json()
        if (json?.products) productData = json.products
      } catch {}
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setHudStatus('thinking')
    playJarvisChime('wake')

    const failAssistant = (fallback: string, detail?: string, setupHint?: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: fallback,
          timestamp: new Date(),
          error: true,
          detail,
          setupHint,
          source: 'J.A.R.V.I.S. Core Diagnostics',
        },
      ])
      setHudStatus('online')
    }

    try {
      const historyPayload = messages
        .filter((m) => !m.error)
        .slice(-12)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const messagesPayload = [
        ...historyPayload,
        { role: 'user', content: text.trim() },
      ]

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          message: text.trim(),
          history: historyPayload,
          messages: messagesPayload,
          model: selectedModel,
          moa: moaMode,
          agentId: selectedAgent !== 'all' ? selectedAgent : undefined,
          sessionId: currentSessionId,
        }),
      })

      const data = await res.json().catch(() => ({}))
      const replyText = data?.reply || data?.content

      if (res.ok && replyText) {
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: replyText,
          timestamp: new Date(),
          source: data?.source || 'Argon MoA Cloud Matrix',
          flightData,
          productData,
          taskData: data?.taskData,
          actionTriggered: data?.actionTriggered,
        }
        setMessages((prev) => [...prev, assistantMsg])
        speakJarvisResponse(replyText, selectedAgent)

        // Update local session title if it was a new conversation
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId && (s.title === 'New Conversation' || s.title === 'New Chat')
              ? { ...s, title: text.trim().slice(0, 42) + (text.trim().length > 42 ? '...' : ''), messageCount: s.messageCount + 2 }
              : s
          )
        )
        return
      }

      failAssistant(
        data?.reply || data?.content || data?.error || 'Neural processor encountered an unhandled exception.',
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
      fetchSessions()
    }
  }, [messages, isTyping, selectedModel, moaMode, selectedAgent, speakJarvisResponse, currentSessionId, fetchSessions])

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Continuous "Hey Jarvis" Speech Sentinel setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    setVoiceSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += chunk + ' '
        else interimTranscript += chunk
      }

      const combined = (finalTranscript + interimTranscript).trim()
      const normalized = applyVoiceTypeDictionary(combined)
      const lower = normalized.toLowerCase()

      if (lower.includes('hey jarvis') || lower.includes('hello jarvis') || lower.includes('jarvis wake up')) {
        playJarvisChime('wake')
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40])
      }

      setInput(normalized)
      setIsListening(true)

      if (silenceDebounceTimerRef.current) {
        clearTimeout(silenceDebounceTimerRef.current)
        silenceDebounceTimerRef.current = null
      }

      if (normalized.trim()) {
        silenceDebounceTimerRef.current = setTimeout(() => {
          if (!isSendingSpeechRef.current && normalized.trim()) {
            isSendingSpeechRef.current = true
            setIsListening(false)

            const directive = ConversationOS.parseVoiceDirective(normalized)
            if (directive.action === 'NAVIGATE' && directive.surface) {
              window.dispatchEvent(new CustomEvent('jarvis-navigate', { detail: { surface: directive.surface } }))
              speakJarvisResponse(directive.reply || `Navigating to ${directive.surface}, sir.`, 'jarvis')
            } else if (directive.action === 'CREATE_TASK' && directive.title) {
              window.dispatchEvent(new CustomEvent('jarvis-create-task', { detail: { title: directive.title } }))
              speakJarvisResponse(`Creating and dispatching task for: ${directive.title}, sir.`, 'jarvis')
            } else {
              sendMessageRef.current(normalized)
            }

            setTimeout(() => { isSendingSpeechRef.current = false }, 1200)
          }
        }, 3000)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => {
      if (sentinelActive && typeof document !== 'undefined' && !document.hidden) {
        try { recognition.start() } catch {}
      } else {
        setIsListening(false)
      }
    }
    recognitionRef.current = recognition

    // Hardware Thermal Protection: instantly kill microphone when mobile screen locks
    const handleVisibility = () => {
      if (document.hidden) {
        try { recognition.abort() } catch {}
        setIsListening(false)
        stopNeuralSpeech()
      } else if (sentinelActive) {
        try {
          recognition.start()
          setIsListening(true)
        } catch {}
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      try { recognition.abort() } catch {}
    }
  }, [sentinelActive])

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

  const filteredSessions = sessions.filter(s =>
    !searchFilter || (s.title && s.title.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  return (
    <div className="space-y-2 md:space-y-4">
      {/* Top Arc Reactor Status Header — Hidden on mobile to maximize chat viewport */}
      <div className="hidden md:block">
        <ArcReactorHUD
          status={hudStatus}
          activeModel={selectedModel === 'auto' ? 'Argon MoA Cloud (70B+)' : selectedModel}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onVoiceTrigger={toggleVoiceOnce}
        />
      </div>

      {/* Main ChatGPT / Claude / Gemini Full-Viewport Interface */}
      <div className="flex h-[calc(100dvh-140px)] md:h-[78vh] md:min-h-[640px] rounded-2xl md:rounded-3xl border border-cyan-500/25 bg-slate-950/90 backdrop-blur-2xl overflow-hidden shadow-2xl relative">
        
        {/* Left Conversation Archive Sidebar (ChatGPT / Claude / Gemini Architecture) */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 md:static flex flex-col w-72 lg:w-80 border-r border-slate-800/80 bg-slate-950/95 md:bg-slate-950/60 backdrop-blur-3xl transition-all duration-300 ease-in-out shrink-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
          )}
        >
          {/* Top Actions: + New Chat & Search */}
          <div className="p-3.5 space-y-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Conversations</span>
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] group"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform" />
                <span>+ New Chat</span>
              </span>
              <span className="text-[10px] text-cyan-400/70 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Fresh
              </span>
            </button>

            {/* Conversation Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-cyan-500/50 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500 space-y-1">
                <MessageSquare className="w-6 h-6 text-slate-700 mx-auto" />
                <p>No chat history yet.</p>
                <p className="text-[10px] text-slate-600">Start typing below to spawn a durable thread.</p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === currentSessionId
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      switchSession(s.id)
                      if (window.innerWidth < 768) setIsSidebarOpen(false)
                    }}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border text-xs font-mono",
                      isActive
                        ? "bg-cyan-500/15 border-cyan-400/60 text-white shadow-[0_0_15px_rgba(6,182,212,0.18)]"
                        : "bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                      <span className="truncate">{s.title || 'Conversation Session'}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-500 px-1 py-0.5 rounded bg-slate-950/50">
                        {s.messageCount}
                      </span>
                      <button
                        onClick={(e) => deleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Sidebar Footer: Cognitive Memory & Model Status */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>Memory Vectors:</span>
              </span>
              <strong className="text-white">259 active</strong>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Cloud 70B+ Gateway:</span>
              <span className="text-emerald-400 font-bold">100% ONLINE</span>
            </div>
          </div>
        </div>

        {/* Right Chat Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/40">
          
          {/* Canvas Top Bar */}
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Toggle conversation sidebar"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={createNewChat}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-purple-500/25 hover:from-cyan-500/35 hover:to-purple-500/35 border border-cyan-400/50 text-cyan-200 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95 cursor-pointer"
                title="Start a fresh conversation (ChatGPT / Claude style)"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">New Chat</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {selectedAgent !== 'all' ? `${selectedAgent.toUpperCase()} SPECIALIST` : 'J.A.R.V.I.S. SWARM'}
                </span>
              </div>
            </div>

            {/* Model & Voice Sentinel Action Buttons */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-xl px-2.5 py-1 text-[11px] font-mono focus:outline-none shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                <option value="auto">⚡ Auto (Gemini 3 Flash • Quantum Active)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ultra-Low Latency)</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Pro (Tactical)</option>
                <option value="deepseek-r1">DeepSeek R1 (Deep Reasoning)</option>
                <option value="groq-llama-3.3-70b">Groq Llama 3.3 70B (220ms LPU)</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Opus Matrix)</option>
              </select>

              {/* Live Temporal Clock (Zero Cutoff Verification) */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-cyan-300">
                <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                <HeaderClock />
              </div>

              {/* Audio Mute / Unmute Toggle */}
              <button
                onClick={toggleMute}
                className={cn(
                  'p-1.5 rounded-xl border transition-colors',
                  isMuted
                    ? 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                    : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                )}
                title={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={toggleSentinel}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border',
                  sentinelActive
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                )}
                title="Continuous 'Hey Jarvis' voice sentinel for phone & PC"
              >
                <Radio className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">{sentinelActive ? 'WAKE ON' : 'WAKE'}</span>
              </button>

              <button
                onClick={resetChat}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear current conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Feed (Clean, Spacious, ChatGPT / Claude Styling) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 px-4 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-300">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-950">
                    ✓
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    How may I assist you today, Master Sri?
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    MoA Sovereign Swarm • 20 Specialist Agents • Storage Vault Reports • Web Recon
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full pt-2">
                  {[
                    {
                      icon: '📄',
                      title: 'Assign Mission & Compile Report',
                      desc: 'Runs full pipeline and uploads executive PDF & Word deliverables to Storage Vault',
                      prompt: 'Swarm, inspect Shopify theme invi-theme section-main-product.css, verify all selectors, and compile a verified executive PDF and Word report to the Storage Vault.'
                    },
                    {
                      icon: '🛡️',
                      title: 'Run Gitleaks & Security Audit',
                      desc: 'Performs token entropy scan and validates Shopify theme integrity',
                      prompt: 'Sentinel, run gitleaks_audit and full security scan across the repository to verify zero secret leaks.'
                    },
                    {
                      icon: '🏗️',
                      title: 'Full-Stack SaaS Scaffolding',
                      desc: 'Architects automated quotation portal with models, API routes, and HUD',
                      prompt: 'Swarm, build a full-stack SaaS project end to end: Automated Quotation Portal with database models, frontend HUD, and API routes.'
                    },
                    {
                      icon: '🌐',
                      title: 'Live 2026 Deep Market Recon',
                      desc: 'Scrapes live Amazon & Flipkart prices with unbiased product comparisons',
                      prompt: 'Analyze Flipkart and Amazon for the best deals on Samsung Galaxy S26 Ultra and iPhone 16 Pro with true market pricing.'
                    }
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(card.prompt)}
                      className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{card.icon}</span>
                        <h4 className="text-xs font-bold font-mono text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {card.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-4xl transition-all',
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                {/* Avatar Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-lg mt-0.5',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-400/50 text-white'
                      : 'bg-gradient-to-br from-slate-900 to-cyan-950 border-cyan-500/40 text-cyan-300'
                  )}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                </div>

                {/* Message Bubble Body */}
                <div
                  className={cn(
                    'rounded-2xl p-4 md:p-5 border text-xs leading-relaxed space-y-3 max-w-[92%] backdrop-blur-xl transition-all',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-indigo-600/20 border-cyan-400/50 text-white shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                      : msg.error
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                      : 'bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-950 border-cyan-500/30 text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.7)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-cyan-500/15 text-[10px] font-mono text-slate-400">
                    <span className="font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", msg.role === 'user' ? "bg-cyan-400" : "bg-emerald-400 animate-pulse")} />
                      {msg.role === 'user' ? 'Master Sri (Commander)' : (msg.source || 'J.A.R.V.I.S. Mark-VI Core')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{formatTime(msg.timestamp)}</span>
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="p-1 rounded text-slate-500 hover:text-cyan-300 transition-colors"
                        title="Copy message"
                      >
                        {copiedMessageId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>{renderMarkdown(msg.content)}</div>

                  {/* Live Workspace Sandbox Embedded Preview Card */}
                  {msg.content && msg.content.includes('/api/workspaces/preview/') && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 text-emerald-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                          <span className="font-bold text-xs font-mono tracking-wider">LIVE WORKSPACE COMPILED // SANDBOX HOSTED</span>
                        </div>
                        {(() => {
                          const match = msg.content.match(/\/api\/workspaces\/preview\/[a-zA-Z0-9_.-]+/);
                          const previewHref = match ? match[0] : '';
                          return previewHref ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={previewHref}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                              >
                                <span>🚀 OPEN LIVE APP</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      {(() => {
                        const match = msg.content.match(/\/api\/workspaces\/preview\/[a-zA-Z0-9_.-]+/);
                        const previewHref = match ? match[0] : '';
                        return previewHref ? (
                          <div className="relative w-full h-[450px] rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 shadow-inner">
                            <iframe
                              src={previewHref}
                              title="Workspace Live Preview"
                              className="w-full h-full border-0 bg-slate-950"
                              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Flight Intelligence Card */}
                  {msg.flightData && msg.flightData.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-sky-500/40 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-sky-400">
                          <Plane className="w-4 h-4" />
                          <span className="font-bold text-xs font-mono">FLIGHT INTEL // MUMBAI → MIAMI DEALS</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">VERIFIED</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.flightData.map((deal, didx) => (
                          <div key={didx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{deal.airline}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300">{deal.badge}</span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-300">{deal.route} • {deal.duration}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black font-mono text-emerald-400">{deal.estimatedPriceINR}</span>
                              <a href={deal.bookingUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-sky-500 text-slate-950">
                                BOOK
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-Commerce Product Comparison Card */}
                  {msg.productData && msg.productData.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-amber-400">
                          <ShoppingCart className="w-4 h-4" />
                          <span className="font-bold text-xs font-mono">E-COMMERCE RECON // FLIPKART VS AMAZON</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">LIVE BENCHMARK</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {msg.productData.map((rec, pidx) => (
                          <div key={pidx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white">{rec.name}</h4>
                              <span className="text-emerald-400 font-mono text-[11px] font-bold">{rec.amazonPrice}</span>
                            </div>
                            <p className="text-[11px] font-mono text-cyan-300/90">{rec.verdict}</p>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                              <a href={rec.amazonLink} target="_blank" rel="noreferrer" className="flex-1 text-center py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                AMAZON ({rec.amazonPrice})
                              </a>
                              <a href={rec.flipkartLink} target="_blank" rel="noreferrer" className="flex-1 text-center py-1 rounded-lg text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                FLIPKART ({rec.flipkartPrice})
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.taskData && (
                    <div className="mt-3">
                      <TaskProgressCard task={msg.taskData} />
                    </div>
                  )}

                  {msg.source && (
                    <div className="pt-1.5 text-[9px] font-mono text-slate-500 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                      <span>{msg.source}</span>
                    </div>
                  )}
                </div>
              </div>
            )))}

            {isTyping && (
              <div className="flex gap-3 max-w-xl mr-auto items-center animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>J.A.R.V.I.S. neural swarm deliberating in cloud...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Directives Carousel */}
          <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-slate-900 bg-slate-950/70">
            <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>DIRECTIVES:</span>
            </span>
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.query)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-[11px] font-mono whitespace-nowrap shrink-0"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Floating Command Input Cockpit */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800/80">
            <div className="relative rounded-2xl border border-cyan-500/35 bg-slate-900/90 p-2.5 shadow-2xl focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
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
                placeholder="Ask J.A.R.V.I.S. anything... (e.g. 'Build full-stack app', 'Best TWS deal', 'Run security audit')..."
                className="w-full bg-transparent px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-mono"
              />

              <div className="flex items-center justify-between pt-2 px-2 border-t border-cyan-500/15 gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>COMMANDER: <strong className="text-cyan-300 font-bold">MASTER SRI</strong></span>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <span className="hidden sm:inline text-slate-400">QUANTUM ENGINE: <strong className="text-cyan-400 font-bold">GEMINI 3 FLASH // REAL-TIME</strong></span>
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
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      )}
                      title="Voice Speech-To-Text"
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
                    <span>SEND</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
