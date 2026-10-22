/**
 * J.A.R.V.I.S. MARK-V Sovereign Universal Arsenal Catalog
 * Connects 17 open-source power frameworks into a programmatic, multi-agent tool matrix.
 * Provides live lookup, skill assimilation, playbooks, prompts, and autonomous agent capabilities.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ArsenalModule {
  id: string;
  name: string;
  category: 'REVERSE_ENGINEERING' | 'REVENUE_BOUNTY' | 'SECURITY' | 'E2E_TESTING' | 'DESIGN_SYSTEM' | 'SWARM_ORCHESTRATION' | 'CODE_ANALYSIS' | 'AUTONOMOUS_DEV' | 'AGENCY_PERSONAS' | 'MEMORY_CONTEXT' | 'ENTERPRISE_KNOWLEDGE' | 'FINANCIAL_INTELLIGENCE';
  path: string;
  description: string;
  capabilities: string[];
  assignedAgents: string[];
}

export class ArsenalCatalog {
  private static arsenalDir = path.resolve(process.cwd(), 'external', 'arsenal');
  private static reaDir = path.resolve(process.cwd(), 'external', 'rea');

  private static modules: ArsenalModule[] = [
    {
      id: 'rea-core',
      name: 'Reverse Engineer Anything (REA Core)',
      category: 'REVERSE_ENGINEERING',
      path: path.resolve(process.cwd(), 'external', 'rea'),
      description: 'Zero-knowledge binary, firmware, protocol, and AST reverse engineering engine.',
      capabilities: ['binary_decompilation', 'protocol_decoding', 'ast_reverse_mapping', 'decompiled_logic_recovery'],
      assignedAgents: ['aegis', 'daedalus', 'sentinel'],
    },
    {
      id: 'rea-playbooks',
      name: 'REA Reverse Engineering Playbooks',
      category: 'REVERSE_ENGINEERING',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'rea-playbooks'),
      description: 'Battle-tested step-by-step playbooks for taking apart web services, APIs, databases, and microservices.',
      capabilities: ['system_disassembly', 'api_extraction', 'contract_reverse_engineering'],
      assignedAgents: ['aegis', 'daedalus'],
    },
    {
      id: 'rea-prompts',
      name: 'REA Autonomous Prompts & Extraction Workflows',
      category: 'REVERSE_ENGINEERING',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'rea-prompts'),
      description: 'Zero-shot and few-shot decompilation prompts for extracting business logic and architecture blueprints.',
      capabilities: ['deep_prompt_extraction', 'schema_reconstruction'],
      assignedAgents: ['aegis', 'friday'],
    },
    {
      id: 'ai-job-search',
      name: 'Autonomous Bounty & Freelance Lead Hunter',
      category: 'REVENUE_BOUNTY',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'ai-job-search'),
      description: 'High-speed automated multi-platform job, gig, and bounty scraper (Upwork, Freelancer, RemoteOK, GitHub Bounties).',
      capabilities: ['multi_platform_scraping', 'bounty_detection', 'high_ticket_filtering'],
      assignedAgents: ['midas', 'vortex'],
    },
    {
      id: 'security-audit-skill',
      name: 'Cloudflare Security & Penetration Audit Skill',
      category: 'SECURITY',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'security-audit-skill'),
      description: 'Enterprise security auditing, secret leakage scans, CORS misconfigurations, and zero-day patch generator.',
      capabilities: ['vulnerability_audit', 'zero_day_patching', 'secrets_detection'],
      assignedAgents: ['sentinel', 'aegis'],
    },
    {
      id: 'orca-qa',
      name: 'Orca E2E Autonomous QA & UI Verification',
      category: 'E2E_TESTING',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'orca-qa'),
      description: 'Automated browser verification, end-to-end regression testing, and visual artifact validation.',
      capabilities: ['e2e_browser_testing', 'visual_regression', 'dom_assertion'],
      assignedAgents: ['sentinel', 'friday'],
    },
    {
      id: 'ponytail-design',
      name: 'Ponytail Tailwind Design System & UI Engine',
      category: 'DESIGN_SYSTEM',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'ponytail-design'),
      description: 'State-of-the-art Tailwind design primitives, glassmorphic UI components, and premium responsive tokens.',
      capabilities: ['tailwind_tokens', 'component_scaffolding', 'dark_mode_palettes'],
      assignedAgents: ['friday', 'daedalus'],
    },
    {
      id: 'ruflo-swarm',
      name: 'Ruflo Multi-Agent Swarm Orchestrator',
      category: 'SWARM_ORCHESTRATION',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'ruflo-swarm'),
      description: 'Distributed event bus and agent consensus coordinator for high-concurrency multi-agent tasks.',
      capabilities: ['swarm_consensus', 'event_bus_dispatch', 'agent_coordination'],
      assignedAgents: ['jarvis', 'daedalus'],
    },
    {
      id: 'graphify-code',
      name: 'Graphify Codebase Dependency & Architecture Graph',
      category: 'CODE_ANALYSIS',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'graphify-code'),
      description: 'Constructs holistic dependency graphs across multi-repo codebases for instant architectural comprehension.',
      capabilities: ['dependency_graphing', 'dead_code_elimination', 'architecture_mapping'],
      assignedAgents: ['daedalus', 'aegis'],
    },
    {
      id: 'opencode-core',
      name: 'OpenCode Autonomous Software Development Core',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'opencode-core'),
      description: 'Multi-file autonomous coding, surgical diff application, and AST self-healing test loop.',
      capabilities: ['multi_file_patching', 'surgical_ast_edits', 'test_driven_healing'],
      assignedAgents: ['friday', 'aegis'],
    },
    {
      id: 'agency-agents',
      name: 'Full-Service Digital Agency Specialized Agent Roster',
      category: 'AGENCY_PERSONAS',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'agency-agents'),
      description: '20+ specialized agency roles: Growth Hacker, Copywriter, SEO Master, Lead Architect, Sales Closer.',
      capabilities: ['persona_specialization', 'proposal_generation', 'sales_closing_strategies'],
      assignedAgents: ['midas', 'vortex', 'cerebro'],
    },
    {
      id: 'headroom-memory',
      name: 'Headroom AI Context Compression & Long-Term Memory',
      category: 'MEMORY_CONTEXT',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'headroom-memory'),
      description: 'Context-window optimization, hierarchical summarization, and infinite conversational retention.',
      capabilities: ['context_compression', 'long_term_retention', 'semantic_distillation'],
      assignedAgents: ['jarvis', 'cerebro'],
    },
    {
      id: 'knowledge-plugins',
      name: 'Enterprise Knowledge Work & Deep Analysis Plugins',
      category: 'ENTERPRISE_KNOWLEDGE',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'knowledge-plugins'),
      description: 'Institutional-grade synthesis tools for consulting, market analysis, and multi-document intelligence.',
      capabilities: ['deep_research_synthesis', 'market_due_diligence', 'executive_briefings'],
      assignedAgents: ['cerebro', 'midas'],
    },
    {
      id: 'agents-hub',
      name: 'Agents Hub Specialized Tool & MCP Frameworks',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'agents-hub'),
      description: 'Modular MCP tools for terminal execution, cloud infrastructure, browser interaction, and database queries.',
      capabilities: ['mcp_connectors', 'tool_schemas', 'sandboxed_execution'],
      assignedAgents: ['jarvis', 'friday', 'vortex'],
    },
    {
      id: 'agentic-skills',
      name: 'Mega-Catalog of Autonomous Engineering Skills',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'agentic-skills'),
      description: 'Universal catalog of actionable agent workflows, playbooks, and coding standards.',
      capabilities: ['skill_resolution', 'dynamic_action_trees', 'execution_recipes'],
      assignedAgents: ['jarvis', 'friday', 'daedalus', 'aegis'],
    },
    {
      id: 'kronos-prediction',
      name: 'Kronos Financial & Time-Series Predictive Intelligence',
      category: 'FINANCIAL_INTELLIGENCE',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'kronos-prediction'),
      description: 'Quantitative forecasting, token price momentum modeling, and macroeconomic trend forecasting.',
      capabilities: ['quantitative_modeling', 'time_series_forecasting', 'market_signal_analysis'],
      assignedAgents: ['midas', 'cerebro'],
    },
    {
      id: 'crawl4ai',
      name: 'Crawl4AI LLM Web Extractor',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'crawl4ai'),
      description: 'High-speed LLM markdown crawler with anti-bot evasion and semantic content extraction.',
      capabilities: ['web_scraping', 'markdown_extraction', 'bot_bypass'],
      assignedAgents: ['browser_use', 'cerebro'],
    },
    {
      id: 'system-prompts',
      name: 'World-Class AI System Prompts Oracle',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'system-prompts'),
      description: 'Exact system instructions of Cursor, Devin, v0, Windsurf, Claude Code, Lovable for state-of-the-art coding prompts.',
      capabilities: ['system_prompt_lookup', 'agent_directives', 'surgical_coding_rules'],
      assignedAgents: ['friday', 'jarvis', 'aegis'],
    },
    {
      id: 'cc-switch',
      name: 'CC-Switch Multi-Agent Protocol Bridge',
      category: 'AUTONOMOUS_DEV',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'cc-switch'),
      description: 'All-in-one desktop assistant bridge for Claude Code, Codex, and OpenCode terminal agents.',
      capabilities: ['agent_switching', 'ipc_bridge', 'protocol_translation'],
      assignedAgents: ['jarvis', 'friday'],
    },
    {
      id: 'public-apis',
      name: 'Public APIs 2,182+ Catalog',
      category: 'ENTERPRISE_KNOWLEDGE',
      path: path.resolve(process.cwd(), 'external', 'arsenal', 'public-apis'),
      description: 'Comprehensive collective directory of 2,182+ free public APIs across 52 categories.',
      capabilities: ['api_search', 'integration_discovery', 'service_catalog'],
      assignedAgents: ['cerebro', 'daedalus', 'vortex'],
    },
  ];

  public static getModules(): ArsenalModule[] {
    return this.modules;
  }

  public static getModuleById(id: string): ArsenalModule | undefined {
    return this.modules.find(m => m.id === id);
  }

  public static getModulesForAgent(agentId: string): ArsenalModule[] {
    const aid = agentId.toLowerCase();
    return this.modules.filter(m => m.assignedAgents.includes(aid));
  }

  /**
   * Search playbooks, prompts, or skills across the arsenal
   */
  public static async searchArsenalFiles(query: string, maxResults: number = 8): Promise<Array<{ moduleId: string; filename: string; relativePath: string; excerpt: string }>> {
    const results: Array<{ moduleId: string; filename: string; relativePath: string; excerpt: string }> = [];
    const lowerQuery = query.toLowerCase();

    for (const mod of this.modules) {
      if (!fs.existsSync(mod.path)) continue;

      try {
        const files = this.scanDirRecursively(mod.path, 3);
        for (const filePath of files) {
          const ext = path.extname(filePath).toLowerCase();
          if (!['.md', '.txt', '.json', '.ts', '.py', '.js'].includes(ext)) continue;

          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.toLowerCase().includes(lowerQuery)) {
              const rel = path.relative(mod.path, filePath);
              const idx = content.toLowerCase().indexOf(lowerQuery);
              const snippet = content.slice(Math.max(0, idx - 80), Math.min(content.length, idx + 200)).trim();

              results.push({
                moduleId: mod.id,
                filename: path.basename(filePath),
                relativePath: rel,
                excerpt: snippet,
              });

              if (results.length >= maxResults) return results;
            }
          } catch {}
        }
      } catch {}
    }

    return results;
  }

  private static scanDirRecursively(dir: string, maxDepth: number, currentDepth: number = 0): string[] {
    if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
    let files: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(this.scanDirRecursively(full, maxDepth, currentDepth + 1));
        } else {
          files.push(full);
        }
      }
    } catch {}
    return files;
  }

  /**
   * Universal Agent Prompt Injection: Injects all arsenal capabilities into prompts
   */
  public static getArsenalContextSummary(agentId?: string): string {
    const relevant = agentId ? this.getModulesForAgent(agentId) : this.modules;
    if (relevant.length === 0) return '';

    return `\n### 🛡️ INTEGRATED SOVEREIGN ARSENAL (${relevant.length} FRAMEWORKS ACTIVE):
${relevant.map(m => `- [${m.name}] (${m.category}): ${m.description} | Capabilities: ${m.capabilities.join(', ')}`).join('\n')}
All playbooks, prompts, skills, and tools from these ${relevant.length} frameworks are loaded in local memory and ready for immediate autonomous execution.\n`;
  }
}
