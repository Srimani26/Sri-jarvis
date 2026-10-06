/**
 * Phase 17 Test Suite — J.A.R.V.I.S. ResourceRegistry, QuotaManager, Adapters & Distributed Worker
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ResourceRegistry } from '../src/resources/ResourceRegistry';
import { ResourceManager } from '../src/resources/ResourceManager';
import { QuotaManager } from '../src/providers/QuotaManager';
import { ProviderLearner } from '../src/providers/ProviderLearner';
import { GeminiAdapter } from '../src/providers/adapters/GeminiAdapter';
import { GroqAdapter } from '../src/providers/adapters/GroqAdapter';
import { OllamaAdapter } from '../src/providers/adapters/OllamaAdapter';
import { WorkerRegistry } from '../src/workers/WorkerRegistry';
import { WorkerExecutor } from '../workers/jarvis-worker/src/executor';
import path from 'node:path';
import fs from 'node:fs';

describe('Phase 17: J.A.R.V.I.S. Resource Architecture, Free Tiers & Distributed Worker', () => {
  beforeEach(() => {
    WorkerRegistry.clear();
  });

  describe('1. Unified ResourceRegistry & Economics', () => {
    it('bootstraps comprehensive multi-resource registry', () => {
      const all = ResourceRegistry.listAll();
      assert.ok(all.length >= 8, 'Should have multiple registered resources');

      const types = new Set(all.map((r) => r.type));
      assert.ok(types.has('MODEL'), 'Should include MODEL');
      assert.ok(types.has('BROWSER'), 'Should include BROWSER');
      assert.ok(types.has('STT'), 'Should include STT');
      assert.ok(types.has('TTS'), 'Should include TTS');
      assert.ok(types.has('EMBEDDING'), 'Should include EMBEDDING');
      assert.ok(types.has('WORKER'), 'Should include WORKER');
      assert.ok(types.has('COMPUTE'), 'Should include COMPUTE');
    });

    it('filters legitimate free resource pool', () => {
      const freePool = ResourceRegistry.getFreeResourcePool();
      assert.ok(freePool.length > 0, 'Free resource pool should not be empty');
      for (const res of freePool) {
        assert.ok(
          res.costClass === 'FREE' || res.costClass === 'ZERO_SELF_HOSTED',
          'Resource must be free or self-hosted'
        );
      }
    });

    it('selects best resource prioritizing local and free capabilities', () => {
      const best = ResourceRegistry.getBestResource({
        type: 'MODEL',
        capabilities: ['coding'],
        preferLocal: true,
      });

      assert.ok(best, 'Should select a candidate model');
      assert.ok(best.capabilities.includes('coding'), 'Selected model must have coding capability');
    });

    it('records execution outcomes and adjusts health', () => {
      const resId = 'res-model-gemini-2.5-flash';
      ResourceRegistry.recordExecutionOutcome(resId, true, 250);
      const res = ResourceRegistry.getResource(resId);
      assert.ok(res);
      assert.ok(res.totalExecutions > 0);
      assert.ok(res.lastSuccessfulExecution);

      // Record failures and verify degradation
      for (let i = 0; i < 4; i++) {
        ResourceRegistry.recordExecutionOutcome(resId, false, 500);
      }
      assert.equal(res.health, 'DEGRADED');

      // Recover
      ResourceRegistry.recordExecutionOutcome(resId, true, 200);
      assert.equal(res.health, 'HEALTHY');
    });

    it('computes accurate system economics in ResourceManager', () => {
      ResourceManager.recordConsumption(0.0025);
      const eco = ResourceManager.getEconomics();
      assert.ok(eco.totalEstimatedCostUsd >= 0.0025);
      assert.ok(eco.freeTierActiveCount > 0);
      assert.ok(eco.localResourceCount > 0);
      assert.ok(ResourceManager.isSystemHealthy());
    });
  });

  describe('2. QuotaManager & Circuit Breakers', () => {
    it('manages provider status and tracks rate limits', () => {
      const prov = 'groq';
      assert.ok(QuotaManager.isProviderAvailable(prov));

      // Trip rate limit
      QuotaManager.recordRateLimit(prov, 60);
      assert.equal(QuotaManager.isProviderAvailable(prov), false, 'Provider should be unavailable when rate limited');

      // Record success on un-tripped provider
      QuotaManager.recordSuccess('gemini', 1500, 0);
      const status = QuotaManager.getStatusOverview();
      assert.ok(status.gemini.requests > 0);
      assert.ok(status.gemini.tokens >= 1500);
    });

    it('handles timeouts with degraded state', () => {
      const prov = 'together';
      QuotaManager.recordTimeout(prov, 'Gateway Timeout 504');
      QuotaManager.recordTimeout(prov, 'Gateway Timeout 504');
      QuotaManager.recordTimeout(prov, 'Gateway Timeout 504');

      const rec = QuotaManager.getRecord(prov);
      assert.equal(rec.state, 'DEGRADED');
    });
  });

  describe('3. Operational Provider Learning', () => {
    it('ranks models empirically per task type without model weight retraining', () => {
      ProviderLearner.recordExecution('coding', 'anthropic', 'claude-3-7-sonnet', true, 1200);
      ProviderLearner.recordExecution('coding', 'anthropic', 'claude-3-7-sonnet', true, 1100);
      ProviderLearner.recordExecution('coding', 'gemini', 'gemini-2.5-flash', true, 400);
      ProviderLearner.recordExecution('coding', 'gemini', 'gemini-2.5-flash', false, 800);

      const best = ProviderLearner.getBestModelForTask('coding');
      assert.ok(best);
      assert.equal(best.model, 'claude-3-7-sonnet');
      assert.equal(best.successRate, 1.0);
    });
  });

  describe('4. Provider Adapters Zero-Crash Safety', () => {
    it('GeminiAdapter safely rejects execution when key is unconfigured without crash', async () => {
      const adapter = new GeminiAdapter('');
      assert.equal(adapter.isConfigured(), false);
      await assert.rejects(
        () => adapter.chat([{ role: 'user', content: 'test' }]),
        /PROVIDER_NOT_CONFIGURED/
      );
    });

    it('GroqAdapter safely rejects execution when key is unconfigured', async () => {
      const adapter = new GroqAdapter('');
      assert.equal(adapter.isConfigured(), false);
      await assert.rejects(
        () => adapter.chat([{ role: 'user', content: 'test' }]),
        /PROVIDER_NOT_CONFIGURED/
      );
    });

    it('OllamaAdapter reports offline gracefully when daemon is unreachable', async () => {
      const adapter = new OllamaAdapter('http://127.0.0.1:59999');
      const isOnline = await adapter.healthCheck();
      assert.equal(isOnline, false);
      await assert.rejects(
        () => adapter.chat([{ role: 'user', content: 'test' }]),
        /OLLAMA_OFFLINE/
      );
    });
  });

  describe('5. Distributed PC Worker & Capability Tokens', () => {
    it('registers worker and tracks heartbeat lifecycle', () => {
      const node = WorkerRegistry.registerWorker({
        id: 'test-pc-worker',
        name: 'Sri Test Workstation',
        capabilities: ['LOCAL_LLM', 'LOCAL_BROWSER', 'WORKSPACE_FILES', 'LOCAL_STT', 'LOCAL_TTS'],
        health: { freeMemoryMB: 8192 },
      });

      assert.equal(node.status, 'ONLINE');
      assert.ok(WorkerRegistry.hasCapability('test-pc-worker', 'LOCAL_LLM'));
      assert.ok(WorkerRegistry.hasCapability('test-pc-worker', 'LOCAL_BROWSER'));
      assert.equal(WorkerRegistry.hasCapability('test-pc-worker', 'NON_EXISTENT'), false);

      // Heartbeat
      const beatSuccess = WorkerRegistry.recordHeartbeat('test-pc-worker', { freeMemoryMB: 7500 });
      assert.ok(beatSuccess);

      // Heartbeat expiration audit
      const offlineCount = WorkerRegistry.auditHeartbeats(0); // 0 ms TTL forces immediate expiry
      assert.ok(offlineCount >= 1);
      assert.equal(WorkerRegistry.getWorker('test-pc-worker')?.status, 'OFFLINE');
    });

    it('enforces worker capability security in WorkerExecutor', async () => {
      const testDir = path.join(process.cwd(), '.tmp_test_worker');
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      // Worker only has WORKSPACE_FILES, lacks LOCAL_LLM
      const executor = new WorkerExecutor(['WORKSPACE_FILES'], testDir);

      // Attempt task requiring LOCAL_LLM
      const result = await executor.executeTask({
        taskId: 'task-auth-fail',
        capabilityRequired: 'LOCAL_LLM',
        action: 'OLLAMA_CHAT',
        params: { model: 'llama3' },
      });

      assert.equal(result.success, false);
      assert.match(result.error || '', /CAPABILITY_DENIED/);

      // Clean up
      try { fs.rmSync(testDir, { recursive: true }); } catch { /* ignore */ }
    });

    it('sandboxes workspace filesystem access and blocks directory traversal', () => {
      const testDir = path.join(process.cwd(), '.tmp_test_sandbox');
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      const executor = new WorkerExecutor(['WORKSPACE_FILES'], testDir);

      // Valid path within workspace
      const validPath = executor.resolveSafePath('my_file.txt');
      assert.ok(validPath.startsWith(path.resolve(testDir)));

      // Forbidden path attempting traversal
      assert.throws(
        () => executor.resolveSafePath('../../../Windows/System32'),
        /SANDBOX_VIOLATION/
      );

      try { fs.rmSync(testDir, { recursive: true }); } catch { /* ignore */ }
    });
  });
});
