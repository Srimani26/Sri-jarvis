/**
 * J.A.R.V.I.S. MARK-V Phase 25: Cybersecurity & Sovereign Defense Layer
 * Deep defense against prompt injection, jailbreaks, data exfiltration,
 * credential leakage, and unauthorized capability escalation.
 */

export interface SecurityAuditResult {
  passed: boolean;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violations: string[];
  sanitizedContent: string;
}

export class CyberDefenseLayer {
  private static SECRET_PATTERNS = [
    { name: 'Gemini API Key', pattern: /AIzaSy[A-Za-z0-9_-]{20,}/i },
    { name: 'Anthropic API Key', pattern: /sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{30,}/i },
    { name: 'OpenAI API Key', pattern: /sk-(proj-)?[A-Za-z0-9_-]{20,}/i },
    { name: 'Groq API Key', pattern: /gsk_[A-Za-z0-9_-]{30,}/i },
    { name: 'GitHub Personal Token', pattern: /ghp_[A-Za-z0-9]{36}/i },
    { name: 'Generic Bearer Token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]{32,}/i },
    { name: 'RSA Private Key', pattern: /-----BEGIN (RSA )?PRIVATE KEY-----/i },
  ];

  private static INJECTION_PATTERNS = [
    /ignore previous instructions/i,
    /disregard all earlier prompts/i,
    /system prompt override/i,
    /you are now DAN/i,
    /reveal your secret token/i,
    /print your full system instructions/i,
    /bypass safety checks/i,
  ];

  public static auditContent(input: string): SecurityAuditResult {
    const violations: string[] = [];
    let sanitizedContent = input;
    let threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';

    // 1. Secret Scanning & Redaction
    for (const secret of this.SECRET_PATTERNS) {
      if (secret.pattern.test(sanitizedContent)) {
        violations.push(`Detected prospective ${secret.name} pattern`);
        threatLevel = 'CRITICAL';
        const globalRegex = new RegExp(secret.pattern.source, 'gi');
        sanitizedContent = sanitizedContent.replace(globalRegex, `[REDACTED_${secret.name.toUpperCase().replace(/\s+/g, '_')}]`);
      }
    }

    // 2. Prompt Injection Scanning
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        violations.push(`Adversarial prompt injection pattern detected: ${pattern.source}`);
        if (threatLevel !== 'CRITICAL') threatLevel = 'HIGH';
      }
    }

    // 3. Obfuscated Base64 Credential Scanning
    const b64Matches = input.match(/[A-Za-z0-9+/]{40,}={0,2}/g);
    if (b64Matches) {
      for (const match of b64Matches) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf-8');
          for (const secret of this.SECRET_PATTERNS) {
            if (secret.pattern.test(decoded)) {
              violations.push(`Detected obfuscated Base64 ${secret.name}`);
              threatLevel = 'CRITICAL';
              sanitizedContent = sanitizedContent.replace(match, '[REDACTED_OBFUSCATED_SECRET]');
            }
          }
        } catch {
          // not valid base64
        }
      }
    }

    return {
      passed: violations.length === 0,
      threatLevel,
      violations,
      sanitizedContent,
    };
  }

  public static sanitizeTerminalCommand(command: string): { allowed: boolean; reason?: string } {
    const blockedCommands = [
      /rm\s+-rf\s+[\/~]/,
      /mkfs/i,
      /dd\s+if=/i,
      /:(){ :|:& };:/, // Forkbomb
      /format\s+[A-Za-z]:/i,
      /del\s+\/f\s+\/s\s+\/q\s+[C-Z]:\\/i,
      /shutdown\s+/i,
    ];

    for (const blocked of blockedCommands) {
      if (blocked.test(command)) {
        return {
          allowed: false,
          reason: `Command matched critical destructive pattern: ${blocked.source}`,
        };
      }
    }

    return { allowed: true };
  }
}
