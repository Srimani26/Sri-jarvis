# J.A.R.V.I.S. Mission Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make every actionable J.A.R.V.I.S. mission obey one permission-aware lifecycle and report completion only when its requested work has evidence and passing verification.

**Architecture:** Add a typed mission outcome and transition contract, then route voice, task, scheduler, and ReAct execution through one coordinator. Keep existing models and tool implementations behind adapters; enforce policy at the final dispatch boundary and persist redacted evidence and approvals.

**Tech Stack:** TypeScript, Node.js, Hono, Prisma 7, SQLite/PostgreSQL, existing `tsx --test` runner.

**Spec:** [`docs/superpowers/specs/2026-11-16-jarvis-reliable-assistant-and-mobile-ux-design.md`](../specs/2026-11-16-jarvis-reliable-assistant-and-mobile-ux-design.md)

## File Map

- `src/kernel/types.ts` and `missionLifecycle.ts`: task status, mission result, and pure legal-transition/completion rules.
- `src/kernel/MissionApprovalStore.ts` and `MissionCheckpointStore.ts`: durable approval/checkpoint records; Prisma schema and migrations own persistence shape; pending tool arguments are encrypted at rest and never copied into task events.
- `src/kernel/MissionToolPolicy.ts` and `MissionCoordinator.ts`: final authorization boundary, pause/resume, tool execution, evidence, and verification lifecycle.
- `src/agents/AgentRuntime.ts`, `src/voice/VoiceEngine.ts`, `src/orchestrator/MissionOrchestrator.ts`, `src/scheduler/AutonomousScheduler.ts`, and both ReAct loop copies: adapters to the shared lifecycle.
- `custom-routes.ts` and `src/lib/api.ts`: authenticated mission and approval surface.
- `tests/mission-*.test.ts`: pure rules, persistence, policy, coordinator, adapters, and API behavior.

## Global Constraints

- “Autonomous” means the system can choose and execute permitted steps; it does not mean bypassing authentication, user approvals, or verification.
- Existing model routing and tool implementations remain in place behind adapters.
- Every tool call is checked against an agent allowlist, kernel permission, task scope, and risk policy immediately before execution.
- Consequential external actions pause in `AWAITING_APPROVAL` with a plain-language action summary; the UI can approve or reject the exact pending action.
- Provider secrets, raw credentials, and private chain-of-thought are never stored in this evidence.
- Any schema change requires a reversible migration and production-safe rollout; never reset or force-push the database schema.
- Do not replace the model-provider layer or add an unreviewed dependency solely for visual effects.

## Review Focus

1. No planned tools or no tool calls: mission stays incomplete instead of becoming a success; test this in `AgentRuntime` and the ReAct loop.
2. Tool says success but artifact/check is missing: verifier keeps the task out of `COMPLETED`; test both web-app and general outputs.
3. Step/time limit or provider returns plain text: task ends `BLOCKED`/`FAILED` with a truthful summary; test limit and no-tool model results.
4. Agent requests a disallowed tool or unsafe scope: dispatch is denied before the executor runs; test forged tool calls and aliases.
5. Approval is expired, replayed, or belongs to another user: action does not execute; test one-use, expiry, ownership, and rejection.

---

### Task 1: Define Mission Outcomes and Legal State Transitions

**Files:**
- Modify: `src/kernel/types.ts`
- Modify: `src/kernel/TaskStore.ts`
- Create: `src/kernel/missionLifecycle.ts`
- Test: `tests/mission-lifecycle.test.ts`

**Interfaces:**
- Produces `MissionStatus = 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'WAITING_FOR_INPUT' | 'AWAITING_APPROVAL'`.
- Produces `MissionOutcomeInput = { executedActions: number; terminalIntentReceived: boolean; executionState: 'IDLE' | 'RUNNING' | 'ERROR' | 'EXHAUSTED'; verification: 'NOT_REQUIRED' | 'NOT_RUN' | 'PASSED' | 'FAILED'; waitingForInput?: boolean; awaitingApproval?: boolean }`.
- Produces `classifyMissionOutcome(input: MissionOutcomeInput): MissionStatus` and `canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean`.

- [ ] Add tests proving zero execution, missing terminal intent, failed required verification, exhausted budget, and denied tools cannot be classified `COMPLETED`.
- [ ] Add transition tests for `QUEUED → PLANNING → RUNNING → VERIFYING → COMPLETED`, `RUNNING → AWAITING_APPROVAL`, approval rejection/expiry, `BLOCKED`, and `FAILED`.
- [ ] Implement the typed inputs and pure classification/transition functions; add `AWAITING_APPROVAL` to `TaskStatus` and make `TaskStore.updateTask` reject illegal state transitions.
- [ ] Run `npx tsx --test tests/mission-lifecycle.test.ts` and confirm all new cases pass.

### Task 2: Persist One-Use Approval Requests and Evidence

**Files:**
- Modify: `prisma/schema.prisma`, `src/kernel/TaskStore.ts`, `src/kernel/types.ts`
- Create: `src/kernel/MissionApprovalStore.ts`, `src/security/MissionCheckpointCrypto.ts`, a reversible Prisma migration, `tests/mission-approval-store.test.ts`

**Interfaces:**
- Produces `createApproval(input: { taskId: string; userId: string; toolName: string; actionDigest: string; summary: string; expiresAt: Date })`, `approveOnce(input: { id: string; userId: string; actionDigest: string; decision: 'APPROVE' | 'REJECT' })`, and `getPendingApprovals(taskId: string, userId: string)`.
- Produces `ApprovalRequest = { id: string; taskId: string; toolName: string; actionDigest: string; summary: string; expiresAt: Date; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' }`.
- Approval records bind a user, task, exact tool/action digest, expiry, and one terminal decision. Mission evidence is appended as redacted `TaskEvent` metadata.

- [ ] Write repository tests for owner match, exact action digest match, expiry, replay, rejection, and concurrent double approval.
- [ ] Add a Prisma `TaskApproval` model with a unique request identifier, task/user ownership, status, action digest, safe summary, expiry, decision timestamps, and task relation; add an index for task/status/expiry. Keep actual tool arguments in the encrypted checkpoint record.
- [ ] Implement AES-256-GCM checkpoint encryption with the Node built-in `crypto` module and a dedicated 32-byte `MISSION_CHECKPOINT_ENCRYPTION_KEY`; reject startup/resume of approval work if the key is missing or invalid. Never fall back to `JWT_SECRET` or a hard-coded seed.
- [ ] Add tests that tampered ciphertext, wrong key, missing key, and key-rotation mismatch fail closed and never dispatch the pending action.
- [ ] Implement atomic compare-and-set approval consumption; do not execute a tool inside the database transaction.
- [ ] Generate and validate the migration against the project's configured development database without resetting existing data.
- [ ] Run `npx tsx --test tests/mission-approval-store.test.ts` and `npx prisma validate`.

### Task 3: Enforce Agent, Kernel, and Risk Policy at Tool Dispatch

**Files:**
- Create: `src/kernel/MissionToolPolicy.ts`
- Modify: `src/kernel/ExecutionKernel.ts`, `src/agents/AgentRegistry.ts`, `src/swarm/tools/toolRegistry.ts`, matching `server/src/swarm/tools/toolRegistry.ts`
- Test: `tests/mission-tool-policy.test.ts`

**Interfaces:**
- Produces `authorizeMissionTool({ agentId, toolName, args, taskScope }): Promise<{ allowed: boolean; approval?: ApprovalRequest; reason?: string }>`.
- Produces a guarded dispatcher that invokes the legacy tool implementation only after authorization.

- [ ] Add table-driven tests for every tool risk class: read-only, local write, external send, production/deploy, and destructive action.
- [ ] Add tests proving aliases and a custom executor cannot bypass `canUseTool`, `ExecutionKernel.checkPermission`, or task scope.
- [ ] Define an explicit mapping from each `SwarmSpecialist` identity to an `AgentRegistry` identity; unknown agents and unknown tools fail closed.
- [ ] Add exact per-tool permission/risk metadata for every tool exposed in `SWARM_TOOL_SCHEMAS`; require approval for external sends, production changes, and irreversible destructive actions.
- [ ] Route both `src` and `server/src` dispatchers through the same guard and add a parity assertion so future copies cannot drift.
- [ ] Run `npx tsx --test tests/mission-tool-policy.test.ts`.

### Task 4: Add a Mission Coordinator with Durable Pause and Resume

**Files:**
- Create: `src/kernel/MissionCoordinator.ts`, `src/kernel/MissionCheckpointStore.ts`, `tests/mission-coordinator.test.ts`
- Modify: `src/kernel/TaskStore.ts`, `src/kernel/EventStream.ts`

**Interfaces:**
- `MissionRequest = { taskId?: string; userId: string; objective: string; agentId: string; source: 'voice' | 'chat' | 'task_api' | 'scheduler' }`.
- `MissionActionEvidence = { actionId: string; toolName: string; status: 'SUCCEEDED' | 'FAILED' | 'DENIED' | 'AWAITING_APPROVAL'; redactedInput: Record<string, unknown>; resultSummary: string; elapsedMs: number }`.
- `MissionVerification = { name: string; status: 'PASSED' | 'FAILED' | 'NOT_RUN'; evidence: string }`.
- `MissionResult = { taskId: string; status: MissionStatus; summary: string; actions: MissionActionEvidence[]; artifacts: string[]; verification: MissionVerification[]; errors: string[]; pendingApprovalId?: string }`.
- `MissionCoordinator.start(request): Promise<MissionResult>` and `resume(taskId, userId, approvalId): Promise<MissionResult>`.

- [ ] Test task creation, event order, redaction, checkpoint persistence, restart/resume, and each terminal outcome using injected store/model/tool/verifier ports.
- [ ] Implement checkpoint storage for the next tool call and compact execution context; encrypt arguments with `MissionCheckpointCrypto` and never persist model private reasoning or put raw tool arguments in `TaskEvent` metadata.
- [ ] On approval-required tool, persist the exact pending action, emit `AWAITING_APPROVAL`, return control to the UI, and stop before tool invocation.
- [ ] On approval, consume the one-use approval, re-check policy, execute once, append evidence, and continue from the checkpoint.
- [ ] On rejection, expiry, or owner mismatch, do not execute; record the outcome and keep the mission non-completed.
- [ ] Run `npx tsx --test tests/mission-coordinator.test.ts`.

### Task 5: Convert Legacy Runtimes into Coordinator Adapters

**Files:**
- Modify: `src/agents/AgentRuntime.ts`, `src/voice/VoiceEngine.ts`, `src/orchestrator/MissionOrchestrator.ts`, `src/scheduler/AutonomousScheduler.ts`
- Modify: `src/swarm/engine/AutonomousAgentLoop.ts`, `server/src/swarm/engine/AutonomousAgentLoop.ts`, `src/services/taskAuditService.ts`
- Tests: `tests/phase3-agents-permissions.test.ts`, `tests/autonomous-react-engine.test.ts`, new `tests/mission-runtime-adapters.test.ts`

**Interfaces:**
- Existing callers receive `MissionResult`; compatibility wrappers may preserve legacy response fields but derive `success` only from `status === 'COMPLETED'`.
- ReAct tools use the guarded dispatcher from Task 3 and checkpoint API from Task 4.

- [ ] Add regression tests: no tools in `AgentRuntime`, model prose without tool calls, exhausted max steps, scaffold success without verification, and failed verifier all stay incomplete.
- [ ] Replace AgentRuntime's hard-coded success object with recorded tool outputs and mission-specific verification; an empty tool list must return a blocked/incomplete result for actionable work.
- [ ] Remove ReAct success on plain text, max-step exit, scaffold shortcut, and `index.html` existence; require explicit finish signal and passing required verifier.
- [ ] Inject `taskId`/task evidence dependencies into the ReAct adapter so it updates the same task record and appends the same event trail rather than creating a second status authority.
- [ ] Ensure user-facing voice summaries use the persisted mission status and never say “verification passed” unless the result contains passing verification evidence.
- [ ] Run the focused regression suites and compare `src`/`server/src` implementations.

### Task 6: Route API Entry Points and Approval UI Contract Through the Coordinator

**Files:**
- Modify: `custom-routes.ts`, relevant task/voice routes, `src/lib/api.ts`
- Test: `tests/mission-routes.test.ts`

- [ ] Add authenticated start/resume/approve/reject route tests for correct owner, malformed requests, expired approval, and idempotent retries.
- [ ] Route voice mission, task dispatch, scheduler runs, and swarm execution through `MissionCoordinator`; conversational chat requests remain answers, not missions.
- [ ] Add `/api/tasks/:id/approvals` and one-use decision routes returning only the pending action summary and state, never secret tool arguments.
- [ ] Make route responses return the same typed `MissionResult` for success, blocked, failure, and waiting approval.
- [ ] Run `npx tsx --test tests/mission-routes.test.ts` and the focused lifecycle/runtime suites.

### Task 7: Verify Release Gates and Update Operations Documentation

**Files:**
- Modify: `TASK_EXECUTION_PROTOCOL.md`, `JARVIS_SECURITY_MODEL.md`, `JARVIS_EVALUATION_SUITE.md`
- Test: `tests/mission-lifecycle.test.ts`, `tests/mission-tool-policy.test.ts`, `tests/mission-coordinator.test.ts`, `tests/mission-runtime-adapters.test.ts`, `tests/mission-routes.test.ts`

- [ ] Add end-to-end test for voice/task request → mission event stream → approval pause → one execution → verification → truthful completion.
- [ ] Add end-to-end denial case for unauthorized tool and expired approval proving no external call is made.
- [ ] Run all five focused mission suites, `npx tsc --noEmit`, `npm run build`, and `npm run build:server`; report pre-existing failures separately rather than weakening the gates.
- [ ] Update protocol docs so they describe executable contracts and current limitations, not aspirational capabilities.
- [ ] Document `MISSION_CHECKPOINT_ENCRYPTION_KEY` generation/rotation and verify deployment config is present before enabling approval-backed missions.
- [ ] Review the final diff for secrets, unchecked dispatch paths, duplicate runtime implementations, and false success language.
