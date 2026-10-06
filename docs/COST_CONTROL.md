# J.A.R.V.I.S. MARK-V — Cost Control & Resource Economics

## 1. Zero-Cost Priority
JARVIS enforces a Free-First / Local-First allocation policy:
- Free APIs and local models are prioritized for all standard workloads.
- Premium models (e.g. Claude 3.7, GPT-4o) are restricted to complex reasoning or explicit user requests.

## 2. Token & Budget Monitoring
- `ResourceManager.ts` continuously estimates and tracks USD consumption based on published token prices.
- 24/7 background monitors execute deterministically without consuming LLM inference quota.
