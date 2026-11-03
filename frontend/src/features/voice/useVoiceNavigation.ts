/**
 * useVoiceNavigation.ts — Sovereign Client Voice Navigation & Audio Worklet Streamer
 * Target: frontend/src/features/voice/useVoiceNavigation.ts & src/features/voice/useVoiceNavigation.ts
 *
 * Implements:
 * 1. Persistent WebSocket connection to /api/voice/session authenticated with biometric token.
 * 2. 16kHz AudioWorkletNode capture with 0.01 RMS threshold and 400ms hangover padding.
 * 3. Monotonic Audio Queue Scheduling via AudioQueuePlayer:
 *    - Eliminates audio fast-forward/chipmunk playback by matching native hardware sample rates.
 *    - Unlocks AudioContext clock on user touch/mic gestures.
 * 4. Dual-Engine Capture Fallback:
 *    - Primary: 16kHz Linear PCM over WebSocket to /api/voice/session.
 *    - Fallback: If WebSocket is disconnected or latency > 1.5s, automatically captures MediaRecorder .webm/.mp4 blob
 *      and POSTs to /api/voice/transcribe (Groq Whisper Large-v3 endpoint).
 * 5. Visual Console Confirmation:
 *    - User's spoken text is immediately transcribed and logged to the console.
 * 6. Echo Suppression Mute Gate:
 *    - Automatically mutes microphone worklet while the agent is speaking.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioQueuePlayer } from './AudioQueuePlayer'

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const speechDetectedRef = useRef(false)
  const lastPacketSendTimeRef = useRef<number>(0)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateStatus = useCallback((status: 'STANDBY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING') => {
    setVoiceStatus(status)
    if (onStatusChange) onStatusChange(status)
  }, [onStatusChange])

  // Process incoming binary audio chunks through monotonic AudioQueuePlayer
  const handleIncomingAudioChunk = useCallback(async (data: ArrayBuffer) => {
    updateStatus('SPEAKING')
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'MUTE' })
    }

    await audioQueuePlayer.enqueueChunk(
      data,
      () => updateStatus('SPEAKING'),
      () => {
        if (workletNodeRef.current) {
          workletNodeRef.current.port.postMessage({ type: 'UNMUTE' })
        }
        updateStatus('STANDBY')
      }
    )
  }, [updateStatus])

  // HTTP Fallback Transcriber via POST /api/voice/transcribe (Groq Whisper Large-v3)
  const transcribeBlobFallback = useCallback(async (audioBlob: Blob) => {
    try {
      updateStatus('PROCESSING')
      const formData = new FormData()
      formData.append('file', audioBlob, 'mic-fallback.webm')

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(6000)
      })

      if (res.ok) {
        const json = await res.json() as any
        const transcriptText = (json.text || '').trim()
        if (transcriptText) {
          console.log('[VoiceNavigation] Transcribed text (HTTP fallback):', transcriptText)
          setLastTranscript(transcriptText)
          if (onTranscript) onTranscript(transcriptText)

          // Dispatch intent
          const intentRes = await fetch('/api/voice/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcriptText, currentAgent: activeAgent })
          })

          if (intentRes.ok) {
            const intentData = await intentRes.json() as any
            const intent = intentData.intent
            if (intent?.type === 'NAVIGATE' && intent?.target && onNavigate) {
              onNavigate(intent.target)
            } else if (intent?.type === 'HANDOFF' && intent?.agent) {
              setActiveAgent(intent.agent)
              if (onAgentChange) onAgentChange(intent.agent)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[VoiceNavigation] Transcribe HTTP fallback error:', err)
    } finally {
      updateStatus('STANDBY')
    }
  }, [activeAgent, onAgentChange, onNavigate, onTranscript, updateStatus])

  // Connect WebSocket to /api/voice/session
  const connectVoiceSession = useCallback((token?: string) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const sessionToken = token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jarvis_biometric_token') : null) || 'bio_sri_session'
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3005'
    const wsUrl = `${protocol}//${host}/api/voice/session?token=${encodeURIComponent(sessionToken)}`

    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      updateStatus('STANDBY')
    }

    ws.onmessage = async (event) => {
      // Clear fallback timer when message received from WebSocket
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }

      if (typeof event.data !== 'string') {
        // Binary TTS audio chunk received from Deepgram Aura / ElevenLabs
        await handleIncomingAudioChunk(event.data)
        return
      }

      try {
        const payload = JSON.parse(event.data)

        // 1. Hands-Free Navigation Dispatch
        if (payload.action === 'NAVIGATE' && payload.route) {
          if (onNavigate) {
            onNavigate(payload.route)
          } else if (typeof window !== 'undefined') {
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
          console.log('[VoiceNavigation] Transcribed text (WebSocket):', payload.text)
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
          if (!audioQueuePlayer.isSpeaking()) {
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
  }, [handleIncomingAudioChunk, onAgentChange, onAgentResponse, onNavigate, onTranscript, updateStatus])

  // Initialize AudioWorkletNode, MediaRecorder fallback, and 16kHz capture
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

      // Explicitly prime AudioQueuePlayer on user touch/mic interaction
      await audioQueuePlayer.prime(ctx)

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

      // Initialize parallel MediaRecorder for HTTP fallback if WebSocket drops or stalls
      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
        const recorder = new MediaRecorder(stream, { mimeType })
        recordedChunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data)
          }
        }

        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType })
            recordedChunksRef.current = []
            // Trigger HTTP fallback if WebSocket is not open or stalled
            const ws = wsRef.current
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              transcribeBlobFallback(blob)
            }
          }
        }

        mediaRecorderRef.current = recorder
      } catch (recErr) {
        console.warn('[useVoiceNavigation] MediaRecorder fallback init note:', recErr)
      }

      const source = ctx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(ctx, 'jarvis-audio-worklet-processor')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event) => {
        const { type, buffer, isAboveThreshold } = event.data
        if (type !== 'PCM_CHUNK') return

        const ws = wsRef.current
        const isWsAvailable = ws && ws.readyState === WebSocket.OPEN

        // Threshold detection: 0.01 + 400ms hangover
        if (isAboveThreshold) {
          speechDetectedRef.current = true
          updateStatus('LISTENING')

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Start MediaRecorder chunk recording if not recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            try {
              recordedChunksRef.current = []
              mediaRecorderRef.current.start(250)
            } catch {}
          }

          if (isWsAvailable) {
            lastPacketSendTimeRef.current = Date.now()
            ws.send(buffer)
          }
        } else if (speechDetectedRef.current) {
          // Send trailing buffers during short silence
          if (isWsAvailable) {
            ws.send(buffer)
          }

          // Conclude turn after 700ms silence
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              speechDetectedRef.current = false
              silenceTimerRef.current = null
              updateStatus('PROCESSING')

              // Stop MediaRecorder fallback buffer
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try { mediaRecorderRef.current.stop() } catch {}
              }

              if (isWsAvailable) {
                ws.send(JSON.stringify({ type: 'SPEECH_END' }))

                // Set 1.5s latency watchdog: if no response from WS, fall back to HTTP
                if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current)
                fallbackTimeoutRef.current = setTimeout(() => {
                  console.warn('[VoiceNavigation] WebSocket latency exceeded 1.5s, checking HTTP fallback')
                  if (recordedChunksRef.current.length > 0) {
                    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                    transcribeBlobFallback(blob)
                  }
                }, 1500)
              }
            }, 700)
          }
        }
      }

      source.connect(workletNode)
      // Do not connect workletNode to ctx.destination to prevent microphone feedback loop
      updateStatus('STANDBY')
    } catch (err) {
      console.warn('[useVoiceNavigation] Audio capture initialization failed:', err)
    }
  }, [transcribeBlobFallback, updateStatus])

  // Stop listening and release media tracks
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    audioQueuePlayer.stop()
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
