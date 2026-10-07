# J.A.R.V.I.S. Third-Party Software Notices & IP Audit
**Project**: J.A.R.V.I.S. Sovereign AI Operating System  
**Repository**: `Srimani26/standardroofs-jarvis`  
**License**: Apache License 2.0 (Repository Baseline)  
**Date of Audit**: October 7, 2026  

---

## 1. Intellectual Property & Licensing Categorization

To maintain compliance and protect commercial deployment viability, all components within the J.A.R.V.I.S. ecosystem are categorized into distinct intellectual property tiers:

- **Tier A: Original J.A.R.V.I.S. Code**: Core application logic, task orchestration, agent state machines, and customized surfaces authored for Master Sri (Srimanikandan K).
- **Tier B: Permissive Open-Source Dependencies**: Third-party libraries licensed under MIT, Apache-2.0, or BSD licenses included via `package.json`.
- **Tier C: Evaluated Open-Source Capability Architecture**: Upstream open-source designs, patterns, and SDK integrations selectively adapted for J.A.R.V.I.S. capabilities.
- **Tier D: Third-Party AI Models & Model Weights**: Foundation model endpoints and open weight distributions.

---

## 2. Upstream Open-Source Capability Review & Notices

The following state-of-the-art open source projects were studied and evaluated for integration into the J.A.R.V.I.S. operating system:

| Project | Origin / Repository | License | Integration Status | Audit / Compliance Notes |
| :--- | :--- | :--- | :--- | :--- |
| **OpenJarvis** | `OpenJarvis/OpenJarvis` | Apache-2.0 | Architecture Study | Compatible with Apache-2.0 repo. Local-first personal AI patterns, memory isolation, and tool routing reviewed. |
| **Open Interpreter** | `openinterpreter/open-interpreter` | Apache-2.0 | Pattern Integration | Sandboxed execution loops and computer-use abstractions reviewed. |
| **OpenHands** | `All-Hands-AI/OpenHands` | MIT | Pattern Integration | Durable multi-agent state machines, step event streaming, and verification loops adapted. Fully compatible. |
| **Browser Use** | `browser-use/browser-use` | MIT | Tool Specification | Headless DOM indexing, screenshot capture, and interactive element extraction patterns adapted. Fully compatible. |
| **Silero VAD** | `snakers4/silero-vad` | MIT | Algorithm Reference | High-performance enterprise voice activity detection and silence gating patterns adapted. Fully compatible. |
| **faster-whisper** | `SYSTRAN/faster-whisper` | MIT | Fallback Engine Spec | CTranslate2-accelerated Whisper inference architecture specified for local fallback deployment. Fully compatible. |
| **Ultron (Sagar Builds)**| `SAGAR-TAMANG/ultron-by-sagar-builds` | MIT | UI / UX Reference | Visual hierarchy, Three.js reactor structures, and HUD ergonomics studied. Fully compatible. |
| **openWakeWord** | `dscripka/openWakeWord` | **Apache-2.0 (Code) / CC BY-NC-SA 4.0 (Pretrained Models)** | Conditional / Constrained | **LEGAL WARNING**: Code is Apache-2.0, but default pretrained model weights are CC BY-NC-SA 4.0 (Non-Commercial). In commercial production, only custom-trained models with permissive weights may be utilized. |
| **Kokoro TTS** | `hexgrad/kokoro` | Apache-2.0 | TTS Evaluation | Highly efficient sub-second TTS engine weights. Permissively licensed. |
| **Piper TTS** | `rhasspy/piper` (OHF-Voice) | **GPLv3** | **EXCLUDED FROM CORE BUNDLE** | **LEGAL RESTRICTION**: Newer Piper implementations under `piper1-gpl` are licensed under GNU GPLv3. To preserve the permissive Apache-2.0 licensing of J.A.R.V.I.S., GPL code is strictly isolated as an optional decoupled microservice. |

---

## 3. Direct Runtime NPM Dependencies

| Package | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `react` | 19.0.0 | MIT | User Interface Library |
| `react-dom` | 19.0.0 | MIT | DOM Renderer |
| `vite` | 7.3.6 | MIT | Frontend Build Tool |
| `esbuild` | 0.25.0 | MIT | High-Performance Server Bundler |
| `@prisma/client` | 6.5.0 | Apache-2.0 | SQLite Database Client |
| `prisma` | 6.5.0 | Apache-2.0 | Database Migrations & Engine |
| `lucide-react` | 1.16.0 | ISC | High-Fidelity HUD Icons |
| `tailwindcss` | 4.0.0 | MIT | Utility-First Styling |
| `clsx` | 2.1.1 | MIT | Dynamic Class Utility |
| `tailwind-merge` | 3.0.2 | MIT | Tailwind Class Resolution |

---

## 4. Repository License Disclosure

The repository is currently published with an **Apache License 2.0**.
If Master Sri intends to transition proprietary components (such as private enterprise trading algorithms or proprietary prompt chains) to a closed-source distribution, the Apache-2.0 license file should be formally updated through an explicit legal directive, rather than informal changes. All third-party attribution notices must remain preserved.
