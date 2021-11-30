const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
var pbkdf2 = require('pbkdf2')
var crypto = require('crypto');
var fs  = require('fs');
const { ECONNRESET } = require('constants');
const algorithm = 'aes-256-cbc';
const enctext = "This is some text to be encrypted";
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
function encrypt(secretKey, salt, content, _callback) {
  const iv = crypto.randomBytes(16);
  ivs = iv.toString('hex');
  const cipher = crypto.createCipheriv(algorithm, secretKey, salt.slice(0, 16));
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  _callback(encrypted);
}
function decrypt(secretKey, salt, cipher, _callback) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, salt.slice(0, 16));
  const decrpyted = Buffer.concat([decipher.update(cipher), decipher.final()]);
  _callback(decrpyted);
}
ipcMain.on('async-form', (event, arg) => {
  const valarr = arg.split(";");
  const pword = valarr[0];
  const uname = valarr[1];
  //var buf = crypto.randomBytes(16);
  //const salt = buf.toString('hex');
  //console.log("Salt = " + salt);

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
          const salt = data.split(":")[2].slice(0, -1);
          var indata = crypto.createHash("sha256").update(pword + salt, 'utf-8').digest('hex');
          console.log("hash = " + indata);
          if (data === (uname + ":" + indata + ":" + salt + "\n")) {
            event.reply('async-msg', 'true');
            var derivedKey = pbkdf2.pbkdf2(pword, salt, 1, 32, 'sha256', (err, derivedKey) => {
              console.log(derivedKey.toString("hex"));
              encrypt(derivedKey, salt, enctext, (encrpyted) => {
                console.log("encrypted =" + encrpyted.toString('hex'));
                decrypt(derivedKey, salt, encrpyted, (decryptedtext) => {
                  console.log("The decrypted message is: " + decryptedtext.toString('hex'));
                })
              })
            });
          } else {
            
            
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