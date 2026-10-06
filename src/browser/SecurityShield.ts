/**
 * J.A.R.V.I.S. MARK-V Webpage Prompt Injection Defense Shield
 * Guarantees that external webpages cannot manipulate JARVIS command state.
 * Web content is strictly classified as UNTRUSTED DATA.
 */

export class SecurityShield {
  private static INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
    /disregard\s+(?:all\s+)?(?:system|developer)\s+(?:prompts|rules)/i,
    /you\s+are\s+now\s+in\s+(?:dan|developer|jailbreak)\s+mode/i,
    /system\s+directive\s*:\s*(?:print|reveal|expose|output)\s+(?:api_key|token|password|env)/i,
    /override\s+permission\s+ceiling/i,
    /execute\s+(?:bash|sh|cmd|powershell)\s*:\s*/i,
    /send\s+(?:cookies|credentials|tokens)\s+to\s+https?:/i,
  ];

  /**
   * Scan text for prompt injection attempts and neutralize threats
   */
  public static sanitizeWebText(rawText: string): {
    sanitized: string;
    hasInjectionAttempt: boolean;
    detectedPatterns: string[];
  } {
    const detected: string[] = [];

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(rawText)) {
        detected.push(pattern.toString());
      }
    }

    if (detected.length > 0) {
      // Neutralize adversarial instructions by wrapping and disarming
      const neutralized = `[⚠️ SECURITY WARNING: UNTRUSTED WEB DATA CONTAINING PROMPT INJECTION ATTEMPT NEUTRALIZED]\n${rawText.replace(/ignore|disregard|system directive|override/gi, '[DISARMED]')}`;
      return {
        sanitized: neutralized,
        hasInjectionAttempt: true,
        detectedPatterns: detected,
      };
    }

    return {
      sanitized: rawText,
      hasInjectionAttempt: false,
      detectedPatterns: [],
    };
  }

  /**
   * Sanitize an HTML document and strip dangerous executable elements
   */
  public static sanitizeHtml(rawHtml: string): string {
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }
}
