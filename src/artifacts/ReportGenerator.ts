/**
 * J.A.R.V.I.S. MARK-V Final Task Report Generator
 * Generates the formal, structured post-mission report for Master Sri.
 */

export interface ExecutionRealityAudit {
  requested: string[];
  planned: string[];
  attempted: string[];
  executed: string[];
  verified: string[];
  failed: string[];
  recovered: string[];
  notExecuted: string[];
}

export interface FinalTaskReportData {
  objective: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  realityAudit?: ExecutionRealityAudit;
  whatJarvisDid: string[];
  agentsUsed: string[];
  toolsUsed: string[];
  filesChanged: string[];
  commandsExecuted: string[];
  result: string;
  verification: string;
  tests: { total: number; passed: number; failed: number };
  errors: string[];
  recoveryActions: string[];
  artifacts: Array<{ path: string; description: string }>;
  timeTakenMs: number;
  estimatedCostUsd: number;
  remainingRisks: string[];
  nextRecommendedAction: string;
}

export class ReportGenerator {
  public static generateMarkdownReport(data: FinalTaskReportData): string {
    const durationFormatted = `${(data.timeTakenMs / 1000).toFixed(2)}s`;
    const costFormatted = `$${data.estimatedCostUsd.toFixed(4)}`;

    return `# ═══════════════════════════════════════════════════════════
# J.A.R.V.I.S. EXECUTIVE MISSION REPORT
# ═══════════════════════════════════════════════════════════

### 1. OBJECTIVE
${data.objective}

### 2. STATUS
**${data.status}**

${
  data.realityAudit
    ? `### 2.1 REALITY EXECUTION BREAKDOWN
- **Requested**: ${data.realityAudit.requested.join('; ') || 'None'}
- **Planned**: ${data.realityAudit.planned.join('; ') || 'None'}
- **Attempted**: ${data.realityAudit.attempted.join('; ') || 'None'}
- **Executed**: ${data.realityAudit.executed.join('; ') || 'None'}
- **Verified**: ${data.realityAudit.verified.join('; ') || 'None'}
- **Failed**: ${data.realityAudit.failed.join('; ') || 'None'}
- **Recovered**: ${data.realityAudit.recovered.join('; ') || 'None'}
- **Not Executed**: ${data.realityAudit.notExecuted.join('; ') || 'None'}
`
    : ''
}
### 3. WHAT J.A.R.V.I.S. DID
${data.whatJarvisDid.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

### 4. AGENTS USED
${data.agentsUsed.map((agent) => `- **${agent}**`).join('\n') || '- None'}

### 5. TOOLS USED
${data.toolsUsed.map((tool) => `- \`${tool}\``).join('\n') || '- None'}

### 6. FILES CHANGED
${data.filesChanged.map((file) => `- \`${file}\``).join('\n') || '- None'}

### 7. COMMANDS EXECUTED
${data.commandsExecuted.map((cmd) => `- \`${cmd}\``).join('\n') || '- None'}

### 8. RESULT
${data.result}

### 9. VERIFICATION & TESTS
- **Verification Summary**: ${data.verification}
- **Tests Executed**: ${data.tests.total} (Passed: ${data.tests.passed}, Failed: ${data.tests.failed})

### 10. ERRORS & RECOVERY ACTIONS
- **Errors Encountered**: ${data.errors.length > 0 ? data.errors.join('; ') : 'None'}
- **Recovery Actions**: ${data.recoveryActions.length > 0 ? data.recoveryActions.join('; ') : 'None'}

### 11. ARTIFACTS
${data.artifacts.map((art) => `- [${art.description}](${art.path})`).join('\n') || '- None'}

### 12. PERFORMANCE & ECONOMICS
- **Time Taken**: ${durationFormatted}
- **Estimated Cost**: ${costFormatted}

### 13. REMAINING RISKS & NEXT ACTION
- **Remaining Risks**:
${data.remainingRisks.map((risk) => `  * ${risk}`).join('\n') || '  * None identified'}
- **Next Recommended Action**: ${data.nextRecommendedAction}
`;
  }
}
