const { exec } = require('child_process');
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    minWidth: 1000,
    minHeight: 600,
    width: 1000,
    height: 800,
    title: "Quest Resolution Changer",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.setMenuBarVisibility(false);
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})



exec("adb.exe shell pm list packages -3\"|cut -f 2 -d \":", (err, data) => {
  console.log(data);
})