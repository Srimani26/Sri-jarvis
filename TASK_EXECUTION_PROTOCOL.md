# J.A.R.V.I.S. Task Execution Protocol
**Document**: Standard Operating Procedure for Autonomous Task Execution  
**Standard**: Non-Simulated Verified Evidence Protocol  
**Version**: 5.0 (Production)  

---

## 1. Core Mandate

No task in J.A.R.V.I.S. may transition to `COMPLETED` based on conversational acknowledgment or LLM assertion alone. Every execution must be anchored by verifiable evidence stored in the database.

### The 8-Stage Lifecycle

```
[PLAN] ─────► [EXECUTE] ─────► [OBSERVE] ─────► [VERIFY]
                                                   │
                                            Pass? ─┴── No
                                             │         │
                                            Yes        ▼
                                             │     [RECOVER]
                                             │         │
                                             ▼         ▼
[STORE EVIDENCE] ◄─── [REPORT] ◄────── [RE-VERIFY] ◄───┘
```

---

## 2. Detailed Lifecycle Stages

### Implementation status for mission approvals
- Mission lifecycle classification, one-use encrypted approvals, and the encrypted resume checkpoint are implemented and unit-tested.
- `src/kernel/MissionToolPolicy.ts` is the dispatch boundary: agent identity, agent allowlist, agent permission ceiling, task scope and per-tool risk class are all checked immediately before execution, and unknown agents/tools fail closed.
- `src/kernel/MissionCoordinator.ts` owns the lifecycle for API-driven missions: it persists the task, records redacted evidence, pauses in `AWAITING_APPROVAL` for external sends, deploys and irreversible commands, and resumes from the encrypted checkpoint after a one-use approval. Resuming re-checks policy *before* burning the approval.
- Authenticated surface: `POST /api/missions/start`, `GET /api/tasks/:id/approvals`, `POST /api/tasks/:id/approvals/:approvalId/decision`, `POST /api/tasks/:id/resume`, `POST /api/moa/deliberate`.
- Still open: the legacy voice/Telegram/scheduler adapters and the two ReAct loops do not yet all pass through `MissionCoordinator`; they retain their existing behaviour. Do not claim end-to-end autonomous mission completion from those surfaces until those adapters land.
- A persisted `COMPLETED` result must be based on executed actions, explicit terminal intent, and passing required verification. Plain model text, a tool's success flag, or artifact existence alone is not sufficient evidence.
- Approval checkpoint encryption requires `MISSION_CHECKPOINT_ENCRYPTION_KEY` (canonical base64 of 32 random bytes). Without it, mission start fails closed with an explicit error and nothing dispatches; the variable is declared in `render.yaml` and must be set in the Render dashboard.

### Stage 1: PLAN
- Parse the natural language directive using `VoiceEngine` or `CommandCenter`.
- Identify the target specialist agent (`Aegis`, `Vortex`, `Midas`, `Cerebro`, `Stark OS`, or canonical specialist).
- Decompose the directive into discrete, verifiable steps (minimum 1, standard 4–8 steps).
- Create a persistent database record in `AgentTask` with state `QUEUED` and a sovereign ID (`TASK-V5-XXXX`).
- Emit SSE event: `TASK_CREATED`.

### Stage 2: EXECUTE
- Transition task status to `RUNNING`.
- Emit SSE event: `TASK_STARTED`.
- For each step:
  - Select approved tool from `ToolRegistry` (`filesystem_write`, `execute_code`, `generate_automation`, `test_runner`, etc.).
  - Check permission ceilings via `AgentRegistry.isPermissionAllowed()`.
  - Execute tool within sandboxed environment.
  - Record execution output, duration, and exit codes.
  - Increment completed steps and update factual progress percentage:
    $$\text{Progress \%} = \min\left(100, \text{round}\left(\frac{\text{completedSteps}}{\text{totalSteps}} \times 100\right)\right)$$
  - Emit SSE event: `TASK_STEP_PROGRESS`.

### Stage 3: OBSERVE
- Collect telemetry from tool outputs, stderr, compiler diagnostics, and DOM inspection.
- Filter out private model chain-of-thought; stream only observable action traces to Master Sri.
- Update `currentOperation` and `currentTool` in `TaskStore`.

### Stage 4: VERIFY
- Execute automated verification checklist defined in `AgentSpecification.verificationChecklist`:
  - **Coding/Engineering**: `tsc --noEmit` exits with 0 errors; unit test runner passes.
  - **Automation**: n8n workflow JSON parses cleanly; webhook endpoints pinged.
  - **Revenue / Business**: Mathematical formulas validate; zero undefined fields.
  - **Research**: Source URLs and citations provided; factual claims substantiated.
  - **Operations**: Hardware and system telemetry sampled and bounded.
- If verification passes: proceed to **Stage 7 (REPORT)**.
- If verification fails: proceed to **Stage 5 (RECOVER)**.

### Stage 5: RECOVER
- Transition task state to `RECOVERING`.
- Emit SSE event: `TASK_RECOVERING`.
- Classify failure type:
  - *Transient Network / Timeout*: Apply exponential backoff and retry (up to `retryPolicy.maxRetries`).
  - *Syntax / Compiler Error*: Route error to `DiffPatcher` or `CodingExecutionLoop.autoRepair()`.
  - *Provider 429 / Quota*: Trigger `ModelRouter` failover to secondary engine.
  - *Environment / Process Hang*: Restart worker sub-process.
- If retry count exhausted: transition to `FAILED` with failure evidence, or `BLOCKED` if unsafe.

### Stage 6: RE-VERIFY
- Re-run verification suite on patched artifacts.
- If re-verification fails again: halt, isolate changes, record failure diff, and report to Master Sri.

### Stage 7: REPORT
- Formulate executive briefing for Master Sri:
  - Task ID and title
  - Assigned specialist agent
  - Total elapsed time
  - Artifacts generated (file paths, endpoints, reports)
  - Explicit confirmation: *"Verified with 0 unresolved errors"*
- Transition task state to `COMPLETED`.
- Record `completedAt` timestamp.
- Emit SSE event: `TASK_COMPLETED`.

### Stage 8: STORE EVIDENCE
- Save all diffs, execution logs, and validation hashes to `TaskEvent` table and local artifact storage (`data/tasks/TASK-V5-XXXX/`).
- Index task outcome into `MemoryStore` for contextual recall on future directives.

---

## 3. Disallowed Anti-Patterns

1. **The Verbal Bluff**: Saying *"I am on it"* or *"Aegis will take care of that"* without generating a `TASK-` database entity.
2. **The Synthetic Completion**: Marking a task as finished when only an LLM text generation was completed without executing tools or verifying output.
3. **The Cosmetic Timer**: Simulating a continuous 0% $\to$ 100% progress animation independent of actual backend event stream.
4. **The Silent Switch**: Changing models or providers during failure without recording telemetry or logging the failover event.
5. **The Unbounded Retry Loop**: Retrying a failing tool indefinitely without a maximum retry limit or circuit breaker trip.
