var express = require('express');
var router = express.Router();
var Record = require("../models/record");
var Device = require("../models/device");
var fs = require('fs');
var jwt = require("jwt-simple");

// Secret key for JWT
var secret = fs.readFileSync(__dirname + '/../jwtkey').toString();

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
  var newApikey = "";
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 32; i++) {
    newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return newApikey;
}

/* POST: device post a new record to database. */
router.post('/post', function(req, res, next) {
  // response message object
  var response = {
      status: "",
      message: ""
  };
  // DEBUG message: enumerate request’s body and print out key and value
  /*for( var key in req.body) {
      console.log( key + ":" + req.body[key] );
  }*/

  // Check the deviceId and apikey are matched.
  Device.findOne({
      deviceId: req.body.deviceId, apikey: req.body.apikey
    }, function(err, device) {
    if (device === null) {
      response.status = "Error";
      response.message = "DeviceId or apikey is not correct.";
      res.status(401).send(JSON.stringify(response));
    } else {
      var newRecord = new Record({
        deviceId: req.body.deviceId,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
        uv: req.body.uv
      });

      newRecord.save(function(err, newRecord) {
        if (err) {
          response.status = "Error";
          response.message = err;
          res.status(400).send(JSON.stringify(response));
        } else {
          response.status = "OK";
          response.message = "Data saved in db with object ID " + newRecord._id + ".";
          res.status(201).send(JSON.stringify(response));
        }
      });
    }
  });
});

// POST registers a new device given the device ID and user email
router.post('/register', function(req, res, next) {
  var responseJson = {
    registered: false,
    message : "",
    apikey : "none"
  };

  // Check if the X-Auth header is set
  if (!req.headers["x-auth"]) {
    responseJson.message = "Missing X-Auth header.";
    return res.status(401).json(responseJson);
  }
  // X-Auth should contain the token value
  var token = req.headers["x-auth"];

  // try decoding
  try {
    var decoded = jwt.decode(token, secret);

    // Ensure the request includes the deviceId parameter
    for (var key in req.body) {
      if (key != 'deviceId') {
        responseJson.message = "Missing deviceId.";
        res.status(400).json(responseJson);
        return;
      }
    }

    // See if device is already registered
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
      if (device !== null) {
        responseJson.message = "Device ID " + req.body.deviceId + " already registered.";
        res.status(400).json(responseJson);
      } else {
        // Get a new apikey
        deviceApikey = getNewApikey();
        // Create a new device with specified id, user email, and randomly generated apikey.
        var newDevice = new Device({
          deviceId: req.body.deviceId,
          userEmail: decoded.email,
          apikey: deviceApikey
        });

        // Save device. If successful, return success. If not, return error message.
        newDevice.save(function(err, newDevice) {
          if (err) {
            // console.log("Error: " + err);
            responseJson.message = err;
            res.status(400).json(responseJson);
          } else {
            responseJson.registered = true;
            responseJson.apikey = deviceApikey;
            responseJson.message = "Device ID " + req.body.deviceId + " was registered.";
            res.status(201).json(responseJson);
          }
        });
      }
    });
  } catch (ex) {
    responseJson.message = "Authentication error: " + ex.message;
    res.status(401).json(responseJson);
  }
});

// DELETE a device by deviceId
router.delete('/delete/:deviceId', function(req, res, next) {
  var deviceId = req.params.deviceId;

  var responseJson = {
      message : "",
  };

  // Check if the X-Auth header is set
  if (!req.headers["x-auth"]) {
    responseJson.message = "Missing X-Auth header.";
    return res.status(401).json(responseJson);
  }
  // X-Auth should contain the token value
  var token = req.headers["x-auth"];

  // try decoding
  try {
    var decoded = jwt.decode(token, secret);

    // See if device is already registered
    Device.findOneAndRemove({ deviceId: deviceId }, function(err, device) {
         if (device === null) {
            // console.log("No device deleted");
            responseJson.message = "No device deleted";
            res.status(400).json(responseJson);
         } else {
            // console.log("Removed device " + device.deviceId);
            responseJson.message = "Removed device " + device.deviceId;
            res.status(201).json(responseJson);
         }
      });
  } catch (ex) {
    responseJson.message = "Authentication error: " + ex.message;
    res.status(401).json(responseJson);
  }
});

router.put("/edit", function(req, res) {
  // Check if the X-Auth header is set
  if (!req.headers["x-auth"]) {
    return res.status(401).json({error: "Missing X-Auth header"});
  }

  // X-Auth should contain the token value
  var token = req.headers["x-auth"];

  // try decoding
  try {
    var decoded = jwt.decode(token, secret);

    // Find a user based on req.body.deviceId
    Device.findOne({ deviceId: req.body.deviceId }, function (err, device) {
      if (err) {
        return res.json({error : err});
      } else {
        if (!device) {
          return res.json({error : "Device not found"});
        } else {
          // Update device's ID with newDeviceId.
          device.deviceId = req.body.newDeviceId;
          // Replace existing deviceId field with updated deviceId
          Device.findByIdAndUpdate(device._id, device, function(err, device) {
              if (err) {
                  res.status(400).send(err);
              } else if (device) {
                   res.sendStatus(204);
              } else {
                   res.sendStatus(404);
              }
          });
        }
      }
    });
  } catch (ex) {
    res.status(401).json({ error: ex.message });
  }
});

module.exports = router;
