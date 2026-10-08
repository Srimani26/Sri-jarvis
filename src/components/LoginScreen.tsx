import { useState } from 'react'
import { Eye, EyeOff, Shield, AlertTriangle, Lock, Loader2, Sparkles, Zap, Fingerprint, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TwoFactorSetup } from './auth/TwoFactorSetup'
import { TwoFactorVerify } from './auth/TwoFactorVerify'
import { playJarvisChime } from '@/lib/sound'

interface LoginScreenProps {
  onLogin: (token: string, username: string, refreshToken?: string) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [username, setUsername] = useState('SrimanikandanK')
  const [password, setPassword] = useState('sri2613M@')
  const [inviteCode, setInviteCode] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [twofaStep, setTwofaStep] = useState<'none' | 'setup' | 'verify'>('none')
  const [tempToken, setTempToken] = useState('')
  const [lockTimer, setLockTimer] = useState(0)

  const switchMode = (next: 'login' | 'register' | 'reset') => {
    setMode(next)
    setError('')
    setNotice('')
  }

  // 1-Click Master Sri Biometric Access
  const handleMasterSriBypass = async () => {
    setLoading(true)
    setError('')
    playJarvisChime('wake')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'SrimanikandanK', password: 'sri2613M@' }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        playJarvisChime('execute')
        onLogin(data.token, 'SrimanikandanK', data.refreshToken)
      } else {
        setError(data.error || 'Authentication rejected')
      }
    } catch (err: any) {
      setError('Connection failure: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    if (mode === 'register' && password !== confirmPw) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    setNotice('')

    try {
      if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, newPassword: password, inviteCode }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to reset password')
          return
        }
        setNotice(data.message || 'Password reset. You can log in now.')
        setMode('login')
        return
      }

      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload: Record<string, string> = { username, password }
      if (mode === 'register' && inviteCode) payload.inviteCode = inviteCode

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 423) {
          setError(data.error || 'Account locked')
          setLockTimer(900)
          const interval = setInterval(() => {
            setLockTimer((t) => {
              if (t <= 1) {
                clearInterval(interval)
                return 0
              }
              return t - 1
            })
          }, 1000)
        } else {
          setError(data.error || 'Authentication failed')
        }
        return
      }

      if (data.require2fa) {
        setTempToken(data.tempToken)
        setTwofaStep('verify')
        return
      }

      playJarvisChime('execute')
      onLogin(data.token, data.user?.username || username, data.refreshToken)
    } catch {
      setError('Connection error. Server is starting up.')
    } finally {
      setLoading(false)
    }
  }

  if (twofaStep === 'verify') {
    return (
      <TwoFactorVerify
        username={username}
        tempToken={tempToken}
        onSuccess={(token, user) => onLogin(token, user.username)}
        onBack={() => {
          setTwofaStep('none')
          setTempToken('')
        }}
        onRecovered={(message) => {
          setError(message)
          setTwofaStep('none')
          setTempToken('')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Holographic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900/90 border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_80px_rgba(6,182,212,0.2)] rounded-3xl relative z-10 overflow-hidden">
        
        {/* Holographic Header Band */}
        <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 p-6 text-center border-b border-cyan-500/20 relative">
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute w-20 h-20 rounded-full bg-cyan-500/30 blur-xl animate-pulse" />
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_35px_rgba(6,182,212,0.6)] flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center backdrop-blur-xl">
                <Zap className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-1">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            J.A.R.V.I.S. MARK-V // SOVEREIGN CLOUD OS
          </div>
          <h1 className="text-xl font-black tracking-wider text-white">
            J.A.R.V.I.S. COMMAND INTERFACE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Dedicated Autonomous AI for Master Sri (Srimanikandan K)
          </p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* 1-Click Biometric Bypass for Master Sri */}
          <button
            type="button"
            onClick={handleMasterSriBypass}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs font-mono tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Fingerprint className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            )}
            <span>⚡ INITIALIZE J.A.R.V.I.S. (MASTER SRI ACCESS)</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-slate-500">
              or enter password
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form Tabs */}
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 font-mono text-xs">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Master Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'register' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'reset' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 text-cyan-400" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-slate-300">Identity / Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SrimanikandanK"
                className="bg-slate-950 border-slate-800 focus:border-cyan-500 text-xs font-mono text-white rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-slate-300">Clearance Code / Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="text-[11px] text-cyan-400 hover:underline font-mono"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="sri2613M@"
                  className="bg-slate-950 border-slate-800 focus:border-cyan-500 text-xs font-mono text-white pr-10 rounded-xl"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-slate-300">Confirm Clearance Code</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter password"
                  className="bg-slate-950 border-slate-800 focus:border-cyan-500 text-xs font-mono text-white rounded-xl"
                />
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-slate-300">Invite Code (Optional for Master)</Label>
                <Input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code if required"
                  className="bg-slate-950 border-slate-800 focus:border-cyan-500 text-xs font-mono text-white rounded-xl"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || lockTimer > 0}
              className="w-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 hover:border-cyan-400 text-white font-mono text-xs font-bold py-2.5 rounded-xl transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {mode === 'login' ? 'Authenticate' : mode === 'register' ? 'Register Clearance' : 'Reset Clearance'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
