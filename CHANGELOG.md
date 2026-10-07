# Changelog — J.A.R.V.I.S. Production Remediation

All notable changes made during the critical production remediation are documented below.

## [5.0.0-PROD] — 2026-10-07

### 🚨 Critical Bug Fixes
- **Bug #1 & #2 (Voice Recognition & Feedback Loop)**:
  - Fixed WebSpeech transcription recursion bug where interim tokens recursively duplicated text inside `transcriptRef.current`.
  - Replaced persistent auto-listen loop with deterministic transition: on TTS speech end, the voice engine reverts strictly to `IDLE`.
  - Implemented hard microphone mute gate during synthetic speech synthesis.
  - Added acoustic echo cancellation (`echoCancellation: true`), noise suppression, and automatic gain control constraints to WebRTC input.
- **Bug #10 (Authentication & 60s Session Loss)**:
  - Implemented `POST /api/auth/refresh` endpoint and `GET /api/auth/diagnostics` in `custom-routes.ts`.
  - Added transparent Axios 401 retry interceptor in `src/lib/api.ts` that automatically refreshes expiring tokens and replays requests without logging out the user.
  - Hardened `App.tsx` and `LoginScreen.tsx` to prevent spurious session destruction during transient network drops or heartbeats.
  - Fixed aggressive process killing in tunnel/uplink background maintenance scripts.
- **Bug #12 (Runaway Greeting Loop)**:
  - Added `sessionStorage.getItem('jarvis_session_greeted')` guard ensuring strictly one dynamic greeting per browser session, immune to React remounts or tab switches.
- **Bug #15 (Barge-In Interruption)**:
  - Implemented barge-in interrupt handling in `JarvisVoiceModal.tsx` allowing Master Sri to click the reactor core or speak to immediately cancel active speech synthesis and capture a new command.
- **Bugs #3, #4, #7, #8, #17, #18 (Real Task Execution & Agent Addressing)**:
  - Replaced simulated prompt generator at `POST /api/agents/dispatch` with real task execution via `TaskStore` and `AgentRuntime`.
  - Removed duplicate route definition at line 3974 of `custom-routes.ts`.
  - Mapped first-class directive aliases (`aegis`, `vortex`, `midas`, `cerebro`, `stark_os`) directly to canonical workforce roles in `AgentRegistry.ts`.
  - Added verified domain tools (`execute_code`, `scrape_web`, `generate_automation`, `build_fullstack_app`, `market_intel`, `self_evolution`) in `ToolRegistry.ts`.
  - Added real-time health telemetry endpoints `GET /api/agents/health` and `GET /api/agents/health/:id`.
- **Bugs #5, #11, #24, #25, #26 (Observability & UI De-Cluttering)**:
  - Created `ActiveTaskExecutionPanel.tsx` connected to SQLite and SSE `/api/tasks/stream` for real-time task progress, step counters, elapsed timers, and deliverables.
  - Embedded the execution cockpit directly into `CommandCenter.tsx`.
  - Simplified information hierarchy on mobile and desktop surfaces, nesting secondary inspector panels in collapsible drawers.

### 🧪 Test Automation & Verification
- Resolved workforce count mismatch in `tests/phase3-agents-permissions.test.ts` and `tests/phase19-30-master-acceptance.test.ts` (20 canonical agents + dynamic specialist alias overlay).
- Created `tests/master-acceptance-remediation.test.ts` validating all 15 scenarios from the Master Directive.
- Achieved **125 / 125 tests passing (0 failures)** across 24 test suites.
- Verified zero compilation or bundling errors in `npm run build:server` (`esbuild`) and `npm run build` (`vite`).

### 📚 Documentation Deliverables Created
- `AUDIT_REPORT.md`: Comprehensive 28-bug root cause and remediation audit.
- `ARCHITECTURE.md`: Complete system topology, component architecture, and API specs.
- `TASK_EXECUTION_PROTOCOL.md`: 8-stage PLAN $\to$ EXECUTE $\to$ VERIFY lifecycle.
- `VOICE_PIPELINE.md`: VAD, state machine, multi-engine STT cascade, and barge-in specs.
- `AGENT_SWARM.md`: 20-agent workforce, executive specialist roles, and addressing syntax.
- `SELF_HEALING.md`: Surgical diff patching, circuit breakers, and crash recovery.
- `OBSERVABILITY.md`: Real-time execution cockpit, event streaming, and telemetry endpoints.
- `THIRD_PARTY_NOTICES.md`: Intellectual property audit and open-source licensing review.
- `ACCEPTANCE_TESTS.md`: 15-point real-world verification matrix and test log.
- `CHANGELOG.md`: Detailed changelog of all production modifications.
