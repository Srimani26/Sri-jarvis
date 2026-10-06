# J.A.R.V.I.S. (Just A Rather Very Intelligent System)
## System Security Model, Defense Architecture & Incident Response

**Document Version**: 2.0 (Phase 18 Production Foundation)  
**Security Posture**: Defense-in-depth, capability-based least privilege, automated detection, deterministic containment, observable verification, and rollback.  

---

## 1. Security Philosophy & Principles

The J.A.R.V.I.S. operating system adheres to the core principle:  
**"LLM output is never proof that an action is safe, nor proof that an action succeeded."**

J.A.R.V.I.S. explicitly avoids claims of being "100% secure", "unhackable", or "immune to prompt injection". Modern distributed AI operating systems operate in adversarial environments. Therefore, our security model is engineered around a continuous cycle of:

```
PREVENT  ───►  DETECT  ───►  CONTAIN  ───►  INVESTIGATE  ───►  RECOVER  ───►  REPAIR  ───►  VERIFY  ───►  ROLLBACK
```

---

## 2. Authentication & Authorization Boundaries

### 2.1 API & Session Authentication
- **Mechanism**: JWT tokens signed with HMAC-SHA256 using an ephemeral/persistent secret (`JWT_SECRET` / `.jarvis-secret`).
- **Storage**: Never committed to Git. If `.jarvis-secret` is stored on disk, file permissions are restricted to `0600` (user read/write only).
- **Session Expiry**: Sessions are bounded with explicit expiration timestamps and revoked on logout or token rotation.

### 2.2 Capability-Based Worker Authorization
- Distributed worker nodes (e.g. local workstation daemons executing coding, browser automation, or terminal commands) require cryptographically verified **Capability Tokens**.
- A worker node cannot execute arbitrary tasks simply by connecting; each task payload must provide a valid `capabilityToken` matching the requested permission scope:
  - `FILE_SYSTEM_WRITE`: Sandboxed directory writing.
  - `TERMINAL_EXEC`: Strictly filtered command line execution.
  - `LOCAL_INFERENCE`: Access to local Ollama/GPU inference.
- Workers reject any payload missing the required capability token with an explicit security violation error.

---

## 3. Sandboxing & Execution Controls

### 3.1 Filesystem Boundaries
- **Workspace Confinement**: All file read/write operations must resolve within the designated workspace root directory.
- **Path Traversal Blocking**: Path normalization intercepts and rejects directory traversal payloads (e.g., `../../etc/passwd`, `C:\Windows\System32`, relative dot-dot escapes).
- **Atomic File Writing**: File updates use atomic writes or verified diff patches with automatic rollback on error.

### 3.2 Terminal Execution Controls (Policy Ceilings)
- Direct arbitrary shell execution is blocked by policy ceilings.
- **Disallowed Command Patterns**: Commands attempting destructive deletion (`rm -rf /`, `del /s /q C:\`), privilege escalation, background persistence modification, or unauthorized outbound tunneling are intercepted and terminated before process spawn.
- **Command Output Redaction**: Stdout/stderr streams are piped through the secret redaction filter before storage in the database or dispatch to SSE event streams.

### 3.3 Prompt-Injection Defense (`SecurityShield`)
- **Direct & Indirect Injection Detection**: Inputs from web browsing, untrusted files, user chat, and third-party API payloads pass through the multi-layer `SecurityShield`.
- **Classification**: Detects adversarial directives attempting to override system prompts, extract hidden API keys, evade sandboxes, or perform privilege escalation.
- **Adversarial Web Content Treatment**: When the browser agent navigates external web pages, the DOM text is tagged as `UNTRUSTED_EXTERNAL_DATA` and stripped of instruction-mimicking tokens before reasoning.

---

## 4. Secret Handling & Redaction Architecture

### 4.1 Strict Exclusion from Git
- **Rule**: Zero API keys, passwords, private keys, database connection strings, or personal access tokens may ever be committed to Git.
- **Remediation**: Historical commits containing exposed credentials must be scrubbed using Git history rewriting tools (e.g., `git-filter-repo`), verified with comprehensive pattern audits, and backed up to separate safety tags before history changes.
- **Scanner Verification**: The repository runs `scripts/security-audit.ts` to scan:
  - Base64-obfuscated credential strings
  - Plaintext provider patterns (`AIza...`, `gsk_...`, `sk-ant-...`, `ghp_...`)
  - Working tree files and commit blobs

### 4.2 Logging & API Redaction
- System logs, telemetry traces, and API responses (e.g. `/api/resources`, `/api/health/*`) mask all sensitive credential material with `[MASKED_SECRET]` or report only status (`CONFIGURED` / `NOT_CONFIGURED`).
- Neither raw keys nor decoded tokens are ever returned to the client or embedded into frontend web bundles.

---

## 5. Provider Security & Circuit Breakers

### 5.1 Quota & Rate Limit Protection
- When an upstream provider returns HTTP 429 or quota exhaustion, `QuotaManager` transitions the provider to `RATE_LIMITED` and applies bounded exponential backoff (initial 5s, ceiling 300s).
- **No Quota Bypass**: J.A.R.V.I.S. never attempts unauthorized proxying or rotation to circumvent legitimate provider rate limits.

### 5.2 Provider Outages & Auth Failures
- Repeated 5xx errors or connection timeouts trip the circuit breaker in `ProviderRegistry`, automatically marking the provider unhealthy and rerouting traffic to verified secondary fallbacks.
- Authentication failures (401/403) transition the provider to `AUTH_FAILED` and halt further requests to avoid account lockouts.

---

## 6. Incident Response & Disaster Recovery

When an anomaly, integrity violation, or compromise is detected, the system triggers the following protocol:

1. **CONTAIN**:
   - Immediately suspend task execution for the affected session or worker.
   - If a provider credential failure occurs, mark provider as `DISABLED`.
   - If a filesystem error occurs, execute atomic rollback via `DiffPatcher` or git checkout of the affected files.

2. **INVESTIGATE**:
   - Query `TelemetryHub` and `ActivityLog` for exact execution traces, tool names, parameters, and callers.
   - Inspect Task events for exact error messages and exit codes.

3. **REPAIR & RECOVER**:
   - `CrashRecovery` scans the database on boot, identifies orphaned in-flight tasks (`RUNNING` state), safely re-queues safe idempotent tasks, and blocks mutating tasks for human review.
   - Database migrations use deterministic Prisma schemas with PostgreSQL compatibility.

4. **VERIFY**:
   - Execute verification tests (`npm test`, reality-verification missions) to prove that the repair resolved the defect.
   - Confirm with verifiable artifacts, status codes, and terminal output.

5. **ROLLBACK**:
   - If verification fails after maximum retry attempts (e.g., 3 attempts), revert the working tree to the prior verified snapshot.

---

## 7. Repository Protection Recommendations

To maintain production integrity on GitHub:
1. **Branch Protection on `main`**:
   - Require pull request reviews prior to merging.
   - Require status checks to pass (`npm test`, `npx tsc --noEmit`).
   - Disallow force pushes (except under documented human-approved security history rewriting).
2. **Secret Scanning & Push Protection**:
   - Enable GitHub Secret Scanning and Push Protection to prevent future accidental secret commits.
3. **Reproducible Builds**:
   - Use `package-lock.json` and strict npm version pinning.
4. **Disaster Recovery Backup Strategy**:
   - Before any destructive history rewrite, push safety tags (e.g., `backup/pre-security-remediation`).
   - Maintain off-site database backups when running Managed PostgreSQL.
