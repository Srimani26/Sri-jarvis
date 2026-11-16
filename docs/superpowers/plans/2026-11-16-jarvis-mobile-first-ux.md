# J.A.R.V.I.S. Mobile-First UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Redesign every current J.A.R.V.I.S. surface into a coherent, accessible Android-first assistant interface while preserving the existing capabilities.

**Architecture:** Keep the React application and existing API routes. Introduce shared app-shell/navigation/design primitives, rebuild the Home/Missions/Chat/Voice core flow around persisted mission results, then migrate every module by domain without changing its backend behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui, lucide-react, existing Vite build and `tsx --test` runner.

**Spec:** [`docs/superpowers/specs/2026-11-16-jarvis-reliable-assistant-and-mobile-ux-design.md`](../specs/2026-11-16-jarvis-reliable-assistant-and-mobile-ux-design.md)

## File Map

- `src/index.css`, `src/components/app/`, and `src/App.tsx`: shared visual tokens, responsive shell, route registry, global voice action, settings, Memory, and Connections entry points.
- `src/surfaces/CommandCenter.tsx` and `src/components/home/`: live-data Home and assistant composer.
- `src/components/missions/`, `ActiveTaskExecutionPanel.tsx`, and `TaskProgressCard.tsx`: mission inbox/detail, event evidence, approval state, and result display.
- `src/surfaces/AIChat.tsx`, `src/components/assistant/`, and `JarvisVoiceModal.tsx`: conversational versus mission outcome and voice state.
- `src/surfaces/AgentEcosystem.tsx` and `src/components/agents/`: actual agent health, scope, assignment, and results.
- `src/surfaces/`: all existing business, work, knowledge, and system modules; migrate in Tasks 6–7 without changing their service APIs.
- `tests/*-ui.test.ts`: route/data/status contracts; final viewport, keyboard, and screen-reader checks are performed on the running app.

## Global Constraints

- Phone-first layout for Android widths, safe areas, large touch targets, readable type, keyboard support, reduced-motion preference, and accessible contrast.
- A compact bottom navigation for **Home**, **Missions**, **Chat**, and **Apps**, with a persistent, clearly labeled voice action. Desktop uses a collapsible side rail and the same information architecture.
- A calm, cinematic graphite interface with restrained cyan/teal action accents and amber/red states. Use motion only to communicate a real state change; remove decorative scanlines, constant pulsing, excessive glow, and unverified performance claims.
- Reorganize and visually refresh every existing user-facing module under one accessible responsive design system without dropping the existing capabilities.
- UI reads status and evidence from authenticated task APIs; it must not fabricate missing values.
- Do not add an unreviewed dependency solely for visual effects.
- Home, missions, chat/voice, agents, and all existing user-facing modules render without horizontal overflow at 360px, 390px, tablet, and desktop widths.

## Review Focus

1. 360px Android viewport and keyboard open: composer and navigation remain usable; test/inspect in Task 2 and Task 4.
2. Long mission title/output/path: text wraps or truncates accessibly without horizontal overflow; inspect in Task 3.
3. Missing, delayed, or failed API data: show explicit loading/empty/error states instead of zeros or fake “online” status; exercise in Tasks 2–5.
4. Reduced-motion and keyboard-only operation: no essential motion, focus never disappears; verify in Tasks 1 and 8.
5. Large app catalog and active navigation: every route is searchable, categorized, and reachable without relying on a hover drawer; verify in Tasks 1 and 7.

---

### Task 1: Establish Tokens and Responsive Application Shell

**Files:**
- Modify: `src/index.css`, `src/App.tsx`
- Create: `src/components/app/AppShell.tsx`, `src/components/app/PrimaryNavigation.tsx`, `src/components/app/PageHeader.tsx`
- Test: `tests/app-navigation.test.ts`

**Interfaces:**
- `AppShell({ activeRoute, onNavigate, onVoice, children })` owns mobile bottom bar, desktop rail, safe-area padding, and route content frame.
- Navigation entries use typed `id`, `label`, `category`, and `icon` data; avoid duplicating nav definitions between desktop and phone.

- [ ] Add pure tests that every route ID is unique, every current route is categorized, and Home/Missions/Chat/Apps/Voice entry points are present.
- [ ] Define CSS tokens for surfaces, text hierarchy, borders, statuses, focus rings, spacing, and radii; remove global always-on scanline/pulse treatment and add `prefers-reduced-motion` rules.
- [ ] Extract the shell from `App.tsx`; desktop gets a collapsible side rail, Android gets four labeled bottom destinations plus a persistent voice action.
- [ ] Add visible focus styles, `aria-current`, landmark labels, safe-area insets, and minimum 44px touch targets.
- [ ] Run `npx tsx --test tests/app-navigation.test.ts` and `npm run build`.

### Task 2: Rebuild Home Around Real Priorities and Assistant Entry

**Files:**
- Modify: `src/surfaces/CommandCenter.tsx`, `src/components/MetricCard.tsx`
- Create: `src/components/home/AssistantComposer.tsx`, `src/components/home/PriorityList.tsx`, `src/components/home/ApprovalSummary.tsx`
- Test: `tests/home-data-contract.test.ts`

- [ ] Add data-contract tests for loading, empty, error, and populated task/approval/agent API responses; absent values must remain absent rather than becoming fake KPIs.
- [ ] Replace status claims such as fixed latency/“primed” counts with values returned by authenticated APIs or explicit “not connected” copy.
- [ ] Place voice/text composer first; show only real priorities, resumable missions, pending approvals, and agent states.
- [ ] Make quick actions create or navigate to real flows, not just log or display a local success message.
- [ ] Inspect at 360px, 390px, tablet, and desktop; run `npm run build`.

### Task 3: Redesign Mission Inbox, Detail, and Evidence Views

**Files:**
- Modify: `src/components/ActiveTaskExecutionPanel.tsx`, `src/components/TaskProgressCard.tsx`
- Create: `src/components/missions/MissionList.tsx`, `MissionDetail.tsx`, `MissionEvidence.tsx`, `MissionStatus.tsx`
- Tests: `tests/mission-status-ui.test.ts`

- [ ] Test mapping from every backend mission state to plain-language label, accessible status color/text, next action, and completion evidence visibility.
- [ ] Build a searchable mission queue grouped by running, awaiting approval/input, completed, failed, and blocked.
- [ ] Build detail sections for request/plan, actual tool actions, artifacts, verifier/check results, errors/retries, and next action; render approval buttons only for the exact pending request.
- [ ] Remove stage-complete inference from overall task status and derive each stage from persisted events/evidence.
- [ ] Test long filenames, outputs, and titles at phone width; ensure no horizontal page overflow and controls remain touchable.

### Task 4: Unify Chat and Foreground Voice Experience

**Files:**
- Modify: `src/surfaces/AIChat.tsx`, `src/components/JarvisVoiceModal.tsx`, `src/App.tsx`
- Create: `src/components/assistant/AssistantInput.tsx`, `src/components/assistant/OutcomeBanner.tsx`
- Tests: `tests/assistant-outcome-ui.test.ts`

- [ ] Test distinct UI outcomes for a conversational answer, mission started, approval needed, verified completion, blocked, and failed.
- [ ] Keep ordinary questions in chat; route actionable requests to missions and show the transition clearly.
- [ ] Restyle the voice surface with explicit mic state, editable transcript, send/cancel, barge-in, readable recognition errors, and persisted mission result.
- [ ] Verify closing/reopening or backgrounding does not silently turn the microphone back on.
- [ ] Verify labels and operation at 360px/390px with onscreen keyboard, and run voice-focused tests plus `npm run build`.

### Task 5: Make Agent Status and Controls Evidence-Based

**Files:**
- Modify: `src/surfaces/AgentEcosystem.tsx`, `src/components/ArcReactorHUD.tsx`
- Create: `src/components/agents/AgentCard.tsx`, `AgentCapabilityList.tsx`, `AgentActivity.tsx`
- Test: `tests/agent-status-ui.test.ts`

- [ ] Add tests proving task counts/current assignments are rendered only from API data, not constants such as static completed-task totals or greetings that claim every agent is online.
- [ ] Show role, actual permission scope, health source, current task, and recent verified outcomes with unknown/loading states.
- [ ] Provide clear dispatch actions with selected agent and confirmation context; do not expose new permissions from the UI.
- [ ] Check touch/keyboard access and `npm run build`.

### Task 6: Migrate Work and Business Modules

**Files:**
- Modify: `src/surfaces/Projects.tsx`, `CodeLab.tsx`, `WorkflowBuilder.tsx`, `DailyPlanner.tsx`, `HabitsTracker.tsx`, `Journal.tsx`, `Inbox.tsx`, `RevenueHunter.tsx`
- Test: `tests/work-business-surface-contract.test.ts`

- [ ] Add a route inventory test asserting all eight surfaces remain registered and retain their existing main actions.
- [ ] Apply shared PageHeader, section spacing, form controls, status chips, cards, empty/loading/error states, and mobile-first column layouts to Projects and CodeLab.
- [ ] Apply the same system to WorkflowBuilder, DailyPlanner, HabitsTracker, and Journal; preserve form behavior and data contracts.
- [ ] Apply the same system to Inbox and RevenueHunter; clearly distinguish live/connected data from unavailable data and drafts from sent actions.
- [ ] Inspect each screen at 360px, 390px, tablet, and desktop; run the route inventory test and build.

### Task 7: Migrate Knowledge and System Modules and App Catalog

**Files:**
- Modify: `src/surfaces/KnowledgeHub.tsx`, `TechRadar.tsx`, `Analytics.tsx`, `CyberThreatDefense.tsx`, `OmniApiArsenal.tsx`, `StorageVault.tsx`, `Profile.tsx`, `src/components/LoginScreen.tsx`, `src/components/auth/TwoFactorSetup.tsx`, `src/components/auth/TwoFactorVerify.tsx`, `src/components/SovereignSurfacesDeck.tsx`, `src/App.tsx`
- Test: `tests/app-catalog.test.ts`

- [ ] Test every current destination has one unique catalog entry, valid category, and functional route callback.
- [ ] Migrate KnowledgeHub, TechRadar, and Analytics using shared search/filter/card/chart states; remove fabricated data labels.
- [ ] Migrate CyberThreatDefense and OmniApiArsenal with clearly visible security/access states and user-readable unavailable states.
- [ ] Migrate StorageVault, Profile, LoginScreen, TwoFactorSetup, and TwoFactorVerify without changing authentication, key, or file permissions; preserve sensitive-value masking.
- [ ] Restyle the login, two-factor setup/verification, and settings states under the same tokens without changing authentication behavior; preserve masked credentials.
- [ ] Replace the dense Arsenal drawer with categorized, searchable Apps pages; include Memory and Connections routes defined in `App.tsx`.
- [ ] Inspect all modules at 360px and desktop; run the app-catalog test and build.

### Task 8: Accessibility and Full Responsive Acceptance Pass

**Files:**
- Modify: affected components under `src/components/` and `src/surfaces/`, `src/index.css`
- Test: focused UI contracts from Tasks 1–7; `npm run build`

- [ ] Perform keyboard-only navigation through login, shell, voice, chat, mission approval, task evidence, agent list, Apps search, and settings; fix focus traps or unreachable controls.
- [ ] Verify screen-reader names, dialog labels, status announcements, form errors, reduced motion, 44px touch targets, and readable status text.
- [ ] Check 360px, 390px, 768px, and 1280px widths; fix any horizontal overflow, clipped controls, or hidden essential action.
- [ ] Confirm all legacy routes remain reachable and each surface's core action still works with its existing API.
- [ ] Run focused UI tests and `npm run build`; document any browser-only check unavailable in the environment.
