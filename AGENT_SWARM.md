# J.A.R.V.I.S. Multi-Agent Workforce & Swarm Specification
**Document**: Specialist Workforce Registry, Direct Addressing & Delegation  
**System**: J.A.R.V.I.S. MARK-V Swarm Architecture  
**Owner**: Master Sri  
**Status**: Production Verified  

---

## 1. Multi-Agent Organization

The J.A.R.V.I.S. workforce consists of **20 canonical specialist agents**, with 5 directive executive specialists exposed as primary operational leads for Master Sri.

```
                    ┌───────────────────────────┐
                    │       J.A.R.V.I.S.        │
                    │   Supreme Commander / MoA │
                    └─────────────┬─────────────┘
                                  │
         ┌──────────────┬─────────┴──────┬──────────────┬──────────────┐
         ▼              ▼                ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐     ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  AEGIS   │   │  VORTEX  │     │  MIDAS   │   │ CEREBRO  │   │ STARK OS │
   │ Software │   │Automate  │     │ Revenue  │   │  Intel   │   │  Device  │
   │ & Defense│   │ & Scrape │     │& Strategy│   │& Research│   │& Ops Core│
   └──────────┘   └──────────┘     └──────────┘   └──────────┘   └──────────┘
```

---

## 2. Executive Specialist Profiles

### 1. AEGIS (`software_engineer` / `F.R.I.D.A.Y.`)
- **Designation**: Full-Stack Software Architect & Cyber Defense Specialist
- **Domain**: Next.js 15, React 19, TypeScript, Compilers, Unit Testing, Perimeter Defense
- **Primary Tools**: `filesystem_read`, `filesystem_write`, `code_diff_apply`, `test_runner`, `build_fullstack_app`, `execute_code`, `terminal_exec`
- **Permission Ceiling**: `PROJECT_WRITE`
- **Verification Rule**: TypeScript builds with 0 errors; all test suites pass.

### 2. VORTEX (`automation_agent` / `C.H.R.O.N.O.S.`)
- **Designation**: Heavy Enterprise Automation Specialist
- **Domain**: n8n workflows, webhook integrations, headless browser scraping, API pipelines
- **Primary Tools**: `generate_automation`, `scrape_web`, `webhook_trigger`, `http_request`, `data_transform`
- **Permission Ceiling**: `SAFE_LOCAL`
- **Verification Rule**: Workflow JSON parses cleanly; webhook nodes verified.

### 3. MIDAS (`business_agent` / `M.I.D.A.S.`)
- **Designation**: Revenue & Monetization Engine
- **Domain**: High-ticket client proposals, pricing formulas, market arbitrage, ROI models
- **Primary Tools**: `market_intel`, `web_search`, `report_generator`, `doc_reader`
- **Permission Ceiling**: `SAFE_LOCAL`
- **Verification Rule**: Mathematical formulas sound; actionable client deliverables.

### 4. CEREBRO (`research_agent` / `A.T.H.E.N.A.`)
- **Designation**: Deep Reconnaissance & Intelligence Officer
- **Domain**: Open-source repo analysis, competitor research, technical citations, paper indexing
- **Primary Tools**: `web_search`, `scrape_web`, `doc_reader`, `github_search`, `market_intel`
- **Permission Ceiling**: `SAFE_LOCAL`
- **Verification Rule**: Primary citations included; zero fabricated data.

### 5. STARK OS (`devops_engineer` / `A.T.L.A.S.`)
- **Designation**: Operations Concierge & Device Telemetry Core
- **Domain**: Hardware stats, process uptime, disk usage, container health, daily logistics
- **Primary Tools**: `system_health`, `terminal_exec`, `filesystem_read`, `network_ping`
- **Permission Ceiling**: `SAFE_LOCAL`
- **Verification Rule**: System telemetry collected; zero resource leaks.

---

## 3. Complete 20-Agent Canonical Registry

| ID | Codename | Name | Role | Max Policy | Key Tools |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `jarvis` | COMMANDER | J.A.R.V.I.S. | commander | PRIVILEGED | `*` (All tools) |
| `architect` | SYSTEM | D.A.E.D.A.L.U.S. | architect | SAFE_LOCAL | `schema_inspect`, `git_log` |
| `software_engineer` | ENGINEER | F.R.I.D.A.Y. / Aegis | software_engineer | PROJECT_WRITE | `build_fullstack_app`, `execute_code` |
| `frontend_engineer` | UI-UX | P.R.I.S.M. | frontend_engineer | PROJECT_WRITE | `code_diff_apply`, `vite_build` |
| `backend_engineer` | API | V.U.L.C.A.N. | backend_engineer | PROJECT_WRITE | `server_build`, `terminal_exec` |
| `database_engineer` | DATA | O.R.A.C.L.E. | database_engineer | PROJECT_WRITE | `prisma_migrate`, `sql_query_safe` |
| `devops_engineer` | INFRA | A.T.L.A.S. / Stark OS | devops_engineer | PRIVILEGED | `terminal_exec`, `network_ping` |
| `qa_engineer` | TEST | S.E.N.T.I.N.E.L. | qa_engineer | SAFE_LOCAL | `test_runner`, `benchmark_run` |
| `debugger` | TRIAGE | H.O.L.M.E.S. | debugger | SAFE_LOCAL | `log_inspect`, `error_trace` |
| `security_agent` | DEFENSE | C.E.R.B.E.R.U.S. | security_agent | READ_ONLY | `security_audit`, `secret_scanner` |
| `research_agent` | INTEL | A.T.H.E.N.A. / Cerebro | research_agent | SAFE_LOCAL | `web_search`, `scrape_web` |
| `browser_agent` | BROWSER | N.A.V.I.S. | browser_agent | SAFE_LOCAL | `browser_navigate`, `browser_click` |
| `automation_agent` | FLOW | C.H.R.O.N.O.S. / Vortex | automation_agent | SAFE_LOCAL | `generate_automation`, `webhook_trigger` |
| `data_agent` | STATS | T.H.O.T.H. | data_agent | SAFE_LOCAL | `data_aggregate`, `chart_generate` |
| `business_agent` | STRATEGY | M.I.D.A.S. | business_agent | SAFE_LOCAL | `market_intel`, `report_generator` |
| `documentation_agent`| DOCS | S.C.R.I.B.E. | documentation_agent | PROJECT_WRITE | `git_log`, `filesystem_write` |
| `memory_agent` | KNOWLEDGE| M.N.E.M.O.S. | memory_agent | SAFE_LOCAL | `memory_store`, `memory_search` |
| `monitor_agent` | WATCHER | A.R.G.U.S. | monitor_agent | SAFE_LOCAL | `health_check`, `system_stats` |
| `scheduler_agent` | CRON | K.A.I.R.O.S. | scheduler_agent | PROJECT_WRITE | `schedule_create`, `task_dispatch` |
| `evolution_agent` | EVOLVE | P.R.O.M.E.T.H.E.U.S. | evolution_agent | SANDBOX | `self_evolution`, `patch_propose` |

---

## 4. Addressing & Invocation Syntax

Directives can address agents either naturally through voice or text input:

- *"Aegis, build Standard Roof landing page"* $\longrightarrow$ routes to `software_engineer` (`Aegis`)
- *"Vortex, create an n8n webhook workflow"* $\longrightarrow$ routes to `automation_agent` (`Vortex`)
- *"Midas, draft a corporate commercial proposal"* $\longrightarrow$ routes to `business_agent` (`Midas`)
- *"Cerebro, research recent OpenHands agent developments"* $\longrightarrow$ routes to `research_agent` (`Cerebro`)
- *"Stark OS, check disk and memory diagnostics"* $\longrightarrow$ routes to `devops_engineer` (`Stark OS`)

### Verified Delegation Handshake
When J.A.R.V.I.S. delegates work:
1. `DELEGATION_CREATED` event emitted with parent task ID and target specialist.
2. `AGENT_ACCEPTED` event emitted only after specialist verifies capability clearance.
3. If an agent is unhealthy or missing credentials: J.A.R.V.I.S. explicitly announces:  
   *"Master Sri, [Agent] is currently unavailable. Connection failed after 3 attempts."*
