// Builds a portable release zip containing dist/, embedded scripts, package.json and README.
// Usage: node embedded/scripts/build-release.js

const fs = require('node:fs');
const path = require('node:path');
const archiver = require('archiver');
const {execSync} = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT, 'dist');
const OUTPUT_DIR = path.join(ROOT, 'embedded', 'releases');
const OUTPUT_ZIP = path.join(OUTPUT_DIR, 'buster-portable.zip');
const README_PATH = path.join(ROOT, 'embedded', 'README_PORTABLE.txt');

function ensureDist() {
  if (!fs.existsSync(path.join(DIST_DIR, 'chrome', 'manifest.json'))) {
    console.log('[build-release] dist missing; building...');
    execSync('npm run build:prod:chrome', {stdio: 'inherit', cwd: ROOT});
  }
}

function ensureReadme() {
  if (!fs.existsSync(README_PATH)) {
    const content = [
      'Buster Portable Package',
      '=======================',
      '',
      '1) npm install',
      '2) npm run setup:browser   # descarga el Chromium fijado en embedded/browser-config.json',
      '3) npm run start:portable  # lanza Chrome con la extensión',
      '',
      'El binario se descarga en embedded/bin (no se incluye en el zip).'
    ].join('\n');
    fs.writeFileSync(README_PATH, content, 'utf-8');
  }
}

function addDir(archive, dirPath, dest) {
  archive.directory(dirPath, dest);
}

function addFile(archive, filePath, dest) {
  archive.file(filePath, {name: dest});
}

async function main() {
  ensureDist();
  ensureReadme();
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {recursive: true});
  }
  const output = fs.createWriteStream(OUTPUT_ZIP);
  const archive = archiver('zip', {zlib: {level: 9}});

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`[build-release] Created ${OUTPUT_ZIP} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on('error', err => reject(err));
    archive.pipe(output);

    addDir(archive, DIST_DIR, 'dist');
    addDir(archive, path.join(ROOT, 'embedded', 'scripts'), path.join('embedded', 'scripts'));
    addFile(archive, path.join(ROOT, 'embedded', 'browser-config.json'), path.join('embedded', 'browser-config.json'));
    addFile(archive, README_PATH, 'README_PORTABLE.txt');
    addFile(archive, path.join(ROOT, 'package.json'), 'package.json');
    addFile(archive, path.join(ROOT, 'package-lock.json'), 'package-lock.json');

    archive.finalize();
  });
}

main().catch(err => {
  console.error('[build-release] failed:', err);
  process.exit(1);
});
