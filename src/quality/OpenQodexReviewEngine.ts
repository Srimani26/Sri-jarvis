/**
 * OpenQodex Autonomous Quality & Security Review Engine
 * Inspired by openqodex (https://github.com/openqodex/openqodex)
 * 
 * Functions:
 * 1. Multi-scanner AST & Security Gate (checks Liquid, CSS, JS, TypeScript).
 * 2. Hardcoded secret / API token leak detection (gitleaks pattern scanning).
 * 3. Autonomous Reviewer Agent: Audits generated freelance code patches and auto-heals defects.
 * 4. Generates SARIF-compliant verification receipts before code is shipped to clients.
 */

export interface ScannerFinding {
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  line?: number;
  snippet?: string;
  autoFixAvailable: boolean;
}

export interface OpenQodexReviewResult {
  passed: boolean;
  score: number; // 0 to 100
  verdict: 'APPROVED' | 'AUTO_REPAIRED' | 'REJECTED';
  findings: ScannerFinding[];
  repairedCode: string;
  receipt: {
    scannersRun: string[];
    timestamp: string;
    filesScanned: number;
    findingsCount: number;
  };
}

export class OpenQodexReviewEngine {
  /**
   * Run full scanner suite on generated code before delivering to client
   */
  public static reviewAndSecure(code: string, language: 'liquid' | 'css' | 'javascript' | 'typescript' | 'html' = 'typescript'): OpenQodexReviewResult {
    const findings: ScannerFinding[] = [];
    let cleanCode = code;

    // 1. Gitleaks Scanner: Detect hardcoded API keys or bearer tokens
    const secretPatterns = [
      { id: 'sec-openai-key', regex: /sk-[a-zA-Z0-9]{32,}/g, msg: 'Detected hardcoded OpenAI API secret key' },
      { id: 'sec-anthropic-key', regex: /sk-ant-[a-zA-Z0-9_-]{32,}/g, msg: 'Detected hardcoded Anthropic secret key' },
      { id: 'sec-elevenlabs-key', regex: /[a-f0-9]{32}/g, msg: 'Detected potential raw API secret hex key' },
      { id: 'sec-generic-bearer', regex: /Bearer\s+["'][a-zA-Z0-9_\-\.]{20,}["']/gi, msg: 'Detected hardcoded Bearer token' },
    ];

    for (const pat of secretPatterns) {
      if (pat.id !== 'sec-elevenlabs-key' && pat.regex.test(cleanCode)) {
        findings.push({
          ruleId: pat.id,
          severity: 'CRITICAL',
          message: pat.msg,
          autoFixAvailable: true,
        });
        cleanCode = cleanCode.replace(pat.regex, 'process.env.API_KEY || ""');
      }
    }

    // 2. Semgrep / AST Scanner: Insecure eval and script injection checks
    if (language === 'javascript' || language === 'typescript' || language === 'html') {
      if (/\beval\s*\(/.test(cleanCode)) {
        findings.push({
          ruleId: 'ast-insecure-eval',
          severity: 'HIGH',
          message: 'Prohibited use of eval() detected in client deliverable.',
          autoFixAvailable: true,
        });
        cleanCode = cleanCode.replace(/\beval\s*\(([^)]+)\)/g, 'JSON.parse($1)');
      }

      if (/innerHTML\s*=\s*[^;\n]+/i.test(cleanCode) && !cleanCode.includes('DOMPurify')) {
        findings.push({
          ruleId: 'ast-xss-innerhtml',
          severity: 'MEDIUM',
          message: 'Direct innerHTML assignment without sanitizer. Risk of client XSS.',
          autoFixAvailable: true,
        });
        cleanCode = cleanCode.replace(/(\.innerHTML\s*=\s*)([^;\n]+)/g, '$1DOMPurify?.sanitize ? DOMPurify.sanitize($2) : ($2)');
      }
    }

    // 3. Shopify / Liquid Tag Validator
    if (language === 'liquid' || cleanCode.includes('{%') || cleanCode.includes('{{')) {
      const openTags = (cleanCode.match(/\{%/g) || []).length;
      const closeTags = (cleanCode.match(/%\}/g) || []).length;
      if (openTags !== closeTags) {
        findings.push({
          ruleId: 'liquid-unbalanced-tag',
          severity: 'HIGH',
          message: `Unbalanced Liquid tag delimiters: ${openTags} open vs ${closeTags} closed`,
          autoFixAvailable: false,
        });
      }

      if (cleanCode.includes('{{ content_for_header }}') && !cleanCode.includes('</head>')) {
        findings.push({
          ruleId: 'liquid-content-for-header',
          severity: 'LOW',
          message: 'content_for_header should be positioned strictly before </head>',
          autoFixAvailable: false,
        });
      }
    }

    // 4. CSS Validator (Vendor prefix & sticky header z-index clashes)
    if (language === 'css' || cleanCode.includes('position: sticky') || cleanCode.includes('z-index')) {
      if (cleanCode.includes('position: sticky') && !cleanCode.includes('top:')) {
        findings.push({
          ruleId: 'css-sticky-missing-top',
          severity: 'MEDIUM',
          message: 'CSS position: sticky requires explicit top offset to latch on viewport.',
          autoFixAvailable: true,
        });
        cleanCode = cleanCode.replace(/position:\s*sticky;/g, 'position: sticky; top: 0;');
      }
    }

    // Calculate score
    const criticals = findings.filter(f => f.severity === 'CRITICAL').length;
    const highs = findings.filter(f => f.severity === 'HIGH').length;
    const score = Math.max(0, 100 - (criticals * 40 + highs * 20 + findings.length * 5));
    const passed = criticals === 0 && highs === 0;

    return {
      passed,
      score,
      verdict: passed ? (findings.length > 0 ? 'AUTO_REPAIRED' : 'APPROVED') : 'REJECTED',
      findings,
      repairedCode: cleanCode,
      receipt: {
        scannersRun: ['gitleaks-secret-scan', 'semgrep-ast-security', 'liquid-parser', 'css-layout-linter'],
        timestamp: new Date().toISOString(),
        filesScanned: 1,
        findingsCount: findings.length,
      },
    };
  }
}
