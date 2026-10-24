// scripts/test-ai-brain-resilience.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

const host = 'http://127.0.0.1:3005';
const secret = fs.readFileSync('.jarvis-secret', 'utf8').trim();
const token = jwt.sign({ userId: 'commander-sri', username: 'Sri' }, secret, { expiresIn: '1h' });

const testQuery = 'can you write pyton programing';

console.log('Testing /api/ai/chat resilience with query:', testQuery);
try {
  const res = await fetch(`${host}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: testQuery })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Reply source:', data.source);
  const reply = data.reply || data.content || '';
  console.log('Sample reply (first 250 chars):\n', reply.slice(0, 250));

  assert.ok(res.ok, `HTTP status should be 200, got ${res.status}`);
  assert.ok(!data.error, `Response must not contain error: ${data.error}`);
  assert.ok(reply.length > 20, 'Response must have substantial content');
  assert.ok(!reply.includes('Neural processor encountered an unhandled exception'), 'Must not return canned exception');
  assert.ok(!reply.includes('Neural link timeout'), 'Must not return neural timeout');

  console.log('\n✔ TEST PASSED: AI brain generated real autonomous response with zero canned exceptions!');
} catch (err) {
  console.error('\n✘ TEST FAILED:', err.message);
  process.exit(1);
}
