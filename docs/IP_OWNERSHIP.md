# J.A.R.V.I.S. (Just A Rather Very Intelligent System)
## Intellectual Property Ownership, Provenance & Legal Classification

**Document Version**: 2.0 (Phase 18 Production Foundation)  
**Classification Date**: October 2026  
**Subject**: Intellectual Property Ownership, Code Provenance, and Licensing Boundary  

---

## 1. Executive Statement of IP Policy

J.A.R.V.I.S. (Just A Rather Very Intelligent System) is an autonomous personal AI operating system developed by Srimani Kandan.

This document establishes a rigorous intellectual property boundary across all components of the repository. J.A.R.V.I.S. explicitly differentiates between:
1. **Original Intellectual Property**: Custom agent workforce implementations, orchestration logic, task lifecycle engines, and system architecture authored specifically for J.A.R.V.I.S.
2. **Third-Party Open-Source Software**: Upstream libraries and dependencies governed by their respective OSI-approved licenses.
3. **Derived / Adapted Open-Source Works**: Architectural implementations inspired by or conforming to external standards (such as MCP or OpenHands).
4. **Generated Code**: Automated code outputs produced by code generators (e.g., Prisma client, Vite bundles).
5. **External Services**: Remote foundational models and API endpoints.
6. **Areas Requiring Formal Legal Review**: Elements that may intersect with employer, contractor, or proprietary institutional agreements.

> **Legal Review Boundary Note**:  
> In engineering organizations, developers may be subject to contractual employment agreements, invention assignment clauses, or client non-disclosure agreements. This document does NOT make definitive statutory or judicial pronouncements regarding employment IP ownership that cannot be verified solely from the Git repository. Instead, it accurately catalogs the origins of the code and flags all areas where human and legal review is advised.

---

## 2. Repository Classification Matrix

| Directory / Component | IP Classification | Primary Owner / Origin | Applicable License / Terms | Review Status |
| :--- | :--- | :--- | :--- | :--- |
| `src/kernel/` (ExecutionKernel, TaskStore, EventStream, CrashRecovery) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/agents/` (AgentRegistry, AgentRuntime, 20 Specialist Agents) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/orchestrator/` (MissionOrchestrator) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/repair/` (SelfRepairEngine, DiagnosticResolver) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/evolution/` (SelfEvolutionEngine) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/observability/` (TelemetryHub) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/resources/` (ResourceRegistry, ResourceManager) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/workers/` (WorkerRegistry, WorkerExecutor) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/artifacts/` (ReportGenerator, DossierFormatter) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/voice/` (VoiceEngine, VAD, Barge-In) | **DERIVED_FROM_OSS** | Whisper/Piper patterns adapted by Srimani Kandan | MIT / Proprietary hybrid | CLEAR |
| `src/coding/` (CodingExecutionLoop, DiffPatcher) | **DERIVED_FROM_OSS** | OpenHands loop patterns adapted by Srimani Kandan | MIT / Proprietary hybrid | CLEAR |
| `src/browser/` (BrowserEngine, SecurityShield) | **DERIVED_FROM_OSS** | Playwright patterns + Custom prompt injection defense | Apache-2.0 / Proprietary hybrid | CLEAR |
| `src/mcp/` (MCPClientManager) | **DERIVED_FROM_OSS** | Anthropic MCP JSON-RPC protocol implementation | MIT License | CLEAR |
| `src/providers/` (ModelRouter, QuotaManager, Adapters) | **ORIGINAL** | Srimani Kandan | J.A.R.V.I.S. Proprietary | CLEAR |
| `src/generated/prisma/` | **GENERATED** | Prisma CLI generator | Apache-2.0 | CLEAR |
| `src/lib/open-agents.ts` | **NEEDS_REVIEW** | Legacy multi-agent framework wrappers (MetaGPT, Camel, LangGraph) | Upstream OSS licenses | REQUIRES LEGAL REVIEW |
| `@shogo-ai/sdk` references | **NEEDS_REVIEW** | Shogo Technologies Platform SDK integration | Shogo Terms / Apache-2.0 | REQUIRES LEGAL REVIEW |
| `node_modules/` | **THIRD_PARTY** | Upstream npm package authors | MIT, Apache-2.0, ISC, BSD | CLEAR |
| Google Gemini / Groq / Anthropic APIs | **EXTERNAL_SERVICE** | Google LLC, Groq Inc, Anthropic PBC | Commercial API Terms of Service | CLEAR |

---

## 3. Detailed Component Provenance

### 3.1 Original J.A.R.V.I.S. Work (`ORIGINAL`)
- **Scope**: All components located in `src/kernel/`, `src/agents/`, `src/orchestrator/`, `src/repair/`, `src/evolution/`, `src/observability/`, `src/resources/`, `src/workers/`, `src/artifacts/`, and custom state machines.
- **Provenance**: Designed, architected, and written specifically to realize the J.A.R.V.I.S. autonomous operating system vision.
- **Copyright Claim**: `Copyright © 2026 Srimani Kandan. All Rights Reserved.`

### 3.2 Adapted Open-Source Architectures (`DERIVED_FROM_OSS`)
- **Coding Loop**: Inspired by OpenHands (All-Hands-AI) search/replace methodology, re-implemented in TypeScript with strict capability security checks and automated rollbacks.
- **Model Context Protocol**: Implements Anthropic's open-standard Model Context Protocol JSON-RPC specification.
- **Voice Turn-Taking**: Uses standard Web Audio API / VAD silence algorithms conforming to open voice assistant patterns.

### 3.3 Generated Assets (`GENERATED`)
- **Prisma Client**: Generated dynamically by `npx prisma generate` based on `prisma/schema.prisma`.
- **Vite Production Bundles**: Compiled assets in `dist/` and `server.mjs`.

### 3.4 Upstream Dependencies (`THIRD_PARTY`)
- All 17 production runtime dependencies and 12 development dependencies installed via npm.
- Detailed in `THIRD_PARTY_LICENSES.md` and `docs/OPEN_SOURCE_LICENSE_REGISTRY.md`.
- No proprietary J.A.R.V.I.S. ownership is claimed over any third-party npm package.

### 3.5 Areas Requiring Legal / Employment Review (`NEEDS_REVIEW`)
1. **Employment & Contractor Intellectual Property Inventions**:
   - If work on J.A.R.V.I.S. was performed on employer-owned equipment, during working hours, or using confidential business context of an employer or client (e.g., historical client references or previous repositories), an intellectual property assignment review by independent counsel is recommended.
   - Srimani Kandan should verify that all personal AI operating system IP is cleanly partitioned from any employer invention assignment agreements.
2. **Third-Party Platform Framework Wrappers (`open-agents.ts`, `@shogo-ai/sdk`)**:
   - The repository contains legacy adapter wrappers referencing Shogo Technologies and third-party multi-agent frameworks (CrewAI, MetaGPT, LangGraph).
   - These modules are currently marked for deprecation in favor of the canonical J.A.R.V.I.S. 20-agent workforce and should undergo final IP cleanup prior to commercial distribution.

---

## 4. IP Protection & Compliance Checklist

- [x] Clear proprietary LICENSE created for original J.A.R.V.I.S. components.
- [x] Clear COPYRIGHT file acknowledging third-party open-source authors.
- [x] Complete THIRD_PARTY_LICENSES.md cataloging all npm and cloud dependencies.
- [x] Formal open-source registry in `docs/OPEN_SOURCE_LICENSE_REGISTRY.md`.
- [x] Zero false ownership claims over third-party open-source code.
- [x] Explicit flagging of areas requiring legal review.
