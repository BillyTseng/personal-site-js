var express = require('express');
var router = express.Router();
var request = require("request");
var fs = require('fs');

// Parse foursquare api's secrect from file and store to variables
var array = fs.readFileSync(__dirname + '/../3rd-party-apikeys/foursquare').toString().split('\n');
var yourClientId = array[0];
var yourClientSecret = array[1];

router.get('/', function(req, res, next) {
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
      return res.status(200).send(JSON.stringify(responseJson));
    }
  } else {
    // Failure (400): Bad request (invalid query string)
    responseJson = {error: "lat and lon parameter missing"};
    return res.status(400).send(JSON.stringify(responseJson));
  }
  var url = 'https://api.foursquare.com/v2/venues/search?' +
            'query=pizza&' +
            'll=' + lat + ',' + lon +
            '&limit=10&radius=100000' +
            '&client_id=' + yourClientId +
            '&client_secret=' + yourClientSecret +
            '&v=20170101';
  // Make a request to get forecast from server to the weatherbit server
  request({
    method: "GET",
    uri: url,
  }, function(error, response, body) {
    if (error || (response && response.statusCode != 200)) {
      responseJson.status = "error: " + error + ', statusCode:' + (response && response.statusCode);
      return res.status(400).send(JSON.stringify(responseJson));
    } else {
      var data = JSON.parse(body);
      responseJson.data = data.response;
      responseJson.status = "OK";
      // Send the response
      res.status(200).send(JSON.stringify(responseJson));
    }
  });
});

module.exports = router;
