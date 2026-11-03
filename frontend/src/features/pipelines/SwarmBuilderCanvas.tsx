import React, { useState, useEffect, useRef } from 'react'
import { swarmAudioEngine } from './swarmAudioEngine'

interface SwarmCursorState {
  id: string
  name: string
  color: string
  x: number
  y: number
  targetX: number
  targetY: number
  tool: 'crosshair' | 'ruler' | 'ibeam' | 'duplicate' | 'pointer'
  label?: string
  visible: boolean
}

interface SwarmBuilderCanvasProps {
  onComplete?: () => void
  onGoLive?: () => void
  siteTitle?: string
}

export const SwarmBuilderCanvas: React.FC<SwarmBuilderCanvasProps> = ({
  onComplete,
  onGoLive,
  siteTitle = 'INVI LUXURY APPAREL'
}) => {
  const [speed, setSpeed] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [buildProgress, setBuildProgress] = useState<number>(0)
  const [isFinished, setIsFinished] = useState<boolean>(false)

  // Visible elements spawned by the swarm
  const [renderedBoxes, setRenderedBoxes] = useState<string[]>([])
  const [typedHeader, setTypedHeader] = useState<string>('')
  const [typedSubhead, setTypedSubhead] = useState<string>('')
  const [activeGuides, setActiveGuides] = useState<number[]>([])
  const [renderedCards, setRenderedCards] = useState<number[]>([])

  // Cursor state
  const [cursors, setCursors] = useState<Record<string, SwarmCursorState>>({
    aegis: {
      id: 'aegis',
      name: 'Aegis',
      color: '#38bdf8', // Cyan
      x: 100,
      y: 100,
      targetX: 100,
      targetY: 100,
      tool: 'crosshair',
      label: 'Box Tool: 920 × 240',
      visible: true
    },
    raphael: {
      id: 'raphael',
      name: 'Raphael',
      color: '#c084fc', // Purple
      x: 200,
      y: 80,
      targetX: 200,
      targetY: 80,
      tool: 'ruler',
      label: 'Guide: X=40px',
      visible: true
    },
    friday: {
      id: 'friday',
      name: 'Friday',
      color: '#fb7185', // Rose
      x: 80,
      y: 140,
      targetX: 80,
      targetY: 140,
      tool: 'ibeam',
      label: 'Typewriter',
      visible: true
    },
    jarvis: {
      id: 'jarvis',
      name: 'Jarvis',
      color: '#facc15', // Amber
      x: 350,
      y: 400,
      targetX: 350,
      targetY: 400,
      tool: 'duplicate',
      label: '⌥ Duplicate Card',
      visible: true
    }
  })

  const animTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    swarmAudioEngine.setMuted(nextMuted)
  }

  // Master Choreography Runner
  const runChoreography = () => {
    // Reset state
    setBuildProgress(0)
    setIsFinished(false)
    setRenderedBoxes([])
    setTypedHeader('')
    setTypedSubhead('')
    setActiveGuides([])
    setRenderedCards([])

    const delay = (ms: number) => ms / speed

    // Step 1: Orbit intro & Fan out
    swarmAudioEngine.playFanoutArpeggio()

    // Step 2: Aegis draws Navbar and Hero Frame
    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        aegis: { ...prev.aegis, x: 40, y: 30, tool: 'crosshair', label: 'Drawing Header: 920 × 56' }
      }))
      swarmAudioEngine.playGlassNote(1, 0.1)
      setRenderedBoxes(prev => [...prev, 'header'])
      setBuildProgress(15)
    }, delay(600))

    // Step 3: Raphael pulls guide ruler
    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        raphael: { ...prev.raphael, x: 40, y: 150, tool: 'ruler', label: 'Snap Guide: X=40' }
      }))
      swarmAudioEngine.playGuideSnap(0.04)
      setActiveGuides([40, 960])
      setBuildProgress(25)
    }, delay(1100))

    // Step 4: Aegis draws Hero container
    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        aegis: { ...prev.aegis, x: 40, y: 110, tool: 'crosshair', label: 'Drawing Hero: 920 × 200' }
      }))
      swarmAudioEngine.playGlassNote(3, 0.4)
      setRenderedBoxes(prev => [...prev, 'hero'])
      setBuildProgress(40)
    }, delay(1700))

    // Step 5: Friday types Title letter by letter
    const titleText = siteTitle
    titleText.split('').forEach((char, i) => {
      setTimeout(() => {
        setTypedHeader(prev => prev + char)
        setCursors(prev => ({
          ...prev,
          friday: { ...prev.friday, x: 70 + (i * 14), y: 160, tool: 'ibeam', label: `Typing: "${char}"` }
        }))
        swarmAudioEngine.playTypewriterClick(0.2 + (i * 0.02), char === ' ')
      }, delay(2200 + (i * 70)))
    })

    // Step 6: Friday types Subhead
    const subText = 'Autonomous Multi-Agent E-Commerce Architecture'
    setTimeout(() => {
      subText.split('').forEach((char, j) => {
        setTimeout(() => {
          setTypedSubhead(prev => prev + char)
          setCursors(prev => ({
            ...prev,
            friday: { ...prev.friday, x: 70 + (j * 8), y: 200, tool: 'ibeam', label: 'Typing Subhead' }
          }))
          if (j % 2 === 0) swarmAudioEngine.playTypewriterClick(0.3, char === ' ')
        }, delay(j * 40))
      })
    }, delay(3400))

    // Step 7: Aegis builds master product card
    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        aegis: { ...prev.aegis, x: 40, y: 340, tool: 'crosshair', label: 'Master Card: 280 × 220' }
      }))
      swarmAudioEngine.playGlassNote(5, 0.1)
      setRenderedCards([0])
      setBuildProgress(65)
    }, delay(4400))

    // Step 8: Jarvis duplicates card 1 and card 2 with spacing measurement guides
    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        jarvis: { ...prev.jarvis, x: 360, y: 340, tool: 'duplicate', label: '⌥ Drag Duplicate: dx=320px' }
      }))
      swarmAudioEngine.playGlassNote(7, 0.4)
      setRenderedCards([0, 1])
      setBuildProgress(80)
    }, delay(5200))

    setTimeout(() => {
      setCursors(prev => ({
        ...prev,
        jarvis: { ...prev.jarvis, x: 680, y: 340, tool: 'duplicate', label: '⌥ Drag Duplicate: dx=640px' }
      }))
      swarmAudioEngine.playGlassNote(9, 0.7)
      setRenderedCards([0, 1, 2])
      setBuildProgress(95)
    }, delay(5900))

    // Step 9: Finale chord & flocking
    setTimeout(() => {
      swarmAudioEngine.playCompletionChord()
      setBuildProgress(100)
      setIsFinished(true)
      onComplete?.()
    }, delay(6700))
  }

  useEffect(() => {
    runChoreography()
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
    }
  }, [speed])

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Top Toolbar (Swarm Status & Controls) */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200 uppercase tracking-wider font-mono">Swarm Rebuild</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-sky-400">Progress: {buildProgress}%</span>
        </div>

        {/* Speed Controls & Audio Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 rounded-lg p-0.5 border border-slate-800 flex items-center">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                onClick={() => setSpeed(val)}
                className={`px-2.5 py-0.5 rounded font-mono font-bold transition-colors ${
                  speed === val ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {val}×
              </button>
            ))}
          </div>

          <button
            onClick={handleToggleMute}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1 font-medium ${
              isMuted ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isMuted ? '🔇 Muted' : '🔊 Sound On'}
          </button>

          <button
            onClick={runChoreography}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors font-medium"
          >
            ↻ Replay Swarm
          </button>

          {isFinished && onGoLive && (
            <button
              onClick={onGoLive}
              className="px-3.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold transition-all shadow-lg shadow-sky-500/20 animate-bounce"
            >
              Go Live ↗
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage with Dot Grid Background */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden" style={{
        backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}>
        {/* Alignment Ruler Guides */}
        {activeGuides.map((x) => (
          <div
            key={x}
            className="absolute top-0 bottom-0 border-l border-rose-500/50 z-10 pointer-events-none transition-all duration-300"
            style={{ left: `${(x / 1000) * 100}%` }}
          >
            <span className="absolute top-2 left-1 bg-rose-500 text-[10px] font-mono text-white px-1 rounded">
              X={x}px
            </span>
          </div>
        ))}

        {/* 1. Header Box */}
        {renderedBoxes.includes('header') && (
          <div
            className="absolute left-[4%] top-[3%] w-[92%] h-[56px] bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between px-6 shadow-xl transition-all duration-300 animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400"></span>
              <span className="font-bold text-sm tracking-widest text-slate-100 font-mono">INVI LUXE</span>
            </div>
            <div className="flex gap-6 text-xs text-slate-400 font-mono">
              <span>// COLLECTIONS</span>
              <span>// HAUTE COUTURE</span>
              <span>// BESPOKE</span>
            </div>
          </div>
        )}

        {/* 2. Hero Box & Typography */}
        {renderedBoxes.includes('hero') && (
          <div
            className="absolute left-[4%] top-[14%] w-[92%] h-[200px] bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 rounded-xl p-8 flex flex-col justify-center shadow-2xl transition-all duration-300 animate-in fade-in"
          >
            <h1 className="text-3xl font-black tracking-tight text-white font-sans flex items-center">
              {typedHeader}
              {!isFinished && <span className="inline-block w-2.5 h-7 ml-1 bg-sky-400 animate-pulse"></span>}
            </h1>
            <p className="text-sm text-sky-400/90 font-mono mt-2 tracking-wide">
              {typedSubhead}
            </p>
          </div>
        )}

        {/* 3. Product Cards & ⌥-drag Spacing Duplicates */}
        <div className="absolute left-[4%] top-[50%] w-[92%] flex gap-8">
          {renderedCards.map((idx) => (
            <div
              key={idx}
              className="w-[280px] h-[220px] bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl transition-all duration-500 animate-in zoom-in-95"
            >
              <div className="w-full h-[120px] bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600 text-xs font-mono">
                [ MEDIA / PRODUCT PREVIEW 0{idx + 1} ]
              </div>
              <div>
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">Sovereign Edition</span>
                <div className="text-sm font-bold text-slate-200">Atelier Silk Robe 0{idx + 1}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">$1,250 USD</div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Live Multi-Agent Multiplayer Cursors */}
        {Object.values(cursors).map((cursor) => (
          <div
            key={cursor.id}
            className="absolute pointer-events-none transition-all duration-150 z-20 flex items-start gap-1 transform -translate-x-1 -translate-y-1"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              opacity: cursor.visible ? 1 : 0
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={cursor.color}
              className="drop-shadow-lg filter"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Agent Badge & Tool Dimension Tag */}
            <div
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-950 shadow-md flex items-center gap-1.5 whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              <span>{cursor.name}</span>
              {cursor.label && (
                <span className="text-[9px] font-normal opacity-90 border-l border-slate-950/20 pl-1">
                  {cursor.label}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default SwarmBuilderCanvas

