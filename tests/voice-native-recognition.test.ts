import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectBestAlternative, recognizeOnce } from '../src/voice/NativeRecognition';

test('the highest-confidence alternative wins', () => {
  const best = selectBestAlternative([
    { transcript: 'open the task page', confidence: 0.62, isFinal: true },
    { transcript: 'open the tasks page', confidence: 0.93, isFinal: true },
    { transcript: 'open the task base', confidence: 0.51, isFinal: true },
  ]);
  assert.equal(best.text, 'open the tasks page');
  assert.equal(best.confidence, 0.93);
});

test('blank alternatives are ignored', () => {
  const best = selectBestAlternative([
    { transcript: '   ', confidence: 0.9, isFinal: true },
    { transcript: 'send the report', confidence: 0, isFinal: true },
  ]);
  assert.equal(best.text, 'send the report');
});

test('recognition degrades gracefully when the browser API is unavailable', async () => {
  const result = await recognizeOnce({ lang: 'en-IN', timeoutMs: 50 });
  assert.equal(result.source, 'none');
  assert.equal(result.text, '');
  assert.ok(result.error);
});
