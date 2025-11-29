// Electron launcher for embedded usage.
// Requires: npm install electron (run separately; not added to package dependencies here).

const path = require('node:path');

const electron = require('electron') || {};
const app = electron.app || electron.default?.app;
const BrowserWindow = electron.BrowserWindow || electron.default?.BrowserWindow;
const session = electron.session || electron.default?.session;

if (!app || !BrowserWindow || !session) {
  console.error(
    'Electron module did not expose app/BrowserWindow. Run with "npx electron embedded/electron/main.js" or ensure electron is installed globally.'
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
