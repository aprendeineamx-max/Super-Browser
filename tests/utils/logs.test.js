import test from 'node:test';
import assert from 'node:assert';

import {filterLogs} from 'utils/logs';

test('filterLogs filters by level', () => {
  const logs = [
    {level: 'info', message: 'a'},
    {level: 'error', message: 'b'}
  ];

  const result = filterLogs({logs, level: 'error'});
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].message, 'b');
});

test('filterLogs filters by search text', () => {
  const logs = [
    {level: 'info', message: 'hello world', scope: 'bg'},
    {level: 'info', message: 'other', scope: 'content'}
  ];

  const result = filterLogs({logs, search: 'world'});
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].message, 'hello world');
});

test('filterLogs filters by scope', () => {
  const logs = [
    {level: 'info', message: 'a', scope: 'bg'},
    {level: 'info', message: 'b', scope: 'content'}
  ];

  const result = filterLogs({logs, scope: 'content'});
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].message, 'b');
});

test('filterLogs filters by date range', () => {
  const now = Date.now();
  const logs = [
    {level: 'info', message: 'old', ts: now - 100000},
    {level: 'info', message: 'new', ts: now}
  ];

  const result = filterLogs({logs, fromTs: now - 1000});
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].message, 'new');
});
