import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMissionStatusPresentation } from '../src/components/missionStatus';

test('mission status text always includes an accessible next action and never implies unverified completion', () => {
  const statuses = ['CREATED', 'QUEUED', 'PLANNING', 'ASSIGNED', 'RUNNING', 'WAITING', 'WAITING_FOR_INPUT', 'AWAITING_APPROVAL', 'RETRYING', 'RECOVERING', 'VERIFYING', 'COMPLETED', 'FAILED', 'BLOCKED', 'CANCELLED'];
  for (const status of statuses) {
    const presentation = getMissionStatusPresentation(status);
    assert.ok(presentation.label.length > 0, `${status} has a readable label`);
    assert.ok(presentation.nextAction.length > 0, `${status} has a next action`);
    assert.equal(presentation.completionEvidenceVisible, status === 'COMPLETED');
  }
  assert.equal(getMissionStatusPresentation('UNKNOWN').completionEvidenceVisible, false);
});
