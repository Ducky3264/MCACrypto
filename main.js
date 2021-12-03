const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
var pbkdf2 = require('pbkdf2')
var crypto = require('crypto');
var fs  = require('fs');
const { ECONNRESET } = require('constants');
const { eventNames } = require('process');
const algorithm = 'aes-256-cbc';
const enctext = Buffer.from("This is some text to be encrypted", "utf-8");
var curruname = "Guest";
function createWindow (name) {
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
  mainWindow.loadFile(name)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow("data.html")

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
ipcMain.on('Recieve-DataRequest', (event, arg) => {
  event.reply('webdata-back', curruname);
})
ipcMain.on('async-form', (event, arg) => {
  const valarr = arg.split(";");
  const pword = valarr[0];
  const uname = valarr[1];
  //var buf = crypto.randomBytes(16);
  //const salt = buf.toString('hex');
  //console.log("Salt = " + salt);

  try {
    if (fs.existsSync("/var/lib/rfidstore/mastersum")) {
      fs.readFile('/var/lib/rfidstore/mastersum', 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        else {
        fs.readFile('/var/lib/rfidstore/mastertable', 'hex', (err, data_enc) => {
          datab = Buffer.from(data_enc, 'hex')
          //console.log("hash = " + indata);
          //Verifies if the user has the corect password before doing the more computationally more expensive pbkdf2 decryption
          var allacc = data.split('\n');
          var curracc = "";
          allacc.forEach(element => {
            //This may be excessively computationally expensive. Node js offers no break like function so this was the only option I saw.
            if (curracc === "" && element.split(':')[0] === uname) {
              curracc = element;
            }
          })
          const salt = curracc.split(":")[2];
          var indata = crypto.createHash("sha256").update(pword + salt, 'utf-8').digest('hex');
          if (curracc === (uname + ":" + indata + ":" + salt)) {
            event.reply('async-msg', 'true');
            pbkdf2.pbkdf2(pword, salt, 1, 32, 'sha256', (err, derivedKey) => {
              console.log(derivedKey.toString("hex"));
                decrypt(derivedKey, salt, datab, (decryptedtext) => {
                 if (decryptedtext.toString() === "BEGINNING_OF_FILE") {
                   //User has decrypted their passwords and is signed in
                   console.log("Success");
                   curruname = uname;
                 }
                })            
            });
          } else {
            event.reply('async-msg', 'false');
          }
          });
        }
      });
    
    } else {
      fs.mkdirSync("/var/lib/rfidstore/");
    }
  } catch (err) {
    console.error(err);
  }
}); 