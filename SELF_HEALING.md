# J.A.R.V.I.S. Self-Healing & Autonomous Remediation Protocol
**Document**: Diagnostic Engine, Circuit Breakers, Rollback & Controlled Repair  
**System**: J.A.R.V.I.S. MARK-V Resilience Subsystem  
**Owner**: Master Sri  
**Status**: Production Verified  

---

## 1. Principles of Controlled Self-Repair

Self-repair in J.A.R.V.I.S. is governed by strict boundaries. It does **not** mean executing random unvetted code from the internet or mutating production files without test checkpoints.

$$\text{DETECT} \longrightarrow \text{DIAGNOSE} \longrightarrow \text{CLASSIFY} \longrightarrow \text{PROPOSE FIX} \longrightarrow \text{APPLY FIX} \longrightarrow \text{TEST} \longrightarrow \text{VERIFY} \longrightarrow \text{ROLLBACK (IF FAILED)} \longrightarrow \text{REPORT}$$

---

## 2. Failure Classification & Remediation Strategies

| Failure Mode | Detection Signal | Remediation Action | Rollback / Fallback |
| :--- | :--- | :--- | :--- |
| **STT Provider Outage** | HTTP 429, 503, or timeout > 5s | Shift to secondary engine (Groq $\to$ OpenAI $\to$ Gemini Flash) | Degraded provider badge on UI; zero invented text |
| **TypeScript / Build Errors** | `tsc` exit code $\neq$ 0 | `DiffPatcher` extracts failing line and applies surgical search/replace patch | Reverts file to pre-edit git stash checkpoint |
| **Orphaned / Stalled Tasks** | Task in `RUNNING` state after process restart | `CrashRecovery.recoverInterruptedTasks()` audits and re-queues safe tasks | Tasks with modified files flagged `BLOCKED` for safety |
| **Provider Quota Depletion** | HTTP 429 quota exhausted | Trip circuit breaker on provider for 300 seconds; route to free-tier provider | Mark provider degraded; notify Master Sri |
| **Memory / Event Leak** | AudioContext or event listener count accumulation | Clean up audio streams, disconnect audio tracks, release WebSocket handles | Hard reset AudioContext instance |
| **Agent Process Crash** | Worker heartbeat missed for 30s | WorkerFabric spins down dead PID, starts fresh instance, resumes queue | Reconciles task status and records incident |

---

## 3. Surgical Diff Patching & Git Checkpoints

When `CodingExecutionLoop` performs a code repair:
1. **Pre-Flight Snapshot**: The target file is copied to `.test-artifacts/checkpoints/[file]_[timestamp].bak`.
2. **Deterministic Search & Replace**: `DiffPatcher` searches for the exact target lines. If the search block is ambiguous or missing, the patch **aborts immediately** rather than guessing line offsets.
3. **Verification Step**: `npm run build:server` or `npx tsc --noEmit` runs synchronously.
4. **Automated Rollback**: If verification fails after maximum retries (default: 3), the checkpoint is restored verbatim.
5. **Evidence Emission**: An evolution log `EVOLUTION-[DATE]-[ID]` is saved with the failure stack trace, proposed diff, and verification result.

---

## 4. Controlled Evolution Harness

When evaluating new capabilities or open-source libraries:
- **Sandbox Environment**: New packages are tested in an isolated sandbox (`workspace/sandbox/`).
- **License Check**: Incompatible licenses (e.g. non-commercial CC BY-NC-SA or viral GPL without clear boundary) are rejected.
- **Security Check**: Dependencies scanned for known CVEs and malicious install hooks.
- **Non-Regression Verification**: The 125-test master test suite is executed. If a single test fails, the evolution patch is discarded.
