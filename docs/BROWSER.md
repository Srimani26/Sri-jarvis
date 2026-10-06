# J.A.R.V.I.S. MARK-V — Browser Engine & Automation

## 1. Cloud vs Worker Separation
- **Cloud (Render)**: HTTP-based DOM scraper with prompt-injection defense (`src/browser/BrowserEngine.ts`, `src/browser/SecurityShield.ts`).
- **Workstation Worker (PC Worker)**: Full headless Playwright / Chromium engine capable of complex JavaScript execution, interactive clicks, multi-page flows, and screenshot capture.

## 2. Adversarial Protection
- `SecurityShield` scans all retrieved web content for prompt injection vectors ("Ignore previous instructions", "SYSTEM OVERRIDE", hidden CSS comments).
- Web content is permanently labeled as untrusted context and stripped of executable script blocks before passing to agents.
