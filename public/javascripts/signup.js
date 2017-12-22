// Initiates an Ajax call to a POST endpoint for sign in
// TODOcosts for a specifed shipping carrier and service type
function showMsg(htmlmsg) {
  var responseDiv = document.getElementById('ServerResponse');
  responseDiv.style.display = "block";
  responseDiv.innerHTML = htmlmsg;
}

function sendReqForSignup() {
  // Remove exist token for saftey.
  window.localStorage.removeItem("token");

  var email = document.getElementById("email").value;
  var fullName = document.getElementById("fullName").value;
  var password = document.getElementById("password").value;
  var passwordConfirm = document.getElementById("passwordConfirm").value;

  if (!isEmailLegal(email)) {
    return;
  }

  if (!password || 0 === password.length) {
    return alert("Error: password field is blank!!");
  }

  if (password != passwordConfirm) {
    showMsg("<p>Password does not match</p>");
    return;
  }
  // Create the XMLHttpRequest object, register the load event
  // listener, and set the response type to JSON
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", signUpResponse);
  xhr.responseType = "json";

  xhr.open("POST", '/users/signup');

  // Send the request
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify({email:email,fullName:fullName, password:password}));
}

// Response listener for the Ajax call for getting the shippign cost results
function signUpResponse() {
  var responseDiv = $('#ServerResponse');
  var responseHTML = "Sign Up Processing ...";

  // Update the response div in the webpage and make it visible
  responseDiv.show();
  responseDiv.html(responseHTML);

  // 200 is the response code for a successful GET request
  if (this.status === 201) {
    if (this.response.success) {
      // Send verification email to user.
      const promiseSendEmail = new Promise(sendVerifyEmail);

      promiseSendEmail.then( value => {
        // Success!
        // Change current location of window to response's redirect
        responseDiv.removeClass('alert-info');
        responseDiv.addClass('alert-success');
        responseDiv.html("Sign Up Success!  Redirecting Sign in page...");
        window.location = this.response.redirect;
      }, reason => {
        // Error!
        responseDiv.removeClass('alert-info');
        responseDiv.addClass('alert-danger');
        responseDiv.html(reason);
      } );
    } else {
      var responseHTML = "";
      responseHTML += "<ol class='ServerResponse'>";
      for( key in this.response) {
        responseHTML += "<li> " + key + ": " + this.response[key] + "</li>";
      }
      responseHTML += "</ol>";
      responseDiv.removeClass('alert-info');
      responseDiv.addClass('alert-danger');
      responseDiv.html(responseHTML);
    }
  } else {
    responseDiv.removeClass('alert-info');
    responseDiv.addClass('alert-danger');
    responseDiv.html("Error: " + this.response.message);
  }
}

function sendVerifyEmail(resolve, reject) {
  var email = document.getElementById("email").value;
  $.ajax({
      url: '/users/sendemail?email=' + email,
      type: 'GET',
      responseType: 'json',
      success: function() {
        resolve('Success!');
      },
      error: function(jqXHR, error) {
        var response = JSON.parse(jqXHR.responseText);
        reject("Error: " + response.message);
      }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("signup").addEventListener("click", sendReqForSignup);
  document.getElementById("passwordConfirm").addEventListener("keypress", function(event) {
    var key = event.which || event.keyCode;
    if (key === 13) { // 13 is enter
       sendReqForSignup();
    }
  });
});
