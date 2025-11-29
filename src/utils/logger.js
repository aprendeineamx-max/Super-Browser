const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function createLogger(
  scope = 'app',
  {level = 'info', sampleRate = 1, onLog = null} = {}
) {
  let minLevel = levels[level] || levels.info;
  let rate = sampleRate;

  function shouldSample() {
    return rate >= 1 || Math.random() < rate;
  }

  function emit(lvl, message, context = {}) {
    if ((levels[lvl] || levels.info) < minLevel) return;
    if (!shouldSample()) return;

    const payload = {
      scope,
      level: lvl,
      message,
      ...context
    };

    // eslint-disable-next-line no-console
    console[lvl === 'error' ? 'error' : lvl === 'warn' ? 'warn' : 'info'](
      `[${scope}] ${lvl}: ${message}`,
      context
    );

    if (onLog) {
      onLog(payload);
    }

    return payload;
  }

  function setLevel(newLevel) {
    if (levels[newLevel]) {
      minLevel = levels[newLevel];
    }
  }

  function setSampleRate(newRate) {
    const value = Number(newRate);
    if (!Number.isNaN(value) && value >= 0 && value <= 1) {
      rate = value;
    }
  }

  return {
    debug: (msg, ctx) => emit('debug', msg, ctx),
    info: (msg, ctx) => emit('info', msg, ctx),
    warn: (msg, ctx) => emit('warn', msg, ctx),
    error: (msg, ctx) => emit('error', msg, ctx),
    setLevel,
    setSampleRate
  };
}

export {createLogger, levels};
