var express = require('express');
var router = express.Router();
var request = require("request");
var fs = require('fs');
var jwt = require("jwt-simple");
var Device = require("../models/device");
var Record = require("../models/record");

// Import api key from a text file.
var apikey = fs.readFileSync(__dirname + '/../3rd-party-apikeys/weatherbit').toString();
// Trim newlines away
apikey = apikey.replace(/(\r\n|\n|\r)/gm,"");

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

router.get('/uv', headerCheck, sessionCheck, function(req, res, next) {
  var lat, lon;
  var responseJson = {
    uv : "none",
    status: "ERROR"
  };

  // Find the last location of the user
  var decoded = res.locals.decoded;
  // Find devices based on decoded token
  Device.findOne({ userEmail : decoded.email}, function(err, device) {
    if (err) {
      var errormsg = {"message": err};
      res.status(400).json(errormsg);
    } else {
      // Find record by user's device IDs and last submitted date.
      Record.find({ deviceId : device.deviceId }).sort({submitTime: -1}).limit(1).exec((err, docs) => {
        if (err) {
          console.log("err: " + err);
          // default location.
          lat = 32.2319;
          lon = -110.9501;
        } else {
          for (var doc of docs) {
            lat = doc.latitude;
            lon = doc.longitude;
            // console.log("lat: " + lat + ", lon: " + lon);
          }
        }
        // Make a request to get today UV from server to the weatherbit server
        request({
          method: "GET",
          uri: "https://api.weatherbit.io/v2.0/current",
          qs: {
            lat: lat,
            lon: lon,
            key : apikey
          }
        }, function(error, response, body) {
          if (error || (response && response.statusCode != 200)) {
            responseJson.status = "error: " + error + ', statusCode:' + (response && response.statusCode);
            console.log(responseJson.status);
            return res.status(400).json(responseJson);
          } else {
            // If the zip_code is invalid, body will be empty. Need to check it at first.
            if (body) {
              var data = JSON.parse(body);
              // Add error handling while getting an error message from weatherbit.io
              if (data.hasOwnProperty("error")){
                return res.status(200).send(body);
              } else {
                responseJson.uv = data.data[0].uv;
                responseJson.status = "OK";
                // Send the response
                res.status(200).json(responseJson);
              }
            } else {
              return res.status(200).json(responseJson);
            }
          }
        });
      });
    }
  });
});

router.get('/', headerCheck, sessionCheck, function(req, res, next) {
  var lat, lon;
  var responseJson = {
    data : [],
    status: "ERROR"
  };

  if (req.query.hasOwnProperty("lat") && req.query.hasOwnProperty("lon")) {
  	lat = req.query.lat;
    lon = req.query.lon;
    if (isNaN(parseInt(lat)) || isNaN(parseInt(lon))) {
      // Failure (200): Invalid location
      return res.status(200).json(responseJson);
    }
  } else {
    // Failure (400): Bad request (invalid query string)
    responseJson = {error: "lat and lon parameter missing"};
    return res.status(400).json(responseJson);
  }

  // Make a request to get forecast from server to the weatherbit server
  request({
    method: "GET",
    uri: "https://api.weatherbit.io/v2.0/forecast/3hourly",
    qs: {
      lat: lat,
      lon: lon,
      key : apikey
    }
  }, function(error, response, body) {
    if (error || (response && response.statusCode != 200)) {
      responseJson.status = "error: " + error + ', statusCode:' + (response && response.statusCode);
      return res.status(400).json(responseJson);
    } else {
      // If the zip_code is invalid, body will be empty. Need to check it at first.
      if (body) {
        var data = JSON.parse(body);
        // Add error handling while getting an error message from weatherbit.io
        if (data.hasOwnProperty("error")){
          return res.status(200).send(body);
        } else {
          //console.log(JSON.stringify(processWeathers(data.data)));
          responseJson.data = processWeathers(data.data);
          responseJson.status = "OK";
          // Send the response
          res.status(200).json(responseJson);
        }
      } else {
        return res.status(200).json(responseJson);
      }
    }
  });
});

function processWeathers(data) {
  var weatherByDays = [];
  // Gather four days data.
  for (var day = 0; day < 4; day++) {
    var eachDay = {};
    // weatherbit return an 3 hours time interval data, so 8 intervals are 24hours.
    var offset = day * 8;
    // Parsing tempatures
    var temp_array = [];
    for (var i = 0 + offset; i < (8 + offset) ; i++) {
      temp_array.push(data[i].temp);
    }
    temp_array.sort(function(a, b){return a-b});
    eachDay['temp_high'] = temp_array.pop();
    eachDay['temp_low']  = temp_array.shift();

    // Parsing UV
    var uv_array = [];
    for (var i = 0 + offset; i < (8 + offset); i++) {
      uv_array.push(data[i].uv);
    }
    uv_array.sort(function(a, b){return a-b});
    eachDay['uv_high'] = uv_array.pop();
    eachDay['uv_low']  = uv_array.shift();

    // the icon code of weather
    eachDay['icon'] = data[0 + offset].weather.icon;
    weatherByDays.push(eachDay);
  }
  return weatherByDays;
}

module.exports = router;
