import { test } from 'node:test';
import assert from 'node:assert/strict';

test('checkpoint crypto rejects absent and malformed keys and authenticates ciphertext', async () => {
  const loaded = await import('../src/security/MissionCheckpointCrypto').catch(() => null);
  assert.ok(loaded, 'MissionCheckpointCrypto module must exist');
  const { MissionCheckpointCrypto } = loaded as typeof import('../src/security/MissionCheckpointCrypto');

  assert.throws(() => new MissionCheckpointCrypto(undefined), /MISSION_CHECKPOINT_ENCRYPTION_KEY/);
  assert.throws(() => new MissionCheckpointCrypto('not-a-key'), /32-byte/);

  const key = Buffer.alloc(32, 7).toString('base64');
  const crypto = new MissionCheckpointCrypto(key);
  const encrypted = crypto.encrypt(JSON.stringify({ tool: 'send_email', args: { body: 'private' } }));
  assert.notEqual(encrypted, JSON.stringify({ tool: 'send_email', args: { body: 'private' } }));
  assert.equal(crypto.decrypt(encrypted), JSON.stringify({ tool: 'send_email', args: { body: 'private' } }));
  assert.throws(() => new MissionCheckpointCrypto(Buffer.alloc(32, 8).toString('base64')).decrypt(encrypted));
  assert.throws(() => crypto.decrypt(`${encrypted.slice(0, -2)}aa`));
});
