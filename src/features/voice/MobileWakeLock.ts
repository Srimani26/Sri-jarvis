/**
 * MobileWakeLock.ts — Persistent Mobile Awake & Background Audio Harness
 *
 * Implements:
 * 1. Screen Wake Lock API: Requests and maintains navigator.wakeLock to prevent device screen sleep.
 * 2. Visibility Lifecycle Reacquisition: Automatically restores lock when user returns to tab.
 * 3. Silent Audio Track Loop: Continual microscopic silent audio keepalive node that prevents
 *    mobile Safari and Android Chromium from freezing the Web Audio worklet thread when display dims.
 */

export class MobileWakeLock {
  private static instance: MobileWakeLock | null = null
  private wakeLockSentinel: any = null
  private silentAudio: HTMLAudioElement | null = null
  private isHandsFreeActive = false
  private visibilityHandler: (() => void) | null = null

  public static getInstance(): MobileWakeLock {
    if (!MobileWakeLock.instance) {
      MobileWakeLock.instance = new MobileWakeLock()
    }
    return MobileWakeLock.instance
  }

  private constructor() {
    this.setupVisibilityListener()
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return

    this.visibilityHandler = async () => {
      if (!document.hidden && this.isHandsFreeActive) {
        await this.acquireScreenLock()
        this.startSilentAudioKeepalive()
      }
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * Request navigator.wakeLock screen sentinel.
   */
  public async acquireScreenLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false
    }

    try {
      if (!this.wakeLockSentinel || this.wakeLockSentinel.released) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen')
        this.wakeLockSentinel.addEventListener('release', () => {
          // If still hands-free active and document visible, re-acquire
          if (this.isHandsFreeActive && typeof document !== 'undefined' && !document.hidden) {
            this.acquireScreenLock()
          }
        })
      }
      return true
    } catch (err) {
      console.warn('[MobileWakeLock] Screen lock request note:', err)
      return false
    }
  }

  /**
   * Start 0-volume looping audio track to prevent OS background audio suspension.
   */
  public startSilentAudioKeepalive(): void {
    if (typeof window === 'undefined') return

    try {
      if (!this.silentAudio) {
        // Standard 1-second silent WAV base64
        const silentWavBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
        const audio = new Audio(silentWavBase64)
        audio.loop = true
        audio.volume = 0.001
        this.silentAudio = audio
      }

      if (this.silentAudio.paused) {
        const p = this.silentAudio.play()
        if (p !== undefined) {
          p.catch(() => {})
        }
      }
    } catch {}
  }

  public stopSilentAudioKeepalive(): void {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause()
        this.silentAudio.currentTime = 0
      } catch {}
    }
  }

  /**
   * Enable hands-free persistent mode.
   */
  public async enableHandsFree(): Promise<boolean> {
    this.isHandsFreeActive = true
    const screenLocked = await this.acquireScreenLock()
    this.startSilentAudioKeepalive()
    return screenLocked
  }

  /**
   * Disable hands-free mode and release resources.
   */
  public release(): void {
    this.isHandsFreeActive = false
    this.stopSilentAudioKeepalive()

    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release()
      } catch {}
      this.wakeLockSentinel = null
    }
  }

  public isActive(): boolean {
    return this.isHandsFreeActive
  }
}

export const mobileWakeLock = MobileWakeLock.getInstance()

