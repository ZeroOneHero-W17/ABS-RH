const { app, BrowserWindow, shell } = require('electron');

const APP_URL = 'https://abs-rh.vercel.app/';
const APP_ORIGIN = new URL(APP_URL).origin;

function openExternal(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      void shell.openExternal(parsedUrl.href);
    }
  } catch {
    // Ignore invalid external URLs.
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 360,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).origin !== APP_ORIGIN) {
        event.preventDefault();
        openExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  void window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});