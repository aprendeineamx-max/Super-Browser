// Verifies extension injection on reCAPTCHA demo by checking solver button.
// Requires: npm run build:prod:chrome (dist/chrome), ensure deps via setup:deps.

const path = require('node:path');
const {chromium} = require('playwright-chromium');

async function main() {
  const extPath =
    process.env.BUSTER_EXT_PATH ||
    path.join(__dirname, '..', 'dist', 'chrome');
  const profilePath =
    process.env.BUSTER_PROFILE_PATH ||
    path.join(__dirname, 'profiles', 'verify');

  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`
    ]
  });

  const page = await context.newPage();
  await page.goto('https://www.google.com/recaptcha/api2/demo', {
    waitUntil: 'domcontentloaded'
  });

  // Click the checkbox inside the anchor iframe.
  const anchorHandle = await page.waitForSelector(
    'iframe[src*="recaptcha/api2/anchor"]',
    {timeout: 20000}
  );
  const anchorFrame = await anchorHandle.contentFrame();
  if (!anchorFrame) {
    console.error('No anchor frame found');
    process.exit(1);
  }
  await anchorFrame.click('#recaptcha-anchor', {timeout: 20000});

  // Wait for challenge frame and check for solver button.
  const challengeHandle = await page.waitForSelector(
    'iframe[src*="recaptcha/api2/bframe"]',
    {timeout: 20000}
  );
  const challengeFrame = await challengeHandle.contentFrame();
  if (!challengeFrame) {
    console.error('No challenge frame found');
    process.exit(1);
  }

  const solverButton = await challengeFrame.waitForSelector('#solver-button', {
    timeout: 10000
  });

  if (solverButton) {
    console.log('Solver button found. Injection OK.');
  } else {
    console.error('Solver button not found.');
    process.exit(1);
  }

  await context.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
