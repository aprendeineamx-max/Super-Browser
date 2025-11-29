// Attempts to install electron globally. Use with caution.
const {spawnSync} = require('node:child_process');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const result = spawnSync(npmCmd, ['install', '-g', 'electron'], {
  stdio: 'inherit'
});

if (result.status !== 0) {
  console.error('Global electron install failed.');
  process.exit(result.status || 1);
}

console.log('Global electron installed successfully.');
