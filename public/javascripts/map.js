// GET the uv record
function getUVRecord() {
  $.ajax({
      url: '/record/byuser',
      type: 'GET',
      headers: { 'x-auth': window.localStorage.getItem("token") },
      responseType: 'json',
      success: markUVRecord,
      error: function(jqXHR, status, error) {
        if (status === 401) {
            window.localStorage.removeItem("token");
            window.location = "signin.html";
        } else {
           alert(error);
        }
      }
  });
}

function markUVRecord(data, status, xhr) {
  var latitude = 32.2319;
  var longitude = -110.9501;

  // Create a map centered at the location
  var uluru = {lat: latitude, lng: longitude};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: uluru
  });

  var markers = [];
  var bounds = new google.maps.LatLngBounds();
  var json = $.parseJSON(data);
  // Add markers for all record
  for (var rec of json.record) {
    uluru = {lat: rec.latitude, lng: rec.longitude};
    var marker = new google.maps.Marker({
       position: uluru,
       map: map,
       label: {
          text: "" + rec.uv,
          color: 'white',
          fontSize: "14px"
       },
    });
    markers.push(marker);
    latitude = rec.latitude;
    longitude = rec.longitude;
  }
  // Use the last location to parse weather's data
  sendReqWeather(latitude, longitude);
  if (markers.length > 0) {
    // Re-zoom map to fit all markers
    for (var i = 0; i < markers.length; i++) {
     bounds.extend(markers[i].getPosition());
    }
    map.fitBounds(bounds);  
  }
}

// Executes once the google map api is loaded, and then sets up and calls the handler
function initMap() {
  getUVRecord();
}

function sendReqAPIKEY() {
  $.ajax({
    url: '/users/gmap',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("token") },
    responseType: 'json',
    success: getAPIKEY,
    error: function(jqXHR, status, error) {
      if (status === 401) {
          window.localStorage.removeItem("token");
          window.location = "signin.html";
      } else {
        alert("Load Map Error");
      }
    }
  });
}

function getAPIKEY(data, status, xhr) {
  var apikey = data.apikey;
  var url = "https://maps.googleapis.com/maps/api/js?key=" + apikey + "&callback=initMap";
  // Put the script after the container div
  $(".container").after('<script async defer src=' + url + '></script>');
}

// Handle authentication on page load
document.addEventListener("DOMContentLoaded", function() {
  if (!window.localStorage.getItem('token') ) {
    window.location = "signin.html";
  } else {
    sendReqAPIKEY();
  }
});
