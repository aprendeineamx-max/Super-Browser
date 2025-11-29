function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, {retries = 2, baseDelay = 150, factor = 2, shouldRetry = null} = {}) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn({attempt});
    } catch (err) {
      lastError = err;
      if (shouldRetry && !(await shouldRetry(err, attempt))) {
        break;
      }
      if (attempt === retries) {
        break;
      }
      const delay = baseDelay * Math.pow(factor, attempt);
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError;
}

async function withTimeout(promise, timeoutMs = 20000, timeoutMessage = 'Timed out') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export {withRetry, withTimeout};
