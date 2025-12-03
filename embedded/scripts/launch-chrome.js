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
// Auditoría de rutas y sobrescritura total de content_scripts
  // Listar archivos .js reales
  const jsFiles = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        jsFiles.push(path.relative(EXT_PATH, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(EXT_PATH);
  jsFiles.forEach(f => console.log('[Auditoría] Archivo en disco:', f));

  const cs = manifest.content_scripts && manifest.content_scripts[0];
  const requestedJs = cs && cs.js ? cs.js : [];
  console.log('[Auditoría] Manifiesto pide:', requestedJs);

  // Escoger ruta válida
  const desired = 'src/base/script.js';
  let targetJs = desired;
  if (!jsFiles.includes(desired)) {
    const fallback = jsFiles.find(f => f.endsWith('base/script.js'));
    if (fallback) {
      targetJs = fallback;
    } else {
      console.error('[FATAL] No se encontró script.js de content_scripts en dist/chrome');
      process.exit(1);
    }
  }

  manifest.content_scripts = [
    {
      matches: ['<all_urls>'],
      js: [targetJs],
      css: ['src/base/style.css'],
      all_frames: true,
      match_about_blank: true,
      run_at: 'document_start'
    }
  ];
  manifest.host_permissions = ['<all_urls>'];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('[launcher] Manifiesto alineado con ruta JS:', targetJs);
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

// Sobrescribir script.js con código puro para aislar problemas de bundling.
try {
  const pwnedScriptPath = path.join(stagedExt, 'src', 'base', 'script.js');
  const pwnedCode = `
console.log("🔥 SCRIPT PURO INYECTADO 🔥");
(function() {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:20px; background:purple; z-index:99999999; color:white; text-align:center; font-weight:bold;';
  d.innerText = 'JS PURO FUNCIONANDO EN: ' + window.location.host;
  (document.body || document.documentElement).appendChild(d);

  var btn = document.createElement('button');
  btn.innerText = '⚡ TEST';
  btn.style.cssText = 'position:fixed; bottom:10px; right:10px; background:orange; z-index:99999999; padding:20px;';
  document.body.appendChild(btn);
})();
`;
  fs.writeFileSync(pwnedScriptPath, pwnedCode, 'utf-8');
  console.log('[Launcher] Archivo script.js SOBRESCRITO con código puro.');
} catch (err) {
  console.warn('[Launcher] No se pudo sobrescribir script.js para prueba de vida:', err.message);
}

const command = [JSON.stringify(chromePath)].concat(args).join(' ');
console.log('[launcher] Chrome path:', chromePath);
console.log('[launcher] EXT_PATH:', EXT_PATH);
console.log('[launcher] PROFILE_DIR:', PROFILE_DIR);
console.log('[launcher] command:', command);

execSync(command, {stdio: 'inherit'});
