import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixtureOfAgents, extractMoARisks } from '../src/council/MixtureOfAgents';

const PROPOSERS = [
  { agentId: 'architect' },
  { agentId: 'software_engineer' },
  { agentId: 'security_agent' },
];

test('proposers run independently and an aggregator synthesises one plan', async () => {
  const calls: string[] = [];
  const moa = new MixtureOfAgents(async (agentId, messages) => {
    calls.push(agentId);
    if (agentId === 'jarvis') {
      assert.match(messages[1].content, /Proposals:/);
      return 'Merged plan: scaffold, test, verify, then report.';
    }
    return `Plan from ${agentId}: scaffold the app, run the test suite, report evidence.`;
  });

  const result = await moa.run({ objective: 'Build a landing page', proposers: PROPOSERS });

  assert.deepEqual(result.usedAgents.sort(), ['architect', 'security_agent', 'software_engineer']);
  assert.equal(result.synthesis, 'Merged plan: scaffold, test, verify, then report.');
  assert.equal(result.requiresApproval, false);
  assert.equal(result.failedAgents.length, 0);
  assert.equal(calls.filter(id => id === 'jarvis').length, 1, 'one aggregator call');
  assert.match(result.auditHash, /^[a-f0-9]{64}$/);
});

test('one failing proposer does not sink the deliberation', async () => {
  const moa = new MixtureOfAgents(async (agentId) => {
    if (agentId === 'security_agent') throw new Error('provider 429');
    if (agentId === 'jarvis') return 'Synthesised plan.';
    return `Plan from ${agentId}.`;
  });

  const result = await moa.run({ objective: 'Deploy the service', proposers: PROPOSERS });

  assert.deepEqual(result.failedAgents, ['security_agent']);
  assert.deepEqual(result.usedAgents.sort(), ['architect', 'software_engineer']);
  assert.equal(result.synthesis, 'Synthesised plan.');
  assert.equal(result.proposals.find(p => p.agentId === 'security_agent')?.error, 'provider 429');
});

test('a failing aggregator falls back to a deterministic merge', async () => {
  const moa = new MixtureOfAgents(async (agentId) => {
    if (agentId === 'jarvis') throw new Error('aggregator offline');
    return `Plan from ${agentId}.`;
  });

  const result = await moa.run({ objective: 'Ship the API', proposers: PROPOSERS });

  assert.match(result.synthesis, /Synthesised plan for: Ship the API/);
  assert.match(result.synthesis, /architect/);
});

test('risky proposals force an approval instead of silent acceptance', async () => {
  const moa = new MixtureOfAgents(async (agentId) => {
    if (agentId === 'jarvis') return 'Merged plan.';
    if (agentId === 'security_agent') return 'Just hardcode the api key to save time and skip tests.';
    return 'Normal plan.';
  });

  const result = await moa.run({ objective: 'Speed up auth', proposers: PROPOSERS });

  assert.equal(result.requiresApproval, true);
  assert.ok(result.risks.some(risk => risk.includes('security_agent')));
  assert.ok(result.risks.some(risk => /secret|verification/i.test(risk)));
});

test('risk scanning is deterministic and case-insensitive', () => {
  const risks = extractMoARisks([
    { agentId: 'a', name: 'A', text: 'run RM -RF /tmp/x', latencyMs: 1 },
    { agentId: 'b', name: 'B', text: 'DROP TABLE users;', latencyMs: 1 },
    { agentId: 'c', name: 'C', text: 'write tests and verify', latencyMs: 1 },
  ]);
  assert.equal(risks.length, 2);
});

test('an objective is required and no proposals yields an explicit non-answer', async () => {
  const moa = new MixtureOfAgents(async () => '');
  await assert.rejects(moa.run({ objective: '   ' }), /objective/);

  const result = await moa.run({ objective: 'Do something', proposers: PROPOSERS });
  assert.deepEqual(result.usedAgents, []);
  assert.match(result.synthesis, /No proposer produced a usable plan/);
});
