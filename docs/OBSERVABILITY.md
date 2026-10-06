# J.A.R.V.I.S. MARK-V — Observability & Telemetry

## 1. Real Metrics Engine
`TelemetryHub.ts` captures operational telemetry across the system:
- **System Metrics**: Process uptime, resident memory, CPU load.
- **Provider Performance**: Requests, total tokens, 429 rate limit counts, estimated cost.
- **Agent Metrics**: Tasks completed, active tasks, error rates, average step latency.
- **Worker Node Status**: Heartbeat freshness, connected status, capability tokens.

## 2. Real-Time Streaming
All events stream via Server-Sent Events (SSE) from `/api/stream` using the standard W3C EventSource protocol.
