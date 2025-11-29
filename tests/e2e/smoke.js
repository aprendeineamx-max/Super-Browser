/* eslint-disable no-console */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {execSync} = require('node:child_process');
const {chromium} = require('playwright-chromium');

async function ensureBuild(extPath) {
  const manifestPath = path.join(extPath, 'manifest.json');
  if (process.env.BUSTER_BUILD === '1' || !fs.existsSync(manifestPath)) {
    console.log('[smoke] Building dist/chrome...');
    execSync('npm run build:prod:chrome', {stdio: 'inherit', cwd: path.join(__dirname, '..', '..')});
  }
}

async function main() {
  const root = path.join(__dirname, '..', '..');
  const extPath = process.env.BUSTER_EXT_PATH || path.join(root, 'dist', 'chrome');
  await ensureBuild(extPath);

  const profilePath =
    process.env.BUSTER_PROFILE_PATH ||
    fs.mkdtempSync(path.join(os.tmpdir(), 'buster-smoke-'));

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: true,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-popup-blocking'
    ]
  });

  // Esperar a que se registre el service worker de la extensión y obtener su id.
  let extensionId;
  const workers = context.serviceWorkers();
  if (workers.length) {
    extensionId = new URL(workers[0].url).hostname;
  } else {
    const worker = await context.waitForEvent('serviceworker', {timeout: 10000}).catch(() => null);
    if (worker) {
      extensionId = new URL(worker.url).hostname;
    }
  }
  if (!extensionId) {
    throw new Error('No extension service worker detected');
  }
  console.log('[smoke] Extension ID:', extensionId);

  // Abrir la página de opciones de la extensión para confirmar carga.
  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, {
    waitUntil: 'domcontentloaded'
  });
  const title = await optionsPage.title();
  console.log('[smoke] Options page title:', title);

  // Navegar a un sitio de prueba (patrickhlauke).
  const page = await context.newPage();
  await page.goto('https://patrickhlauke.github.io/recaptcha/', {waitUntil: 'domcontentloaded'});
  console.log('[smoke] Demo page loaded, title:', await page.title());

  await context.close();
}

main().catch(err => {
  console.error('[smoke] FAILED:', err);
  process.exit(1);
});
