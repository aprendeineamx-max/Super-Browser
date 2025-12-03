// Launcher for isolated Chromium. Fails if local Chromium is missing.
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

// --- 1. Encontrar Chromium ---
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
const chromePath = findPlaywrightChromium();
if (!chromePath) {
  console.error('[FATAL] No se encontró Chromium. Ejecuta "npx playwright install chromium".');
  process.exit(1);
}

// --- 2. Validar Manifest ---
const manifestPath = path.join(EXT_PATH, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('[FATAL] Falta manifest.json. Ejecuta npm run build:prod:chrome');
  process.exit(1);
}

// --- 3. Parchear Manifest (Forzar inyección) ---
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  // Forzamos la configuración correcta
  manifest.content_scripts = [{
    "matches": ["<all_urls>"],
    "js": ["src/base/script.js"],
    "css": ["src/base/style.css"],
    "all_frames": true,
    "match_about_blank": true,
    "run_at": "document_start"
  }];
  manifest.host_permissions = ["<all_urls>"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('[Launcher] Manifest parcheado para inyección global.');
} catch (e) {
  console.warn('[Launcher] Error parcheando manifest:', e.message);
}

// --- 4. Staging (Copia limpia) ---
if (fs.existsSync(STAGED_EXT_DIR)) fs.rmSync(STAGED_EXT_DIR, {recursive: true, force: true});
fs.mkdirSync(STAGED_EXT_DIR, {recursive: true});
fs.cpSync(EXT_PATH, STAGED_EXT_DIR, {recursive: true});

// --- 5. INYECCIÓN DEL CONTENT SCRIPT V3 (Código Puro Inline) ---
// Escribimos esto directamente en el staging para asegurar que sea la versión nueva
const v3ScriptContent = `
(function () {
  console.log('🔥 BUSTER V3 - INTEGRACIÓN WIDGET ACTIVADA 🔥');
  const BTN_ID = 'buster-widget-btn';

  // --- Utilidades Humanas ---
  function randomSleep(min = 50, max = 150) {
    const t = min + Math.random() * (max - min);
    return new Promise(res => setTimeout(res, t));
  }

  async function simulateClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, view: window, clientX: rect.left + 5, clientY: rect.top + 5 };
    el.dispatchEvent(new MouseEvent('mousemove', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    await randomSleep(20, 60);
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  async function typeText(input, text) {
    input.focus();
    let current = '';
    for (const ch of text) {
      current += ch;
      input.value = current;
      input.dispatchEvent(new Event('input', {bubbles: true}));
      await randomSleep(50, 150);
    }
  }

  // --- Lógica de Resolución ---
  async function solveAudio() {
    const audioBtn = document.querySelector('#recaptcha-audio-button');
    if (audioBtn) {
        await simulateClick(audioBtn);
        await randomSleep(1000, 2000);
    }

    // Buscar audio source (reintentos)
    let audioEl = null;
    for(let k=0; k<10; k++) {
        audioEl = document.querySelector('audio#audio-source');
        if(audioEl && audioEl.src) break;
        await randomSleep(500, 1000);
    }

    if (!audioEl || !audioEl.src) {
        console.warn('[BUSTER] No se encontró audio source');
        return;
    }

    // Enviar a background
    const btn = document.getElementById(BTN_ID);
    if(btn) btn.innerText = '⏳';
    
    try {
        const solution = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                id: 'transcribeAudio',
                audioUrl: audioEl.src,
                lang: 'en'
            }, response => resolve(response));
        });

        if (solution) {
            const input = document.querySelector('#audio-response');
            await typeText(input, solution);
            const verifyBtn = document.querySelector('#recaptcha-verify-button');
            await simulateClick(verifyBtn);
            if(btn) btn.innerText = '✅';
        } else {
            if(btn) btn.innerText = '❌';
        }
    } catch(e) {
        console.error(e);
        if(btn) btn.innerText = 'ERR';
    }
  }

  // --- Inyección Visual Inteligente ---
  function inject() {
    // Solo actuamos en iframes de google
    if (!window.location.href.includes('google.com/recaptcha') && !window.location.href.includes('recaptcha.net')) return;

    // Buscamos el footer oficial
    const footer = document.querySelector('.rc-footer');
    if (!footer) return; // Si no hay footer, esperamos al siguiente ciclo

    if (document.getElementById(BTN_ID)) return; // Ya inyectado

    const btn = document.createElement('div');
    btn.id = BTN_ID;
    btn.className = 'buster-extension-button'; // Para que herede estilos si los hay
    btn.innerText = '🍊'; // Icono simple
    btn.title = 'Resolver con Buster';
    
    // Estilos para que parezca nativo
    Object.assign(btn.style, {
        width: '24px',
        height: '24px',
        backgroundColor: '#ff4500',
        borderRadius: '2px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        marginLeft: '8px',
        marginTop: '10px', // Ajuste vertical
        boxShadow: '0 1px 1px rgba(0,0,0,0.2)'
    });

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        solveAudio();
    };

    // Insertar en la barra de controles (al lado del botón Info o Audio)
    const controls = document.querySelector('.rc-controls') || footer;
    if(document.querySelector('.primary-controls')) {
        document.querySelector('.primary-controls').appendChild(btn);
    } else {
        controls.appendChild(btn);
    }
    console.log('⚡ [BUSTER] Botón inyectado en el footer');
  }

  // Ciclo de vida agresivo
  setInterval(inject, 500);
})();
`;

// Sobrescribimos el archivo en staging
const targetJs = path.join(STAGED_EXT_DIR, 'src', 'base', 'script.js');
fs.writeFileSync(targetJs, v3ScriptContent);
console.log('[Launcher] Content Script V3 inyectado (Size:', v3ScriptContent.length, ')');

// --- 6. Perfil ---
let currentProfileDir = PROFILE_DIR;
try {
  if (fs.existsSync(PROFILE_DIR)) fs.rmSync(PROFILE_DIR, {recursive: true, force: true});
} catch (e) {
  currentProfileDir = path.join(os.tmpdir(), `buster-profile-${Date.now()}`);
}
fs.mkdirSync(currentProfileDir, {recursive: true});

// --- 7. Proxy ---
let proxyArg = '';
if (fs.existsSync(PROXY_FILE)) {
    const p = fs.readFileSync(PROXY_FILE, 'utf-8').trim();
    if(p) proxyArg = `--proxy-server=${p}`;
}

// --- 8. Lanzar ---
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