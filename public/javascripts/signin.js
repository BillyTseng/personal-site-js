// Initiates an Ajax call to a POST endpoint for sign in
function sendReqForSignin() {
  // User inputs for email and password
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (!isEmailLegal(email)) {
    return;
  }
  
  // Create the XMLHttpRequest object, register the load event
  // listener, and set the response type to JSON
  var xhr = new XMLHttpRequest();

  xhr.addEventListener("load", signInResponse);
  xhr.responseType = "json";
  xhr.open("POST", '/users/signin');
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify({email:email, password:password}));
}

// Process response from sign in attempt
function signInResponse() {
  var responseDiv = $('#ServerResponse');
  var responseHTML = "";

  // 200 is the response code for a successful GET request
  if (this.status === 201) {
    responseDiv.removeClass('alert-danger');
    responseDiv.addClass('alert-success');
    responseHTML = "Success: Redirecting";
    // Store token to local storage
    window.localStorage.setItem("token", this.response.token);
    // Store redirect to local storage
    window.localStorage.setItem("redirect", this.response.redirect);
    // Redirecting location
    window.location = this.response.redirect;
  } else {
    responseHTML = "Error: " + this.response.error;
  }

  // Update the response div in the webpage and make it visible
  responseDiv.show();
  responseDiv.html(responseHTML);
}

// Handle authentication on page load
document.addEventListener("DOMContentLoaded", function() {
  // Check if local storage has token
  if( window.localStorage.getItem("token")) {
    window.location = window.localStorage.getItem("redirect");
  }
  // add event listener to signin button
  else {
    document.getElementById("signin").addEventListener("click", sendReqForSignin);
    document.getElementById("password").addEventListener("keypress", function(event) {
      var key = event.which || event.keyCode;
      if (key === 13) { // 13 is enter
         sendReqForSignin();
      }
    });
  }
});
