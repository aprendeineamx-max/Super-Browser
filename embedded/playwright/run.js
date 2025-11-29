// Playwright launcher for embedded usage.
// Requires: npm install playwright-chromium (run separately; not added to package dependencies here).

const path = require('node:path');
const {chromium} = require('playwright-chromium');

const EXT_PATH =
  process.env.BUSTER_EXT_PATH ||
  path.join(__dirname, '..', 'dist', 'chrome'); // assumes npm run build:prod:chrome

async function main() {
  const context = await chromium.launchPersistentContext(
    path.join(__dirname, 'profiles', 'tmp'),
    {
      headless: false,
      args: [
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`
      ]
    }
  );

  const page = await context.newPage();
  await page.goto('https://www.google.com/recaptcha/api2/demo');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
