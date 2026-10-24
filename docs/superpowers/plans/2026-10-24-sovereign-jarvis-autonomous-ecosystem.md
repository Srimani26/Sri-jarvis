# Sovereign J.A.R.V.I.S. Autonomous Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real, end-to-end autonomous J.A.R.V.I.S. smart personal assistant with dynamic voice greeting, 3-second speech pause detection, hybrid ElevenLabs voice, zero-canned resilient AI brain, 10 specialist agents with 5-stage task pipelines, Midas money engine, Hermes PDF/DOC generator, and a high-end cybernetic UI.

**Architecture:** A unified full-stack architecture combining a resilient Node.js/Hono API layer with multi-provider LLM routing (verified active Gemini 3.1/3.5 Flash-Lite + failovers), a browser-native voice OS with silence detection and voice routing, and a React 19 glassmorphism interface hosting 7 dedicated tactical surfaces.

**Tech Stack:** TypeScript, React 19, Tailwind CSS / Vanilla CSS design tokens, Hono / Node.js, Google Gemini API, ElevenLabs TTS, Deepgram STT, Web Speech API, PDFKit / jsPDF.

**Spec:** [`docs/superpowers/specs/2026-10-24-sovereign-jarvis-autonomous-ecosystem-design.md`](file:///E:/standardroofs-jarvis/docs/superpowers/specs/2026-10-24-sovereign-jarvis-autonomous-ecosystem-design.md)

---

## Global Constraints
- Online Store 2.0 theme conventions and Dawn workspace compatibility (`c:\Users\hp\invi-theme`) must be preserved.
- Zero canned fallback strings or unhandled exceptions when calling AI.
- Working Gemini models must be dynamically chosen from verified endpoints (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`).
- Voice silence detection must be 3,000ms before finalizing input.
- All 10 specialist agents must have distinct domain boundaries, system prompts, and toolsets.
- All generated documents must be written to `artifacts/storage/`.

## Review Focus
1. Gemini Rate Limiting / 429: Ensure fallback chain cleanly routes from `gemini-3.1-flash-lite` to `gemini-3.5-flash-lite` and OpenRouter without crashing.
2. Web Speech API browser permission: Ensure graceful fallback when microphone access is pending or unsupported.
3. Silence accumulator timing: Ensure speech input resets timer on interim results and only fires after 3s of actual silence.
4. Voice command collision: Ensure navigation phrases ("open task page") don't collide with conversational messages.
5. High token outputs (4000+ lines): Ensure stream/response buffers handle large payloads without truncating.

---

### Task 1: Fix AI Brain & Chat Resilience (Zero Canned Responses, No Exceptions)

**Files:**
- Modify: `custom-routes.ts:1115-1150` (Gemini model list)
- Modify: `custom-routes.ts:1430-1510` (Provider failover & error handling)
- Modify: `custom-routes.ts:1780-1840` (`/api/ai/chat` handler)
- Test: `scripts/test-ai-brain-resilience.mjs`

**Interfaces:**
- Consumes: `.env` (`GEMINI_API_KEY`)
- Produces: `callAI(systemPrompt: string, messages: Message[], preferredModel?: string): Promise<{ text: string; source: string }>`

- [ ] **Step 1: Write test script for AI Brain resilience**

```javascript
// scripts/test-ai-brain-resilience.mjs
import assert from 'node:assert';

const host = 'http://127.0.0.1:3000';
const testQuery = 'can you write pyton programing';

console.log('Testing /api/ai/chat resilience...');
const res = await fetch(`${host}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jarvis-master-key' },
  body: JSON.stringify({ message: testQuery })
});

const data = await res.json();
console.log('Reply source:', data.source);
console.log('Sample reply:', (data.reply || data.content || '').slice(0, 150));

assert.ok(res.ok, `HTTP status should be 200, got ${res.status}`);
assert.ok(!data.error, `Response must not contain error: ${data.error}`);
assert.ok(data.reply || data.content, 'Response must have valid content');
assert.ok(!data.reply?.includes('Neural processor encountered an unhandled exception'), 'Must not be canned exception');
console.log('✔ Task 1 test passed: AI brain generated real response.');
```

- [ ] **Step 2: Update model pool in `custom-routes.ts` to active endpoints**
Update `validModels` in `callDirectGeminiPool`:
```typescript
const validModels = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];
```
Ensure all errors in `callDirectGeminiPool` are caught per-model and seamlessly rotate to next model.

- [ ] **Step 3: Remove brittle canned message blocks and wrap with general generative engine**
In `callAI`:
Remove hardcoded regexes that return static strings for greetings or code instructions.
Ensure `callAI` always forwards user messages to the multi-provider LLM chain with high token limits (`maxTokens: 8192`).

- [ ] **Step 4: Run test to verify resilience**
Run: `node scripts/test-ai-brain-resilience.mjs`
Expected: Output shows real generative content from Gemini with 200 OK.

- [ ] **Step 5: Commit changes**
```bash
git add custom-routes.ts scripts/test-ai-brain-resilience.mjs
git commit -m "fix(ai-brain): update gemini model chain to active 3.1/3.5 endpoints and eliminate canned exceptions"
```

---

### Task 2: Duplex Voice OS & Hands-Free Navigation Engine

**Files:**
- Modify: `src/voice/ConversationOS.ts`
- Modify: `src/voice/VoiceEngine.ts`
- Modify: `src/surfaces/AIChat.tsx`
- Modify: `src/components/ArcReactorHUD.tsx`
- Modify: `src/App.tsx`
- Test: `scripts/test-voice-pipeline.mjs`

**Interfaces:**
- Consumes: ElevenLabs API key, Web Speech API
- Produces: `speakDynamicGreeting()`, `startContinuousVoice(onFinalTranscript, onInterim)`, `dispatchVoiceNavigation(transcript: string)`

- [ ] **Step 1: Write test script for voice navigation parser**

```javascript
// scripts/test-voice-pipeline.mjs
import assert from 'node:assert';

function parseVoiceCommand(transcript) {
  const clean = transcript.toLowerCase().trim();
  if (/open\s+(the\s+)?task(\s+page|\s+pipeline)?/i.test(clean)) return { action: 'NAVIGATE', surface: 'tasks' };
  if (/open\s+(the\s+)?code(\s*base|\s*lab)?/i.test(clean)) return { action: 'NAVIGATE', surface: 'codelab' };
  if (/open\s+(the\s+)?money(\s+making|\s+hunter)?/i.test(clean)) return { action: 'NAVIGATE', surface: 'revenue' };
  if (/open\s+(the\s+)?self\s*healing/i.test(clean)) return { action: 'NAVIGATE', surface: 'defense' };
  if (/create\s+task\s+for\s+(.+)/i.test(clean)) {
    const match = clean.match(/create\s+task\s+for\s+(.+)/i);
    return { action: 'CREATE_TASK', title: match[1] };
  }
  return { action: 'CHAT', message: transcript };
}

assert.strictEqual(parseVoiceCommand('hey jarvis open the task page').surface, 'tasks');
assert.strictEqual(parseVoiceCommand('open code base').surface, 'codelab');
assert.strictEqual(parseVoiceCommand('create task for build landing page').title, 'build landing page');
console.log('✔ Voice command parser test passed.');
```

- [ ] **Step 2: Add dynamic startup greeting in `ConversationOS.ts` / `App.tsx`**
Implement dynamic greeting logic that examines the time of day and returns an executive greeting:
```typescript
export function generateDynamicGreeting(commanderName = 'Master Sri'): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greetings = [
    `Good ${timeOfDay}, ${commanderName}. All sovereign systems and ten agent cores are synchronized.`,
    `Welcome back, ${commanderName}. Arc Reactor is stable at peak capacity. Standing by for directives.`,
    `Systems primed, ${commanderName}. Tactical swarms are online. What shall we conquer today?`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
```

- [ ] **Step 3: Implement 3-second silence detector in `AIChat.tsx` & `VoiceEngine.ts`**
In continuous speech recognition handler:
- Maintain a `silenceTimerRef`.
- When `onresult` receives interim or final speech, clear existing `silenceTimerRef`.
- Accumulate the transcript in a buffer.
- Set a new timer for 3,000ms:
```typescript
if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
silenceTimerRef.current = setTimeout(() => {
  if (accumulatedTranscript.trim().length > 0) {
    handleVoiceDirective(accumulatedTranscript.trim());
    accumulatedTranscript = '';
  }
}, 3000);
```

- [ ] **Step 4: Hook up Voice Navigation to Surface State in `App.tsx`**
When `handleVoiceDirective` detects an action like `open task page`, it calls `setActiveSurface('tasks')` and confirms via voice: *"Opening Task Pipeline, sir."*

- [ ] **Step 5: Run tests and commit**
```bash
node scripts/test-voice-pipeline.mjs
git add src/voice/ src/surfaces/AIChat.tsx src/App.tsx scripts/test-voice-pipeline.mjs
git commit -m "feat(voice): implement 3s silence detector, dynamic greeting, and voice navigation dispatcher"
```

---

### Task 3: The 10 Specialist Autonomous Agents & 5-Stage Task Pipeline

**Files:**
- Modify: `src/agents/AgentRegistry.ts`
- Modify: `src/agents/MissionOrchestrator.ts`
- Modify: `src/agents/MultiAgentSwarmEngine.ts`
- Modify: `src/surfaces/Projects.tsx` (Task Pipeline UI)
- Test: `scripts/test-10-agent-swarm.mjs`

**Interfaces:**
- Consumes: Task directive
- Produces: 5-Stage Task Execution (Plan ➔ Execute ➔ Test ➔ Verify ➔ Report)

- [ ] **Step 1: Write test script for 10-Agent Swarm execution**

```javascript
// scripts/test-10-agent-swarm.mjs
import assert from 'node:assert';

const host = 'http://127.0.0.1:3000';
console.log('Testing 5-stage task pipeline...');
const res = await fetch(`${host}/api/tasks/dispatch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jarvis-master-key' },
  body: JSON.stringify({
    title: 'Scaffold High-Performance Product Page',
    agentId: 'daedalus'
  })
});

const data = await res.json();
console.log('Dispatched task:', data);
assert.ok(data.taskId || data.task?.id, 'Task must be registered');
console.log('✔ Task pipeline dispatch verified.');
```

- [ ] **Step 2: Formalize 10 Specialist Agents in `AgentRegistry.ts`**
Define all 10 agents with dedicated IDs, avatars, system prompts, voices, and tools:
1. `jarvis` (Supreme Orchestrator)
2. `friday` (Chief Software Engineer)
3. `midas` (Revenue Specialist & Contract Hunter)
4. `cerebro` (Deep Research & Knowledge Intelligence)
5. `aegis` (Cyber Defense & AST Security)
6. `daedalus` (System Architecture & MoA)
7. `sentinel` (QA Marshal & Auto-Verification)
8. `vortex` (Workflow Automation & n8n)
9. `chronos` (Self-Healing & System Diagnostics)
10. `hermes` (Omni Document Generator)

- [ ] **Step 3: Implement 5-Stage Pipeline Telemetry in `MultiAgentSwarmEngine.ts`**
Record timestamped logs and status updates for each stage:
- Stage 1: Plan (Daedalus)
- Stage 2: Execute (Assigned Specialist)
- Stage 3: Test (Sentinel)
- Stage 4: Verify (Aegis)
- Stage 5: Report (Jarvis / Hermes)

- [ ] **Step 4: Update Task Pipeline UI in `Projects.tsx`**
Display live progress bar (0-100%), stage indicators, current operations, and log telemetry.

- [ ] **Step 5: Run tests and commit**
```bash
node scripts/test-10-agent-swarm.mjs
git add src/agents/ src/surfaces/Projects.tsx scripts/test-10-agent-swarm.mjs
git commit -m "feat(agents): configure 10 specialist agents with 5-stage task pipeline telemetry"
```

---

### Task 4: Midas Revenue Engine & Hermes Document Generator

**Files:**
- Modify: `src/agents/RevenueHunterEngine.ts`
- Modify: `src/surfaces/RevenueHunter.tsx`
- Create: `src/services/HermesDocumentService.ts`
- Modify: `custom-routes.ts` (Document generation endpoints)
- Test: `scripts/test-midas-and-hermes.mjs`

**Interfaces:**
- Consumes: Contract feeds / prompt specifications
- Produces: Live opportunity listings, PDF and DOC files in `artifacts/storage/`

- [ ] **Step 1: Write test script for Midas and Hermes**

```javascript
// scripts/test-midas-and-hermes.mjs
import assert from 'node:assert';
import { existsSync } from 'node:fs';

const host = 'http://127.0.0.1:3000';
console.log('Testing Midas Revenue Scout...');
const scoutRes = await fetch(`${host}/api/revenue/scan`, {
  headers: { 'Authorization': 'Bearer jarvis-master-key' }
});
const scoutData = await scoutRes.json();
assert.ok(Array.isArray(scoutData.opportunities), 'Midas must return contract opportunities');

console.log('Testing Hermes Document Generator...');
const docRes = await fetch(`${host}/api/docs/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jarvis-master-key' },
  body: JSON.stringify({
    title: 'Autonomous System Report',
    format: 'pdf',
    content: '# Executive Report\nAll systems operational.'
  })
});
const docData = await docRes.json();
assert.ok(docData.filePath, 'Hermes must return a file path');
console.log('✔ Midas and Hermes verified.');
```

- [ ] **Step 2: Build Midas Revenue Engine in `RevenueHunterEngine.ts`**
- Scrape remote developer contracts (RemoteOK, Upwork public feeds).
- Calculate estimated project value, hourly rate, competition score, and win probability.
- Auto-generate high-conversion proposals for Master Sri.

- [ ] **Step 3: Build Hermes Document Service in `src/services/HermesDocumentService.ts`**
- Implement PDF generation using native PDF stream writing formatted text, headers, and tables.
- Implement DOC generation formatted with clean XML/HTML doc structure readable by Microsoft Word.
- Save output to `artifacts/storage/<filename>`.

- [ ] **Step 4: Add `/api/docs/generate` endpoint in `custom-routes.ts`**
Serve generated files with download headers and storage vault indexing.

- [ ] **Step 5: Run tests and commit**
```bash
node scripts/test-midas-and-hermes.mjs
git add src/agents/RevenueHunterEngine.ts src/services/HermesDocumentService.ts custom-routes.ts scripts/test-midas-and-hermes.mjs
git commit -m "feat(midas-hermes): implement live revenue hunter and hermes pdf/doc compiler"
```

---

### Task 5: Cybernetic UI/UX Overhaul & Full Ecosystem Surface Integration

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Modify: `src/components/ArcReactorHUD.tsx`
- Modify: `src/surfaces/CommandCenter.tsx`
- Modify: `src/surfaces/AIChat.tsx`

**Interfaces:**
- Consumes: Surface routing state, audio frequencies
- Produces: Cohesive Stark cybernetic design system with animated soundwave HUD

- [ ] **Step 1: Update design tokens in `src/index.css`**
Define Stark Obsidian, Arc Cyan, Midas Gold, and glassmorphism backdrop filters with smooth CSS transitions.

- [ ] **Step 2: Upgrade ArcReactorHUD with live voice wave canvas**
Render smooth sine-wave pulses reflecting speech input and audio output playback.

- [ ] **Step 3: Update Navigation Sidebar & Topbar in `App.tsx`**
Provide quick-action tabs for all 7 primary surfaces:
1. Command Center (HUD)
2. AI Chat Studio
3. Task Pipeline Hub
4. Midas Money Space
5. Self-Healing Chamber
6. 10 Specialist Agent Fleet
7. Code Lab / Workspaces

- [ ] **Step 4: Verify build integrity**
Run: `npm run build`
Expected: Zero build errors; clean bundle output.

- [ ] **Step 5: Commit changes**
```bash
git add src/index.css src/App.tsx src/components/ArcReactorHUD.tsx src/surfaces/
git commit -m "feat(ui): complete stark cybernetic theme overhaul and 7-surface navigation"
```
