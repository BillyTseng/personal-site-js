var express = require('express');
var router = express.Router();
var Record = require("../models/record");
var fs = require('fs');
var jwt = require("jwt-simple");
var Device = require("../models/device");

// Secret key for JWT
var secret = fs.readFileSync(__dirname + '/../jwtkey').toString();

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

router.get('/byuser', headerCheck, sessionCheck, function(req, res, next) {
  var decoded = res.locals.decoded;
  // Find devices based on decoded token
  Device.find({ userEmail : decoded.email}, function(err, devices) {
    if (err) {
      var errormsg = {"message": err};
      res.status(400).send(JSON.stringify(errormsg));
    } else {
      // Create JSON response to contain all record.
      var responseJson = { record: [] };
      // Use Promise to resolve the multi-device issue which causes server down.
      const findRecordPromise = new Promise((resolve, reject) => {
        for (device of devices) {
          // Find record by user's device IDs.
          Record.find({ deviceId : device.deviceId }, function(err, allDevices) {
            if (err) {
              reject("Error: " + err);
            } else {
              // For each found device add a new element to the array
              for (var doc of allDevices) {
                responseJson.record.push({
                  "deviceId": doc.deviceId,
                  "latitude": doc.latitude,
                  "longitude": doc.longitude,
                  "uv": doc.uv,
                  "time": doc.submitTime
                });
              }
              resolve('Success!');
            }
          });
        }
      });
      findRecordPromise.then( value => {
        // Success!
        res.status(201).send(JSON.stringify(responseJson));
      }, reason => {
        // Error!
        res.status(400).send(JSON.stringify(reason));
      } );

    }
  });
});

/* POST: create a new record. */
/*router.post('/create', function(req, res, next) {

  var responseJson = {
    status : "",
    message : ""
  };

  var newRecord = new Record({
    deviceId: req.body.deviceId,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    uv: req.body.uv
  });

  newRecord.save(function(err, newRecord) {
    if (err) {
      var errormsg = {"message": err};
      res.status(400).send(JSON.stringify(errormsg));
    } else {
      responseJson.status = "OK";
      responseJson.message = "Data saved in db with object ID " + newRecord._id + ".";
      res.status(201).send(JSON.stringify(responseJson));
    }
  });
});*/

// GET request return all
router.get('/all', function(req, res, next) {
  // Empty query means find all data in the database.
  var query = {};
  // Query the devices collection to returned requested documents
  Record.find(query, function(err, allDevices) {
    if (err) {
      var errormsg = {"message": err};
      res.status(400).send(JSON.stringify(errormsg));
    } else {
      // Create JSON response to contain all record.
      var responseJson = { record: [] };
      for (var doc of allDevices) {
        // For each found device add a new element to the array
        responseJson.record.push({
          "deviceId": doc.deviceId,
          "latitude": doc.latitude,
          "longitude": doc.longitude,
          "uv": doc.uv,
          "time": doc.submitTime
        });
      }
      res.status(200).send(JSON.stringify(responseJson));
    }
  });
});

module.exports = router;
