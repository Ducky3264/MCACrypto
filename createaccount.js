//Will require elevation. Should be run during installation
var pbkdf2 = require('pbkdf2')
var crypto = require('crypto');
var fs  = require('fs');
const readline = require("readline");
const algorithm = 'aes-256-cbc';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.stdoutMuted = false;
rl.question("Input a username: ", (username) => {
    rl.question("Input a password: ", (password) => {
        rl.question("Reenter your password: ", (pass2) => {
            if (password === pass2) {
                createAccount(username, password + "0C73BBCC", (data) => {
                console.log(data);
                });
            } else {
                console.log("Passwords do not match!");
                process.exit(-1);
            }
        });
    })
})
function encrypt(secretKey, salt, content, _callback) {
    const iv = crypto.randomBytes(16);
    ivs = iv.toString('hex');
    const cipher = crypto.createCipheriv(algorithm, secretKey, salt.slice(0, 16));
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    _callback(encrypted);
  }
function writeToMastersum(Username, Password, app, _callback) {
    var buf = crypto.randomBytes(16);
    const salt = buf.toString('hex');
    var indata = crypto.createHash("sha256").update(Password + salt, 'utf-8').digest('hex');
    if (app) {
        fs.appendFile('/var/lib/rfidstore/mastersum', Username + ':' + indata + ':' + salt + "\n", (err) => {    
            pbkdf2.pbkdf2(Password, salt, 1, 32, 'sha256', (err, derivedKey) => {
                console.log(derivedKey);
                writeNewMastertable(derivedKey, salt, "BEGINNING_OF_FILE;Example Account:Example Username:Example Password;Google:alice:password;", (data) => {
                console.log(data);
                });
                _callback(err);
            });
        });
    } else {
    fs.writeFile('/var/lib/rfidstore/mastersum', Username + ':' + indata + ':' + salt + "\n", (err) => {
        pbkdf2.pbkdf2(Password, salt, 1, 32, 'sha256', (err, derivedKey) => {
            console.log(derivedKey);
            writeNewMastertable(derivedKey, salt, "BEGINNING_OF_FILE;Example Account:Example Username:Example Password;Google:alice:password;", (data) => {
            console.log(data);
            });
            _callback(err);
        });
        _callback(err);
    });
}
}
function writeNewMastertable(secretKey, salt, content, _callback) {
    console.log("writing");
    encrypt(secretKey, salt, content, (data) => {
        fs.writeFile('/var/lib/rfidstore/mastertable', data, (err) => {
            if (err !== null) {
                console.log(err);
                _callback(err);
            } else {
                console.log("Done writing");
                console.log('here, data is :' + data);
                _callback(data);
                process.exit(0);
            }
        });
        
        
    })
    
}


function createAccount(Username, Password, _callback) {
        fs.access("/var/lib/rfidstore/mastersum", fs.constants.F_OK, (err) => {
            if (err) {
                writeToMastersum(Username, Password, false, (err) => {
                    if (err != null) {
                        console.log(err);
                        _callback(err);
                    }
                });
            } else {
                fs.readFile('/var/lib/rfidstore/mastersum', 'utf-8', (err, data) => {
                    if (data.split(':')[0] == Username) {
                        _callback("Already Exists");
                    };
                    writeToMastersum(Username, Password, true, (err) => {
                        if (err != null) {
                            console.log(err);
                            return _callback(err);
                        }
                        return _callback("written");
                    });
                })
            }
        }); 
}