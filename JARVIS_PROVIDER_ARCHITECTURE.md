# J.A.R.V.I.S. — MODEL PROVIDER FABRIC & CAPABILITY ROUTER ARCHITECTURE

**System**: Sri's J.A.R.V.I.S. Mark-V // Sovereign AI Business OS  
**Subsystem**: Multi-Provider Dynamic Router & Resilience Fabric  
**Implementation**: `src/providers/CapabilityRegistry.ts` and `src/ai/ModelRouter.ts`

---

## 1. Core Principles & Security Invariants

1. **Zero Leaked / Scraped Keys**: J.A.R.V.I.S. strictly uses API keys legitimately provisioned in environment variables (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`). Searching the Internet for leaked keys is prohibited by design.
2. **Zero Frontend Exposure**: No API keys are EVER returned in client responses, bundled in Vite output, or rendered in HTML. All LLM calls pass through the Hono backend proxy (`POST /api/ai/chat` or `/api/agents/dispatch`).
3. **Dynamic Capability Routing**: Requests are routed based on required task capabilities (e.g. `multimodal`, `code`, `high_context`, `json_mode`, `speed`) rather than hardcoded provider names.
4. **Empirically Verified Failover**: Failover is only marked operational when tested against active authenticated endpoints with observed circuit breaker trip and recovery.

---

## 2. Provider Inventory & Capability Matrix

| Provider ID | Environment Variable | Active Models | Key Capabilities | Auth Status | Default Latency | Quota / Rate Limits | Circuit Breaker State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **gemini** | `GEMINI_API_KEY` | `gemini-1.5-flash`, `gemini-1.5-pro` | `multimodal_audio`, `vision`, `high_context` (1M+), `code`, `structured_json` | **CONFIGURED** | 363ms - 545ms | 15 RPM (Free) / 1,000 RPM (Paid) | **CLOSED** (Operational) |
| **groq** | `GROQ_API_KEY` | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` | `fast_tool_calling`, `low_latency`, `text_generation` | Configurable | 180ms - 320ms | 30 RPM / 6,000 TPM | **CLOSED** (Standby) |
| **openrouter** | `OPENROUTER_API_KEY` | `anthropic/claude-3.5-sonnet`, `deepseek/deepseek-r1` | `deep_reasoning`, `complex_code`, `academic_research` | Configurable | 850ms - 1,800ms | Pay-as-you-go credit pool | **CLOSED** (Standby) |
| **ollama** | `OLLAMA_BASE_URL` | `qwen2.5-coder:7b`, `llama3.1:8b` | `local_privacy`, `offline_execution` | Local Workstation | 2,500ms | Unlimited local compute | **OPEN** (Disabled in Cloud) |

---

## 3. Resilience Engine: Circuit Breakers, Retries & Failover

```mermaid
graph TD
    Request["Agent Task Request (Capabilities: [code, speed])"] --> Router["CapabilityRegistry.routeTask()"]
    
    Router --> Primary{"Primary Provider Healthy & Circuit CLOSED?"}
    Primary -->|Yes| ExecPrimary["Execute Primary (Gemini)"]
    Primary -->|No (Circuit OPEN / Rate Limited)| Failover1["Failover to Secondary (Groq)"]
    
    ExecPrimary --> Check1{"Response OK (200)?"}
    Check1 -->|Yes| Success["Reset Failure Counter -> Return Result"]
    Check1 -->|Timeout / 429 / 5xx| Trip1["Increment Failure Count -> Trip Circuit Breaker"]
    Trip1 --> Failover1
    
    Failover1 --> Check2{"Secondary Response OK?"}
    Check2 -->|Yes| Success2["Log Telemetry -> Return Result"]
    Check2 -->|Fail| Failover2["Failover to Tertiary (OpenRouter)"]
    
    Failover2 --> FinalCheck{"Tertiary OK?"}
    FinalCheck -->|Yes| Success3["Return Result"]
    FinalCheck -->|Fail| SafeError["Exhausted Provider Fallback -> Enter Safe Recovery"]
```

### 3.1 Circuit Breaker Finite State Machine
- **CLOSED**: Provider is operating normally. Requests flow without restriction.
- **OPEN**: Triggered after **3 consecutive failures** (HTTP 429, 500, or $>15,000\text{ms}$ timeout). All new requests immediately bypass this provider without attempting network connections.
- **HALF_OPEN**: After a cooldown window of **60 seconds**, the circuit breaker permits a single canary probe request. If the canary succeeds, the breaker resets to **CLOSED**; if it fails, it returns to **OPEN** for another 120 seconds.

### 3.2 Exponential Backoff & Jitter
When retrying transient network errors (socket reset, DNS lookup timeout):
$$t_{\text{wait}} = \min(t_{\text{max}}, t_{\text{base}} \times 2^{\text{attempt}}) \pm \text{jitter}$$
- $t_{\text{base}} = 500\text{ms}$
- $t_{\text{max}} = 5,000\text{ms}$
- Maximum retry count: $3$ attempts before triggering failover.

---

## 4. Capability Matching Heuristic

When an agent requests an LLM inference, it passes capability flags:
- `taskType: 'code'`: Prioritizes models with proven benchmark scores on coding (`gemini-1.5-flash`, `claude-3.5-sonnet`).
- `taskType: 'voice_stt'`: Requires `multimodal_audio` support (routes directly to Gemini audio cascade).
- `taskType: 'fast_chat'`: Prioritizes lowest latency provider with circuit breaker in `CLOSED` state (Groq Llama-3.3 or Gemini Flash).
- `taskType: 'deep_research'`: Requires context window $\ge 128\text{K}$ tokens (Gemini 1.5 Pro or Claude 3.5 Sonnet).

---

## 5. Live Production Health Monitoring Endpoints

- `GET /api/providers/registry`: Returns public provider health summary without exposing secret keys.
- `POST /api/providers/health/:id`: Triggers an active live ping against the provider's API endpoint, recording latency and connectivity.
- `POST /api/providers/route`: Evaluates task requirements and returns the optimal active provider routing decision.
