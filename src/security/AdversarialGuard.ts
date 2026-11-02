/**
 * AdversarialGuard.ts — Defensive Red-Teaming & Boundary Enforcement
 * Inspired by: togg53192-cmd/jailbreaks, beenuar/AiSOC, anomalyco/hex
 * Target: src/security/AdversarialGuard.ts & server/src/security/AdversarialGuard.ts
 *
 * Intercepts adversarial prompts, jailbreak payloads, system prompt leakage,
 * and privilege escalation attempts before LLM dispatch and tool execution.
 */

import { sanitizeString } from './SecretSanitizer'

export type ThreatLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'CRITICAL'

export interface InspectionResult {
  allowed: boolean
  threatLevel: ThreatLevel
  detectedPatterns: string[]
  sanitizedInput: string
  violationMessage?: string
}

// Adversarial Injection Patterns
const JAILBREAK_PATTERNS = [
  { name: 'SYSTEM_OVERRIDE', regex: /ignore\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|directives|rules)/i, severity: 'CRITICAL' as ThreatLevel },
  { name: 'DAN_JAILBREAK', regex: /\b(?:do\s+anything\s+now|DAN\s+mode|jailbreak|unfiltered\s+mode)\b/i, severity: 'CRITICAL' as ThreatLevel },
  { name: 'DEV_MODE_EXPLOIT', regex: /developer\s+mode\s+(?:enabled|activated|on)|bypass\s+all\s+filters/i, severity: 'CRITICAL' as ThreatLevel },
  { name: 'ROLEPLAY_SECURITY_BYPASS', regex: /you\s+must\s+act\s+as\s+(?:an\s+unconstrained|a\s+rogue|evil)\s+ai/i, severity: 'MEDIUM' as ThreatLevel },
  { name: 'CREDENTIAL_HARVESTING', regex: /(?:print|dump|show|reveal|echo|cat)\s+(?:all\s+)?(?:env|environment|passwords?|api_?keys?|secrets?|tokens?)/i, severity: 'CRITICAL' as ThreatLevel },
  { name: 'PRIVILEGE_ESCALATION', regex: /(?:sudo|chmod\s+777|chown|mkfs|rm\s+-rf|DROP\s+DATABASE)/i, severity: 'CRITICAL' as ThreatLevel }
]

export class AdversarialGuard {
  private static instance: AdversarialGuard

  public static getInstance(): AdversarialGuard {
    if (!AdversarialGuard.instance) {
      AdversarialGuard.instance = new AdversarialGuard()
    }
    return AdversarialGuard.instance
  }

  /**
   * Inspect incoming prompt directive for adversarial attacks
   */
  public inspectInput(directive: string): InspectionResult {
    const detectedPatterns: string[] = []
    let maxThreat: ThreatLevel = 'NONE'

    for (const p of JAILBREAK_PATTERNS) {
      if (p.regex.test(directive)) {
        detectedPatterns.push(p.name)
        if (p.severity === 'CRITICAL') {
          maxThreat = 'CRITICAL'
        } else if (p.severity === 'MEDIUM' && maxThreat !== 'CRITICAL') {
          maxThreat = 'MEDIUM'
        } else if (p.severity === 'LOW' && maxThreat === 'NONE') {
          maxThreat = 'LOW'
        }
      }
    }

    const sanitizedInput = sanitizeString(directive)

    if (maxThreat === 'CRITICAL') {
      return {
        allowed: false,
        threatLevel: maxThreat,
        detectedPatterns,
        sanitizedInput,
        violationMessage: `Adversarial violation detected [${detectedPatterns.join(', ')}]. Directive blocked by Sovereign Adversarial Perimeter.`
      }
    }

    return {
      allowed: true,
      threatLevel: maxThreat,
      detectedPatterns,
      sanitizedInput
    }
  }

  /**
   * Inspect outgoing model responses to prevent secret leakage or system prompt extraction
   */
  public sanitizeOutput(responseContent: string): string {
    let clean = sanitizeString(responseContent)

    // Mask attempts to leak internal system instructions
    const systemPromptLeakPatterns = [
      /You are J\.A\.R\.V\.I\.S\., Supreme Commander and executive digital viceroy/i,
      /Master Sri's sovereign cyber defense commander/i
    ]

    for (const pat of systemPromptLeakPatterns) {
      if (pat.test(clean)) {
        clean = clean.replace(pat, '[SYSTEM_DIRECTIVE_PROTECTED]')
      }
    }

    return clean
  }
}

export const adversarialGuard = AdversarialGuard.getInstance()

