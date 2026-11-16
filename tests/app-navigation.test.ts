import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mobileDestinations, persistentVoiceAction } from '../src/components/app/navigation';

test('Android navigation has four unique destinations and a separate persistent voice action', () => {
  assert.deepEqual(mobileDestinations.map(item => item.label), ['Home', 'Missions', 'Chat', 'Apps']);
  assert.equal(new Set(mobileDestinations.map(item => item.id)).size, mobileDestinations.length);
  assert.equal(persistentVoiceAction.id, 'voice');
  assert.equal(mobileDestinations.some(item => item.id === persistentVoiceAction.id), false);
});
