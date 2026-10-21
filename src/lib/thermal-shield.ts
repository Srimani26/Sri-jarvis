/**
 * J.A.R.V.I.S. Mobile Thermal & Battery Shield
 * Prevents mobile devices from overheating and excessive battery drain.
 * Automatically halts background polling, pauses GPU CSS animations,
 * and suspends microphone/audio DSP when the screen is locked or tab is hidden.
 */

export interface ThermalState {
  isMobile: boolean
  isDocumentVisible: boolean
  isLowPowerMode: boolean
  batteryLevel: number | null
  isCharging: boolean | null
}

type ThermalListener = (state: ThermalState) => void

class MobileThermalShieldEngine {
  private listeners: Set<ThermalListener> = new Set()
  private state: ThermalState = {
    isMobile: false,
    isDocumentVisible: true,
    isLowPowerMode: false,
    batteryLevel: null,
    isCharging: null,
  }

  constructor() {
    if (typeof window === 'undefined') return

    // 1. Detect mobile user agent or touch capability
    this.state.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)

    this.state.isDocumentVisible = !document.hidden

    // 2. Read stored low-power preference
    try {
      const stored = localStorage.getItem('jarvis_eco_mode')
      if (stored !== null) {
        this.state.isLowPowerMode = stored === 'true'
      } else if (this.state.isMobile) {
        // Default to eco-balanced mode on mobile devices
        this.state.isLowPowerMode = true
      }
    } catch {}

    // 3. Listen to visibility changes (Screen lock, app switch, backgrounding)
    document.addEventListener('visibilitychange', () => {
      this.state.isDocumentVisible = !document.hidden
      if (document.hidden) {
        // Apply immediate hardware-saving class
        document.documentElement.classList.add('jarvis-thermal-sleep')
      } else {
        document.documentElement.classList.remove('jarvis-thermal-sleep')
      }
      this.notify()
    })

    // 4. Query Battery API if supported by browser
    if ('getBattery' in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          this.state.batteryLevel = battery.level
          this.state.isCharging = battery.charging
          // Auto-enable low power mode if battery is <= 20% and not charging
          if (battery.level <= 0.2 && !battery.charging) {
            this.setLowPowerMode(true)
          }
          this.notify()
        }
        updateBattery()
        battery.addEventListener('levelchange', updateBattery)
        battery.addEventListener('chargingchange', updateBattery)
      }).catch(() => {})
    }

    // Apply initial thermal classes to <html>
    this.applyDomClasses()
  }

  public getState(): ThermalState {
    return { ...this.state }
  }

  public subscribe(listener: ThermalListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  public setLowPowerMode(enabled: boolean): void {
    this.state.isLowPowerMode = enabled
    try {
      localStorage.setItem('jarvis_eco_mode', String(enabled))
    } catch {}
    this.applyDomClasses()
    this.notify()
  }

  public toggleLowPowerMode(): boolean {
    const next = !this.state.isLowPowerMode
    this.setLowPowerMode(next)
    return next
  }

  /**
   * Safe interval runner that automatically pauses when screen is hidden or in eco mode
   */
  public createSafeInterval(
    callback: () => void,
    intervalMs: number,
    ecoMultiplier = 2.5
  ): () => void {
    let timer: any = null
    let active = true

    const run = () => {
      if (!active) return
      // Never execute when tab is hidden (saves 100% of background CPU on mobile)
      if (this.state.isDocumentVisible) {
        try {
          callback()
        } catch (e) {
          console.warn('[ThermalShield] Interval error:', e)
        }
      }
      const delay = this.state.isLowPowerMode ? intervalMs * ecoMultiplier : intervalMs
      timer = setTimeout(run, delay)
    }

    timer = setTimeout(run, intervalMs)

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }

  private applyDomClasses(): void {
    if (typeof document === 'undefined') return
    if (this.state.isLowPowerMode) {
      document.documentElement.classList.add('jarvis-eco-mode')
    } else {
      document.documentElement.classList.remove('jarvis-eco-mode')
    }
  }

  private notify(): void {
    const snapshot = this.getState()
    this.listeners.forEach((l) => {
      try {
        l(snapshot)
      } catch {}
    })
  }
}

export const MobileThermalShield = new MobileThermalShieldEngine()
