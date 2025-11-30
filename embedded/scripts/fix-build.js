// Attempts to fix manifest background path mismatches in dist/chrome.
const fs = require('node:fs');
const path = require('node:path');

function findFile(root, target) {
  const stack = [root];
  const matches = [];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, {withFileTypes: true});
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === path.basename(target)) {
        matches.push(full);
      }
    }
  }
  return matches;
}

function run() {
  const extDir = path.resolve(__dirname, '..', '..', 'dist', 'chrome');
  const manifestPath = path.join(extDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('[fix-build] manifest.json not found, skipping');
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  let bgPath =
    (manifest.background && manifest.background.service_worker) ||
    (manifest.background &&
      manifest.background.scripts &&
      manifest.background.scripts[0]) ||
    null;

  if (!bgPath) {
    console.log('[fix-build] No background script declared, nothing to fix.');
    return;
  }

  const expected = path.join(extDir, bgPath);
  if (fs.existsSync(expected)) {
    console.log('[fix-build] Background script found at', bgPath);
    return;
  }

  console.warn('[fix-build] Background script missing at', bgPath, 'searching...');
  const matches = findFile(extDir, bgPath);
  if (!matches.length) {
    console.error('[fix-build] Could not find', path.basename(bgPath), 'in dist/chrome');
    return;
  }

  const best = matches[0];
  let rel = path.relative(extDir, best).replace(/\\/g, '/');
  if (!rel) {
    rel = path.basename(best);
  }

  if (manifest.background && manifest.background.service_worker) {
    manifest.background.service_worker = rel;
  } else if (
    manifest.background &&
    manifest.background.scripts &&
    manifest.background.scripts.length
  ) {
    manifest.background.scripts[0] = rel;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('[fix-build] Updated manifest background to', rel);
}

run();
