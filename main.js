//This is the entry point of the app. All execution begins from here.
const { app, BrowserWindow, ipcMain } = require('electron') //Electron is a framework that allows node js to be used locally.
const path = require('path')
var pbkdf2 = require('pbkdf2')
var crypto = require('crypto');
var fs  = require('fs');
const { ECONNRESET } = require('constants');
const { eventNames } = require('process');
const algorithm = 'aes-256-cbc';
//Open the serial port and create handlers for events on it
var SerialPort = require('serialport');
var ardstatus = "disconnected";
var giventag = "";
<<<<<<< HEAD
var ardV = "";
var currentuser = new AccData("Guest", "unauthed");
=======
var currentuser = AccData("Guest", "unauthed");
>>>>>>> 005937c855484aeea03a526d8896f02e1c694319
SerialPort.list().then (
  ports => ports.forEach(port =>console.log(port.path)),
  err => console.log(err)
)
/**var myPort = new SerialPort("/dev/ttyACM1", 9600);
var Readline = SerialPort.parsers.Readline;	
var parser = new Readline();								
myPort.pipe(parser);
var ardV = "udef";

myPort.on('open', () => {
  console.log("port open");
  
});    
parser.on('data', (data) => {
  console.log(data);
  var indata = crypto.createHash("sha256").update(data, 'utf-8').digest('hex');
  console.log("indata = " + indata + "ardV = " + ardV);
  if (indata === ardV) {
    ipcMain.send("unlock", "true");
  } else {
    ipcMain.send("unlock", "false");
  }
}); **/
var myPort = new SerialPort('/dev/ttyACM0', 9600);// open the port
var Readline = SerialPort.parsers.Readline;	// make instance of Readline parser
var parser = new Readline();								// make a new parser to read ASCII lines
myPort.pipe(parser);													// pipe the serial stream to the parser

// these are the definitions for the serial events:
myPort.on('open', () => {
  console.log('port open. Data rate: ' + myPort.baudRate);
  ardstatus = "connected";
  //ipcMain.send("ardopen", "true");
  fs.readFile('/var/lib/rfidstore/ardcheck', 'utf-8', (err, data) => {
    ardV = data.slice(0, -1);
  });
});    // called when the serial port opens
myPort.on('close', () => {
  console.log('port closed.');
  ardstatus = "disconnected";
});  // called when the serial port closes
myPort.on('error', (error) => {
  console.log('serial port error: ' + error);
});   // called when there's an error with the serial port
 
parser.on('data', (data) => {
  try {
    console.log(data);
    var tag = data.split(":")[0];
    if (tag === "UID tag ") {
      var intag = data.split(":")[1];
      var uid = intag.replace(/\s/g, "");
      var indata = crypto.createHash("sha256").update(uid, 'utf-8').digest('hex');
      console.log(indata);
      if (indata === ardV) {
        ardstatus = "authed";
        giventag = uid;
      }
  } 
} catch (e) {
}
});  

//Unused example text
const enctext = Buffer.from("This is some text to be encrypted", "utf-8");

function createWindow (name) {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      //Allow requires in browser scripts for ipcRenderer
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  // and load the index.html of the app.
  mainWindow.loadFile(name)

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow("index.html")
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
//Functions for encryption and decryption. Supplying a buffer as opposed to a utf8 string is recommended for 
//each of the tags. Utf8 encoding can add extra tags on the end of the strings which changes the hash.
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
//Reply with the current username on data requested from the page. IpcMain and IpcRenderer 
//are event emitters for communicated from server to webpage.
ipcMain.on('Recieve-DataRequest', (event, arg) => {
  event.reply('webdata-back', currentuser);
})
ipcMain.on('checkardstatus', (event, arg) => {
  if (ardstatus === "disconnected") {
    event.reply("ardstatusreply", "disconnected");
  } else if (ardstatus === "connected") {
    event.reply("ardstatusreply", "connected");
  } else if (ardstatus === "authed") {
    event.reply("ardstatusreply", "authed");
  }
})
function AccData(uname, stat) {
  this.uname = uname;
  this.status = stat;
  Accounts = "";
}
AccData.prototype.getUsername = function() {
  return uname;
}
AccData.prototype.getStatus = function() {
  return stat;
}
//Recieve login data from index.html and check it. Reply with true if the user can authenticate. 
ipcMain.on('async-form', (event, arg) => {
  const valarr = arg.split(";");
  const pword = valarr[0];
  const uname = valarr[1];
  try {
    if (fs.existsSync("/var/lib/rfidstore/mastersum")) {
      if (ardstatus === "authed") {
      fs.readFile('/var/lib/rfidstore/mastersum', 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        else {
        fs.readFile('/var/lib/rfidstore/mastertable', 'hex', (err, data_enc) => {
          datab = Buffer.from(data_enc, 'hex')
          //Verifies if the user has the corect password before doing the more computationally more expensive pbkdf2 decryption
          var allacc = data.split('\n');
          var curracc = "";
          allacc.forEach(element => {
            //This may be excessively computationally expensive. Node js offers no break like function so this was the only option I saw.
            //Check the username against the mastertable and check which user it is. Load their info.
            if (curracc === "" && element.split(':')[0] === uname) {
              curracc = element;
            }
          })
          //Load a user's salt
          const salt = curracc.split(":")[2];
          //Create a hash based on the password provided and the salt. If it is the same as the one in the database,
          //attempt to decrypt.
          var indata = crypto.createHash("sha256").update(pword + giventag + salt, 'utf-8').digest('hex');
          if (curracc === (uname + ":" + indata + ":" + salt)) {
            //Derive a key. 
            pbkdf2.pbkdf2(pword + giventag, salt, 1, 32, 'sha256', (err, derivedKey) => {
                decrypt(derivedKey, salt, datab, (decryptedtext) => {
                 //Try to decrypt. If the user has the wrong key, the decrypted text will not read BEGINNING_OF_FILE.
                  if (decryptedtext.toString().split(";")[0] === "BEGINNING_OF_FILE") {
                   //User has decrypted their passwords and is signed in
                   console.log("Success");
                   currentuser.uname = uname;
<<<<<<< HEAD
                   currentuser.Accounts = decryptedtext.toString()
=======
>>>>>>> 005937c855484aeea03a526d8896f02e1c694319
                   event.reply('async-msgpsd', 'true');
                   //Reply that the user has the correct password so they can be redirected.
                 } else{
                  //User has the correct password but cannot decrypt. This indicates something is wrong with their mastertable. 
                  console.log("Error with decryption. Data may be corrupted.");
                 }
                })            
            });
          } else {
            event.reply('async-msgpsd', 'false');
            //reply that the user has the wrong password.
          }
          });
        }
      });
    
    } else {
      event.reply('async-msgpsd', "falseard")
    }
  } else {
    
  }
  } catch (err) {
    console.error(err);
  }
}); 