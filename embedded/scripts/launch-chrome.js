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
const STAGED_EXT_DIR = path.join(os.tmpdir(), 'buster-ext-staged');
const PROXY_FILE = path.join(projectRoot, 'embedded', 'proxy.txt');

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

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  // Sobrescritura total de content_scripts para asegurar inyección en todos los iframes.
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
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('[launcher] Manifiesto PARCHEADO (content_scripts y host_permissions forzados a <all_urls>)');
} catch (err) {
  console.warn('[launcher] No se pudo auditar/parchear el manifest:', err.message);
}

// Validar que el content script final contenga los logs esperados.
const builtScriptPath = path.join(EXT_PATH, 'src', 'base', 'script.js');
if (fs.existsSync(builtScriptPath)) {
  try {
    const content = fs.readFileSync(builtScriptPath, 'utf-8').split(/\r?\n/);
    console.log('[launcher] Primeras 5 líneas de dist/src/base/script.js:');
    console.log(content.slice(0, 5).join('\n'));
  } catch (err) {
    console.warn('[launcher] No se pudo leer el content script built:', err.message);
  }
} else {
  console.warn('[launcher] No se encontró dist/src/base/script.js para validar logs');
}

function stageExtension() {
  if (fs.existsSync(STAGED_EXT_DIR)) {
    fs.rmSync(STAGED_EXT_DIR, {recursive: true, force: true});
  }
  fs.mkdirSync(STAGED_EXT_DIR, {recursive: true});
  fs.cpSync(EXT_PATH, STAGED_EXT_DIR, {recursive: true});
  console.log('[launcher] Extensión copiada a staging:', STAGED_EXT_DIR);
  return STAGED_EXT_DIR;
}

let currentProfileDir = PROFILE_DIR;
try {
  if (fs.existsSync(PROFILE_DIR)) {
    fs.rmSync(PROFILE_DIR, {recursive: true, force: true});
  }
} catch (err) {
  console.warn('[launcher] Perfil bloqueado, usando ruta temporal única...', err.message);
  currentProfileDir = path.join(os.tmpdir(), `buster-profile-${Date.now()}`);
}
fs.mkdirSync(currentProfileDir, {recursive: true});

const stagedExt = stageExtension();

let proxyValue = null;
if (fs.existsSync(PROXY_FILE)) {
  try {
    const raw = fs.readFileSync(PROXY_FILE, 'utf-8').trim();
    if (raw) {
      proxyValue = raw;
      console.log('[launcher] Usando Proxy: SI (Configurado desde archivo)');
    } else {
      console.log('[launcher] Modo Directo (proxy.txt vacío)');
    }
  } catch (err) {
    console.warn('[launcher] No se pudo leer proxy.txt:', err.message);
  }
} else {
  console.log('[launcher] Modo Directo (Sin Proxy)');
}

const args = [
  `--disable-extensions-except=${JSON.stringify(stagedExt)}`,
  `--load-extension=${JSON.stringify(stagedExt)}`,
  `--user-data-dir=${JSON.stringify(currentProfileDir)}`,
  '--start-maximized',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--test-type',
  'https://patrickhlauke.github.io/recaptcha/',
  'https://2captcha.com/demo/recaptcha-v2'
];

if (proxyValue) {
  args.splice(args.length - 1, 0, `--proxy-server=${JSON.stringify(proxyValue)}`);
}

const buildCommand =
  process.env.BUSTER_DEBUG === '1'
    ? `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run build:dev:chrome`
    : `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run build:prod:chrome`;

// Rebuild if manifest or staged ext missing
try {
  execSync(buildCommand, {stdio: 'inherit', cwd: projectRoot});
} catch (err) {
  console.error('[launcher] Error al ejecutar build:', err.message);
  process.exit(1);
}

const command = [JSON.stringify(chromePath)].concat(args).join(' ');
console.log('[launcher] Chrome path:', chromePath);
console.log('[launcher] EXT_PATH:', EXT_PATH);
console.log('[launcher] PROFILE_DIR:', PROFILE_DIR);
console.log('[launcher] command:', command);

execSync(command, {stdio: 'inherit'});
