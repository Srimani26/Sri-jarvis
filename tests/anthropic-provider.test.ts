import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toAnthropicRequest,
  parseAnthropicResponse,
  dispatchAnthropic,
  anthropicModels,
  isAnthropicConfigured,
} from '../src/swarm/engine/AnthropicProvider';

const originalFetch = globalThis.fetch;
const originalKey = process.env.ANTHROPIC_API_KEY;
const originalModel = process.env.ANTHROPIC_MODEL;

function restore() {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.ANTHROPIC_MODEL;
  else process.env.ANTHROPIC_MODEL = originalModel;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('system prompts are hoisted and tool schemas are converted', () => {
  const payload = toAnthropicRequest(
    [
      { role: 'system', content: 'You are J.A.R.V.I.S.' },
      { role: 'user', content: 'Build the invoice dashboard' },
    ],
    [{ type: 'function', function: { name: 'workspace_write_file', description: 'Write a file', parameters: { type: 'object', properties: { path: { type: 'string' } } } } }],
    { model: 'claude-sonnet-4-5' },
  );

  assert.equal(payload.system, 'You are J.A.R.V.I.S.');
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.messages[0], { role: 'user', content: [{ type: 'text', text: 'Build the invoice dashboard' }] });
  assert.equal(payload.tools?.[0].name, 'workspace_write_file');
  assert.deepEqual(payload.tools?.[0].input_schema, { type: 'object', properties: { path: { type: 'string' } } });
  assert.ok(payload.max_tokens > 0);
});

test('assistant tool calls and tool results round-trip in Anthropic shape', () => {
  const payload = toAnthropicRequest(
    [
      { role: 'user', content: 'run the tests' },
      {
        role: 'assistant',
        content: 'Running them now.',
        tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'execute_sandbox_command', arguments: '{"command":"npm test"}' } }],
      },
      { role: 'tool', tool_call_id: 'call_1', content: '12 passing' },
      { role: 'tool', tool_call_id: 'call_2', content: '9 passing' },
    ],
    [],
    { model: 'claude-sonnet-4-5' },
  );

  const assistant = payload.messages[1];
  assert.equal(assistant.role, 'assistant');
  assert.equal(assistant.content[1].type, 'tool_use');
  assert.equal(assistant.content[1].name, 'execute_sandbox_command');
  assert.deepEqual(assistant.content[1].input, { command: 'npm test' });

  // Consecutive tool results must merge into a single user turn.
  const toolTurn = payload.messages[2];
  assert.equal(toolTurn.role, 'user');
  assert.equal(toolTurn.content.length, 2);
  assert.equal(toolTurn.content[0].type, 'tool_result');
  assert.equal(toolTurn.content[0].tool_use_id, 'call_1');
});

test('responses map back to the OpenAI shape the swarm expects', () => {
  const parsed = parseAnthropicResponse({
    content: [
      { type: 'text', text: 'Patched the file.' },
      { type: 'tool_use', id: 'toolu_9', name: 'finish_task', input: { success: true } },
    ],
  });

  assert.equal(parsed.content, 'Patched the file.');
  assert.equal(parsed.tool_calls?.[0].id, 'toolu_9');
  assert.equal(parsed.tool_calls?.[0].function.name, 'finish_task');
  assert.deepEqual(JSON.parse(parsed.tool_calls![0].function.arguments), { success: true });
});

test('the tier stays dormant without a key', async () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.CLAUDE_API_KEY;
  // virtualKeyVault has no anthropic key configured in tests
  if (isAnthropicConfigured()) return; // environment supplied a real key: nothing to assert
  const result = await dispatchAnthropic([{ role: 'user', content: 'hi' }], [], {});
  assert.equal(result, null);
  restore();
});

test('a configured key dispatches and reports provider, model and latency', async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-0123456789';
  globalThis.fetch = (async () =>
    jsonResponse({ content: [{ type: 'text', text: 'Systems online.' }], stop_reason: 'end_turn' })) as typeof fetch;

  const result = await dispatchAnthropic([{ role: 'user', content: 'status' }], [], { model: 'claude-sonnet-4-5' });

  assert.equal(result?.content, 'Systems online.');
  assert.equal(result?.provider, 'anthropic-claude');
  assert.equal(result?.model, 'claude-sonnet-4-5');
  assert.equal(typeof result?.latencyMs, 'number');
  restore();
});

test('a throttled key degrades to null instead of throwing', async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-0123456789';
  globalThis.fetch = (async () => jsonResponse({ error: 'rate limited' }, 429)) as typeof fetch;

  const result = await dispatchAnthropic([{ role: 'user', content: 'status' }], [], {});
  assert.equal(result, null);
  restore();
});

test('a renamed model falls through to the next candidate', async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-0123456789';
  const seen: string[] = [];
  globalThis.fetch = (async (_url: any, init: any) => {
    const body = JSON.parse(String(init?.body || '{}'));
    seen.push(body.model);
    if (seen.length === 1) return jsonResponse({ error: 'model_not_found' }, 404);
    return jsonResponse({ content: [{ type: 'text', text: 'ok' }] });
  }) as typeof fetch;

  const result = await dispatchAnthropic([{ role: 'user', content: 'status' }], [], {});

  assert.equal(result?.content, 'ok');
  assert.equal(seen.length, 2);
  assert.notEqual(seen[0], seen[1]);
  assert.deepEqual(anthropicModels().slice(0, 1), [seen[0]]);
  restore();
});

test('rejected credentials stop the tier without retrying every model', async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-0123456789';
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse({ error: 'invalid x-api-key' }, 401);
  }) as typeof fetch;

  const result = await dispatchAnthropic([{ role: 'user', content: 'status' }], [], {});
  assert.equal(result, null);
  assert.equal(calls, 1);
  restore();
});
