// Copies dist/chrome into embedded/dist/chrome for manual loading in browsers.
const fs = require('node:fs');
const path = require('node:path');

const src = path.join(__dirname, '..', '..', 'dist', 'chrome');
const dest = path.join(__dirname, '..', 'dist', 'chrome');

function copyRecursive(srcPath, destPath) {
  const stat = fs.statSync(srcPath);
  if (stat.isDirectory()) {
    fs.mkdirSync(destPath, {recursive: true});
    for (const entry of fs.readdirSync(srcPath)) {
      copyRecursive(path.join(srcPath, entry), path.join(destPath, entry));
    }
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

try {
  fs.accessSync(src);
} catch (err) {
  console.error('Source dist/chrome not found. Run npm run build:prod:chrome first.');
  process.exit(1);
}

copyRecursive(src, dest);
console.log('Synced dist/chrome to embedded/dist/chrome.');
