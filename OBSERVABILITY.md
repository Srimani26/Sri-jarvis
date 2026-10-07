# J.A.R.V.I.S. Real-Time Observability & Telemetry Hub
**Document**: Real-Time Observability, Event Bus, Metrics & Dashboard Spec  
**System**: J.A.R.V.I.S. MARK-V Observability Subsystem  
**Owner**: Master Sri  
**Status**: Production Verified  

---

## 1. Observability Architecture

Observability in J.A.R.V.I.S. guarantees that Master Sri sees actual execution progress rather than synthetic placeholders.

```
[Agent Action / Tool Execution]
              │
              ▼
    [Kernel Event Logger]
              │
       ┌──────┴──────┐
       ▼             ▼
 [SQLite dev.db]  [SSE Stream: /api/tasks/stream]
 (TaskEvent Table)   │
                     ▼
           [ActiveTaskExecutionPanel]
             ├── Task ID (e.g. TASK-V5-103628)
             ├── Assigned Specialist Agent Badge
             ├── Current Operation & Current Tool
             ├── Step Counter (Step X of Y)
             ├── Live Elapsed Counter (MM:SS)
             ├── Range-Based ETA (e.g. 2-5 min)
             ├── Verification Checklist Evidence
             └── Collapsible Artifact Deliverables
```

---

## 2. Real-Time Execution Panel UI Specification

The live execution cockpit (`ActiveTaskExecutionPanel.tsx`) rendered in `CommandCenter.tsx` features:

```
┌─────────────────────────────────────────────────────────────────┐
│ TASK-V5-103628042                               [RUNNING] ⚡   │
│ Build Standard Roof Landing Page & Pricing Matrix               │
├─────────────────────────────────────────────────────────────────┤
│ Assigned Agent: AEGIS (Software Engineer)                       │
│ Current Tool:   execute_code                                    │
│ Current Action: Compiling React 19 UI component & testing diff │
│ Step Progress:  Step 3 of 6 (50%)                              │
│ Elapsed:        01:42                                           │
│ ETA:            2 - 4 min (Range-based estimate)                │
│ Retries:        0                                               │
├─────────────────────────────────────────────────────────────────┤
│ Verification Evidence:                                          │
│ [PASS] TypeScript compiler passed with 0 errors                 │
│ [WAIT] Browser sandbox screenshot pending render                │
├─────────────────────────────────────────────────────────────────┤
│ Technical Deliverables:                                         │
│ └── src/surfaces/StandardRoofLanding.tsx (Scaffolded)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Telemetry & Health Endpoints

### `GET /api/tasks`
Returns current task summary and active queue:
```json
{
  "timestamp": "2026-10-07T05:40:00.000Z",
  "summary": {
    "total": 42,
    "active": 1,
    "completed": 39,
    "failed": 2,
    "blocked": 0
  },
  "tasks": [...]
}
```

### `GET /api/tasks/stream`
Server-Sent Events (SSE) stream adhering to W3C EventSource specifications. Emits structured `KernelEvent` JSON payloads:
```
data: {"id":"evt_1728279600","taskId":"TASK-V5-001","eventType":"TASK_STEP_PROGRESS","message":"Step 2 of 4 completed","timestamp":"2026-10-07T05:40:01Z"}
```

### `GET /api/agents/health`
Factual health telemetry for all 20 workforce agents:
- `agentId`, `name`, `role`, `registered: true`
- `health`: `'HEALTHY'` | `'DEGRADED'` | `'UNAVAILABLE'`
- `invocations`, `successes`, `failures`, `avgDurationMs`, `successRate`

### `GET /api/auth/diagnostics`
Session lifecycle diagnostics showing token age, expiration timestamp, active bearer mode, and refresh status.
