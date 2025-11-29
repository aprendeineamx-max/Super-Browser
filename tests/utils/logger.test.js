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

test('logger updates level and sample rate', () => {
  const entries = [];
  const logger = createLogger('test', {
    level: 'warn',
    sampleRate: 0,
    onLog: e => entries.push(e)
  });

  logger.info('ignored');
  logger.setLevel('info');
  logger.setSampleRate(1);
  logger.info('now');

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].message, 'now');
});
