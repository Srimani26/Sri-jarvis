import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ModelRouter } from '../src/providers/ModelRouter';
import { ProviderRegistry } from '../src/providers/ProviderRegistry';
import { QuotaManager } from '../src/providers/QuotaManager';
import { ModelRouteRequest, LLMMessage, ModelMetadata } from '../src/providers/types';

describe('Phase 18: Real Provider Failure, Outage & Failover Architecture', () => {
  beforeEach(() => {
    // Reset circuits and quotas before each test
    ProviderRegistry.resetProviderCircuit('ollama');
    ProviderRegistry.resetProviderCircuit('groq');
    ProviderRegistry.resetProviderCircuit('gemini');
    ProviderRegistry.resetProviderCircuit('anthropic');
    QuotaManager.resetProvider('ollama');
    QuotaManager.resetProvider('groq');
    QuotaManager.resetProvider('gemini');
    QuotaManager.resetProvider('anthropic');
  });

  test('Correctly classifies HTTP 429 and Quota Exhaustion with bounded backoff', async () => {
    assert.equal(ModelRouter.classifyFailure('Error: 429 Too Many Requests'), 'HTTP_429_RATE_LIMIT');
    assert.equal(ModelRouter.classifyFailure('Resource has exhausted its quota (request count)'), 'QUOTA_EXHAUSTED');

    QuotaManager.recordRateLimit('groq', 10);
    const overview = QuotaManager.getStatusOverview();
    assert.equal(overview.groq.state, 'RATE_LIMITED');
    assert.equal(overview.groq.available, false, 'Rate limited provider must not be available');

    QuotaManager.recordQuotaExhaustion('gemini', 30);
    const overview2 = QuotaManager.getStatusOverview();
    assert.equal(overview2.gemini.state, 'QUOTA_EXHAUSTED');
    assert.equal(overview2.gemini.available, false, 'Quota exhausted provider must not be available');
  });

  test('Correctly classifies Auth Failure and halts without credential harvesting', async () => {
    assert.equal(ModelRouter.classifyFailure('401 Unauthorized: Invalid API Key'), 'AUTH_FAILED');
    assert.equal(ModelRouter.classifyFailure('Forbidden: 403 access denied for requested resource'), 'AUTH_FAILED');

    QuotaManager.recordAuthFailure('anthropic', 'Invalid API key provided');
    const overview = QuotaManager.getStatusOverview();
    assert.equal(overview.anthropic.state, 'AUTH_FAILED');
    assert.equal(overview.anthropic.available, false, 'Auth failed provider must halt without retry');
  });

  test('Correctly classifies Timeout, Network Errors, and Malformed Responses', async () => {
    assert.equal(ModelRouter.classifyFailure('Request timed out after 30000ms'), 'TIMEOUT');
    assert.equal(ModelRouter.classifyFailure('Fetch failed: ECONNREFUSED 127.0.0.1:11434'), 'NETWORK_ERROR');
    assert.equal(ModelRouter.classifyFailure('Unexpected token < in JSON at position 0 (malformed)'), 'MALFORMED_RESPONSE');
    assert.equal(ModelRouter.classifyFailure('Model llama-unknown not found or does not exist'), 'INVALID_MODEL');
  });

  test('Fails over across real provider errors and provides observable evidence of final provider', async () => {
    const request: ModelRouteRequest = { taskType: 'coding' };
    const messages: LLMMessage[] = [{ role: 'user', content: 'Generate binary search implementation' }];

    // Candidates ordered by tier: gemini (FREE) -> groq (LOW_COST) -> anthropic (PAID)
    let callCount = 0;
    const invoker = async (model: ModelMetadata, msgs: LLMMessage[]): Promise<string> => {
      callCount++;
      if (model.provider === 'gemini') {
        throw new Error('HTTP 429: Rate limit exceeded for requests per minute');
      }
      if (model.provider === 'groq' || model.provider === 'together') {
        throw new Error('fetch failed: connect ECONNREFUSED 127.0.0.1:443');
      }
      if (model.provider === 'anthropic') {
        return 'function binarySearch(arr, target) { return arr.indexOf(target); }';
      }
      throw new Error(`Unexpected provider: ${model.provider}`);
    };

    const response = await ModelRouter.executeWithFailover(request, messages, invoker);

    assert.equal(response.failoverOccurred, true, 'Failover flag must be recorded as true');
    assert.ok(response.attemptedModels && response.attemptedModels.length >= 3, 'Must record all attempted models');
    assert.equal(response.provider, 'anthropic', 'Must record that Anthropic ultimately executed the request');
    assert.match(response.text, /binarySearch/, 'Response text must contain verified output');
    assert.ok(response.failureHistory && response.failureHistory.length >= 2, 'Failure history must be preserved for telemetry');

    // Verify error classifications in failure history
    assert.equal(response.failureHistory[0].failureType, 'HTTP_429_RATE_LIMIT');
    assert.equal(response.failureHistory[1].failureType, 'NETWORK_ERROR');
  });

  test('Rejects empty or malformed responses and prevents fake failover success', async () => {
    const request: ModelRouteRequest = { taskType: 'simple_chat' };
    const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];

    // Both candidates return empty string
    const invoker = async (): Promise<string> => {
      return '   '; // Malformed empty content
    };

    await assert.rejects(
      async () => {
        await ModelRouter.executeWithFailover(request, messages, invoker);
      },
      /All candidate models failed failover chain/
    );
  });
});
