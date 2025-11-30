// Launcher simple: carga una extensión desempaquetada indicada por EXT_PATH.
// Uso: EXT_PATH="C:\\ruta\\a\\la\\extension" CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" node embedded/scripts/launch-simple.js

const path = require('node:path');
const fs = require('node:fs');
const {execSync} = require('node:child_process');
const os = require('node:os');

const EXT_PATH =
  process.env.EXT_PATH ||
  path.resolve(__dirname, '..', '..', 'dist', 'chrome');
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR =
  process.env.PROFILE_DIR ||
  path.join(os.tmpdir(), 'buster-simple-profile');

function ensureExt() {
  const manifestPath = path.join(EXT_PATH, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('[simple-launcher] manifest.json no encontrado en EXT_PATH:', EXT_PATH);
    process.exit(1);
  }
}

function ensureProfile() {
  if (fs.existsSync(PROFILE_DIR)) {
    fs.rmSync(PROFILE_DIR, {recursive: true, force: true});
  }
  fs.mkdirSync(PROFILE_DIR, {recursive: true});
}

function launch() {
  ensureExt();
  ensureProfile();

  const args = [
    `--load-extension=${JSON.stringify(EXT_PATH)}`,
    `--user-data-dir=${JSON.stringify(PROFILE_DIR)}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-popup-blocking',
    '--no-sandbox',
    'https://example.com'
  ];

  const command = [JSON.stringify(CHROME_PATH)].concat(args).join(' ');
  console.log('[simple-launcher] EXT_PATH:', EXT_PATH);
  console.log('[simple-launcher] PROFILE_DIR:', PROFILE_DIR);
  console.log('[simple-launcher] command:', command);
  execSync(command, {stdio: 'inherit'});
}

launch();
