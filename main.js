const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
var crypto = require('crypto');
var fs  = require('fs');
const { ECONNRESET } = require('constants');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('async-form', (event, arg) => {
  const valarr = arg.split(";");
  const pword = valarr[0];
  const uname = valarr[1];
  var indata = crypto.createHash("sha256").update(pword, 'utf-8').digest('hex');
  console.log("hash = " + indata);
  try {
    if (fs.existsSync("/var/lib/rfidstore/mastersum")) {
      console.log("test2");
      fs.readFile('/var/lib/rfidstore/mastersum', 'utf-8', (err, data) => {
        console.log("test");
        if (err) {
          console.error(err);
          return;
        }
        else {
          if (indata == uname + " : " + data) {
            event.reply('async-msg', 'true');
            console.log("true");
          } else {
            console.log(indata);
          }
        }
      })
    } else {
      console.log("test3");
      fs.mkdirSync("/var/lib/rfidstore/");
    }
  } catch (err) {
    console.error(err);
  }
}); 