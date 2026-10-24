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
  const [telemetry, setTelemetry] = useState<any>({ batteryLevel: 100, charging: false, isMobile: false })
  const [evolutionStats, setEvolutionStats] = useState(SelfEvolutionEngine.getEvolutionStats())

  useEffect(() => {
    getDeviceTelemetry().then(setTelemetry).catch(() => {})
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
            {/* Ambient Blur Glow */}
            <div className="absolute -inset-3 rounded-full bg-cyan-400/40 blur-lg opacity-80 group-hover:opacity-100 transition-opacity quantum-glow" />
            {/* Outer fluid clockwise ring */}
            <div className="absolute -inset-1.5 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-500 arc-spin-cw transition-all shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
            {/* Counter-rotating inner ring */}
            <div className="absolute -inset-0.5 rounded-full p-[1px] border border-dashed border-cyan-300/80 arc-spin-ccw" />
            {/* Glowing Core */}
            <div
              className={cn(
                'relative w-12 h-12 rounded-full bg-gradient-to-tr border flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.8)]',
                getStatusColor()
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 border border-cyan-300 flex items-center justify-center shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 uppercase font-mono drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                J.A.R.V.I.S. MARK-VI // QUANTUM CORE
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                NEURAL DUPLEX
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                20 SWARMS PRIMED
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                <Zap className="w-2.5 h-2.5 text-purple-400" />
                AUTONOMOUS // ZERO-CANNED
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 mt-1">
              <span>Sole Commander:</span>
              <strong className="text-white font-semibold tracking-wide">Master Sri</strong>
              <span className="text-cyan-600">•</span>
              <span className="text-cyan-300 font-mono truncate px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">
                Gemini 3 Flash Pro (Quantum Real-Time)
              </span>
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
                  height: status === 'speaking' || status === 'thinking' ? `${h}%` : '25%',
                  animationDelay: `${i * 120}ms`,
                  animationDuration: status === 'speaking' ? '0.7s' : '1.4s'
                }}
                className={cn(
                  'w-0.5 rounded-full transition-all duration-300',
                  (status === 'speaking' || status === 'thinking') && 'animate-pulse',
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
            <span>SWARM: 20 ACTIVE</span>
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
