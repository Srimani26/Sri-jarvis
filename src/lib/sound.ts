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

export function stopNeuralSpeech() {
  if (activeAudio) {
    try {
      activeAudio.pause()
      activeAudio.currentTime = 0
    } catch {}
    activeAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
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
  onError?: () => void
): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  stopNeuralSpeech()

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

  // Match static pre-rendered studio quality audio
  let staticAudioPath: string | null = null
  if (clean.includes('greetings and welcome back') || clean.includes('Master Sri, greetings')) {
    staticAudioPath = '/audio/welcome.mp3'
  } else if (clean.includes('DeepSeek reasoning core primed')) {
    staticAudioPath = '/audio/agent_deepseek.mp3'
  } else if (clean.includes('AutoGen roundtable moderator active')) {
    staticAudioPath = '/audio/agent_autogen.mp3'
  } else if (clean.includes('CrewAI commander operational')) {
    staticAudioPath = '/audio/agent_crewai.mp3'
  } else if (clean.includes('Browser-Use reconnaissance core ready')) {
    staticAudioPath = '/audio/agent_browser_use.mp3'
  } else if (clean.includes('MetaGPT software company initialized')) {
    staticAudioPath = '/audio/agent_metagpt.mp3'
  } else if (clean.includes('Antigravity Agent Foundry ready')) {
    staticAudioPath = '/audio/agent_foundry.mp3'
  } else if (clean.includes('OpenHands autonomous software engineer reporting')) {
    staticAudioPath = '/audio/agent_openhands.mp3'
  } else if (clean.includes('Smolagents high-speed code-action runner active')) {
    staticAudioPath = '/audio/agent_smolagent.mp3'
  } else if (clean.includes('CAMEL communicative inception society engaged')) {
    staticAudioPath = '/audio/agent_camel.mp3'
  } else if (clean.includes('LangGraph stateful cyclical supervisor online')) {
    staticAudioPath = '/audio/agent_langgraph.mp3'
  } else if (clean.includes('Aegis online, Master Sri')) {
    staticAudioPath = '/audio/agent_aegis.mp3'
  } else if (clean.includes('Vortex operational, Master Sri')) {
    staticAudioPath = '/audio/agent_vortex.mp3'
  } else if (clean.includes('Midas at your service, Master Sri')) {
    staticAudioPath = '/audio/agent_midas.mp3'
  } else if (clean.includes('Cerebro activated, Master Sri')) {
    staticAudioPath = '/audio/agent_cerebro.mp3'
  } else if (clean.includes('Stark OS here, Master Sri')) {
    staticAudioPath = '/audio/agent_stark_os.mp3'
  } else if (clean.includes('J.A.R.V.I.S. Grand Marshal core reporting') || clean.includes('commanding the subordinate') || clean.includes('commanding the supreme intelligence swarm')) {
    staticAudioPath = '/audio/rollcall_jarvis.mp3'
  } else if (clean.includes('I am Aegis')) {
    staticAudioPath = '/audio/rollcall_aegis.mp3'
  } else if (clean.includes('I am Vortex')) {
    staticAudioPath = '/audio/rollcall_vortex.mp3'
  } else if (clean.includes('I am Midas')) {
    staticAudioPath = '/audio/rollcall_midas.mp3'
  } else if (clean.includes('I am Cerebro')) {
    staticAudioPath = '/audio/rollcall_cerebro.mp3'
  } else if (clean.includes('I am Stark OS')) {
    staticAudioPath = '/audio/rollcall_stark.mp3'
  } else if (clean.includes('I am DeepSeek')) {
    staticAudioPath = '/audio/rollcall_deepseek.mp3'
  } else if (clean.includes('I am AutoGen')) {
    staticAudioPath = '/audio/rollcall_autogen.mp3'
  } else if (clean.includes('I am CrewAI')) {
    staticAudioPath = '/audio/rollcall_crewai.mp3'
  } else if (clean.includes('I am Browser-Use')) {
    staticAudioPath = '/audio/rollcall_browser_use.mp3'
  } else if (clean.includes('I am MetaGPT')) {
    staticAudioPath = '/audio/rollcall_metagpt.mp3'
  } else if (clean.includes('I am Agent Foundry')) {
    staticAudioPath = '/audio/rollcall_foundry.mp3'
  } else if (clean.includes('I am OpenHands')) {
    staticAudioPath = '/audio/rollcall_openhands.mp3'
  } else if (clean.includes('I am Smolagents')) {
    staticAudioPath = '/audio/rollcall_smolagent.mp3'
  } else if (clean.includes('I am CAMEL')) {
    staticAudioPath = '/audio/rollcall_camel.mp3'
  } else if (clean.includes('I am LangGraph')) {
    staticAudioPath = '/audio/rollcall_langgraph.mp3'
  } else if (clean.includes('all 16 Sovereign Agents are fully armed') || clean.includes('all agents are live, synchronized') || clean.includes('all 16 Sovereign Agents')) {
    staticAudioPath = '/audio/rollcall_conclusion.mp3'
  }

  try {
    const encoded = encodeURIComponent(clean.slice(0, 320))
    const audioUrl = staticAudioPath || `/api/voice/speak?text=${encoded}&lang=${lang}&t=${Date.now()}`
    const audio = new Audio(audioUrl)
    activeAudio = audio

    audio.onplay = () => {
      if (onStart) onStart()
    }

    audio.onended = () => {
      activeAudio = null
      if (onEnd) onEnd()
    }

    audio.onerror = () => {
      console.warn('Streaming neural audio failed, falling back to Web Speech')
      activeAudio = null
      fallbackWebSpeech(clean, lang, onStart, onEnd, onError)
    }

    const p = audio.play()
    if (p !== undefined) {
      p.catch((err) => {
        console.warn('Audio play blocked by browser policy:', err)
        fallbackWebSpeech(clean, lang, onStart, onEnd, onError)
      })
    }

    return audio
  } catch {
    fallbackWebSpeech(clean, lang, onStart, onEnd, onError)
    return null
  }
}

function fallbackWebSpeech(
  cleanText: string,
  lang: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError()
    return
  }

  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    const voices = window.speechSynthesis.getVoices()

    const voice =
      voices.find(v => v.lang.includes(lang) || v.lang.startsWith(lang.slice(0, 2))) ||
      voices.find(v => v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Ryan') || v.name.includes('George')) ||
      voices.find(v => v.lang.startsWith('en'))

    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 0.98

    utterance.onstart = () => { if (onStart) onStart() }
    utterance.onend = () => { if (onEnd) onEnd() }
    utterance.onerror = () => { if (onError) onError() }

    window.speechSynthesis.speak(utterance)
  } catch {
    if (onError) onError()
  }
}
