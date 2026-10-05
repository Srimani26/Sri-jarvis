/**
 * Sovereign J.A.R.V.I.S. Mobile Core (Offline & Base-Station Disconnected Mode)
 * Ensures Master Sri can always talk to J.A.R.V.I.S. even when the main PC/server is shut down.
 */

export interface OfflineDirective {
  id: string
  timestamp: number
  command: string
  category: string
  status: 'queued' | 'synced'
  localResponse: string
}

export function isServerReachable(): Promise<boolean> {
  return fetch('/health', { method: 'GET', signal: AbortSignal.timeout(2000) })
    .then(r => r.ok)
    .catch(() => false)
}

export function processOfflineCommand(cmd: string): { reply: string; action?: string } {
  const lower = cmd.toLowerCase().trim()

  if (lower.includes('who are you') || lower.includes('status')) {
    return {
      reply: "I am your Sovereign J.A.R.V.I.S. Mobile Core, Master Sri. The primary base station is currently powered down, but my on-device intelligence remains vigilant on your phone. All directives are queued for instant execution upon base station reboot."
    }
  }

  if (lower.includes('hello') || lower.includes('hey jarvis') || lower.includes('hi')) {
    return {
      reply: "Greetings Sovereign Master Sri! Mobile Core active on your device. What thoughts or directives shall we record, Sire?"
    }
  }

  if (lower.startsWith('tutor me') || lower.includes('guide me') || lower.includes('what is good') || lower.includes('what is bad')) {
    return {
      reply: "Master Sri, as your tutor: Never compromise on code architecture for quick hacks. In business, prioritize high-ticket recurring client contracts over low-margin one-offs. Value your rest, for a clear mind commands greatest power. What specific topic shall we dissect, Sire?"
    }
  }

  if (lower.startsWith('calc') || lower.includes('+') || lower.includes('-') || lower.includes('*') || lower.includes('/')) {
    try {
      const sanitized = lower.replace(/[^0-9+\-*/().]/g, '')
      if (sanitized) {
        // eslint-disable-next-line no-eval
        const res = Function(`"use strict"; return (${sanitized})`)()
        return { reply: `Calculation complete, Master Sri: ${sanitized} = ${res}` }
      }
    } catch {}
  }

  // Queue general directive for synchronization
  queueOfflineDirective(cmd, 'general', `Directive registered in mobile buffer: "${cmd}". Will execute full multi-agent swarm once base station reconnects.`)

  return {
    reply: `Master Sri, directive logged in your Sovereign Mobile Buffer: "${cmd}". As soon as your main system boots, Aegis and Vortex will execute it immediately.`,
    action: 'queued'
  }
}

export function queueOfflineDirective(command: string, category: string, localResponse: string): OfflineDirective {
  const item: OfflineDirective = {
    id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    command,
    category,
    status: 'queued',
    localResponse
  }

  try {
    const existing = JSON.parse(localStorage.getItem('jarvis_offline_queue') || '[]')
    existing.push(item)
    localStorage.setItem('jarvis_offline_queue', JSON.stringify(existing))
  } catch {}

  return item
}

export function getQueuedDirectives(): OfflineDirective[] {
  try {
    return JSON.parse(localStorage.getItem('jarvis_offline_queue') || '[]')
  } catch {
    return []
  }
}

export function clearQueuedDirectives(): void {
  try {
    localStorage.removeItem('jarvis_offline_queue')
  } catch {}
}
