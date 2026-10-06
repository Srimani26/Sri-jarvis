/**
 * J.A.R.V.I.S. MARK-V Provider Failover & Circuit Breaker Demonstration
 * Requirement 12: Controlled provider failure test
 * primary provider unavailable → circuit breaker → secondary provider → successful response
 * Shows actual transition in event stream. Does not bypass provider quotas.
 */

import { ModelRouter } from '../src/providers/ModelRouter.js';
import { ProviderRegistry } from '../src/providers/ProviderRegistry.js';
import { QuotaManager } from '../src/providers/QuotaManager.js';
import { EventStream } from '../src/kernel/EventStream.js';

async function main() {
  console.log('================================================================');
  console.log('⚡ J.A.R.V.I.S. CONTROLLED PROVIDER FAILOVER & CIRCUIT BREAKER TEST');
  console.log('================================================================\n');

  const taskId = 'failover-sim-' + Date.now();
  const events: Array<{ timestamp: string; event: string; details: any }> = [];

  function logTransition(event: string, details: any) {
    const entry = { timestamp: new Date().toISOString(), event, details };
    events.push(entry);
    EventStream.broadcastToTask(taskId, {
      id: 'ev-' + Date.now(),
      taskId,
      eventType: 'MODEL_STARTED',
      message: `[FAILOVER_ENGINE] ${event}: ${JSON.stringify(details)}`,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${entry.timestamp}] 🔄 [${event}]`, details);
  }

  // 1. Initial State
  logTransition('INITIAL_STATE', {
    geminiAvailable: QuotaManager.isProviderAvailable('gemini'),
    groqAvailable: QuotaManager.isProviderAvailable('groq'),
  });

  // 2. Candidate Routing
  const candidates = ModelRouter.route({ taskType: 'coding', requiresTools: false });
  logTransition('ROUTED_CANDIDATES', {
    candidates: candidates.slice(0, 3).map((c) => ({ id: c.id, provider: c.provider, tier: c.tier })),
  });

  const primaryModel = candidates[0];
  const secondaryModel = candidates[1] || { id: 'backup-mock-runner', provider: 'groq' };

  logTransition('PRIMARY_ATTEMPT', {
    model: primaryModel.id,
    provider: primaryModel.provider,
    expectedBehavior: 'Simulate 429 Rate Limit exhaustion',
  });

  // 3. Controlled Execution with Failover
  let attempts = 0;
  const result = await ModelRouter.executeWithFailover(
    { taskType: 'coding', requiresTools: false },
    [{ role: 'user', content: 'Generate resilient failover handler' }],
    async (model, messages) => {
      attempts++;
      if (attempts === 1) {
        logTransition('PRIMARY_FAILED', {
          model: model.id,
          provider: model.provider,
          error: 'HTTP 429: Rate limit exceeded on primary quota tier',
        });
        throw new Error('HTTP 429: Rate limit exceeded on primary quota tier');
      }

      logTransition('SECONDARY_SUCCEEDED', {
        attempt: attempts,
        model: model.id,
        provider: model.provider,
        responseSnippet: 'export function recover() { return true; }',
      });
      return 'export function recover() { return true; }';
    }
  );

  // 4. Verify Circuit Breaker Triggered on Primary
  const primaryProviderRecord = QuotaManager.getRecord(primaryModel.provider);
  logTransition('CIRCUIT_BREAKER_STATE', {
    primaryProvider: primaryModel.provider,
    state: primaryProviderRecord.state,
    rateLimitHits: primaryProviderRecord.rateLimitHits,
    availableForNextCall: QuotaManager.isProviderAvailable(primaryModel.provider),
  });

  console.log('\n================================================================');
  console.log('📋 FAILOVER TRANSITION SUMMARY');
  console.log('================================================================');
  console.log({
    primaryModel: primaryModel.id,
    secondaryModel: result.model,
    successfulProvider: result.provider,
    latencyMs: result.latencyMs,
    totalAttempts: attempts,
    circuitBreakerTripped: primaryProviderRecord.state === 'RATE_LIMITED' || !QuotaManager.isProviderAvailable(primaryModel.provider),
  });

  // Clean up
  ProviderRegistry.resetProviderCircuit('gemini');
  ProviderRegistry.resetProviderCircuit('groq');
}

main().catch((err) => {
  console.error('Failover test error:', err);
  process.exit(1);
});
