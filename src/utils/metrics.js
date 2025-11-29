function formatMetrics(sttMetrics = {}) {
  const rows = Object.entries(sttMetrics || {}).map(([driver, stats]) => ({
    driver,
    ok: stats?.ok || 0,
    fail: stats?.fail || 0,
    avgMs: stats?.avgMs || 0,
    total: (stats?.ok || 0) + (stats?.fail || 0)
  }));

  return rows.sort((a, b) => b.total - a.total);
}

export {formatMetrics};
