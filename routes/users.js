var express = require('express');
var router = express.Router();
var fs = require('fs');
var jwt = require("jwt-simple");
var User = require("../models/users");
var Device = require("../models/device");
var bcrypt = require("bcrypt-nodejs");
var nodemailer = require("nodemailer");
var url = require('url') ;

// Secret key for JWT
var secret = fs.readFileSync(__dirname + '/../jwtkey').toString();

// A random string to verify user's email.
function getRandomStr() {
  var string = "";
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 32; i++) {
    string += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return string;
}

/* Authenticate user on sign in. */
router.post('/signin', function(req, res, next) {
  User.findOne( { email: req.body.email} , function(err, user) {
    if (err) {
      res.status(401).json({ error: "Database findOne error" });
    } else if (!user) {
      res.status(401).json({ error: "Bad Request" }); // User not exist
    } else {
      bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
        if (err) {
            res.status(401).json({ error: "bcrypt error" });
        } if (valid) {
            var token = jwt.encode({email: req.body.email}, secret);
            res.status(201).json({ token: token , fullName: user.fullName, redirect: "/home.html"});
        } else {
            res.status(401).json({ error: "Bad Request" });  // Wrong password
        }
      });
    }
  });
});

/* Register a new user */
router.post('/signup', function(req, res, next) {
  // Create a hash for the submitted password
  bcrypt.hash(req.body.password, null, null, function(err, hash) {
  	// Prepare a new user
  	var newUser = new User( {
  	    email: req.body.email,
  	    fullName: req.body.fullName,
  	    passwordHash: hash // hashed password
  	});
  	newUser.save( function(err, user) {
      if (err) { // this error could be a duplicate key error when the same email insertion tried
        // console.log(err.errmsg); // show the db's error message.
        // For the safety reason, do not specify the detailed error message.
        res.status(400).json( {success: false, message: "Bad Request" } );
      } else {
        res.status(201).json( {success: true, message: user.fullName + " has been created", redirect:"/signin.html" } );
      }
  	});
  });
});

// Modularized code for /users/status
var headerCheck = function(req, res, next) {
  // Check if the X-Auth header is set
  if (!req.headers["x-auth"]) {
    return res.status(401).json({error: "Missing X-Auth header"});
  }
  next();
}

var sessionCheck = function(req, res, next) {
  var token = req.headers["x-auth"];
  try {
    var decoded = jwt.decode(token, secret);
    res.locals.decoded = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ error: "Invalid JWT" });
  }
}

router.get('/gmap', headerCheck, sessionCheck, function(req, res, next) {
  // Import api key from a text file.
  var apikey = fs.readFileSync(__dirname + '/../3rd-party-apikeys/googlemaps').toString();
  // Trim newlines away
  apikey = apikey.replace(/(\r\n|\n|\r)/gm,"");
  return res.status(200).json({apikey : apikey});
});

/* GET status */
router.get("/status", headerCheck, sessionCheck, function(req, res, next) {
  var decoded = res.locals.decoded;
  var userStatus = {};

  // Find a user based on decoded token
  User.findOne({email:decoded.email}, function (err, user) {
    if (err) {
      return res.json({error : err});
    } else {
      if (!user) {
        return res.json({error : "User not found"});
      } else {
        userStatus['email'] = user.email;
        userStatus['fullName'] = user.fullName;
        userStatus['lastAccess'] = user.lastAccess;
        userStatus['redirect'] = '/home.html';

        if(user.verified) {
          userStatus['verified'] = true;
        } else {
          userStatus['verified'] = false;
        }

        // Find devices based on decoded token
        Device.find({ userEmail : decoded.email}, function(err, devices) {
          if (err) {
            res.status(400).json({error : err});
          } else {
            // Construct device list
            var deviceList = [];
            for (device of devices) {
              deviceList.push({
                deviceId: device.deviceId,
                apikey: device.apikey
              });
            }
            userStatus['devices'] = deviceList;
            res.status(200).json(userStatus);
          }
        });
      }
    }
  });
});

router.put("/edit", headerCheck, sessionCheck, function(req, res, next) {
  var decoded = res.locals.decoded;
  // Find a user based on decoded token
  User.findOne({email:decoded.email}, function (err, user) {
    if (err) {
      return res.json({error : err});
    } else {
      if (!user) {
        return res.json({error : "User not found"});
      } else {
        if (user.email !== req.body.email) {
          // Replace old email with req.body.email in Devices collections.
          Device.update({ userEmail: user.email },
            { userEmail: req.body.email },
            { multi: true },
            function(err, status) {
              // console.log("Documents updated: " + status.nModified);
            }
          );
          // Update user's email.
          user.email = req.body.email;
        }
        // Update user's name.
        user.fullName = req.body.fullName;
        // Replace existing user fields with updated user
        User.findByIdAndUpdate(user._id, user, function(err, user) {
          if (err) {
            res.status(400).send(err);
          } else if (user) {
            res.sendStatus(204);
          } else {
            res.sendStatus(404);
          }
        });
      }
    }
  });
});

router.get("/sendemail", function(req, res, next) {
  var responseJson = {
    status: "ERROR",
    message: ""
  };

  if (!req.query.hasOwnProperty("email")) {
    // Failure (400): Bad request (invalid query string)
    responseJson.message = "email parameter missing";
    return res.status(400).send(JSON.stringify(responseJson));
  }

  // Parse Gmail api's token from file and store to variables
  var array = fs.readFileSync(__dirname + '/../3rd-party-apikeys/gmail').toString().split('\n');
  var sender = array[0];
  var clientId = array[1];
  var clientSecret = array[2];
  var refreshToken = array[3];
  var accessToken = array[4];
  var receiver = req.query.email;

  let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          type: 'OAuth2',
          user: sender,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
          accessToken: accessToken
      }
  });
  // Find the user's email and update the random string field to verify user in future.
  var randomStr = getRandomStr();
  User.findOneAndUpdate( { email: receiver} , {randomStr: randomStr}, function(err, user) {
    if (err) {
      res.status(401).json({ error: "Database findOneAndUpdate error" });
    } else if (!user) {
      res.status(401).json({ error: "Bad Request" }); // User not exist
    } else {
      var verifyEmailUrl = 'https://' + req.headers.host + '/users/auth?key=' + randomStr;
      // console.log("verifyEmailUrl: " + verifyEmailUrl);
      var mailOptions = {
        from: sender,
        to: receiver,
        subject: "SunSmart email verification.",
        generateTextFromHTML: true,
        html: "<a href='" + verifyEmailUrl + "'>Click the link to finish the account registeration.</a>"
      };

      transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
          console.log(error);
          responseJson.message = error;
          res.status(400).send(JSON.stringify(responseJson));
        } else {
          // Response status.
          // console.log(response);
          responseJson.status = "OK";
          responseJson.message = "email sent.";
          res.status(200).send(JSON.stringify(responseJson));
        }
        transporter.close();
      });
    }
  });
});

router.get("/auth", function(req, res, next) {
  var responseJson = {
    status: "ERROR",
    message: ""
  };

  if (!req.query.hasOwnProperty("key")) {
    // Failure (400): Bad request (invalid query string)
    responseJson.message = "key parameter missing";
    return res.status(400).send(JSON.stringify(responseJson));
  }

  var key = req.query.key;
  User.findOneAndUpdate({randomStr: key}, {verified: true}, function(err, user) {
    if (err) {
      res.status(401).json({ error: "Database findOneAndUpdate error" });
    } else if (!user) {
      res.status(401).json({ error: "Bad Request" }); // User not exist
    } else {
      res.redirect("/home.html");
    }
  });
});

module.exports = router;
