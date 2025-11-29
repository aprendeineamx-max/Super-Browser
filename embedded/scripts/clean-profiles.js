// Cleans embedded profiles for Playwright/Electron.
const fs = require('node:fs');
const path = require('node:path');

const targets = [
  path.join(__dirname, '..', 'playwright', 'profiles', 'tmp'),
  path.join(__dirname, '..', 'playwright', 'profiles', 'smoke'),
  path.join(__dirname, '..', 'profiles', 'electron')
];

for (const dir of targets) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {recursive: true, force: true});
    console.log('Removed profile dir:', dir);
  }
}
