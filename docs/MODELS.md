# Model stack — how JARVIS picks a brain

Every model call in the system goes through one waterfall,
`SwarmModelRouter.dispatch()`. Voice turns, the ReAct loop, MoA proposers, Telegram
directives and mission workers all pass through it, so one configuration change
applies everywhere.

| Tier | Provider | Used for | Key |
|---|---|---|---|
| 0 | **Anthropic Claude** (`src/swarm/engine/AnthropicProvider.ts`) | Frontier agentic coding, long-horizon planning, tool use | `ANTHROPIC_API_KEY` (or `CLAUDE_API_KEY`) |
| 1 | Groq — LLaMA 3.3 70B / DeepSeek-R1 distill | Fast chat, cheap reasoning | `GROQ_API_KEY` |
| 2 | OpenAI GPT-4o / 4o-mini | Strong general fallback | `OPENAI_API_KEY` |
| 3 | OpenRouter free pool — Qwen 2.5 Coder 32B, DeepSeek-R1 | Coding fallback at zero cost | `OPENROUTER_API_KEY` |
| 4 | Gemini Flash Lite / Flash | Multimodal, long context, voice | `GEMINI_API_KEY` |
| Emergency | Local Ollama (qwen3:4b) | Offline last resort | — |

## Claude tier behaviour

- **Dormant without a key.** No `ANTHROPIC_API_KEY` means tier 0 is skipped and the
  waterfall behaves exactly as before. Nothing breaks, nothing is slower.
- **Model list with fallthrough.** Default order is `claude-sonnet-4-5`,
  `claude-3-7-sonnet-latest`, `claude-3-5-sonnet-latest`. Override with
  `ANTHROPIC_MODEL`. An unknown model (HTTP 404/400) moves to the next entry, so a
  rename never takes the tier down.
- **Key pools.** `ANTHROPIC_API_KEY` accepts a comma-separated list. A 429/503/529
  throttles that key for 30s and moves to the next one.
- **Bad credentials fail fast.** 401/403 stops the tier for that call and logs only
  the status code — key values never appear in logs or errors.
- **Shape translation.** The swarm speaks OpenAI's format, so the provider converts
  both directions: system prompts are hoisted, tool schemas become `input_schema`,
  assistant `tool_calls` become `tool_use` blocks, and `role: 'tool'` results become
  merged `tool_result` blocks. `finish_task` and every other swarm tool work
  unchanged.

## Verifying what is live

```bash
curl -s https://<your-app>.onrender.com/api/health | python -m json.tool
```

The `activeProviders` block reports `anthropic` with its model list and status
(`ONLINE` / `THROTTLED` / `UNAVAILABLE`). A configured-but-rejected key shows
`UNAVAILABLE`, which means the value in Render is wrong or expired — not that the
code is missing.

## Cost control

Tier 0 is used first *when configured*. If you want Claude only for real work and
cheap models for chit-chat, set `ANTHROPIC_MODEL` and remove the key from the
environment used for casual surfaces, or leave the key unset in that environment
altogether. Per-specialist routing (coding → Claude, quick chat → Gemini Flash) is
controlled by which keys exist in that environment.
