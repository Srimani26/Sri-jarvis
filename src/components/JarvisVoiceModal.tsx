import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Activity, Shield, Terminal, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { playJarvisChime } from '@/lib/sound'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'

interface JarvisVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tabId: string) => void
}

export default function JarvisVoiceModal({ isOpen, onClose, onNavigate }: JarvisVoiceModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [jarvisResponse, setJarvisResponse] = useState('Online and listening, Master Sri. Speak your command.')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceVolume, setVoiceVolume] = useState([30, 60, 45, 80, 50, 95, 40, 70, 35, 60])
  const recognitionRef = useRef<any>(null)

  // Web Speech Synthesis (Jarvis Voice)
  const speak = (text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const clean = text
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/[*_#`]/g, '')
      .trim()

    const utterance = new SpeechSynthesisUtterance(clean)
    const voices = window.speechSynthesis.getVoices()
    const britishVoice = voices.find(
      v => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('Daniel') || v.name.includes('Oliver')
    ) || voices.find(v => v.lang.startsWith('en'))

    if (britishVoice) utterance.voice = britishVoice
    utterance.rate = 1.05
    utterance.pitch = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      if (onDone) onDone()
    }
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Handle command interpretation
  const processCommand = async (cmd: string) => {
    const lower = cmd.toLowerCase().trim()
    setIsProcessing(true)
    playJarvisChime('execute')

    // Fast-path Stark command heuristics
    if (lower.includes('status') || lower.includes('systems') || lower.includes('report')) {
      const resp = 'All systems nominal, Master Sri. Arc Reactor at 100% output. Cyber defense perimeter secure. 2,001 public APIs armed and standing by.'
      setJarvisResponse(resp)
      speak(resp)
      setIsProcessing(false)
      return
    }

    if (lower.includes('who are you') || lower.includes('introduce')) {
      const resp = 'I am J.A.R.V.I.S. Mark-IV. Your personal autonomous AI command center, dedicated with absolute loyalty to you, Master Sri.'
      setJarvisResponse(resp)
      speak(resp)
      setIsProcessing(false)
      return
    }

    if (lower.includes('github') || lower.includes('analyze repo') || lower.includes('repository')) {
      const resp = 'Analyzing GitHub repository architecture with Gemini 3.8 Flash, Master Sri. Routing to Code Lab.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('codlab')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('api') || lower.includes('public api') || lower.includes('arsenal') || lower.includes('tool')) {
      const resp = 'Accessing the Omni-API Arsenal with 2,001 verified endpoints, Master Sri. Routing your display now.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('apis')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('security') || lower.includes('cyber') || lower.includes('threat') || lower.includes('shield')) {
      const resp = 'Engaging Aegis Cyber Threat Matrix. Zero-Trust perimeter active for Master Sri.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('cyber')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('flight') || lower.includes('travel') || lower.includes('airline')) {
      const resp = 'Initializing Global Flight Navigator. Ready to scan airline fares, sir.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('chat')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    if (lower.includes('phone') || lower.includes('gadget') || lower.includes('mobile price') || lower.includes('iphone')) {
      const resp = 'Pulling Amazon and Flipkart flagship product intelligence for you, sir.'
      setJarvisResponse(resp)
      speak(resp, () => {
        onNavigate('chat')
        onClose()
      })
      setIsProcessing(false)
      return
    }

    // Default to Jarvis AI neural network via /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          messages: [{ role: 'user', content: cmd }],
          model: 'gemini-2.5-flash',
        }),
      })

      if (res.ok) {
        const text = await res.text()
        const clean = text.replace(/^data: /gm, '').trim().slice(0, 300)
        setJarvisResponse(clean || 'Command received and synchronized, Master Sri.')
        speak(clean || 'Command executed, sir.')
      } else {
        const fallback = `Understood, Master Sri. I have registered your command: "${cmd}". All neural clusters are aligning.`
        setJarvisResponse(fallback)
        speak(fallback)
      }
    } catch {
      const fallback = `Understood, Master Sri. Command: "${cmd}". Neural clusters synchronized.`
      setJarvisResponse(fallback)
      speak(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  // Start speech recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setJarvisResponse('Speech Recognition API not supported in this browser. Please use Chrome or Edge, sir.')
      return
    }

    try {
      playJarvisChime('wake')
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setJarvisResponse('Listening for your voice, Master Sri...')
      }

      recognition.onresult = (event: any) => {
        const current = event.resultIndex
        const text = event.results[current][0].transcript
        setTranscript(text)
      }

      recognition.onerror = (e: any) => {
        console.error('Speech error', e)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (transcript.trim()) {
          processCommand(transcript.trim())
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error(e)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  useEffect(() => {
    if (isOpen) {
      playJarvisChime('wake')
      speak('J.A.R.V.I.S. voice transceiver active. Standing by, Master Sri.')
      startListening()
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
    }
  }, [isOpen])

  // Volume bars animation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setVoiceVolume(Array.from({ length: 14 }, () => Math.floor(Math.random() * 85) + 15))
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isListening, isSpeaking])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl rounded-3xl border border-cyan-500/50 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-6 md:p-8 shadow-[0_0_80px_rgba(6,182,212,0.25)] overflow-hidden">
        
        {/* Holographic Arc Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              VOICE COMM TRANSCEIVER // MARK-IV
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-wider text-white">
              J.A.R.V.I.S. VOICE INTERFACE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Dedicated channel for Master Sri (Srimanikandan K)
            </p>
          </div>

          {/* Central Holographic Reactor Orb */}
          <div className="relative group cursor-pointer" onClick={isListening ? stopListening : startListening}>
            {/* Outer spinning ring */}
            <div className={cn(
              "w-36 h-36 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center",
              isListening
                ? "border-cyan-400 animate-spin shadow-[0_0_40px_rgba(6,182,212,0.6)]"
                : isSpeaking
                ? "border-amber-400 animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                : "border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            )}>
              {/* Inner Core */}
              <div className={cn(
                "w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 border",
                isListening
                  ? "bg-gradient-to-tr from-cyan-600/40 to-blue-500/40 border-cyan-400/80 scale-105"
                  : isSpeaking
                  ? "bg-gradient-to-tr from-amber-600/40 to-cyan-500/40 border-amber-400/80 scale-105"
                  : "bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400"
              )}>
                {isListening ? (
                  <Mic className="w-10 h-10 text-cyan-300 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-10 h-10 text-amber-300 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-1 text-slate-300">
                  {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'TAP TO TALK'}
                </span>
              </div>
            </div>
          </div>

          {/* Animated Audio Equalizer Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-10">
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

          {/* Live Transcript / Response Box */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
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
                {isProcessing ? 'Analyzing and executing command, Master Sri...' : jarvisResponse}
              </p>
            </div>
          </div>

          {/* Preset Voice Action Badges */}
          <div className="w-full space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block text-center">
              Quick Vocal Commands
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'Status Report',
                'Show 2,001 Public APIs',
                'Scan Cyber Defense',
                'Find Flight Deals',
                'Compare Top Mobile Phones',
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(cmd)
                    processCommand(cmd)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
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
