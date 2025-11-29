// Ensures local dev deps for embedded launchers are installed.
// Installs electron and playwright-chromium locally if missing.
const {spawnSync} = require('node:child_process');

function isResolvable(mod) {
  try {
    require.resolve(mod);
    return true;
  } catch (err) {
    return false;
  }
}

const missing = [];
if (!isResolvable('electron')) {
  missing.push('electron');
}
if (!isResolvable('playwright-chromium')) {
  missing.push('playwright-chromium');
}

if (missing.length) {
  console.log('Installing missing dev deps:', missing.join(', '));
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--save-dev', '--legacy-peer-deps', ...missing],
    {stdio: 'inherit'}
  );
  if (result.status !== 0) {
    console.error('Failed to install dev deps', missing);
    process.exit(result.status || 1);
  }
} else {
  console.log('Dev deps already present.');
}
