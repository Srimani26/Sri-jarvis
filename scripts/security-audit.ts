#!/usr/bin/env tsx
/**
 * J.A.R.V.I.S. MARK-V Automated Security & Credential Auditor
 * Scans both current working tree and Git commit history for hardcoded,
 * plaintext, or encoded credentials.
 *
 * CRITICAL RULE: NEVER logs or prints actual secret values to stdout/stderr.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface SecretDetectionRule {
  provider: string;
  type: string;
  pattern: RegExp;
}

const SECRET_RULES: SecretDetectionRule[] = [
  { provider: 'Google Gemini', type: 'API Key', pattern: /AIza[0-9A-Za-z\-_]{35}/ },
  { provider: 'Groq', type: 'API Key', pattern: /gsk_[a-zA-Z0-9]{20,}/ },
  { provider: 'OpenRouter', type: 'API Key', pattern: /sk-or-v1-[a-zA-Z0-9]{32,}/ },
  { provider: 'OpenAI', type: 'API Key', pattern: /sk-(?:proj-)?[a-zA-Z0-9]{32,}/ },
  { provider: 'Anthropic', type: 'API Key', pattern: /sk-ant-[a-zA-Z0-9_\-]{20,}/ },
  { provider: 'Mistral AI', type: 'API Key', pattern: /mstrl_[a-zA-Z0-9]{20,}/ },
  { provider: 'Hugging Face', type: 'User Access Token', pattern: /hf_[a-zA-Z0-9]{20,}/ },
  { provider: 'GitHub', type: 'Personal Access Token', pattern: /ghp_[a-zA-Z0-9]{30,}/ },
];

interface Finding {
  provider: string;
  location: string;
  commit: string;
  secretType: string;
  status: string;
}

const findings: Finding[] = [];

// 1. Scan Working Tree
function scanWorkingTree(): void {
  try {
    const rawFiles = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' });
    const files = rawFiles.split('\n').filter(Boolean);

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const stat = fs.statSync(file);
      if (!stat.isFile() || file.endsWith('.png') || file.endsWith('.ico') || file.endsWith('.db')) continue;

      const content = fs.readFileSync(file, 'utf8');

      // Check standard rules
      for (const rule of SECRET_RULES) {
        if (rule.pattern.test(content)) {
          findings.push({
            provider: rule.provider,
            location: file,
            commit: 'WORKING_TREE',
            secretType: rule.type,
            status: 'COMPROMISED_ACTIVE_FILE',
          });
        }
      }

      // Check base64 encoded secrets
      const base64Blocks = content.match(/['"][A-Za-z0-9+/=]{40,}['"]/g) || [];
      for (const block of base64Blocks) {
        const clean = block.slice(1, -1);
        try {
          const decoded = Buffer.from(clean, 'base64').toString('utf8');
          for (const rule of SECRET_RULES) {
            if (rule.pattern.test(decoded)) {
              findings.push({
                provider: rule.provider,
                location: file,
                commit: 'WORKING_TREE',
                secretType: `BASE64_OBFUSCATED_${rule.type}`,
                status: 'COMPROMISED_BASE64_STRING',
              });
            }
          }
        } catch { /* ignored */ }
      }
    }
  } catch (err: any) {
    console.error('Working tree scan error:', err.message);
  }
}

// 2. Scan Git Commit History
function scanGitHistory(): void {
  try {
    const commitsRaw = execSync('git rev-list --all --max-count=100', { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const commits = commitsRaw.split('\n').filter(Boolean);

    for (const commit of commits) {
      // Only inspect if commit touched code files
      const lines = execSync(`git show ${commit}`, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }).split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('+') && !line.startsWith('+++')) {
          for (const rule of SECRET_RULES) {
            if (rule.pattern.test(line)) {
              findings.push({
                provider: rule.provider,
                location: `git:${commit.slice(0, 7)}`,
                commit: commit.slice(0, 7),
                secretType: rule.type,
                status: 'HISTORICAL_COMMIT_LEAK',
              });
            }
          }

          // Check base64
          const base64Blocks = line.match(/['"][A-Za-z0-9+/=]{40,}['"]/g) || [];
          for (const block of base64Blocks) {
            const clean = block.slice(1, -1);
            try {
              const decoded = Buffer.from(clean, 'base64').toString('utf8');
              for (const rule of SECRET_RULES) {
                if (rule.pattern.test(decoded)) {
                  findings.push({
                    provider: rule.provider,
                    location: `git:${commit.slice(0, 7)}`,
                    commit: commit.slice(0, 7),
                    secretType: `BASE64_OBFUSCATED_${rule.type}`,
                    status: 'HISTORICAL_COMMIT_LEAK',
                  });
                }
              }
            } catch { /* ignored */ }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Git history scan error:', err.message);
  }
}

function runAudit(): void {
  const args = process.argv.slice(2);
  const workingTreeOnly = args.includes('--working-tree-only');

  console.log(`🔒 [J.A.R.V.I.S. Security Auditor] Starting ${workingTreeOnly ? 'working tree' : 'full working tree & git'} scan...\n`);

  scanWorkingTree();
  if (!workingTreeOnly) {
    scanGitHistory();
  }

  if (findings.length === 0) {
    console.log(`✅ AUDIT PASSED: Zero credentials or obfuscated tokens detected across ${workingTreeOnly ? 'working tree' : 'working tree and scanned history'}.`);
    process.exit(0);
  }

  console.log('⚠️  SECURITY VULNERABILITIES DETECTED:\n');
  console.log(
    'PROVIDER'.padEnd(16) +
    'LOCATION'.padEnd(35) +
    'COMMIT'.padEnd(14) +
    'SECRET TYPE'.padEnd(30) +
    'STATUS'
  );
  console.log('-'.repeat(110));

  // Deduplicate findings by commit + provider + location
  const seen = new Set<string>();
  for (const f of findings) {
    const key = `${f.provider}:${f.location}:${f.commit}:${f.secretType}`;
    if (seen.has(key)) continue;
    seen.add(key);

    console.log(
      f.provider.padEnd(16) +
      f.location.padEnd(35) +
      f.commit.padEnd(14) +
      f.secretType.padEnd(30) +
      f.status
    );
  }

  console.log(`\n❌ Total Findings: ${seen.size}`);
  console.log('Security violation: Hardcoded/historical credentials must be remediated.');
  process.exit(1);
}

runAudit();
