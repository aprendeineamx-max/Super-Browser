// Verifies extension injection on reCAPTCHA demo by checking solver button.
// Requires: npm run build:prod:chrome (dist/chrome), ensure deps via setup:deps.

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {chromium} = require('playwright-chromium');
const {spawnSync} = require('node:child_process');

async function main() {
  const targets = [
    'https://www.google.com/recaptcha/api2/demo',
    'https://www.recaptcha.net/recaptcha/api2/demo',
    'https://patrickhlauke.github.io/recaptcha/'
  ];
  const extPath =
    process.env.BUSTER_EXT_PATH ||
    path.join(__dirname, '..', '..', 'dist', 'chrome');
  const profilePath =
    process.env.BUSTER_PROFILE_PATH ||
    fs.mkdtempSync(path.join(os.tmpdir(), 'buster-playwright-verify-'));

  // Ensure manifest exists; if not, build dist/chrome.
  const manifestPath = path.join(extPath, 'manifest.json');
  try {
    require('fs').accessSync(manifestPath);
  } catch (err) {
    console.log('manifest.json not found, building dist/chrome...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(npmCmd, ['run', 'build:prod:chrome'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    if (result.status !== 0) {
      console.error('Build failed, cannot continue.');
      process.exit(result.status || 1);
    }
  }

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage'
    ],
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  let navigated = false;
  for (const url of targets) {
    try {
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000});
      navigated = true;
      break;
    } catch (err) {
      console.warn('Navigation failed to', url, err.message);
    }
  }
  if (!navigated) {
    console.error('Could not load any target demo URL.');
    return;
  }

  // Click the checkbox inside the anchor iframe.
  let anchorFrame = null;
  for (let i = 0; i < 5 && !anchorFrame; i++) {
    const anchorHandle = await page
      .waitForSelector('iframe[src*="recaptcha/api2/anchor"]', {
        timeout: 5000
      })
      .catch(() => null);
    anchorFrame = await anchorHandle?.contentFrame();
    if (!anchorFrame) {
      await page.waitForTimeout(2000);
    }
  }
  if (!anchorFrame) {
    console.error('No anchor frame found; available frames:', page.frames().map(f => f.url()));
    await page.waitForTimeout(60000);
    return;
  }
  await anchorFrame.click('#recaptcha-anchor', {timeout: 20000}).catch(err => {
    console.error('Click anchor failed:', err.message);
  });

  // Wait for challenge frame and check for solver button.
  let challengeFrame = null;
  for (let i = 0; i < 5 && !challengeFrame; i++) {
    const challengeHandle = await page
      .waitForSelector('iframe[src*="recaptcha/api2/bframe"]', {
        timeout: 5000
      })
      .catch(() => null);
    challengeFrame = await challengeHandle?.contentFrame();
    if (!challengeFrame) {
      await page.waitForTimeout(2000);
    }
  }
  if (!challengeFrame) {
    console.error('No challenge frame found; frames:', page.frames().map(f => f.url()));
    await page.waitForTimeout(60000);
    return;
  }

  const solverButton = await challengeFrame
    .waitForSelector('#solver-button', {
      timeout: 30000
    })
    .catch(err => {
      console.error('Solver button not found:', err.message);
      return null;
    });

  if (solverButton) {
    console.log('Solver button found. Injection OK.');
  } else {
    console.error('Solver button not found.');
  }

  console.log('Keeping browser open for manual inspection. Close it to finish.');
  await new Promise(() => {});
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
