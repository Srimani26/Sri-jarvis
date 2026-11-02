/**
 * useVoiceNavigation.ts — Sovereign Client Voice Navigation & Audio Worklet Streamer
 * Target: frontend/src/features/voice/useVoiceNavigation.ts & src/features/voice/useVoiceNavigation.ts
 *
 * Implements:
 * 1. Persistent WebSocket connection to /api/voice/session authenticated with biometric token.
 * 2. 16kHz AudioWorkletNode capture with zero-CPU silent STANDBY state machine.
 * 3. Incoming Action Receiver:
 *    - If payload.action === "NAVIGATE": invokes client route transition hands-free.
 *    - If payload.type === "AGENT_HANDOFF": updates active specialist persona.
 *    - If binary audio chunk received: feeds into AudioContext for gapless playback.
 * 4. Automatic echo suppression: pauses microphone capture while the AI agent is speaking.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export interface VoiceNavigationOptions {
  onNavigate?: (route: string) => void
  onAgentChange?: (agent: string) => void
  onTranscript?: (text: string) => void
  onAgentResponse?: (text: string) => void
  onStatusChange?: (status: 'STANDBY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING') => void
  autoConnect?: boolean
}

export function useVoiceNavigation(options: VoiceNavigationOptions = {}) {
  const {
    onNavigate,
    onAgentChange,
    onTranscript,
    onAgentResponse,
    onStatusChange
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [activeAgent, setActiveAgent] = useState<'jarvis' | 'aegis' | 'raphael' | 'friday'>('jarvis')
  const [voiceStatus, setVoiceStatus] = useState<'STANDBY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('STANDBY')
  const [lastTranscript, setLastTranscript] = useState('')
  const [lastResponse, setLastResponse] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const speechDetectedRef = useRef(false)

  const updateStatus = useCallback((status: 'STANDBY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING') => {
    setVoiceStatus(status)
    if (onStatusChange) onStatusChange(status)
  }, [onStatusChange])

  // Play next audio buffer in queue via AudioBufferSourceNode
  const playNextAudioChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return

    const ctx = audioContextRef.current
    if (!ctx) return

    const rawBuffer = audioQueueRef.current.shift()
    if (!rawBuffer) return

    isPlayingRef.current = true
    updateStatus('SPEAKING')

    try {
      // Decode 16kHz linear PCM into Web Audio AudioBuffer
      const int16Array = new Int16Array(rawBuffer)
      const audioBuffer = ctx.createBuffer(1, int16Array.length, 16000)
      const channelData = audioBuffer.getChannelData(0)

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0
      }

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      source.onended = () => {
        isPlayingRef.current = false
        if (audioQueueRef.current.length > 0) {
          playNextAudioChunk()
        } else {
          // All speech audio finished: Unmute mic and enter STANDBY
          if (workletNodeRef.current) {
            workletNodeRef.current.port.postMessage({ type: 'UNMUTE' })
          }
          updateStatus('STANDBY')
        }
      }

      source.start()
    } catch (err) {
      console.warn('[useVoiceNavigation] Audio playback error:', err)
      isPlayingRef.current = false
      updateStatus('STANDBY')
    }
  }, [updateStatus])

  // Connect WebSocket to /api/voice/session
  const connectVoiceSession = useCallback((token?: string) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const sessionToken = token || sessionStorage.getItem('jarvis_biometric_token') || 'bio_sri_session'
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/api/voice/session?token=${encodeURIComponent(sessionToken)}`

    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      updateStatus('STANDBY')
    }

    ws.onmessage = async (event) => {
      if (typeof event.data !== 'string') {
        // Binary TTS audio chunk received from Deepgram Aura / ElevenLabs
        audioQueueRef.current.push(event.data)
        playNextAudioChunk()
        return
      }

      try {
        const payload = JSON.parse(event.data)

        // 1. Hands-Free Navigation Dispatch
        if (payload.action === 'NAVIGATE' && payload.route) {
          if (onNavigate) {
            onNavigate(payload.route)
          } else {
            // Fallback direct window navigation / hash navigation
            window.location.hash = payload.route
          }
        }

        // 2. Specialist Persona Handoff
        if (payload.type === 'AGENT_HANDOFF' && payload.activeAgent) {
          setActiveAgent(payload.activeAgent)
          if (onAgentChange) onAgentChange(payload.activeAgent)
        }

        // 3. Transcript returned
        if (payload.type === 'TRANSCRIPT' && payload.text) {
          setLastTranscript(payload.text)
          if (onTranscript) onTranscript(payload.text)
        }

        // 4. Agent Spoken Response
        if (payload.type === 'AGENT_RESPONSE' && payload.text) {
          setLastResponse(payload.text)
          if (onAgentResponse) onAgentResponse(payload.text)
        }

        // 5. Echo-suppression Mute Gate
        if (payload.type === 'AGENT_SPEAK_START') {
          if (workletNodeRef.current) {
            workletNodeRef.current.port.postMessage({ type: 'MUTE' })
          }
          updateStatus('SPEAKING')
        }

        if (payload.type === 'AGENT_SPEAK_END') {
          if (audioQueueRef.current.length === 0) {
            if (workletNodeRef.current) {
              workletNodeRef.current.port.postMessage({ type: 'UNMUTE' })
            }
            updateStatus('STANDBY')
          }
        }
      } catch (err) {
        console.warn('[useVoiceNavigation] Message parse error:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      updateStatus('STANDBY')
    }

    ws.onerror = (err) => {
      console.warn('[useVoiceNavigation] WebSocket error:', err)
    }
  }, [onNavigate, onAgentChange, onTranscript, onAgentResponse, playNextAudioChunk, updateStatus])

  // Initialize AudioWorkletNode and 16kHz capture
  const startListening = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioCtx()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Load 16kHz Linear PCM AudioWorkletProcessor
      try {
        await ctx.audioWorklet.addModule('/audio-worklet-processor.js')
      } catch {
        // Module might already be registered
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      mediaStreamRef.current = stream
      const source = ctx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(ctx, 'jarvis-audio-worklet-processor')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event) => {
        const { type, buffer, isAboveThreshold } = event.data
        if (type !== 'PCM_CHUNK') return

        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        // Zero-CPU Silent Standby State Machine:
        // When quiet: DO NOT send packets over WebSocket
        if (isAboveThreshold) {
          speechDetectedRef.current = true
          updateStatus('LISTENING')

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Stream binary 16kHz linear PCM chunk directly
          ws.send(buffer)
        } else if (speechDetectedRef.current) {
          // Still stream trailing consonant buffers during short silence
          ws.send(buffer)

          // If silence lasts >700ms, trigger turn completion
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              speechDetectedRef.current = false
              silenceTimerRef.current = null
              updateStatus('PROCESSING')

              // Signal backend to transcribe accumulated audio
              ws.send(JSON.stringify({ type: 'SPEECH_END' }))
            }, 700)
          }
        }
      }

      source.connect(workletNode)
      workletNode.connect(ctx.destination)
      updateStatus('STANDBY')
    } catch (err) {
      console.warn('[useVoiceNavigation] Audio capture initialization failed:', err)
    }
  }, [updateStatus])

  // Stop listening and release media tracks
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    updateStatus('STANDBY')
  }, [updateStatus])

  // Disconnect session
  const disconnectVoiceSession = useCallback(() => {
    stopListening()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [stopListening])

  // Handoff to a specific specialist agent
  const switchAgent = useCallback((agent: 'jarvis' | 'aegis' | 'raphael' | 'friday') => {
    setActiveAgent(agent)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SET_AGENT', agent }))
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnectVoiceSession()
    }
  }, [disconnectVoiceSession])

  return {
    isConnected,
    activeAgent,
    voiceStatus,
    lastTranscript,
    lastResponse,
    connectVoiceSession,
    disconnectVoiceSession,
    startListening,
    stopListening,
    switchAgent
  }
}

export default useVoiceNavigation
