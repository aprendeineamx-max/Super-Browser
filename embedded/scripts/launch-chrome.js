// Launches local Chrome with the extension; uses exec with quoted args to survive spaces.
// Usage: CHROME_PATH=<path-to-chrome> node embedded/scripts/launch-chrome.js
// Optional: BUSTER_EXT_PATH, BUSTER_PROFILE_PATH, BUSTER_TARGET (URL to open), BUSTER_BUILD=1 to force build.
const path = require('node:path');
const fs = require('node:fs');
const {exec, execSync} = require('node:child_process');
const {computeExecutablePath, BrowserPlatform} = require('@puppeteer/browsers');
const userAgents = require('./user-agents');

const scriptDir = __dirname;

const DEFAULT_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
];

function resolveLocalBrowser() {
  const binDir = path.join(scriptDir, '..', 'bin');
  const configPath = path.join(scriptDir, '..', 'browser-config.json');
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
      cwd: path.join(scriptDir, '..', '..')
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

function inspectManifest() {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const bg =
      (manifest.background && manifest.background.service_worker) ||
      (manifest.background && manifest.background.scripts && manifest.background.scripts[0]);
    console.log('[Launcher] El manifiesto espera el script de background:', bg || 'N/D');
    if (bg) {
      const bgPath = path.join(extPath, bg);
      if (!fs.existsSync(bgPath)) {
        console.error('[ERROR] Archivo faltante en dist/chrome:', bgPath);
        console.error('[ERROR] Ejecutando reconstrucción forzada (npm run build:prod:chrome)...');
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        execSync(`${npmCmd} run build:prod:chrome`, {
          stdio: 'inherit',
          cwd: path.join(scriptDir, '..', '..')
        });
      }
    }
  } catch (err) {
    console.error('[Launcher] No se pudo inspeccionar manifest.json:', err.message);
  }
}

try {
  const files = fs.readdirSync(extPath);
  console.log('Archivos en dist:', files);
  if (files.length <= 1) {
    console.warn('[Launcher] dist/chrome parece vacío, ejecutando build de emergencia...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execSync(`${npmCmd} run build:prod:chrome`, {
      stdio: 'inherit',
      cwd: path.join(scriptDir, '..', '..')
    });
  }
} catch (err) {
  console.warn('[Launcher] No se pudo listar dist:', err.message);
}

inspectManifest();

const profilePath =
  process.env.BUSTER_PROFILE_PATH ||
  (function () {
    const fixed = path.resolve(scriptDir, 'user-data');
    if (fs.existsSync(fixed)) {
      fs.rmSync(fixed, {recursive: true, force: true});
    }
    fs.mkdirSync(fixed, {recursive: true});
    return fixed;
  })();

const targetUrl =
  process.env.BUSTER_TARGET || 'https://patrickhlauke.github.io/recaptcha/';

ensureBuild();

// Pick a random UA from the pool.
const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

const parts = [
  JSON.stringify(chromePath),
  `--load-extension=${JSON.stringify(extPath)}`,
  `--user-data-dir=${JSON.stringify(profilePath)}`,
  `--user-agent=${JSON.stringify(ua)}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--disable-blink-features=AutomationControlled',
  '--disable-infobars',
  '--exclude-switches=enable-automation',
  '--use-mock-keychain',
  targetUrl
];

const command = parts.join(' ');

console.log('Launching Chrome with extension:', extPath);
console.log('Profile:', profilePath);
console.log('Target URL:', targetUrl);
console.log('[buster-launcher] Identity (UA):', ua);
console.log('[Launcher] Ejecutando comando RAW:', command);

exec(command, err => {
  if (err) {
    console.error('[buster-launcher] Error al lanzar Chrome:', err);
  }
});
