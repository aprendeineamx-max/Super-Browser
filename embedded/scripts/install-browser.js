// Downloads the pinned browser binary defined in embedded/browser-config.json
// Usage: node embedded/scripts/install-browser.js

const path = require('node:path');
const fs = require('node:fs');
const {install, BrowserPlatform, resolveBuildId, canDownload} = require('@puppeteer/browsers');

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'embedded', 'browser-config.json');
const BIN_DIR = path.join(ROOT, 'embedded', 'bin');

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing ${CONFIG_PATH}`);
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  if (!cfg.browser || !cfg.platform || !cfg.revision) {
    throw new Error('browser-config.json must include browser, platform, revision');
  }
  return cfg;
}

async function main() {
  const cfg = readConfig();
  const platform = BrowserPlatform[cfg.platform] || cfg.platform;
  const buildId = resolveBuildId(cfg.browser, cfg.revision);

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, {recursive: true});
  }

  const downloadParams = {
    cacheDir: BIN_DIR,
    browser: cfg.browser,
    platform,
    buildId
  };

  const can = await canDownload(downloadParams);
  if (!can) {
    throw new Error(`Cannot download ${cfg.browser} @ ${buildId} for ${platform}`);
  }

  console.log(`[setup:browser] Downloading ${cfg.browser} ${buildId} for ${platform}...`);
  const result = await install(downloadParams);
  console.log('[setup:browser] Downloaded to', result.executablePath);
}

main().catch(err => {
  console.error('[setup:browser] failed:', err);
  process.exit(1);
});
