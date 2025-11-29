import {createLogger} from 'utils/logger';

const log = createLogger('browserClient');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, {op = 'unknown', retries = 3, baseDelay = 100, factor = 2} = {}) {
  let attempt = 0;
  while (true) {
    const started = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - started;
      log.info('[BrowserAPI] Call success', {op, duration});
      return result;
    } catch (err) {
      attempt += 1;
      const duration = Date.now() - started;
      const willRetry = attempt <= retries;
      log.warn('[BrowserAPI] Call failed', {
        op,
        attempt,
        retries,
        duration,
        error: err?.message
      });
      if (!willRetry) {
        log.error('[BrowserAPI] Retries exhausted', {op, retries, error: err?.message});
        throw err;
      }
      const wait = baseDelay * Math.pow(factor, attempt - 1);
      await delay(wait);
    }
  }
}

function sendMessage(target, payload, opts = {}) {
  const isTab = typeof target === 'number';
  const op = isTab ? 'tabs.sendMessage' : 'runtime.sendMessage';
  return withRetry(
    () => {
      if (isTab) {
        return browser.tabs.sendMessage(target, payload);
      }
      // runtime.sendMessage puede recibir (message) o (extensionId, message)
      return target
        ? browser.runtime.sendMessage(target, payload)
        : browser.runtime.sendMessage(payload);
    },
    {...opts, op}
  );
}

function storageGet(keys = null, {area = 'local', ...opts} = {}) {
  const op = `storage.${area}.get`;
  return withRetry(() => browser.storage[area].get(keys), {...opts, op});
}

function storageSet(obj, {area = 'local', ...opts} = {}) {
  const op = `storage.${area}.set`;
  return withRetry(() => browser.storage[area].set(obj), {...opts, op});
}

function storageRemove(keys, {area = 'local', ...opts} = {}) {
  const op = `storage.${area}.remove`;
  return withRetry(() => browser.storage[area].remove(keys), {...opts, op});
}

function storageClear({area = 'local', ...opts} = {}) {
  const op = `storage.${area}.clear`;
  return withRetry(() => browser.storage[area].clear(), {...opts, op});
}

export {
  withRetry,
  sendMessage,
  storageGet,
  storageSet,
  storageRemove,
  storageClear
};
