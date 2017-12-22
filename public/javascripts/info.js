
function sendUvRequest() {
  $.ajax({
    url: '/weathers/uv',
    type: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("token") },
    responseType: 'json',
    success: processUvResponse,
    error: function(jqXHR, status, error) {
      if (status === 401) {
          window.localStorage.removeItem("token");
          window.location = "signin.html";
      } else {
        alert("Load UV Error");
      }
    }
  });
}

function processUvResponse(data, status, xhr) {
  // console.log("uv: " + data.uv);
  var uv = parseInt(data.uv);
  var alert = $('#alert');

  if (uv <= 2) {
    // 0 to 2: Low
    alert.removeClass();
    alert.addClass("alert alert-success");
    alert.text("If you burn easily, cover up and use broad spectrum SPF 30+ sunscreen.");
  } else if (uv >= 3 && uv <= 5) {
    // 3 to 5: Moderate
    alert.removeClass();
    alert.addClass("alert alert-warning");
    alert.text("Generously apply broad spectrum SPF 30+ sunscreen every 2 hours, even on cloudy days, and after swimming or sweating.");
  } else if (uv >= 6 && uv <= 7) {
    // 6 to 7: High
    alert.removeClass();
    alert.addClass("alert alert-orange");
    alert.text("Generously apply broad spectrum SPF 30+ sunscreen every 2 hours, even on cloudy days, and after swimming or sweating.");
  } else if (uv >= 8 && uv <= 10) {
    // 8 to 10: Very High
    alert.removeClass();
    alert.addClass("alert alert-danger");
    alert.text("Minimize sun exposure between 10 a.m. and 4 p.m.");
  } else {
    // 11 or more: Extreme
    alert.removeClass();
    alert.addClass("alert alert-orchid");
    alert.text("Try to avoid sun exposure between 10 a.m. and 4 p.m.");
  }
}

function initUvRequest() {
    // Automatically refresh recent potholes every 10 mins = 600
    // 30*1000 = 30 seconds
    refreshTimer = window.setInterval(sendUvRequest, 600*1000);
    sendUvRequest();
}

// Handle authentication on page load
document.addEventListener("DOMContentLoaded", function() {
  if (!window.localStorage.getItem('token') ) {
    window.location = "signin.html";
  } else {
    initUvRequest();
  }
});
