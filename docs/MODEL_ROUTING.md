# J.A.R.V.I.S. MARK-V — Model Routing V2

## 1. Routing Hierarchy
```
1. LOCAL / SELF-HOSTED (Ollama)
2. LEGITIMATE FREE (Gemini 2.5 Flash / Groq)
3. EXISTING USER-AUTHORIZED (Community / OpenRouter :free)
4. LOW-COST
5. PAID PREMIUM
```

## 2. Dynamic Task Classification
The router classifies every mission before selecting a model:
- `simple_chat` / `classification` -> Ultra-fast free model (Groq Llama 3 8B, Gemini Flash-Lite).
- `coding` -> High coding benchmark model (Qwen 2.5 Coder, Gemini 2.5 Flash, Claude 3.7 Sonnet).
- `architecture` -> Deep reasoning model (DeepSeek R1, Gemini 2.5 Pro, Claude).
- `vision` -> Multimodal vision-capable model (Gemini 2.5 Flash, Ollama LLaVA).
- `research` -> High-context model (>100k tokens, Gemini 2.5 Flash/Pro).

## 3. Operational Performance Learning
- `ProviderLearner` tracks empirical latency, success rate, and token efficiency for each task type.
- Empirically proven models gain priority boosts for specific task types without foundation model retraining.
- Circuit breaker automatically excludes providers experiencing 429 rate limits or timeouts.
