/**
 * voiceNavigationRouter.ts — Omni-Directional Intent Navigation & Semantic UI Controller
 *
 * Provides:
 * 1. Comprehensive regex and semantic mapping from natural spoken phrases to application routes.
 * 2. Instant hands-free navigation across 100% of the J.A.R.V.I.S. workspace tabs.
 * 3. Spoken executive audio confirmation cues for each route transition.
 */

export interface NavigationRouteRule {
  targetRoute: string
  tabKey: string
  patterns: RegExp[]
  confirmationVoice: string
}

export const NAVIGATION_RULES: NavigationRouteRule[] = [
  {
    targetRoute: '/telemetry',
    tabKey: 'telemetry',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(telemetry|system stats|metrics|health|status|ping)/i,
      /(?:how is the system doing|system health|show performance)/i
    ],
    confirmationVoice: 'Opening system telemetry now.'
  },
  {
    targetRoute: '/dashboard',
    tabKey: 'dashboard',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(dashboard|home|main page|overview|control center)/i,
      /(?:take me home|back to base)/i
    ],
    confirmationVoice: 'Returning to main command dashboard.'
  },
  {
    targetRoute: '/studio',
    tabKey: 'studio',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(studio|code studio|ide|editor|workbench|workspace)/i,
      /(?:let's code|open workspace|start coding)/i
    ],
    confirmationVoice: 'Opening code studio.'
  },
  {
    targetRoute: '/storage',
    tabKey: 'storage',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(storage|vault|files|drive|cloud storage|backups|artifacts)/i,
      /(?:open the vault|show my files|check backups)/i
    ],
    confirmationVoice: 'Accessing storage vault.'
  },
  {
    targetRoute: '/cyber',
    tabKey: 'cyber',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(cyber|soc|security|firewall|defense|perimeter|threats|aegis defense)/i,
      /(?:security status|check defenses|perimeter scan)/i
    ],
    confirmationVoice: 'Transferring to Cyber Defense and SOC monitor.'
  },
  {
    targetRoute: '/revenue',
    tabKey: 'revenue',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(revenue|finance|midas|pricing|accounting|billing|mrr|invoices)/i,
      /(?:show me the money|how much did we make|financial overview)/i
    ],
    confirmationVoice: 'Displaying revenue and financial telemetry.'
  },
  {
    targetRoute: '/chat',
    tabKey: 'chat',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(chat|conversation|messages|dialogue|terminal|direct feed)/i,
      /(?:let's talk|open chat)/i
    ],
    confirmationVoice: 'Switching to direct intelligence feed.'
  },
  {
    targetRoute: '/settings',
    tabKey: 'settings',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(settings|preferences|config|configuration|keys|api keys|credentials)/i
    ],
    confirmationVoice: 'Opening system settings.'
  },
  {
    targetRoute: '/tasks',
    tabKey: 'tasks',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(tasks|lead tasks|lead task|lead-tasks|pipeline|task manager|milestones|queue|active tasks|task board|task execution|tasks page)/i,
      /(?:show active tasks|what is running|show queue|show lead tasks|open lead tasks)/i
    ],
    confirmationVoice: 'Opening active lead task pipelines.'
  },
  {
    targetRoute: '/projects',
    tabKey: 'projects',
    patterns: [
      /(?:go to|open|show|navigate to|switch to|view)\s+(?:the\s+)?(projects|invi|clothing store|store|ecommerce|apps)/i,
      /(?:open invi store|show client projects)/i
    ],
    confirmationVoice: 'Opening sovereign projects.'
  }
]

export interface NavigationMatchResult {
  matched: boolean
  targetRoute?: string
  tabKey?: string
  confirmationVoice?: string
}

/**
 * Resolves spoken natural text against all semantic navigation rules.
 */
export function resolveVoiceNavigation(spokenText: string): NavigationMatchResult {
  if (!spokenText || typeof spokenText !== 'string') {
    return { matched: false }
  }

  const clean = spokenText.trim().replace(/[.,!?;:]/g, '')

  for (const rule of NAVIGATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(clean)) {
        return {
          matched: true,
          targetRoute: rule.targetRoute,
          tabKey: rule.tabKey,
          confirmationVoice: rule.confirmationVoice
        }
      }
    }
  }

  return { matched: false }
}

