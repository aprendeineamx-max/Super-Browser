const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function createLogger(scope = 'app', {level = 'info', sampleRate = 1} = {}) {
  const minLevel = levels[level] || levels.info;

  function shouldSample() {
    return sampleRate >= 1 || Math.random() < sampleRate;
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

    return payload;
  }

  return {
    debug: (msg, ctx) => emit('debug', msg, ctx),
    info: (msg, ctx) => emit('info', msg, ctx),
    warn: (msg, ctx) => emit('warn', msg, ctx),
    error: (msg, ctx) => emit('error', msg, ctx)
  };
}

export {createLogger};
