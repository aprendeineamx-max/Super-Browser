// Launches local Chrome with the extension, using provided profile (for cookies/sessions).
// Usage: CHROME_PATH=<path-to-chrome> node embedded/scripts/launch-chrome.js
// Optional: BUSTER_EXT_PATH, BUSTER_PROFILE_PATH, BUSTER_TARGET (URL to open), BUSTER_BUILD=1 to force build.
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {spawn} = require('node:child_process');

const DEFAULT_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
];

const chromePath =
  process.env.CHROME_PATH ||
  DEFAULT_PATHS.find(p => p && fs.existsSync(p));

if (!chromePath) {
  console.error('Chrome binary not found. Set CHROME_PATH env var.');
  process.exit(1);
}

const extPath =
  process.env.BUSTER_EXT_PATH ||
  path.join(__dirname, '..', '..', 'dist', 'chrome');

if (process.env.BUSTER_BUILD === '1') {
  console.log('Building dist/chrome...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawn(npmCmd, ['run', 'build:prod:chrome'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..')
  });
  if (result.status !== 0) {
    console.error('Build failed, cannot continue.');
    process.exit(result.status || 1);
  }
}

const profilePath =
  process.env.BUSTER_PROFILE_PATH ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'buster-chrome-'));

const targetUrl =
  process.env.BUSTER_TARGET || 'https://patrickhlauke.github.io/recaptcha/';

const args = [
  `--disable-extensions-except=${extPath}`,
  `--load-extension=${extPath}`,
  `--user-data-dir=${profilePath}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  targetUrl
];

// Allow skipping the automation flag if it interferes with UI injection.
if (process.env.BUSTER_NO_AUTOMATION !== '1') {
  args.splice(args.length - 1, 0, '--disable-blink-features=AutomationControlled');
}

console.log('Launching Chrome with extension:', extPath);
console.log('Profile:', profilePath);
console.log('Target URL:', targetUrl);
const child = spawn(chromePath, args, {stdio: 'inherit'});

child.on('exit', code => {
  console.log('Chrome exited with code', code);
});
