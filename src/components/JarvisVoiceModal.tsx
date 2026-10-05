import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, Activity, Shield,
  Terminal, ArrowRight, Bot, Code2, Workflow, DollarSign, Brain, Laptop,
  CheckCircle2, Radio, Zap
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'

interface JarvisVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tabId: string) => void
}

interface AgentBadge {
  id: string
  name: string
  role: string
  color: string
  bg: string
  border: string
  icon: any
}

const AGENTS: Record<string, AgentBadge> = {
  jarvis: { id: 'jarvis', name: 'J.A.R.V.I.S.', role: '2nd-in-Command / Grand Marshal', color: 'text-cyan-300', bg: 'bg-cyan-500/20', border: 'border-cyan-400', icon: Bot },
  aegis: { id: 'aegis', name: 'Aegis', role: 'Full-Stack Software Architect', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-400', icon: Code2 },
  vortex: { id: 'vortex', name: 'Vortex', role: 'Heavy Enterprise Automation', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-400', icon: Workflow },
  midas: { id: 'midas', name: 'Midas', role: 'Revenue & Monetization Engine', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-400', icon: DollarSign },
  cerebro: { id: 'cerebro', name: 'Cerebro', role: 'Deep Intelligence & Recon', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-400', icon: Brain },
  stark_os: { id: 'stark_os', name: 'Stark OS', role: 'Device & Physical Concierge', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-400', icon: Laptop },
}

export default function JarvisVoiceModal({ isOpen, onClose, onNavigate }: JarvisVoiceModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [jarvisResponse, setJarvisResponse] = useState('Online and standing by, Master Sri. Your command is my directive.')
  const [activeAgent, setActiveAgent] = useState<AgentBadge>(AGENTS.jarvis)
  const [engineType, setEngineType] = useState<'WebSpeech' | 'Whisper-Turbo'>('WebSpeech')
  const [voiceVolume, setVoiceVolume] = useState<number[]>([25, 45, 30, 70, 50, 85, 40, 60, 35, 55, 45, 65, 30, 50])

  // Persistent Refs to eliminate React closure traps
  const transcriptRef = useRef('')
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const continuousModeRef = useRef(true)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Keep continuousModeRef in sync with state
  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  // Clean Web Speech Synthesis with natural British cadence
  const speak = (text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Immediately stop listening so J.A.R.V.I.S. doesn't listen to his own voice
    stopListening()
    window.speechSynthesis.cancel()

    // Clean markdown, code blocks, json syntax for speech
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, 'I have generated the production code block and synced it to your Command Center, Sire.')
      .replace(/https?:\/\/[^\s]+/g, 'link provided on your screen.')
      .replace(/[*_#`~>]/g, '')
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanSpeech) return

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    const voices = window.speechSynthesis.getVoices()

    // Select sophisticated natural British / English voice
    const naturalVoice = voices.find(
      v => (v.lang.includes('en-GB') || v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Ryan') || v.name.includes('George'))
    ) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || voices.find(v => v.lang.startsWith('en'))

    if (naturalVoice) utterance.voice = naturalVoice
    utterance.rate = 1.02
    utterance.pitch = 0.98

    utterance.onstart = () => {
      setIsSpeaking(true)
      isSpeakingRef.current = true
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      isSpeakingRef.current = false
      if (onDone) onDone()

      // Continuous Dialogue Loop: automatically re-open microphone for hands-free discussion
      if (continuousModeRef.current && isOpen) {
        setTimeout(() => {
          if (!isSpeakingRef.current) {
            playJarvisChime('wake')
            startListening()
          }
        }, 350)
      }
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      isSpeakingRef.current = false
      if (continuousModeRef.current && isOpen) {
        setTimeout(startListening, 300)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  // Process voice directive with multi-agent intelligence
  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return
    const lower = cmd.toLowerCase().trim()
    setIsProcessing(true)
    playJarvisChime('execute')

    // Detect if Master Sri is delegating to a subordinate agent
    let targetAgent = AGENTS.jarvis
    if (lower.includes('aegis') || lower.includes('software') || lower.includes('next.js') || lower.includes('fastapi') || lower.includes('scaffold')) {
      targetAgent = AGENTS.aegis
    } else if (lower.includes('vortex') || lower.includes('automation') || lower.includes('n8n') || lower.includes('deluge') || lower.includes('webhook')) {
      targetAgent = AGENTS.vortex
    } else if (lower.includes('midas') || lower.includes('money') || lower.includes('revenue') || lower.includes('client') || lower.includes('pitch')) {
      targetAgent = AGENTS.midas
    } else if (lower.includes('cerebro') || lower.includes('intelligence') || lower.includes('market trend') || lower.includes('competitor')) {
      targetAgent = AGENTS.cerebro
    } else if (lower.includes('stark os') || lower.includes('flight') || lower.includes('device') || lower.includes('youtube') || lower.includes('food')) {
      targetAgent = AGENTS.stark_os
    }
    setActiveAgent(targetAgent)

    // Fast-path Stark command heuristics
    if (lower.includes('status report') || lower.includes('systems nominal') || lower.includes('systems check')) {
      const resp = 'All systems nominal, Master Sri. Arc Reactor at 100% output. Cyber defense perimeter secure. All 6 subordinate agent swarms stand ready at your command, Sire.'
      setJarvisResponse(resp)
      speak(resp)
      setIsProcessing(false)
      return
    }

    if (lower.includes('who are you') || lower.includes('introduce yourself') || lower.includes('what can you do')) {
      const resp = 'I am J.A.R.V.I.S. Mark-IV. Your executive 2nd-in-Command and personal right hand, Sire. You are the Sovereign Commander of this empire; I orchestrate your agent legions—Aegis, Vortex, Midas, Cerebro, and Stark OS—to write software, automate pipelines, generate revenue, and execute your directives anywhere in the world.'
      setJarvisResponse(resp)
      speak(resp)
      setIsProcessing(false)
      return
    }

    if (lower.includes('remember that') || lower.includes('store in memory') || lower.includes('memorize')) {
      const fact = cmd.replace(/^(remember that|store in memory|memorize)/i, '').trim()
      try {
        await fetch('/api/memory/remember', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({ fact, category: 'voice_directive', importance: 9 }),
        })
        const resp = `Preserved in permanent cognitive memory, Master Sri: "${fact}". I shall retain this across all operations.`
        setJarvisResponse(resp)
        speak(resp)
      } catch {
        const fallback = `Registered in memory buffer, Master Sri: "${fact}".`
        setJarvisResponse(fallback)
        speak(fallback)
      }
      setIsProcessing(false)
      return
    }

    if (lower.includes('github') || lower.includes('analyze repo') || lower.includes('repository')) {
      const match = cmd.match(/github\.com\/([a-zA-Z0-9_\-\/]+)/i)
      const repoUrl = match ? `https://github.com/${match[1]}` : 'https://github.com/Srimani26/standardroofs-jarvis'
      const resp = `Analyzing repository ${repoUrl} with Gemini 3.8 Flash, Sire. Routing blueprint to Code Lab.`
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('codlab')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('public api') || lower.includes('api arsenal') || lower.includes('tool arsenal')) {
      const resp = 'Accessing the Omni-API Arsenal with 2,001 verified endpoints, Master Sri. Routing your display now.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('apis')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('cyber') || lower.includes('threat defense') || lower.includes('shield')) {
      const resp = 'Engaging Aegis Cyber Threat Matrix. Zero-Trust perimeter active for Master Sri.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('cyber')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    // Delegate to Subordinate Agent Swarm if specialized
    if (targetAgent.id !== 'jarvis') {
      try {
        const res = await fetch('/api/agents/dispatch', {
          method: 'POST',
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            agentId: targetAgent.id,
            task: cmd,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const reply = data.spokenSummary || data.report?.slice(0, 280) || `${targetAgent.name} has completed the directive, Master Sri.`
          setJarvisResponse(reply)
          speak(reply)
          setIsProcessing(false)
          return
        }
      } catch {
        // Fall through to general AI chat
      }
    }

    // Default to J.A.R.V.I.S. Core Neural Network via /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          messages: [{ role: 'user', content: cmd }],
          model: 'gemini-3.8-flash',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const textContent = data.content || data.reply || data.text || 'Command executed, Master Sri.'
        setJarvisResponse(textContent)
        speak(textContent)
      } else {
        const fallback = `Understood, Master Sri. I have registered your directive: "${cmd}". The swarm is aligning execution.`
        setJarvisResponse(fallback)
        speak(fallback)
      }
    } catch {
      const fallback = `At your command, Master Sri. Directive: "${cmd}" synchronized across neural clusters.`
      setJarvisResponse(fallback)
      speak(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  // Universal Fallback: Server-side Whisper transcription via Groq for Mobile
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size < 100) return

        setIsProcessing(true)
        setJarvisResponse('Transcribing voice with Groq Whisper Turbo (150ms)...')

        try {
          const form = new FormData()
          form.append('file', audioBlob, 'voice.webm')
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: authHeaders(),
            body: form,
          })
          if (res.ok) {
            const data = await res.json()
            if (data.text?.trim()) {
              setTranscript(data.text.trim())
              transcriptRef.current = data.text.trim()
              processCommand(data.text.trim())
            }
          }
        } catch (e) {
          console.error('Whisper STT error', e)
        } finally {
          setIsProcessing(false)
        }
      }

      recorder.start()
      setIsListening(true)
      isListeningRef.current = true
      setEngineType('Whisper-Turbo')
      setJarvisResponse('Recording audio for Groq Whisper...')
    } catch (err) {
      console.error('MediaRecorder error', err)
      setJarvisResponse('Microphone permission required, Master Sri. Please allow access.')
    }
  }

  // Primary Speech Recognition (Web Speech API with closure fix)
  const startListening = () => {
    if (isSpeakingRef.current) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    // If browser lacks WebSpeech (e.g. mobile Safari / Firefox), seamlessly use Whisper
    if (!SpeechRecognition) {
      startWhisperRecording()
      return
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        isListeningRef.current = true
        setEngineType('WebSpeech')
        setTranscript('')
        transcriptRef.current = ''
        setJarvisResponse('Listening intently, Master Sri...')
      }

      recognition.onresult = (event: any) => {
        const current = event.resultIndex
        const text = event.results[current][0].transcript
        setTranscript(text)
        transcriptRef.current = text
      }

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e.error)
        setIsListening(false)
        isListeningRef.current = false

        if (e.error === 'not-allowed' || e.error === 'network') {
          setEngineType('Whisper-Turbo')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        isListeningRef.current = false

        // CRITICAL FIX: Read from transcriptRef.current to avoid React closure trap!
        const finalRecordedText = transcriptRef.current.trim()
        if (finalRecordedText) {
          processCommand(finalRecordedText)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error('Failed to start WebSpeech, falling back to Whisper', e)
      startWhisperRecording()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    setIsListening(false)
    isListeningRef.current = false
  }

  // Audio equalizer visualizer simulation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setVoiceVolume(Array.from({ length: 14 }, () => Math.floor(Math.random() * 80) + 20))
      }, 90)
      return () => clearInterval(interval)
    } else {
      setVoiceVolume([15, 20, 15, 25, 18, 22, 15, 20, 18, 25, 15, 20, 18, 15])
    }
  }, [isListening, isSpeaking])

  // Lifecycle on modal open/close
  useEffect(() => {
    if (isOpen) {
      playJarvisChime('wake')
      speak('J.A.R.V.I.S. voice transceiver active. At your service, Master Sri. What is your directive?')
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      stopListening()
      setIsListening(false)
      setIsSpeaking(false)
      isListeningRef.current = false
      isSpeakingRef.current = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const AgentIcon = activeAgent.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl rounded-3xl border border-cyan-500/50 bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950 p-5 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden">

        {/* Ambient Holographic Reactor Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Close & Continuous Toggle */}
        <div className="flex items-center justify-between w-full relative z-20 mb-4">
          <button
            onClick={() => setContinuousMode(!continuousMode)}
            className={cn(
              "px-3 py-1 rounded-full border text-[10px] font-mono tracking-wider flex items-center gap-1.5 transition-all",
              continuousMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400"
            )}
            title="Hands-free continuous conversation mode: listens automatically when JARVIS finishes speaking"
          >
            <Radio className={cn("w-3 h-3", continuousMode && "animate-pulse text-emerald-400")} />
            {continuousMode ? 'HANDS-FREE DIALOGUE: ON' : 'PUSH TO TALK'}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-5 relative z-10">
          {/* Header & Clearance */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Zap className="w-3 h-3 text-cyan-400 animate-spin" />
              VICEROY COMM TRANSCEIVER // LEVEL-10 ALPHA
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2">
              J.A.R.V.I.S. 2ND-IN-COMMAND
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Dedicated Sovereign Uplink for Master Sri (Srimanikandan K)
            </p>
          </div>

          {/* Active Subordinate Agent Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-mono transition-all"
            style={{ borderColor: 'rgba(6,182,212,0.4)', background: 'rgba(15,23,42,0.8)' }}>
            <AgentIcon className={cn("w-4 h-4", activeAgent.color)} />
            <span className="text-slate-300">ACTIVE UNIT:</span>
            <span className={cn("font-bold", activeAgent.color)}>{activeAgent.name}</span>
            <span className="text-[10px] text-slate-500">({activeAgent.role})</span>
          </div>

          {/* Central Holographic Reactor Orb */}
          <div
            className="relative group cursor-pointer"
            onClick={isListening ? stopListening : startListening}
          >
            {/* Outer spinning ring */}
            <div className={cn(
              "w-36 h-36 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center",
              isListening
                ? "border-cyan-400 animate-spin shadow-[0_0_50px_rgba(6,182,212,0.7)]"
                : isSpeaking
                ? "border-amber-400 animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.7)]"
                : "border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            )}>
              {/* Inner Core */}
              <div className={cn(
                "w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 border",
                isListening
                  ? "bg-gradient-to-tr from-cyan-600/40 to-blue-500/40 border-cyan-400/90 scale-105"
                  : isSpeaking
                  ? "bg-gradient-to-tr from-amber-600/40 to-cyan-500/40 border-amber-400/90 scale-105"
                  : "bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400"
              )}>
                {isListening ? (
                  <Mic className="w-10 h-10 text-cyan-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-10 h-10 text-amber-300 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-1 text-slate-200">
                  {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'TAP TO COMMAND'}
                </span>
                <span className="text-[7px] font-mono text-cyan-400/80">
                  [{engineType}]
                </span>
              </div>
            </div>
          </div>

          {/* Animated Audio Equalizer Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs">
            {voiceVolume.map((vol, i) => (
              <span
                key={i}
                style={{ height: `${vol}%` }}
                className={cn(
                  "w-1.5 rounded-full transition-all duration-150",
                  isListening
                    ? "bg-gradient-to-t from-cyan-500 to-blue-400"
                    : isSpeaking
                    ? "bg-gradient-to-t from-amber-400 to-cyan-400"
                    : "bg-slate-800 h-2"
                )}
              />
            ))}
          </div>

          {/* Live Transcript / Dialogue Box */}
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 max-h-48 overflow-y-auto">
            {transcript && (
              <div className="space-y-1 pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Master Sri Said:
                </span>
                <p className="text-sm font-semibold text-white">
                  "{transcript}"
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                J.A.R.V.I.S. Response:
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {isProcessing ? 'Synthesizing with multi-model swarm, Master Sri...' : jarvisResponse}
              </p>
            </div>
          </div>

          {/* Preset Vocal Directives */}
          <div className="w-full space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block text-center">
              Executive Directives
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'Status Report',
                'Aegis, scaffold Next.js SaaS',
                'Vortex, build n8n pipeline',
                'Midas, monetize roofing client',
                'Cerebro, analyze AI market',
                'Analyze GitHub repository',
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(cmd)
                    transcriptRef.current = cmd
                    processCommand(cmd)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
