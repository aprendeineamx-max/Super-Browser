import test from 'node:test';
import assert from 'node:assert';

import {withRetry, withTimeout} from 'utils/retry';

test('withRetry retries and succeeds', async () => {
  let attempts = 0;

  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error('fail once');
      }
      return 'ok';
    },
    {retries: 2, baseDelay: 5, factor: 1}
  );

  assert.strictEqual(result, 'ok');
  assert.strictEqual(attempts, 2);
});

test('withTimeout rejects when exceeding limit', async () => {
  let timedOut = false;
  try {
    await withTimeout(new Promise(() => {}), 10, 'timeout');
  } catch (err) {
    timedOut = err instanceof Error && err.message === 'timeout';
  }
  assert.strictEqual(timedOut, true);
});
