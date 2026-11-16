import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionTaskStatus, classifyMissionOutcome } from '../src/kernel/missionLifecycle';

describe('mission lifecycle truth rules', () => {
  test('only an executed, terminal, error-free, verified mission can complete', () => {
    const complete = {
      executedActions: 1,
      terminalIntentReceived: true,
      executionState: 'IDLE' as const,
      verification: 'PASSED' as const,
    };
    assert.equal(classifyMissionOutcome(complete), 'COMPLETED');
    assert.equal(classifyMissionOutcome({ ...complete, executedActions: 0 }), 'BLOCKED');
    assert.equal(classifyMissionOutcome({ ...complete, executedActions: Number.NaN }), 'BLOCKED');
    assert.equal(classifyMissionOutcome({ ...complete, terminalIntentReceived: false }), 'BLOCKED');
    assert.equal(classifyMissionOutcome({ ...complete, verification: 'FAILED' }), 'FAILED');
    assert.equal(classifyMissionOutcome({ ...complete, executionState: 'EXHAUSTED' }), 'BLOCKED');
    assert.equal(classifyMissionOutcome({ ...complete, executionState: 'ERROR' }), 'FAILED');
    assert.equal(classifyMissionOutcome({ ...complete, waitingForInput: true }), 'WAITING_FOR_INPUT');
    assert.equal(classifyMissionOutcome({ ...complete, awaitingApproval: true }), 'AWAITING_APPROVAL');
    assert.notEqual(classifyMissionOutcome({ ...complete, executedActions: 0 }), 'COMPLETED');
  });

  test('only declared mission lifecycle transitions are accepted', () => {
    assert.equal(canTransitionTaskStatus('QUEUED', 'PLANNING'), true);
    assert.equal(canTransitionTaskStatus('PLANNING', 'RUNNING'), true);
    assert.equal(canTransitionTaskStatus('RUNNING', 'VERIFYING'), true);
    assert.equal(canTransitionTaskStatus('VERIFYING', 'COMPLETED'), true);
    assert.equal(canTransitionTaskStatus('RUNNING', 'AWAITING_APPROVAL'), true);
    assert.equal(canTransitionTaskStatus('AWAITING_APPROVAL', 'RUNNING'), true);
    assert.equal(canTransitionTaskStatus('AWAITING_APPROVAL', 'BLOCKED'), true);
    assert.equal(canTransitionTaskStatus('AWAITING_APPROVAL', 'FAILED'), true);
    assert.equal(canTransitionTaskStatus('COMPLETED', 'RUNNING'), false);
    assert.equal(canTransitionTaskStatus('QUEUED', 'COMPLETED'), false);
  });
});
