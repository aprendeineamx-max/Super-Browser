// Electron launcher for embedded usage.
// Requires: npm install electron (run separately; not added to package dependencies here).

const path = require('node:path');
const {app, BrowserWindow, session} = require('electron');

const EXT_PATH =
  process.env.BUSTER_EXT_PATH ||
  path.join(__dirname, '..', 'dist', 'chrome'); // assumes npm run build:prod:chrome

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
