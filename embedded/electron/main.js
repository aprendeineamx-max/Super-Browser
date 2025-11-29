// Electron launcher for embedded usage.
// Requires: npm install electron (run separately; not added to package dependencies here).

const path = require('node:path');
const {spawn} = require('node:child_process');

const electronModule = require('electron');

// If not running under Electron, spawn Electron binary with this script.
if (!process.versions.electron) {
  const electronBin =
    typeof electronModule === 'string'
      ? electronModule
      : electronModule.default || electronModule;

  if (!electronBin) {
    console.error(
      'Electron binary not found. Ensure devDependency "electron" is installed.'
    );
    process.exit(1);
  }

  const child = spawn(electronBin, [__filename], {
    stdio: 'inherit'
  });

  child.on('exit', code => process.exit(code || 0));
  return;
}

// Running inside Electron environment
const {app, BrowserWindow, session} = electronModule;

if (!app || !BrowserWindow || !session) {
  console.error(
    'Electron API unavailable in this environment. Ensure GUI support and correct Electron binary.'
  );
  process.exit(1);
}

const EXT_PATH =
  process.env.BUSTER_EXT_PATH ||
  path.join(__dirname, '..', 'dist', 'chrome'); // assumes npm run build:prod:chrome

const PROFILE_PATH =
  process.env.BUSTER_PROFILE_PATH ||
  path.join(__dirname, '..', 'profiles', 'electron');

async function createWindow() {
  // Load extension
  await session.defaultSession.loadExtension(EXT_PATH, {
    allowFileAccess: true
  });

  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await win.loadURL('https://www.google.com/recaptcha/api2/demo');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
