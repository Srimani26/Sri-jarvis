# J.A.R.V.I.S. Mark-V: 100% Autonomous Realization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the remaining 55% theoretical stubs, mocks, and façades across J.A.R.V.I.S. Mark-V into 100% factual, verifiable, autonomous production systems.

**Architecture:** Replace mock JSON and regex engines with real system integrations: Puppeteer-core for genuine Chrome browser automation, multi-source live RSS parsers for jobs, real two-pass Mixture-of-Agents LLM synthesis, genuine AST analysis for reverse engineering, automated filesystem project scaffolding for fullstack app building, and real test-driven verification loops.

**Tech Stack:** Node.js v24, TypeScript, Puppeteer-Core (connected to host Chrome/Edge), Prisma, Hono, Google Gemini API, ElevenLabs API, Web Audio API.

**Spec:** Remediation of Audit Report defects and elimination of simulation mocks identified in the forensic codebase audit.

## Global Constraints

- Zero hardcoded mock returns (`status: 'COMPILED'`, fake Reddit fallback templates, fake verification passes).
- All tools must execute real operations on disk, network, or process memory.
- Backward compatibility: keep existing route paths and API signatures so UI surfaces and Telegram bot continue working smoothly.
- Real verification: agents must test and assert file outputs before emitting `VERIFICATION_PASSED`.

## Review Focus

1. **Browser launch crashes:** Ensure `puppeteer-core` handles missing display or locked Chrome gracefully without crashing the server.
2. **LLM rate limit failover in MoA:** Two-pass synthesis must gracefully fallback to single-pass if quota limits (429) occur during the second pass.
3. **Workspace file path security:** Workspace project creation must strictly prevent path traversal outside `E:\standardroofs-jarvis\workspace`.
4. **Feed ingestion reliability:** Live job scouting must combine RemoteOK RSS + WeWorkRemotely RSS so real jobs are returned even if Reddit blocks requests.
5. **AST parser errors:** Reverse engineering on non-TS/JS targets must return structured regex/byte analysis without throwing unhandled syntax errors.

---

### Task 1: Real Mixture-of-Agents (MoA) Multi-Pass Synthesis

**Files:**
- Modify: `E:\standardroofs-jarvis\custom-routes.ts:L108-L131`
- Test: `E:\standardroofs-jarvis\tests\moa-real-synthesis.test.ts`

**Interfaces:**
- Consumes: `callAI(systemPrompt, messages, preferredModelId)`
- Produces: `callMoAEngine(systemPrompt, messages)` -> executes Layer 1 candidate generation + Layer 2 Master Aggregator LLM call.

- [ ] **Step 1: Write the failing test**
Create `tests/moa-real-synthesis.test.ts` asserting that `callMoAEngine` calls the synthesis LLM and incorporates candidate improvements rather than returning the raw Layer 1 text untouched.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/moa-real-synthesis.test.ts`
Expected: FAIL (currently returns primaryResult.text verbatim).

- [ ] **Step 3: Implement real two-pass MoA synthesis**
Update `callMoAEngine` in `custom-routes.ts`:
1. Execute Layer 1 proposal with Chief Technical Proposer prompt.
2. Execute Layer 2 synthesis call using `callAI` with `synthesisPrompt` and the candidate proposal.
3. If Layer 2 fails or rate-limits, safely fall back to Layer 1.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/moa-real-synthesis.test.ts`
Expected: PASS.

---

### Task 2: Real Chrome Browser Automation via Puppeteer-Core

**Files:**
- Modify: `E:\standardroofs-jarvis\src\browser\BrowserEngine.ts`
- Modify: `E:\standardroofs-jarvis\workers\jarvis-worker\src\executor.ts`
- Test: `E:\standardroofs-jarvis\tests\browser-real-execution.test.ts`

**Interfaces:**
- Consumes: `C:\Program Files\Google\Chrome\Application\chrome.exe` or `msedge.exe`
- Produces: Real headless browser navigation, DOM node evaluation, screenshot capture, and text extraction.

- [ ] **Step 1: Write the failing test**
Create `tests/browser-real-execution.test.ts` asserting that navigating to `https://example.com` or local HTML returns a real page title and DOM elements extracted by headless Chrome.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/browser-real-execution.test.ts`
Expected: FAIL (currently uses regex on raw string).

- [ ] **Step 3: Implement real Puppeteer-Core integration**
In `BrowserEngine.ts` and `workers/jarvis-worker/src/executor.ts`:
1. Detect system Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` or Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
2. Launch `puppeteer-core` with `--no-sandbox --disable-gpu --headless=new`.
3. Extract real DOM elements, evaluate scripts, take screenshots to `artifacts/screenshots/`.
4. Close browser pages cleanly after execution.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/browser-real-execution.test.ts`
Expected: PASS.

---

### Task 3: Replace Mock Arsenal Tools in ToolRegistry with Real Autonomous Actions

**Files:**
- Modify: `E:\standardroofs-jarvis\src\tools\ToolRegistry.ts`
- Test: `E:\standardroofs-jarvis\tests\tools-real-execution.test.ts`

**Interfaces:**
- `build_fullstack_app`: Generates real HTML/JS/CSS files in `workspace/projects/<name>`, writes them to disk, verifies syntax.
- `market_intel`: Fetches live web data via search / RSS, analyzes real signals via LLM.
- `rea_reverse_engineer`: Uses TypeScript AST compiler API to parse target source files, extract classes, methods, parameters, and types.
- `self_evolution`: Inspects local codebase, runs lint/test audit, and produces real git diff proposals.

- [ ] **Step 1: Write the failing test**
Create `tests/tools-real-execution.test.ts` asserting that `build_fullstack_app` produces real files on disk, and `rea_reverse_engineer` produces actual AST nodes from a sample TypeScript file.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/tools-real-execution.test.ts`
Expected: FAIL (currently returns hardcoded mock strings).

- [ ] **Step 3: Implement real tool execution logic**
Replace hardcoded JSON blocks in `ToolRegistry.ts`:
1. `build_fullstack_app`: Use `WorkspaceManager.initProject` + LLM generation + `WorkspaceManager.writeFile` for `index.html`, `app.js`, `style.css`.
2. `rea_reverse_engineer`: Use `ts.createSourceFile` to traverse AST and return actual exported interfaces, classes, and function signatures.
3. `market_intel`: Search DuckDuckGo / web search and summarize verified pricing.
4. `self_evolution`: Read real git diffs and test coverage to determine capability gaps.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/tools-real-execution.test.ts`
Expected: PASS.

---

### Task 4: Real Multi-Source Live Job Scraping (Eliminate Fake Reddit Fallback)

**Files:**
- Modify: `E:\standardroofs-jarvis\src\tools\JobScoutTool.ts`
- Test: `E:\standardroofs-jarvis\tests\jobscout-real-feeds.test.ts`

**Interfaces:**
- Ingests: Public RSS feeds from RemoteOK (`https://remoteok.com/remote-dev-jobs.rss`), WeWorkRemotely, and Reddit public JSON.
- Produces: List of verified live freelance & contract postings with real URLs and dates. Zero fabricated posts.

- [ ] **Step 1: Write the failing test**
Create `tests/jobscout-real-feeds.test.ts` asserting all returned jobs have valid external URLs and non-mock descriptions.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/jobscout-real-feeds.test.ts`
Expected: FAIL (when Reddit blocks, it injects 3 hardcoded fake posts).

- [ ] **Step 3: Implement resilient multi-source RSS scraper**
In `JobScoutTool.ts`:
1. Add XML/RSS parser for RemoteOK and WeWorkRemotely developer feeds (reliable, keyless, never blocked).
2. Attempt Reddit JSON as primary; if rate-limited, failover to RemoteOK/WWR feeds instead of injecting fake posts.
3. Delete the hardcoded fake post template array entirely.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/jobscout-real-feeds.test.ts`
Expected: PASS.

---

### Task 5: Register Missing API Endpoints (`/api/tools/ecommerce/recon` & `/api/tools/flights`)

**Files:**
- Modify: `E:\standardroofs-jarvis\custom-routes.ts`
- Test: `E:\standardroofs-jarvis\tests\endpoints-recon.test.ts`

**Interfaces:**
- `GET /api/tools/ecommerce/recon?q=<query>` -> Returns real comparison between Amazon & Flipkart deals.
- `GET /api/tools/flights?from=<from>&to=<to>` -> Returns real route options and airline pricing.

- [ ] **Step 1: Write the failing test**
Create `tests/endpoints-recon.test.ts` asserting `GET /api/tools/ecommerce/recon` and `GET /api/tools/flights` return HTTP 200 with structured data.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/endpoints-recon.test.ts`
Expected: FAIL with 404 Not Found.

- [ ] **Step 3: Implement endpoints in custom-routes.ts**
1. Wire `/tools/ecommerce/recon` to `ECommerceReconEngine.analyzeDeals(query)` using web scraping / DuckDuckGo search.
2. Wire `/tools/flights` to calculate real flight durations, major carriers, and live booking deep-links.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/endpoints-recon.test.ts`
Expected: PASS.

---

### Task 6: Real Specialist Agent Verification Loop

**Files:**
- Modify: `E:\standardroofs-jarvis\src\agents\AgentRuntime.ts`
- Test: `E:\standardroofs-jarvis\tests\agent-verification.test.ts`

**Interfaces:**
- Takes: `checklist: string[]`, `taskId: string`, `outputResult: any`
- Produces: True deterministic validation (verifying syntax, file existence, and test execution) before emitting `VERIFICATION_PASSED`.

- [ ] **Step 1: Write the failing test**
Create `tests/agent-verification.test.ts` asserting that an agent outputting invalid code fails verification.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx tests/agent-verification.test.ts`
Expected: FAIL (currently auto-emits VERIFICATION_PASSED unconditionally).

- [ ] **Step 3: Implement factual verification checks**
In `AgentRuntime.ts`:
1. Check that any files created or modified actually exist on disk.
2. If code was modified, run AST syntax validation or test command.
3. Only emit `VERIFICATION_PASSED` if all checks succeed; emit `VERIFICATION_FAILED` with repair recommendations if any check fails.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx tests/agent-verification.test.ts`
Expected: PASS.
