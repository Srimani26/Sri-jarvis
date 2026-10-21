/**
 * clone-universal-arsenal.mjs
 * Shallow clones (--depth 1) the 17 shared open-source power repositories
 * into external/arsenal so they are indexed, cataloged, and integrated into J.A.R.V.I.S.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const ARSENAL_DIR = resolve(process.cwd(), 'external', 'arsenal');
if (!existsSync(ARSENAL_DIR)) {
  mkdirSync(ARSENAL_DIR, { recursive: true });
}

const REPOSITORIES = [
  { name: 'rea-playbooks', url: 'https://github.com/NabilRFG12/Reverse-Engineer-anything.git', role: 'REA Reverse Engineering Playbooks' },
  { name: 'rea-prompts', url: 'https://github.com/JoasASantos/REA-Prompts.git', role: 'REA Autonomous Reverse Engineering Prompts' },
  { name: 'ai-job-search', url: 'https://github.com/MadsLorentzen/ai-job-search.git', role: 'Autonomous Multi-Platform Job & Bounty Scraper' },
  { name: 'security-audit-skill', url: 'https://github.com/cloudflare/security-audit-skill.git', role: 'Cloudflare Security & Vulnerability Audit Skill' },
  { name: 'orca-qa', url: 'https://github.com/stablyai/orca.git', role: 'E2E Automated Browser & UI Testing Engine' },
  { name: 'ponytail-design', url: 'https://github.com/DietrichGebert/ponytail.git', role: 'Tailwind Design System & Component Library' },
  { name: 'ruflo-swarm', url: 'https://github.com/ruvnet/ruflo.git', role: 'Multi-Agent Swarm Orchestrator & Event Bus' },
  { name: 'graphify-code', url: 'https://github.com/Graphify-Labs/graphify.git', role: 'Codebase Dependency & Architecture Graph Generator' },
  { name: 'opencode-core', url: 'https://github.com/anomalyco/opencode.git', role: 'Multi-File Autonomous Software Development Core' },
  { name: 'agency-agents', url: 'https://github.com/msitarzewski/agency-agents.git', role: 'Full-Service Digital Agency Specialized Agent Roster' },
  { name: 'headroom-memory', url: 'https://github.com/headroomlabs-ai/headroom.git', role: 'AI Context Compression & Long-Term Memory Optimizer' },
  { name: 'knowledge-plugins', url: 'https://github.com/anthropics/knowledge-work-plugins.git', role: 'Enterprise Knowledge Work & Deep Analysis Plugins' },
  { name: 'agents-hub', url: 'https://github.com/wshobson/agents.git', role: 'Specialized Autonomous Agents & Tool Frameworks' },
  { name: 'agentic-skills', url: 'https://github.com/sickn33/agentic-awesome-skills.git', role: 'Mega-Catalog of Autonomous Agent Engineering Skills' },
  { name: 'kronos-prediction', url: 'https://github.com/shiyu-coder/Kronos.git', role: 'Financial & Time-Series Predictive Intelligence' },
];

console.log(`🚀 Starting Universal Arsenal Ingestion into: ${ARSENAL_DIR}\n`);

for (const repo of REPOSITORIES) {
  const targetPath = join(ARSENAL_DIR, repo.name);
  if (existsSync(targetPath)) {
    console.log(`✔ [Exists] ${repo.name} (${repo.role})`);
    continue;
  }

  console.log(`📥 Cloning ${repo.name} (${repo.role})...`);
  try {
    execSync(`git clone --depth 1 ${repo.url} "${targetPath}"`, {
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log(`   ↳ Successfully cloned ${repo.name}`);
  } catch (err) {
    console.error(`   ⚠️ Failed to clone ${repo.name}: ${err?.message || err}`);
  }
}

console.log(`\n🎉 Universal Arsenal Ingestion Complete!`);
