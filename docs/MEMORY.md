# J.A.R.V.I.S. MARK-V — Memory Store & Retrieval

## 1. Scoped Memory Planes
JARVIS implements isolated memory planes to prevent cross-contamination:
- `USER_PROFILE`: Master Sri preferences, role, communication style, authorized keys.
- `TASK_HISTORY`: Historical mission outcomes, execution duration, and costs.
- `FAILURE_FIXES`: Verified error signatures and exact code/patch resolutions.
- `TEMPORAL`: Short-lived session context with automatic TTL expiration.

## 2. Invalidation & Maintenance
- Expired temporal memories are automatically evicted during scheduled maintenance jobs.
- High-confidence failure fixes are indexed by deterministic error signatures to achieve instant self-repair.
