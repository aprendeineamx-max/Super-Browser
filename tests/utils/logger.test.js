import test from 'node:test';
import assert from 'node:assert';

import {createLogger} from 'utils/logger';

test('logger calls onLog hook and respects level', () => {
  const entries = [];
  const logger = createLogger('test', {level: 'info', onLog: e => entries.push(e)});

  logger.debug('ignore');
  logger.info('hello', {foo: 'bar'});

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].message, 'hello');
  assert.strictEqual(entries[0].scope, 'test');
  assert.strictEqual(entries[0].foo, 'bar');
});
