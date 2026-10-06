# J.A.R.V.I.S. MARK-V — Operational Troubleshooting

## 1. Common Scenarios & Resolutions

### 1.1 "API rate limit exceeded (429)"
- **Cause**: Free tier RPM limit reached on primary provider.
- **Action**: JARVIS automatically trips circuit breaker and falls over to backup free providers (e.g. Gemini -> Groq -> OpenRouter). No manual intervention needed.

### 1.2 "OLLAMA_OFFLINE: Local Ollama daemon unreachable"
- **Cause**: Ollama service is not running on localhost.
- **Action**: Run `ollama serve` or start Ollama app. Cloud orchestrator automatically routes tasks to cloud free tiers until Ollama comes online.

### 1.3 "SANDBOX_VIOLATION: Path escapes workspace root"
- **Cause**: An agent attempted to access files outside the authorized workspace directory.
- **Action**: Verify file path arguments. Ensure targeted files are located within the configured workspace.

### 1.4 "Worker OFFLINE"
- **Cause**: Heartbeat expired (>60s).
- **Action**: Check if `jarvis-worker start` is running on workstation. The worker will automatically reconnect on next heartbeat.
