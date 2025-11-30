// Launches local Chrome with the extension, using provided profile (for cookies/sessions).
// Usage: CHROME_PATH=<path-to-chrome> node embedded/scripts/launch-chrome.js
// Optional: BUSTER_EXT_PATH, BUSTER_PROFILE_PATH, BUSTER_TARGET (URL to open), BUSTER_BUILD=1 to force build.
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {spawn, execSync} = require('node:child_process');
const {computeExecutablePath, BrowserPlatform} = require('@puppeteer/browsers');
const userAgents = require('./user-agents');

const DEFAULT_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
];

function resolveLocalBrowser() {
  const binDir = path.join(__dirname, '..', 'bin');
  const configPath = path.join(__dirname, '..', 'browser-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const platform =
        process.env.BROWSER_PLATFORM ||
        BrowserPlatform[cfg.platform] ||
        cfg.platform ||
        'win64';
      const execPath = computeExecutablePath({
        cacheDir: binDir,
        browser: cfg.browser || 'chrome',
        buildId: cfg.revision,
        platform
      });
      if (execPath && fs.existsSync(execPath)) {
        return execPath;
      }
    } catch (err) {
      console.warn('[buster-launcher] Failed to resolve local browser from config:', err.message);
    }
  }
  return null;
}

const chromePath =
  process.env.CHROME_PATH ||
  resolveLocalBrowser() ||
  DEFAULT_PATHS.find(p => p && fs.existsSync(p));

if (!chromePath) {
  console.error('Chrome binary not found. Set CHROME_PATH env var.');
  console.error('Tip: run npm run setup:browser to download the pinned Chromium.');
  process.exit(1);
}

const scriptDir = __dirname;
const extPath =
  process.env.BUSTER_EXT_PATH ||
  path.resolve(scriptDir, '..', '..', 'dist', 'chrome');
console.log('[Launcher] Buscando extensión en:', extPath);

const manifestPath = path.join(extPath, 'manifest.json');

function ensureBuild() {
  if (process.env.BUSTER_BUILD === '1') {
    console.log('[buster-launcher] Forcing build because BUSTER_BUILD=1');
  } else if (fs.existsSync(manifestPath)) {
    return;
  } else {
    console.log('[buster-launcher] manifest.json not found, triggering build...');
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    execSync(`${npmCmd} run build:prod:chrome`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..')
    });
  } catch (err) {
    console.error('[buster-launcher] Build failed:', err.message);
    process.exit(1);
  }
  if (!fs.existsSync(manifestPath)) {
    console.error('[buster-launcher] manifest.json still missing after build, aborting.');
    process.exit(1);
  }
}

if (!fs.existsSync(manifestPath)) {
  console.error('[FATAL] No se encontró manifest.json en:', extPath);
  console.error('Asegúrate de haber ejecutado "npm run build:prod:chrome"');
  process.exit(1);
}

try {
  const files = fs.readdirSync(extPath);
  console.log('Archivos en dist:', files);
  // Compilación de emergencia si casi está vacío
  if (files.length <= 1) {
    console.warn('[Launcher] dist/chrome parece vacío, ejecutando build de emergencia...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execSync(`${npmCmd} run build:prod:chrome`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..')
    });
  }
} catch (err) {
  console.warn('[Launcher] No se pudo listar dist:', err.message);
}

const profilePath =
  process.env.BUSTER_PROFILE_PATH ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'buster-chrome-'));

const targetUrl =
  process.env.BUSTER_TARGET || 'https://patrickhlauke.github.io/recaptcha/';

ensureBuild();

// Pick a random UA from the pool.
const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

const args = [
  `--disable-extensions-except="${extPath}"`,
  `--load-extension="${extPath}"`,
  `--user-data-dir="${profilePath}"`,
  `--user-agent=${ua}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--disable-blink-features=AutomationControlled',
  '--disable-infobars',
  '--exclude-switches=enable-automation',
  '--use-mock-keychain',
  targetUrl
];

console.log('Launching Chrome with extension:', extPath);
console.log('Profile:', profilePath);
console.log('Target URL:', targetUrl);
console.log('[buster-launcher] Identity (UA):', ua);
console.log('Argumentos de lanzamiento:', args);
const child = spawn(chromePath, args, {
  stdio: 'inherit',
  detached: true
});

console.log(`[buster-launcher] Navegador lanzado y esperando en PID: ${child.pid}`);

child.unref();

// Mantén el proceso vivo hasta que se envíe SIGINT/CTRL+C, para inspección manual.
const keepAlive = setInterval(() => {}, 1 << 30);

process.on('SIGINT', () => {
  clearInterval(keepAlive);
  console.log('[buster-launcher] Terminando por SIGINT...');
  process.exit(0);
});
