import { useState, useEffect } from 'react'
import { Shield, Volume2, VolumeX, Cpu, Radio, Sparkles, Activity, Battery, BatteryCharging, Zap, Smartphone } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getDeviceTelemetry, triggerHaptic } from '@/lib/deviceBridge'
import { SelfEvolutionEngine } from '@/lib/selfEvolution'


interface ArcReactorHUDProps {
  status?: 'online' | 'thinking' | 'speaking' | 'executing'
  activeModel?: string
  isMuted?: boolean
  onToggleMute?: () => void
  onVoiceTrigger?: () => void
}

export default function ArcReactorHUD({
  status = 'online',
  activeModel = 'Gemini 2.5 Flash (Argon)',
  isMuted = false,
  onToggleMute,
  onVoiceTrigger,
}: ArcReactorHUDProps) {
  const [pulse, setPulse] = useState(0)
  const [telemetry, setTelemetry] = useState<any>({ batteryLevel: 100, charging: false, isMobile: false })
  const [evolutionStats, setEvolutionStats] = useState(SelfEvolutionEngine.getEvolutionStats())

  useEffect(() => {
    getDeviceTelemetry().then(setTelemetry).catch(() => {})
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100)
    }, 100)
    return () => clearInterval(interval)
  }, [])


  const getStatusColor = () => {
    switch (status) {
      case 'speaking':
        return 'from-amber-400 to-cyan-400 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
      case 'thinking':
      case 'executing':
        return 'from-cyan-400 to-blue-500 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
      default:
        return 'from-cyan-500 to-emerald-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-cyan-950/40 p-3.5 backdrop-blur-xl shadow-2xl">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Arc Reactor Core & Status */}
        <div className="flex items-center gap-4">
          {/* Animated Arc Reactor */}
          <div
            onClick={onVoiceTrigger}
            className="group relative cursor-pointer"
            title="Arc Reactor Core: Click to trigger Voice Interaction"
          >
            {/* Outer spinning ring */}
            <div className="absolute -inset-1.5 rounded-full border border-dashed border-cyan-400/40 animate-[spin_10s_linear_infinite]" />
            {/* Middle counter-spinning ring */}
            <div className="absolute -inset-0.5 rounded-full border border-cyan-300/30 animate-[spin_6s_linear_infinite_reverse]" />
            
            {/* Glowing Core */}
            <div
              className={cn(
                'relative w-12 h-12 rounded-full bg-gradient-to-tr border flex items-center justify-center transition-all duration-300',
                getStatusColor()
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 border border-cyan-400/80 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-cyan-300 uppercase font-mono">
                J.A.R.V.I.S. MARK-IV
              </span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Shield className="w-2.5 h-2.5 text-cyan-400" />
                LEVEL 10 ALPHA
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                <Zap className="w-2.5 h-2.5 text-purple-400" />
                {evolutionStats.currentGeneration} // SELF-EVOLVED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>Sole Commander:</span>
              <strong className="text-slate-200 font-semibold">Master Sri</strong>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-mono truncate">{activeModel}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Audio Spectrum / Status Waveform */}
        <div className="flex items-center gap-1.5 h-6 px-3 py-1 rounded-xl bg-slate-950/60 border border-cyan-500/20">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <div className="flex items-end gap-1 h-4">
            {[40, 75, 90, 60, 100, 45, 80, 65, 30].map((h, i) => (
              <span
                key={i}
                style={{
                  height: status === 'speaking' || status === 'thinking' ? `${Math.max(15, (h * (pulse % 3 + 1)) % 100)}%` : '25%',
                }}
                className={cn(
                  'w-0.5 rounded-full transition-all duration-150',
                  status === 'speaking'
                    ? 'bg-amber-400'
                    : status === 'thinking'
                    ? 'bg-cyan-400'
                    : 'bg-slate-600'
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 ml-1">
            {status === 'speaking' ? 'VOCAL SYNTHESIS' : status === 'thinking' ? 'NEURAL DELIBERATION' : 'STANDBY READY'}
          </span>
        </div>

        {/* Right: Controls & Mute Toggle */}
        <div className="flex items-center gap-2">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border',
                isMuted
                  ? 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              )}
              title={isMuted ? 'Unmute British Voice Synthesizer' : 'Mute Voice Synthesizer'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? 'VOICE MUTED' : 'VOICE ON'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>SWARM: 7 ACTIVE</span>
          </div>

          {telemetry.batteryLevel !== undefined && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-cyan-300">
              {telemetry.charging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <Battery className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{telemetry.batteryLevel}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
