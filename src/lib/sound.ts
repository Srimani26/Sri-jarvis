// Cybernetic Arc Reactor Chime Synthesizer via Web Audio API
export function playJarvisChime(type: 'wake' | 'execute' | 'alert' = 'wake') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime

    if (type === 'wake') {
      // Iron Man Arc Reactor Power-Up Chime (Dual Sine ascending harmony)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'triangle'

      // Pitch sweep up
      osc1.frequency.setValueAtTime(440, now)
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18)
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.35)

      osc2.frequency.setValueAtTime(554.37, now)
      osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.18)
      osc2.frequency.exponentialRampToValueAtTime(1661.22, now + 0.35)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.5)
      osc2.stop(now + 0.5)
    } else if (type === 'execute') {
      // Sub-agent task dispatched confirmation chime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.3)
    } else if (type === 'alert') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.setValueAtTime(900, now + 0.1)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    }
  } catch {}
}

let activeAudio: HTMLAudioElement | null = null
let activeSpeechSessionId = 0
let speechKeepAliveInterval: any = null

function startSpeechKeepAlive() {
  if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval)
  speechKeepAliveInterval = setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }
  }, 7000)
}

function stopSpeechKeepAlive() {
  if (speechKeepAliveInterval) {
    clearInterval(speechKeepAliveInterval)
    speechKeepAliveInterval = null
  }
}

export function stopNeuralSpeech() {
  activeSpeechSessionId++
  stopSpeechKeepAlive()
  if (activeAudio) {
    try {
      activeAudio.pause()
      activeAudio.currentTime = 0
      activeAudio.src = ''
    } catch {}
    activeAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
}

export function isNeuralSpeechActive(): boolean {
  return Boolean(activeAudio || (typeof window !== 'undefined' && window.speechSynthesis?.speaking))
}

/**
 * Primes browser audio subsystem in direct user gesture context.
 * Unlocks HTML5 audio playback and Web Speech synthesis without browser policy blocking.
 */
export function primeAudioPlayback() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtx) {
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.resume()
      // Permanently unlock speech synthesis in Chromium/Safari user activation model
      const silentUtterance = new SpeechSynthesisUtterance(' ')
      silentUtterance.volume = 0.001
      window.speechSynthesis.speak(silentUtterance)
      window.speechSynthesis.resume()
    }
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
    silentAudio.volume = 0.01
    const p = silentAudio.play()
    if (p !== undefined) {
      p.then(() => {
        silentAudio.pause()
      }).catch(() => {})
    }
  } catch {}
}

/**
 * Bulletproof Neural Voice Synthesizer
 * Uses backend Google Neural Audio stream (/api/voice/speak) for true human audio
 * Gracefully falls back to browser SpeechSynthesis if offline.
 */
export function playNeuralSpeech(
  text: string,
  lang: string = 'en-GB',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  agentId: string = 'jarvis'
): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  stopNeuralSpeech()
  const sessionId = ++activeSpeechSessionId

  // Clean out code blocks, URLs, markdown symbols for clean speech
  const clean = text
    .replace(/```[\s\S]*?```/g, 'I have generated the production code and synced it to your Command Center, Sire.')
    .replace(/https?:\/\/[^\s]+/g, 'link provided on screen.')
    .replace(/[*_#`~>]/g, '')
    .replace(/\{[\s\S]*?\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) {
    if (onEnd) onEnd()
    return null
  }

  // All greetings and executive intelligence are 100% dynamic!
  // Pre-rendered audio is strictly restricted to static demo previews.
  let staticAudioPath: string | null = null


  try {
    const spokenSlice = clean.slice(0, 30000)

    // Primary High-Fidelity Path: Direct Stream from Backend /api/voice/speak (ElevenLabs + Google Neural Stream)
    fetch('/api/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spokenSlice, lang, agentId })
    })
    .then(res => {
      if (!res.ok) throw new Error(`POST TTS failed with status ${res.status}`)
      return res.blob()
    })
    .then(blob => {
      if (sessionId !== activeSpeechSessionId) return
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      activeAudio = audio
      audio.onplay = () => { if (sessionId === activeSpeechSessionId && onStart) onStart() }
      audio.onended = () => {
        activeAudio = null
        URL.revokeObjectURL(blobUrl)
        if (sessionId === activeSpeechSessionId && onEnd) onEnd()
      }
      audio.onerror = () => {
        activeAudio = null
        URL.revokeObjectURL(blobUrl)
        if (sessionId === activeSpeechSessionId) fallbackWebSpeech(spokenSlice, lang, onStart, onEnd, onError, agentId)
      }
      const p = audio.play()
      if (p !== undefined) {
        p.catch(() => {
          if (sessionId === activeSpeechSessionId) fallbackWebSpeech(spokenSlice, lang, onStart, onEnd, onError, agentId)
        })
      }
    })
    .catch(() => {
      if (sessionId === activeSpeechSessionId) fallbackWebSpeech(spokenSlice, lang, onStart, onEnd, onError, agentId)
    })
    return null
  } catch {
    fallbackWebSpeech(clean, lang, onStart, onEnd, onError, agentId)
    return null
  }
}

/**
 * Instant Local Zero-Latency Speech Synthesizer (< 100ms)
 * Used for immediate greetings and ultra-fast responsive interactions.
 * Completely immune to network latency and mobile background aborts.
 */
export function speakInstantNativeSpeech(
  text: string,
  lang: string = 'en-GB',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  agentId: string = 'jarvis'
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onStart) onStart()
    if (onEnd) onEnd()
    return
  }

  stopNeuralSpeech()
  const sessionId = ++activeSpeechSessionId

  const clean = text
    .replace(/```[\s\S]*?```/g, 'I have generated the code.')
    .replace(/https?:\/\/[^\s]+/g, 'link on screen.')
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) {
    if (onEnd) onEnd()
    return
  }

  try {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    if (typeof window.speechSynthesis.resume === 'function') {
      window.speechSynthesis.resume()
    }

    startSpeechKeepAlive()

    // Break text into clean sentences (< 160 chars) to prevent mobile browser truncation
    const rawChunks = clean.match(/[^.!?]+[.!?]+|[^.!?]+/g)?.map(s => s.trim()).filter(Boolean) || [clean]
    const sentences: string[] = []
    for (const raw of rawChunks) {
      if (raw.length <= 160) {
        sentences.push(raw)
      } else {
        const words = raw.split(' ')
        let current = ''
        for (const w of words) {
          if ((current + ' ' + w).trim().length <= 160) {
            current = (current + ' ' + w).trim()
          } else {
            if (current) sentences.push(current)
            current = w
          }
        }
        if (current) sentences.push(current)
      }
    }

    if (sentences.length === 0) {
      stopSpeechKeepAlive()
      if (onEnd) onEnd()
      return
    }

    const id = (agentId || 'jarvis').toLowerCase()
    const isFemaleAgent = id === 'friday' || id === 'raphael' || id === 'sentinel' || id === 'cerebro' || id === 'smolagent' || id === 'smolagents' || id === 'langgraph'
    const isIndianMidas = id === 'midas'

    const voices = window.speechSynthesis.getVoices()
    let voice: SpeechSynthesisVoice | undefined

    if (isFemaleAgent) {
      voice =
        voices.find(v => (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Moira') || v.name.includes('Female') || v.name.includes('Natural')) && (v.lang.startsWith('en'))) ||
        voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith(lang.slice(0, 2)))
    } else if (isIndianMidas) {
      voice =
        voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('Rishi') || v.name.includes('Veena')) ||
        voices.find(v => v.name.includes('Oliver') || v.name.includes('Daniel') || v.name.includes('Ryan'))
    } else if (id === 'aegis') {
      voice =
        voices.find(v => v.name.includes('George') || v.name.includes('Arthur') || v.name.includes('David')) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith('en'))
    } else {
      voice =
        voices.find(v => (v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('George')) && (v.lang.includes('GB') || v.lang.includes('en'))) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith(lang.slice(0, 2))) ||
        voices.find(v => v.lang.startsWith('en'))
    }

    const pitch = isFemaleAgent ? 1.15 : (id === 'midas' ? 0.95 : (id === 'aegis' ? 0.92 : 0.98))
    const rate = isFemaleAgent ? 1.05 : (id === 'midas' ? 1.10 : 1.02)

    let currentIndex = 0
    let hasStarted = false
    let watchdogTimer: any = null

    const speakNext = () => {
      if (sessionId !== activeSpeechSessionId) {
        if (watchdogTimer) clearTimeout(watchdogTimer)
        stopSpeechKeepAlive()
        return
      }

      if (watchdogTimer) {
        clearTimeout(watchdogTimer)
        watchdogTimer = null
      }

      if (currentIndex >= sentences.length) {
        (window as any).__activeUtterance = null
        stopSpeechKeepAlive()
        if (onEnd) onEnd()
        return
      }

      const textChunk = sentences[currentIndex]
      const utterance = new SpeechSynthesisUtterance(textChunk)
      ;(window as any).__activeUtterance = utterance
      utterance.lang = lang || (isFemaleAgent ? 'en-US' : (isIndianMidas ? 'en-IN' : 'en-GB'))
      if (voice) utterance.voice = voice
      utterance.rate = rate
      utterance.pitch = pitch

      const expectedDurationMs = Math.max(6000, (textChunk.length * 160) + 6000)
      watchdogTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.speaking && sessionId === activeSpeechSessionId) {
          currentIndex++
          speakNext()
        }
      }, expectedDurationMs)

      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true
          if (onStart) onStart()
        }
      }

      utterance.onend = () => {
        if (watchdogTimer) {
          clearTimeout(watchdogTimer)
          watchdogTimer = null
        }
        if (sessionId === activeSpeechSessionId) {
          currentIndex++
          speakNext()
        }
      }

      utterance.onerror = (e) => {
        if (watchdogTimer) {
          clearTimeout(watchdogTimer)
          watchdogTimer = null
        }
        console.warn('[InstantWebSpeech] Utterance note:', e)
        if (sessionId === activeSpeechSessionId) {
          currentIndex++
          speakNext()
        }
      }

      window.speechSynthesis.speak(utterance)
      if (typeof window.speechSynthesis.resume === 'function') {
        window.speechSynthesis.resume()
      }
    }

    speakNext()
  } catch (err) {
    console.warn('Instant speech error:', err)
    stopSpeechKeepAlive()
    if (onError) onError()
    if (onEnd) onEnd()
  }
}

function fallbackWebSpeech(
  cleanText: string,
  lang: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  agentId: string = 'jarvis'
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError()
    if (onEnd) onEnd()
    return
  }

  try {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    if (typeof window.speechSynthesis.resume === 'function') {
      window.speechSynthesis.resume()
    }

    startSpeechKeepAlive()

    // Break text into clean bite-sized sentences (< 160 chars) so Chromium/Safari never truncate
    const rawChunks = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+/g)?.map(s => s.trim()).filter(Boolean) || [cleanText]
    const sentences: string[] = []
    for (const raw of rawChunks) {
      if (raw.length <= 160) {
        sentences.push(raw)
      } else {
        const words = raw.split(' ')
        let current = ''
        for (const w of words) {
          if ((current + ' ' + w).trim().length <= 160) {
            current = (current + ' ' + w).trim()
          } else {
            if (current) sentences.push(current)
            current = w
          }
        }
        if (current) sentences.push(current)
      }
    }

    if (sentences.length === 0) {
      stopSpeechKeepAlive()
      if (onEnd) onEnd()
      return
    }

    const id = (agentId || 'jarvis').toLowerCase()
    const isFemaleAgent = id === 'friday' || id === 'raphael' || id === 'sentinel' || id === 'cerebro' || id === 'smolagent' || id === 'smolagents' || id === 'langgraph'
    const isIndianMidas = id === 'midas'

    const voices = window.speechSynthesis.getVoices()
    let voice: SpeechSynthesisVoice | undefined

    if (isFemaleAgent) {
      voice =
        voices.find(v => (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Moira') || v.name.includes('Female') || v.name.includes('Natural')) && (v.lang.startsWith('en'))) ||
        voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith(lang.slice(0, 2)))
    } else if (isIndianMidas) {
      voice =
        voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('Rishi') || v.name.includes('Veena')) ||
        voices.find(v => v.name.includes('Oliver') || v.name.includes('Daniel') || v.name.includes('Ryan'))
    } else if (id === 'aegis') {
      voice =
        voices.find(v => v.name.includes('George') || v.name.includes('Arthur') || v.name.includes('David')) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith('en'))
    } else {
      voice =
        voices.find(v => (v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('George')) && (v.lang.includes('GB') || v.lang.includes('en'))) ||
        voices.find(v => v.lang.includes(lang) || v.lang.startsWith(lang.slice(0, 2))) ||
        voices.find(v => v.lang.startsWith('en'))
    }

    const pitch = isFemaleAgent ? 1.15 : (id === 'midas' ? 0.95 : (id === 'aegis' ? 0.92 : 0.98))
    const rate = isFemaleAgent ? 1.05 : (id === 'midas' ? 1.10 : 1.02)

    let currentIndex = 0
    let hasStarted = false
    let watchdogTimer: any = null

    const speakNext = () => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer)
        watchdogTimer = null
      }

      if (currentIndex >= sentences.length) {
        (window as any).__activeUtterance = null
        stopSpeechKeepAlive()
        if (onEnd) onEnd()
        return
      }

      const textChunk = sentences[currentIndex]
      const utterance = new SpeechSynthesisUtterance(textChunk)
      ;(window as any).__activeUtterance = utterance
      utterance.lang = lang || (isFemaleAgent ? 'en-US' : (isIndianMidas ? 'en-IN' : 'en-GB'))
      if (voice) utterance.voice = voice
      utterance.rate = rate
      utterance.pitch = pitch

      // Watchdog: If browser onend fails to fire, advance automatically without cutting off natural pauses
      const expectedDurationMs = Math.max(6000, (textChunk.length * 160) + 6000)
      watchdogTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
          currentIndex++
          speakNext()
        }
      }, expectedDurationMs)

      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true
          if (onStart) onStart()
        }
      }

      utterance.onend = () => {
        if (watchdogTimer) {
          clearTimeout(watchdogTimer)
          watchdogTimer = null
        }
        currentIndex++
        speakNext()
      }

      utterance.onerror = (e) => {
        if (watchdogTimer) {
          clearTimeout(watchdogTimer)
          watchdogTimer = null
        }
        console.warn('[WebSpeech] Utterance error:', e)
        currentIndex++
        speakNext()
      }

      window.speechSynthesis.speak(utterance)
      if (typeof window.speechSynthesis.resume === 'function') {
        window.speechSynthesis.resume()
      }
    }

    speakNext()
  } catch {
    stopSpeechKeepAlive()
    if (onError) onError()
    if (onEnd) onEnd()
  }
}


