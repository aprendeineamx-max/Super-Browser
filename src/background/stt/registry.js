import {withRetry, withTimeout} from 'utils/retry';

const drivers = new Map();

function registerDriver(id, driver) {
  drivers.set(id, driver);
}

function getDriver(id) {
  return drivers.get(id);
}

function clearDrivers() {
  drivers.clear();
}

async function transcribeWithFallback({
  order = [],
  lang,
  audioContent,
  audioBase64 = null,
  tryEnglishSpeechModel = false,
  logger,
  onMetric = null,
  context = {}
} = {}) {
  const seen = new Set();
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);

    const driver = getDriver(id);
    if (!driver) {
      logger?.warn?.('STT driver not found', {driver: id});
      continue;
    }

    if (driver.canUse && !(await driver.canUse({lang, context}))) {
      logger?.debug?.('STT driver skipped by canUse', {driver: id});
      continue;
    }

    const startedAt = Date.now();
    try {
      const run = async () =>
        await driver.transcribe({
          lang,
          audioContent,
          audioBase64,
          tryEnglishSpeechModel,
          context,
          logger
        });

      const result = await withRetry(
        () =>
          withTimeout(
            run(),
            driver.timeoutMs || 20000,
            `${id} timed out after ${driver.timeoutMs || 20000}ms`
          ),
        driver.retryOptions
      );

      const durationMs = Date.now() - startedAt;
      onMetric?.({driverId: id, ok: Boolean(result), durationMs});

      if (result) {
        return result;
      }
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      onMetric?.({driverId: id, ok: false, durationMs});
      logger?.warn?.('STT driver failed', {
        driver: id,
        error: err?.message || String(err)
      });
      continue;
    }
  }
}

export {registerDriver, transcribeWithFallback, clearDrivers};
