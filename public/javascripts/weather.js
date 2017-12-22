function sendReqWeather(latitude, longitude) {
  // console.log("weather.js: sendReqWeather");
  $.ajax({
    url: '/weathers',
    type: 'GET',
    data: {lat: latitude, lon: longitude},
    headers: { 'x-auth': window.localStorage.getItem("token") },
    responseType: 'json',
    success: processWeathers,
    error: function(jqXHR, status, error) {
      if (status === 401) {
          window.localStorage.removeItem("token");
          window.location = "signin.html";
      } else {
        alert("Load Weather Error");
      }
    }
  });
}

function processWeathers(data, status, xhr) {
  // console.log("processWeathers: " + JSON.stringify(data));
  var d = new Date();
  var dayofweek=['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // day0 is today
  for (var i = 0; i < 4; i++) {
    $('#day' + i + ' img').attr('src', "images/icons/" + data.data[i].icon + ".png");
    $('#day' + i + ' span:eq(0)').html(
      dayofweek[(d.getDay() + i) % 7] + ': ' + data.data[i].temp_high + '&deg; ~ ' +
      data.data[i].temp_low + '&deg;');
    $('#day' + i + ' span:eq(1)').html(
      'UV index: ' + data.data[i].uv_high + ' ~ ' + data.data[i].uv_low);
  }
}
