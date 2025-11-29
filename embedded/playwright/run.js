// Playwright launcher for embedded usage.
// Requires: npm install playwright-chromium (run separately; not added to package dependencies here).

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {chromium} = require('playwright-chromium');

const EXT_PATH =
  process.env.BUSTER_EXT_PATH ||
  path.join(__dirname, '..', '..', 'dist', 'chrome'); // assumes npm run build:prod:chrome
const PROFILE_PATH =
  process.env.BUSTER_PROFILE_PATH ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'buster-playwright-'));
const CHANNEL = process.env.BUSTER_CHANNEL || undefined;

async function main() {
  const context = await chromium.launchPersistentContext(
    PROFILE_PATH,
    {
      headless: false,
      channel: CHANNEL,
      args: [
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`,
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ]
    }
  );

  context.setDefaultTimeout(120000);
  context.setDefaultNavigationTimeout(120000);

  const page = await context.newPage();
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  console.log('Loading demo with extension:', EXT_PATH);
  await page.goto('https://www.google.com/recaptcha/api2/demo');

  console.log('Playwright launched with extension. Profile:', PROFILE_PATH);
  await new Promise(() => {});
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
