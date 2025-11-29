import test from 'node:test';
import assert from 'node:assert';

import {formatMetrics} from 'utils/metrics';

test('formatMetrics sorts by total and fills defaults', () => {
  const metrics = {
    b: {ok: 1, fail: 1, avgMs: 200},
    a: {ok: 3, fail: 0, avgMs: 100}
  };

  const rows = formatMetrics(metrics);
  assert.strictEqual(rows[0].driver, 'a');
  assert.strictEqual(rows[0].total, 3);
  assert.strictEqual(rows[1].driver, 'b');
  assert.strictEqual(rows[1].total, 2);
});
