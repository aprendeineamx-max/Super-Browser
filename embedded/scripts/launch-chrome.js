// Launcher for isolated Chromium (no system Chrome). Fails if local Chromium is missing.
// Usage: node embedded/scripts/launch-chrome.js
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {execSync} = require('node:child_process');

const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..', '..');
const EXT_PATH = path.resolve(projectRoot, 'dist', 'chrome');
const PROFILE_DIR = path.join(os.tmpdir(), 'buster-portable-profile');

function findPlaywrightChromium() {
  const base = path.join(projectRoot, 'node_modules', 'playwright', '.local-browsers');
  if (!fs.existsSync(base)) return null;
  const entries = fs.readdirSync(base);
  for (const entry of entries) {
    const candidate = path.join(base, entry, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function findEmbeddedBin() {
  const candidate = path.join(projectRoot, 'embedded', 'bin', 'chrome.exe');
  return fs.existsSync(candidate) ? candidate : null;
}

const chromePath = findPlaywrightChromium() || findEmbeddedBin();

if (!chromePath) {
  console.error(
    '[FATAL] No se encontró Chromium aislado. Ejecuta "npx playwright install chromium" o "npm run setup:browser".'
  );
  process.exit(1);
}

const manifestPath = path.join(EXT_PATH, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('[FATAL] manifest.json no encontrado en dist/chrome. Ejecuta npm run build:prod:chrome');
  process.exit(1);
}

if (fs.existsSync(PROFILE_DIR)) {
  fs.rmSync(PROFILE_DIR, {recursive: true, force: true});
}
fs.mkdirSync(PROFILE_DIR, {recursive: true});

const args = [
  `--load-extension=${JSON.stringify(EXT_PATH)}`,
  `--user-data-dir=${JSON.stringify(PROFILE_DIR)}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--no-sandbox',
  'https://example.com'
];

const command = [JSON.stringify(chromePath)].concat(args).join(' ');
console.log('[launcher] Chrome path:', chromePath);
console.log('[launcher] EXT_PATH:', EXT_PATH);
console.log('[launcher] PROFILE_DIR:', PROFILE_DIR);
console.log('[launcher] command:', command);

execSync(command, {stdio: 'inherit'});
