// Headless-ish smoke test using Playwright + extension.
// Requires: npm run build:prod:chrome (to populate dist/chrome)
//           npm install playwright-chromium

const path = require('node:path');
const {chromium} = require('playwright-chromium');

async function main() {
  const extPath =
    process.env.BUSTER_EXT_PATH ||
    path.join(__dirname, '..', 'dist', 'chrome');
  const profilePath =
    process.env.BUSTER_PROFILE_PATH ||
    path.join(__dirname, 'profiles', 'smoke');

  const context = await chromium.launchPersistentContext(
    profilePath,
    {
      headless: true,
      args: [
        `--disable-extensions-except=${extPath}`,
        `--load-extension=${extPath}`
      ]
    }
  );

  const page = await context.newPage();
  await page.goto('https://www.google.com/recaptcha/api2/demo', {
    waitUntil: 'domcontentloaded'
  });

  const title = await page.title();
  console.log('Smoke page title:', title);

  await context.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
