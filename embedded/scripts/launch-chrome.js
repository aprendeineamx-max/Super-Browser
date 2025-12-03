// Lanzador de Chromium aislado con content script puro y auto-configuración.
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {execSync} = require('node:child_process');

const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..', '..');
const EXT_PATH = path.resolve(projectRoot, 'dist', 'chrome');
const PROFILE_DIR = path.join(os.tmpdir(), 'buster-portable-profile');
const STAGED_EXT_DIR = path.join(os.tmpdir(), 'buster-ext-staged');
const PROXY_FILE = path.join(projectRoot, 'embedded', 'proxy.txt');

// 1) Encontrar Chromium (Playwright)
function findPlaywrightChromium() {
  const base = path.join(projectRoot, 'node_modules', 'playwright', '.local-browsers');
  if (!fs.existsSync(base)) return null;
  for (const entry of fs.readdirSync(base)) {
    const candidate = path.join(base, entry, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
const chromePath = findPlaywrightChromium();
if (!chromePath) {
  console.error('[FATAL] No se encontró Chromium aislado. Ejecuta "npx playwright install chromium".');
  process.exit(1);
}

// 2) Validar manifest
const manifestPath = path.join(EXT_PATH, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('[FATAL] Falta manifest.json. Ejecuta npm run build:prod:chrome');
  process.exit(1);
}

// 3) Parchear manifest (inyección global en todos los iframes, document_start)
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.content_scripts = [
    {
      matches: ['<all_urls>'],
      js: ['src/base/script.js'],
      css: ['src/base/style.css'],
      all_frames: true,
      match_about_blank: true,
      run_at: 'document_start'
    }
  ];
  manifest.host_permissions = ['<all_urls>'];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('[Launcher] Manifest parcheado para inyección global.');
} catch (e) {
  console.warn('[Launcher] Error parcheando manifest:', e.message);
}

// 4) Staging limpio
if (fs.existsSync(STAGED_EXT_DIR)) fs.rmSync(STAGED_EXT_DIR, {recursive: true, force: true});
fs.mkdirSync(STAGED_EXT_DIR, {recursive: true});
fs.cpSync(EXT_PATH, STAGED_EXT_DIR, {recursive: true});

// 5) Copiar script puro (humano) sobre el bundling generado
try {
  const sourcePure = path.join(projectRoot, 'src', 'base', 'script.pure.js');
  const targetJs = path.join(STAGED_EXT_DIR, 'src', 'base', 'script.js');
  fs.copyFileSync(sourcePure, targetJs);
  console.log('[Launcher] VERIFICACIÓN: script.pure.js copiado. Tamaño:', fs.statSync(targetJs).size, 'bytes');
} catch (err) {
  console.warn('[Launcher] No se pudo copiar script.pure.js:', err.message);
}

// 6) Perfil
let currentProfileDir = PROFILE_DIR;
try {
  if (fs.existsSync(PROFILE_DIR)) fs.rmSync(PROFILE_DIR, {recursive: true, force: true});
} catch (e) {
  currentProfileDir = path.join(os.tmpdir(), `buster-profile-${Date.now()}`);
}
fs.mkdirSync(currentProfileDir, {recursive: true});

// 7) Proxy opcional
let proxyArg = '';
if (fs.existsSync(PROXY_FILE)) {
  const p = fs.readFileSync(PROXY_FILE, 'utf-8').trim();
  if (p) proxyArg = `--proxy-server=${p}`;
}

// 8) Build dev o prod antes de lanzar
const buildCommand =
  process.env.BUSTER_DEBUG === '1'
    ? `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run build:dev:chrome`
    : `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run build:prod:chrome`;
try {
  execSync(buildCommand, {stdio: 'inherit', cwd: projectRoot});
} catch (err) {
  console.error('[Launcher] Error al ejecutar build:', err.message);
  process.exit(1);
}

// 9) Argumentos y lanzamiento
const args = [
  `--disable-extensions-except=${JSON.stringify(STAGED_EXT_DIR)}`,
  `--load-extension=${JSON.stringify(STAGED_EXT_DIR)}`,
  `--user-data-dir=${JSON.stringify(currentProfileDir)}`,
  '--start-maximized',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--test-type',
  proxyArg ? proxyArg : '',
  'https://patrickhlauke.github.io/recaptcha/',
  'https://2captcha.com/demo/recaptcha-v2'
].filter(Boolean);

const command = [JSON.stringify(chromePath)].concat(args).join(' ');
console.log('[Launcher] Ejecutando:', command);
execSync(command, {stdio: 'inherit'});

