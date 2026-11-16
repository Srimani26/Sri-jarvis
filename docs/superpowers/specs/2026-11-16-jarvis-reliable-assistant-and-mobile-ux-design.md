# J.A.R.V.I.S. Reliable Assistant and Mobile UX — Design Specification

**Date:** 2026-11-16
**Status:** Proposed design; awaiting user review
**Repository:** `Srimani26/Sri-jarvis`
**Target:** Existing isolated worktree `codex/foreground-voice-security`

## 1. Purpose

Make J.A.R.V.I.S. useful for real day-to-day work by pairing trustworthy agent execution with a clear, phone-first interface. A task must report what actually happened, what evidence supports completion, and where it needs the user's decision. The UI must make it easy to start work by voice or text, follow progress, approve consequential actions, and inspect the result.

The operator's approved priorities are Android phone usability, reliable voice interaction, and agents that complete real work. “Autonomous” means the system can choose and execute permitted steps; it does not mean bypassing authentication, user approvals, or verification.

## 2. Current-state findings

These findings come from source inspection. The local browser could not be attached safely in this Windows session; no account was logged into and no credentials were read.

- `VoiceEngine` calls `AgentRuntime.executeAgentTask` without a tool plan. `AgentRuntime` can return a hard-coded success summary with zero executed tools, then pass verification because a non-empty summary exists.
- `executeAutonomousReAct` marks a plain model response and a loop that reaches its step limit as successful. A web-app fast path can complete after finding `index.html` without running the configured verifier.
- The UI puts about 20 destinations in one application shell. Mobile exposes only a subset in the bottom bar and sends the rest to a “More” drawer.
- Dashboard, module, and task surfaces use dense, technical labels. Some headline health or latency text is not visibly tied to a live API result. The task view's stage indicators infer progress from task status rather than independent stage evidence.

## 3. Goals and exclusions

### Goals

1. Give chat answers, actionable tasks, and delegated missions distinct outcome semantics.
2. Make mission completion require concrete tool results and the relevant independent checks; report `BLOCKED`, `FAILED`, or `WAITING_FOR_INPUT` honestly when completion criteria are not met.
3. Enforce role/tool permissions and action-specific approval requirements at the execution boundary, regardless of which UI or agent initiated the action.
4. Show a mobile-first “Ask J.A.R.V.I.S.” entry point, honest mission progress, pending approvals, and verifiable outcomes.
5. Reorganize and visually refresh every existing user-facing module under one accessible responsive design system without dropping the existing capabilities.
6. Preserve voice as a first-class input, with transcript review, explicit microphone state, and visible task/result handoff.

### Exclusions for this phase

- Claiming unlimited intelligence, guaranteed results, or autonomous access to every external service.
- Removing authentication, expanding agent permissions by default, or automatically performing externally visible or irreversible actions without the required approval.
- Replacing the model-provider layer or adding an unreviewed dependency solely for visual effects.
- Rewriting the system as a native Android application. This phase targets the existing React application on Android-sized screens and a clear installable web-app path if it fits the current deployment architecture; native packaging is a later decision.

## 4. Proposed execution architecture

Introduce one mission lifecycle boundary used by voice task dispatch, task routes, and the existing ReAct executor. Existing model routing and tool implementations remain in place behind adapters.

```text
Voice / text / scheduled request
              │
              ▼
     Intent: answer or mission
              │
      Mission coordinator
       ├── plan + agent role
       ├── capability/policy check
       ├── approval checkpoint (when required)
       ├── execute permitted tools
       ├── record observable evidence
       └── independent verification
              │
              ▼
   Completed / blocked / failed
```

The coordinator owns task state transitions and completion. `AgentRuntime` and `executeAutonomousReAct` become execution adapters rather than independent sources of success. Every tool call is checked against an agent allowlist, kernel permission, task scope, and risk policy immediately before execution. A custom executor cannot bypass those checks. Consequential external actions pause in `AWAITING_APPROVAL` with a plain-language action summary; the UI can approve or reject the exact pending action.

Conversational questions that require no action stay in chat and are not reported as completed missions. For missions, a model's prose, a tool's `success` flag alone, a `finish_task` call, file existence, or reaching the step limit is insufficient proof. Completion requires an explicit terminal intent plus the configured checks and persisted evidence. If the agent reaches its step or time budget without that proof, it reports an incomplete state.

Evidence is an append-only task event trail containing tool identity, redacted arguments, result status, timing, artifact references, verifier name/version, and check outcomes. Provider secrets, raw credentials, and private chain-of-thought are never stored in this evidence.

## 5. Proposed product experience

### Navigation and visual language

- Phone-first layout for Android widths, safe areas, large touch targets, readable type, keyboard support, reduced-motion preference, and accessible contrast.
- A compact bottom navigation for **Home**, **Missions**, **Chat**, and **Apps**, with a persistent, clearly labeled voice action. Desktop uses a collapsible side rail and the same information architecture.
- A calm, cinematic graphite interface with restrained cyan/teal action accents and amber/red states. Use motion only to communicate a real state change; remove decorative scanlines, constant pulsing, excessive glow, and unverified performance claims.
- Shared page headers, buttons, cards, empty/error/loading states, forms, status chips, dialogs, and tables. Every interactive item is keyboard operable and has a visible focus state.

### Home

- A prominent text/voice composer with example task prompts.
- Today's priorities and schedules only when backed by connected data.
- Resume-able active/recent missions, pending approvals, and clear agent availability derived from runtime status.
- Quick links to frequently used modules; no static fake telemetry.

### Missions

- A searchable queue grouped by active, waiting for approval/input, completed, and failed/blocked.
- Mission detail shows the request, plan, actual tool actions, live operation, artifacts, checks and evidence, errors, retries, and exact next action required.
- Progress reflects persisted steps and evidence. It never advances because a timer or model message changed.

### Chat and voice

- Chat is the home for questions and conversational work; actionable requests can become missions with the intent made clear.
- Voice uses the existing foreground microphone model: explicit listening state, editable transcript, send/cancel, barge-in, and spoken summary matching the persisted mission outcome.
- The UI distinguishes “answer generated,” “action started,” “approval needed,” “verified complete,” and “could not complete.”

### Agents and Apps

- The agent view lists actual roles, permitted capabilities, health source, current mission, and recent verified outcomes. It does not claim an agent is “primed” or “healthy” without runtime evidence.
- The Apps area groups all current modules into **Work**, **Business**, **Knowledge**, and **System**, preserving their functions while migrating each to the shared component system and responsive layouts.
- Settings expose connected services, access state, notification preferences, and approval controls with clear descriptions.

## 6. Data and API contract

- Reuse `AgentTask` and append-only `TaskEvent` where possible; the `AgentTask.status` column is already a string. Add a typed `AWAITING_APPROVAL` status and matching state transitions in application code.
- Define a typed mission result that includes status, user-facing summary, executed action IDs, artifacts, verification results, unresolved issues, and approval request reference.
- Add an approval record only if the current task/event model cannot safely support one-use, user-bound, expiring approval decisions. Any schema change requires a reversible migration and production-safe rollout; never reset or force-push the database schema.
- UI reads status and evidence from authenticated task APIs; it must not fabricate missing values. Existing routes are adapted behind the coordinator and may be retired only after call sites migrate.

## 7. Acceptance criteria

1. A conversational answer is not misreported as an executed action.
2. Zero-tool, step-limit, thrown-tool, denied-tool, failed-verifier, and failed-artifact cases never produce `COMPLETED`.
3. Successful missions include persisted tool results and passing task-appropriate verification evidence.
4. Approval-required actions do not execute until the user approves that exact pending action; rejection or expiry leaves a truthful terminal/waiting state.
5. Voice, task API, scheduler, and agent dispatch paths use the same lifecycle rules.
6. Home, missions, chat/voice, agents, and all existing user-facing modules render without horizontal overflow at 360px, 390px, tablet, and desktop widths.
7. Core flows work by touch and keyboard, with visible focus, screen-reader labels, legible status text, and reduced motion support.
8. No dashboard KPI or task stage is shown as live/completed unless a data source or recorded event supports it.
9. Existing authenticated integrations and task history remain accessible after rollout.

## 8. Rollout and risk controls

Implement behind the existing app shell in small reviewable stages: mission lifecycle and truth contract; mobile navigation and design tokens; home/missions/voice core surfaces; remaining module migration; final responsive/accessibility pass. Keep legacy execution paths behind adapters until their callers are migrated and acceptance checks pass. Do not deploy until the release checks clearly distinguish baseline repository failures from regressions introduced by this phase.

Principal risks are the number of legacy dispatch paths, inconsistent tool schemas, pre-existing test/typecheck failures, and the large number of screens. The implementation plan must identify one source of truth for mission state, inventory each dispatch entry point, prioritize the core mobile workflow, and migrate the remaining screens systematically.
