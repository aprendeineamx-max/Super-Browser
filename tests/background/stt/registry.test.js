import test from 'node:test';
import assert from 'node:assert';

import {
  registerDriver,
  transcribeWithFallback,
  clearDrivers
} from 'background/stt/registry';

const noopLogger = {
  debug: () => {},
  warn: () => {}
};

test('transcribeWithFallback respects order and metrics', async () => {
  clearDrivers();

  registerDriver('fail', {
    transcribe: async () => {
      throw new Error('nope');
    },
    timeoutMs: 50
  });

  registerDriver('ok', {
    transcribe: async () => 'solved',
    timeoutMs: 50
  });

  const metrics = [];

  const result = await transcribeWithFallback({
    order: ['fail', 'ok'],
    lang: 'en',
    audioContent: new ArrayBuffer(0),
    audioBase64: '',
    tryEnglishSpeechModel: false,
    logger: noopLogger,
    onMetric: m => metrics.push(m)
  });

  assert.strictEqual(result, 'solved');
  assert.strictEqual(metrics.length, 2);
  assert.strictEqual(metrics[0].ok, false);
  assert.strictEqual(metrics[1].ok, true);
});
