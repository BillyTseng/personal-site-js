function signOut() {
  window.localStorage.removeItem("token");
  window.location = "signin.html";
}

// Register function for signing out.
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('signout').addEventListener('click', function() {
    signOut();
  });
});

// check email is legal.
function isEmailLegal(val) {
  var reg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if(reg.test(val) == false) {
    alert("Your Email is illegal. Please modify it.");
    return false;
  } else {
    return true;
  }
}

// chsck device ID is legal.
function isDeviceIdLegal(val) {
  if(/^[a-zA-Z0-9-_]+$/.test(val) == false) {
    alert("Your Device ID contains illegal characters." +
      " We don't accept space and special characters");
    return false;
  } else {
    return true;
  }
}
