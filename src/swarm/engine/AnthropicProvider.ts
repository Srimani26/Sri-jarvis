/**
 * AnthropicProvider.ts — Frontier Claude tier for the swarm.
 *
 * The rest of the swarm speaks OpenAI's shape (messages, tool_calls, role:'tool'),
 * so this module converts both directions and returns the same envelope the
 * ModelRouter waterfall already understands. That means every specialist — Jarvis,
 * Aegis, Friday, Cerebro, and the ReAct loop itself — gets Claude-quality planning
 * without touching their call sites.
 *
 * Keys: ANTHROPIC_API_KEY or CLAUDE_API_KEY. Comma-separated pools are supported,
 * and virtualKeyVault rotation/backoff is reused so one throttled key never takes
 * the tier down.
 */

import { virtualKeyVault } from '../../security/SecretSanitizer'

export const ANTHROPIC_API_VERSION = '2023-06-01'
export const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_MODELS_ENDPOINT = 'https://api.anthropic.com/v1/models'

/** Newest first; each model is tried in order so a renamed model never breaks the tier. */
export const DEFAULT_ANTHROPIC_MODELS = [
  'claude-sonnet-4-5',
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-latest',
]

const DEFAULT_TIMEOUT_MS = 45_000
const DEFAULT_MAX_TOKENS = 8_192

export function anthropicKeys(): string[] {
  const raw = [
    virtualKeyVault.getActiveKey('anthropic'),
    process.env.ANTHROPIC_API_KEY,
    process.env.CLAUDE_API_KEY,
  ]
    .filter(Boolean)
    .join(',')

  return [...new Set(raw.split(',').map((key) => key.trim()).filter((key) => key.length > 8))]
}

export function isAnthropicConfigured(): boolean {
  return anthropicKeys().length > 0
}

export function anthropicModels(): string[] {
  const override = (process.env.ANTHROPIC_MODEL || '').trim()
  if (!override) return [...DEFAULT_ANTHROPIC_MODELS]
  return [override, ...DEFAULT_ANTHROPIC_MODELS.filter((model) => model !== override)]
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

export interface AnthropicRequest {
  model: string
  max_tokens: number
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: any }>
  tools?: Array<{ name: string; description: string; input_schema: any }>
  temperature?: number
}

/**
 * Converts OpenAI-shaped conversation history + tool schemas into Anthropic's
 * Messages API. Handles system extraction, assistant tool_calls -> tool_use blocks,
 * and role:'tool' results -> user tool_result blocks (merged so consecutive
 * results stay in one user turn, which the API requires).
 */
export function toAnthropicRequest(
  messages: any[],
  tools: any[] = [],
  options: { model: string; maxTokens?: number; temperature?: number } = { model: DEFAULT_ANTHROPIC_MODELS[0] },
): AnthropicRequest {
  const systemParts: string[] = []
  const converted: Array<{ role: 'user' | 'assistant'; content: any }> = []

  const push = (role: 'user' | 'assistant', blocks: any[]) => {
    if (blocks.length === 0) return
    const last = converted[converted.length - 1]
    if (last && last.role === role && Array.isArray(last.content)) {
      last.content.push(...blocks)
      return
    }
    converted.push({ role, content: blocks })
  }

  for (const message of Array.isArray(messages) ? messages : []) {
    const role = String(message?.role || 'user')
    if (role === 'system' || role === 'developer') {
      const value = textOf(message?.content)
      if (value) systemParts.push(value)
      continue
    }

    if (role === 'tool') {
      push('user', [
        {
          type: 'tool_result',
          tool_use_id: String(message?.tool_call_id || message?.id || 'unknown_tool_call'),
          content: textOf(message?.content) || 'Tool returned no output.',
        },
      ])
      continue
    }

    if (role === 'assistant') {
      const blocks: any[] = []
      const text = textOf(message?.content)
      if (text) blocks.push({ type: 'text', text })
      for (const call of Array.isArray(message?.tool_calls) ? message.tool_calls : []) {
        let input: any = {}
        try {
          const rawArgs = call?.function?.arguments
          input = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs ?? {}
        } catch {
          input = { raw: call?.function?.arguments }
        }
        blocks.push({
          type: 'tool_use',
          id: String(call?.id || `toolu_${call?.function?.name || 'call'}`),
          name: String(call?.function?.name || call?.name || 'unknown_tool'),
          input: input ?? {},
        })
      }
      push('assistant', blocks)
      continue
    }

    const text = textOf(message?.content)
    if (text) push('user', [{ type: 'text', text }])
  }

  const schema = Array.isArray(tools) && tools.length > 0
    ? tools
        .map((tool: any) => {
          const fn = tool?.function || tool
          if (!fn?.name) return null
          return {
            name: String(fn.name),
            description: String(fn.description || ''),
            input_schema: fn.parameters || fn.input_schema || { type: 'object', properties: {} },
          }
        })
        .filter(Boolean)
    : []

  return {
    model: options.model,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    messages: converted.length > 0 ? converted : [{ role: 'user', content: [{ type: 'text', text: 'Continue.' }] }],
    tools: schema.length > 0 ? (schema as AnthropicRequest['tools']) : undefined,
    temperature: options.temperature ?? 0.2,
  }
}

/** Anthropic response -> OpenAI-shaped {content, tool_calls} for the swarm. */
export function parseAnthropicResponse(json: any): { content: string; tool_calls?: any[] } {
  const blocks = Array.isArray(json?.content) ? json.content : []
  const text = blocks
    .filter((block: any) => block?.type === 'text')
    .map((block: any) => block.text || '')
    .join('')
    .trim()

  const toolCalls = blocks
    .filter((block: any) => block?.type === 'tool_use')
    .map((block: any) => ({
      id: String(block.id),
      type: 'function' as const,
      function: { name: String(block.name), arguments: JSON.stringify(block.input ?? {}) },
    }))

  return { content: text, tool_calls: toolCalls.length > 0 ? toolCalls : undefined }
}

export interface AnthropicResult {
  content: string
  tool_calls?: any[]
  provider: string
  model: string
  latencyMs: number
  usedKeyIndex: number
}

/**
 * Attempts Claude across the model list and the key pool. Returns null when the
 * tier is not configured so callers can fall through to cheaper tiers untouched.
 * Never throws for expected provider failures — the router treats this as a tier
 * that simply did not answer, and the waterfall continues.
 */
export async function dispatchAnthropic(
  messages: any[],
  tools: any[] = [],
  options: { model?: string; timeoutMs?: number; maxTokens?: number; temperature?: number; specialist?: string } = {},
): Promise<AnthropicResult | null> {
  const keys = anthropicKeys()
  if (keys.length === 0) return null

  const models = options.model ? [options.model] : anthropicModels()
  const started = Date.now()
  let lastStatus = 0

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex]

    for (const model of models) {
      const payload = toAnthropicRequest(messages, tools, {
        model,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      })

      try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': ANTHROPIC_API_VERSION,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        })

        if (response.status === 429 || response.status === 503 || response.status === 529) {
          lastStatus = response.status
          virtualKeyVault.markRateLimited('anthropic', key, 30_000)
          break // this key is throttled: move to the next key, not the next model
        }

        if (response.status === 401 || response.status === 403) {
          // Bad/revoked key: no point trying other models with it.
          lastStatus = response.status
          break
        }

        if (!response.ok) {
          // 404 / 400 usually means this account lacks the model: try the next one.
          lastStatus = response.status
          continue
        }

        const json = (await response.json()) as any
        const parsed = parseAnthropicResponse(json)
        if (!parsed.content && !parsed.tool_calls) {
          lastStatus = 502
          continue
        }

        return {
          ...parsed,
          provider: 'anthropic-claude',
          model,
          latencyMs: Date.now() - started,
          usedKeyIndex: keyIndex,
        }
      } catch (error: any) {
        // Timeouts and network faults: try the next model/key. The key itself is
        // never included in logs or errors.
        lastStatus = 0
        console.warn(`[Anthropic] ${model} failed: ${error?.name === 'TimeoutError' ? 'timeout' : 'network error'}`)
        continue
      }
    }
  }

  if (lastStatus === 401 || lastStatus === 403) {
    console.warn(`[Anthropic] credentials rejected (HTTP ${lastStatus}); Claude tier disabled for this call`)
  }

  return null
}
