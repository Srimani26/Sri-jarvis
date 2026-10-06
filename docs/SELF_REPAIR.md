# J.A.R.V.I.S. MARK-V — Self-Repair Engine

## 1. Classification of Failures
- **Transient**: Network 502/503/504, temporary rate limits. Strategy: Exponential backoff with jitter and automated provider failover.
- **Deterministic**: Syntax errors, broken TypeScript types, failed unit tests. Strategy: Invoke `CodingExecutionLoop` with surgical diff patcher.
- **Security / Permission**: Missing token, disallowed path. Strategy: Immediate halt; diagnose and `ASK_USER`.

## 2. Safe Repair Loop
```
Error Encountered -> Classify Signature -> Lookup Memory Store
  ├─ If known fix: Apply surgical patch -> Verify compilation
  └─ If novel: Coding agent diagnoses -> Generates minimal diff -> Runs test -> If green, persist to MemoryStore
```
