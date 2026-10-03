// Hardware & Mobile Device Bridge for J.A.R.V.I.S.
export interface DeviceTelemetry {
  isMobile: boolean
  platform: string
  online: boolean
  batteryLevel?: number
  charging?: boolean
  coords?: { latitude: number; longitude: number }
  connectionType?: string
}

export async function getDeviceTelemetry(): Promise<DeviceTelemetry> {
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const platform = typeof navigator !== 'undefined' ? navigator.platform || 'Unknown Device' : 'Server'
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  let batteryLevel: number | undefined
  let charging: boolean | undefined

  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      const b: any = await (navigator as any).getBattery()
      batteryLevel = Math.round(b.level * 100)
      charging = b.charging
    } catch {}
  }

  return {
    isMobile,
    platform,
    online,
    batteryLevel,
    charging,
  }
}

export function triggerHaptic(pattern: number[] = [50, 100, 50]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

export function launchNativeApp(action: 'call' | 'whatsapp' | 'maps' | 'youtube', payload?: string) {
  if (typeof window === 'undefined') return

  switch (action) {
    case 'call': {
      const phone = payload || '+916382121634'
      window.location.href = `tel:${phone}`
      break
    }
    case 'whatsapp': {
      const phone = payload || '916382121634'
      window.open(`https://wa.me/${phone}?text=Greetings%20Master%20Sri,%20JARVIS%20is%20executing%20this%20directive.`, '_blank')
      break
    }
    case 'maps': {
      const query = payload || 'Erode, Tamil Nadu'
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
      break
    }
    case 'youtube': {
      const q = payload || 'AI multi-agent swarms'
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank')
      break
    }
  }
}
