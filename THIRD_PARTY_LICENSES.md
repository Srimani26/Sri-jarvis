# J.A.R.V.I.S. — Third-Party Software & Dependency Licenses

**Product**: J.A.R.V.I.S. (Just A Rather Very Intelligent System)  
**Document**: Third-Party Licenses & Legal Obligations  
**Last Updated**: October 2026  

J.A.R.V.I.S. incorporates and interfaces with external open-source libraries, runtimes, model interfaces, and developer SDKs. In accordance with open-source compliance standards, this document records all third-party dependencies, licenses, copyright holders, modifications, and statutory obligations.

---

## 1. Direct NPM Dependencies

### 1.1 `@hono/node-server` & `hono`
- **Version**: `^4.0.0`
- **Source**: [https://github.com/honojs/hono](https://github.com/honojs/hono)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) 2021-present Yusuke Wada and Hono contributors
- **Modified**: No (imported directly as dependency).
- **Attribution Requirement**: Yes, include copyright notice and license text in distributions.
- **Commercial Use**: Permitted without royalty.
- **Redistribution Requirements**: Retain copyright and permission notice.
- **URL**: [https://hono.dev](https://hono.dev)

### 1.2 `@modelcontextprotocol/sdk`
- **Version**: `^1.32.0`
- **Source**: [https://github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) Anthropic, PBC.
- **Modified**: No (used for MCP client and tool protocol definitions in `src/mcp/MCPClientManager.ts`).
- **Attribution Requirement**: Yes, retain copyright and permission notice.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain license text.
- **URL**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

### 1.3 `@prisma/client`, `@prisma/adapter-pg`, `@prisma/adapter-libsql`
- **Version**: `^7.3.0` / `^7.10.0`
- **Source**: [https://github.com/prisma/prisma](https://github.com/prisma/prisma)
- **License**: Apache-2.0
- **Copyright Holder**: Copyright (c) Prisma Data, Inc.
- **Modified**: No (client generated via standard Prisma CLI).
- **Attribution Requirement**: Yes, must give recipients a copy of the Apache-2.0 license and cause modified files to carry prominent notices.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: State changes if any, retain copyright, patent, trademark, and attribution notices.
- **URL**: [https://www.prisma.io](https://www.prisma.io)

### 1.4 `pg` (node-postgres) & `@types/pg`
- **Version**: `^8.23.1`
- **Source**: [https://github.com/brianc/node-postgres](https://github.com/brianc/node-postgres)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) 2010-2024 Brian Carlson
- **Modified**: No.
- **Attribution Requirement**: Yes, retain notice.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain license text.
- **URL**: [https://node-postgres.com](https://node-postgres.com)

### 1.5 `ai` (Vercel AI SDK)
- **Version**: `^7.0.112`
- **Source**: [https://github.com/vercel/ai](https://github.com/vercel/ai)
- **License**: Apache-2.0
- **Copyright Holder**: Copyright (c) Vercel, Inc.
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Apache-2.0 notice retention.
- **URL**: [https://sdk.vercel.ai](https://sdk.vercel.ai)

### 1.6 `react` & `react-dom`
- **Version**: `^19.0.0`
- **Source**: [https://github.com/facebook/react](https://github.com/facebook/react)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) Meta Platforms, Inc. and affiliates
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain license notice.
- **URL**: [https://react.dev](https://react.dev)

### 1.7 `mobx` & `mobx-react-lite`
- **Version**: `^6.13.0` / `^4.0.0`
- **Source**: [https://github.com/mobxjs/mobx](https://github.com/mobxjs/mobx)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) 2015 Michel Weststrate
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain notice.
- **URL**: [https://mobx.js.org](https://mobx.js.org)

### 1.8 `radix-ui` / `@radix-ui/react-*`
- **Version**: `^1.4.3`
- **Source**: [https://github.com/radix-ui/primitives](https://github.com/radix-ui/primitives)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) 2022 WorkOS
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain notice.
- **URL**: [https://www.radix-ui.com](https://www.radix-ui.com)

### 1.9 `lucide-react`
- **Version**: `^0.563.0`
- **Source**: [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)
- **License**: ISC License
- **Copyright Holder**: Copyright (c) Lucide Contributors
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain ISC license notice.
- **URL**: [https://lucide.dev](https://lucide.dev)

### 1.10 `jsonwebtoken` & `bcryptjs`
- **Version**: `^9.0.3` / `^3.0.3`
- **Source**: [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [https://github.com/dcodeIO/bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **License**: MIT License / Apache-2.0
- **Copyright Holder**: Copyright (c) Auth0 / Daniel Wirtz
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Standard notice retention.
- **URL**: [https://jwt.io](https://jwt.io)

### 1.11 `otplib` & `qrcode`
- **Version**: `^13.5.0` / `^1.5.4`
- **Source**: [https://github.com/yeojinj/otplib](https://github.com/yeojinj/otplib)
- **License**: MIT License
- **Copyright Holder**: Copyright (c) Gerald Yeo
- **Modified**: No.
- **Attribution Requirement**: Yes.
- **Commercial Use**: Permitted.
- **Redistribution Requirements**: Retain license text.

---

## 2. External AI Foundations & API Services

### 2.1 Google Gemini (Gemini 2.5 Flash, 2.5 Pro)
- **Provider**: Google LLC
- **Integration**: REST API / Official SDK adapters (`src/providers/adapters/GeminiAdapter.ts`)
- **Terms / License**: Google Cloud Terms of Service & Gemini API Additional Terms
- **Obligations**: Comply with Acceptable Use Policy, do not scrape credentials, respect rate limits.
- **Commercial Restrictions**: Governed by tier (Free tier allows personal and prototyping usage; paid tier allows commercial deployment).
- **Data Privacy**: No training on paid API inputs; free tier usage subject to standard terms.

### 2.2 Groq LPU Fast Inference
- **Provider**: Groq, Inc.
- **Integration**: REST API (`src/providers/adapters/GroqAdapter.ts`)
- **Terms / License**: Groq Terms of Service & API License
- **Obligations**: Standard API token authorization; rate limits.
- **Commercial Restrictions**: Subject to Groq commercial service agreement.

### 2.3 Ollama Local Engine (Llama 3, DeepSeek, Mistral)
- **Provider / Project**: Ollama Community
- **Integration**: Local loopback HTTP (`http://localhost:11434`)
- **License**: MIT License
- **Model Weights**: Meta Llama 3 Community License / DeepSeek Open License
- **Obligations**: Self-hosted; local inference. Comply with Llama 3 acceptable use policy if monthly active users exceed 700 million.
- **Commercial Restrictions**: Permitted for private, internal, and commercial use.

### 2.4 Anthropic Claude (Claude 3.7 Sonnet)
- **Provider**: Anthropic, PBC.
- **Integration**: API endpoints
- **Terms / License**: Anthropic Commercial Terms of Service
- **Obligations**: Usage policies, prompt safety guidelines.

---

## 3. Adapted Open-Source Architectural Patterns

### 3.1 Model Context Protocol (MCP)
- **Origin**: Anthropic, PBC.
- **License**: MIT License
- **Status in JARVIS**: Standard JSON-RPC protocol implementation in `src/mcp/MCPClientManager.ts`. Tool permissions strictly governed by J.A.R.V.I.S. capability security.

### 3.2 OpenHands Coding Agent Loop
- **Origin**: All-Hands-AI (OpenHands)
- **License**: MIT License
- **Status in JARVIS**: Architectural inspiration for search/replace patch workflows and verification loops in `src/coding/CodingExecutionLoop.ts`.

### 3.3 Whisper & Piper Audio Processing
- **Origin**: OpenAI (Whisper), Michael Hansen (Piper)
- **License**: MIT License
- **Status in JARVIS**: Offloaded to distributed worker (`workers/jarvis-worker/`) for high-fidelity speech-to-text and audio synthesis without loading Render memory.

---

## 4. Summary of Legal Compliance

| License Type | Dependency Count | Permitted for Commercial Use | Action Required |
| :--- | :--- | :--- | :--- |
| **MIT** | 12 | Yes | Retain copyright & permission notice |
| **Apache-2.0** | 4 | Yes | Retain notices, provide Apache license text, note modifications |
| **ISC** | 1 | Yes | Retain copyright notice |
| **Llama 3 Community** | 1 (weights) | Yes | Comply with Meta usage guidelines |
| **Proprietary API** | 4 | Yes (per tier) | Comply with cloud provider terms of service |

J.A.R.V.I.S. complies fully with all upstream licenses and imposes no incompatible restrictions on open-source code.
