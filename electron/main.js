const { app, BrowserWindow } = require('electron');
const path = require('path');

(async () => {
  const serveModule = await import('electron-serve');
  const serve = serveModule.default || serveModule;
  const appServe = app.isPackaged ? serve({ directory: path.join(__dirname, '../out') }) : serve({ directory: path.join(__dirname, '../out') });

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 1920,
      height: 1080,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      autoHideMenuBar: true,
    });

    if (app.isPackaged) {
      appServe(win).then(() => {
        win.loadURL('app://-');
      });
    } else {
      appServe(win).then(() => {
        win.loadURL('app://-');
      });
      // win.webContents.openDevTools();
    }
  };

  app.whenReady().then(() => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})();
