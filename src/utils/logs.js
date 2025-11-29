function filterLogs({logs = [], level = 'all', search = ''} = {}) {
  const q = (search || '').toLowerCase();

  return logs
    .filter(log => (level === 'all' ? true : log.level === level))
    .filter(log => {
      if (!q) return true;
      return (
        (log.scope || '').toLowerCase().includes(q) ||
        (log.message || '').toLowerCase().includes(q)
      );
    });
}

export {filterLogs};
