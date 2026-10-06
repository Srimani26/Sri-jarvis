# J.A.R.V.I.S. MARK-V — Worker Security & Sandboxing

## 1. Capability Tokens
The worker operates strictly under capability token enforcement:
- `LOCAL_LLM`: Required to execute local Ollama inference.
- `LOCAL_BROWSER`: Required to execute Playwright automation.
- `WORKSPACE_FILES`: Required for sandboxed filesystem reads/writes.
- `TERMINAL`: Required to run shell commands.
- `LOCAL_STT`: Speech-to-text inference.
- `LOCAL_TTS`: Audio synthesis.

If a cloud task requests an action for which the worker lacks a token, execution is immediately rejected with `CAPABILITY_DENIED`.

## 2. Filesystem Sandboxing
- All worker filesystem operations are strictly confined to `workspacePath` (e.g. `E:\JARVIS\workspace`).
- Any attempt to use directory traversal (`..`) outside the workspace root throws `SANDBOX_VIOLATION`.
- System directories (`C:\Windows`, `System32`), SSH keys (`~/.ssh`), and browser credential profiles are permanently unreachable.
