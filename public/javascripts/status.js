// GET the user status and list of devices
function sendReqForStatus() {
    $.ajax({
        url: '/users/status',
        type: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("token") },
        responseType: 'json',
        success: statusResponse,
        error: function(jqXHR, status, error) {
          if (status === 401) {
              window.localStorage.removeItem("token");
              window.location = "signin.html";
          } else {
             $("#error").html("Error: " + error);
             $("#error").show();
          }
        }
    });
}

function composeRowOfDeviceTable(deviceId, apikey) {
  var dropDownHtml = "" +
    '<div class="btn-group justify-content-center">' +
      '<button type="button" class="btn btn-secondary dropdown-toggle"' +
      ' data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
        'Actions' +
      '</button>' +
      '<div class="dropdown-menu">' +
        '<a class="dropdown-item">Edit</a>' +
        '<a class="dropdown-item">Delete</a>' +
      '</div>' +
    '</div>';

  var editdeviceIdHtml = "" +
    '<div class="edit-device-id justify-content-center">' +
    '<button class="btn btn-primary btn-sm" role="button">&nbspDone&nbsp</button>' +
    '<button class="btn btn-danger btn-sm" role="button">Cancel</button></div>';

  $('#deviceTable > tbody:last-child').append(
    '<tr id="' + deviceId + '">' +
    '<td>'+ dropDownHtml + editdeviceIdHtml + '</td>' +
    '<td>'+ deviceId + '</td>' +
    '<td>'+ apikey + '</td>' + '</tr>');

  $("#" + deviceId + " a:contains('Delete')").click(
    {deviceId: deviceId}, deviceIdDelete);

  $("#" + deviceId + " a:contains('Edit')").click(
    {deviceId: deviceId}, showEditDeviceId);
}

function sendVerifyEmail(event) {
  var email = event.data.email;

  $("#error").removeClass('alert-danger');
  $("#error").addClass('alert-info');
  $("#error").html("Sending Email ...")
  $("#error").show();

  $.ajax({
      url: '/users/sendemail?email=' + email,
      type: 'GET',
      responseType: 'json',
      success: function() {
        $("#error").html("Email Sent.")
      },
      error: function(jqXHR, status, error) {
        var response = JSON.parse(jqXHR.responseText);
        $("#error").addClass('alert-danger');
        $("#error").removeClass('alert-info');
        $("#error").html("Error: " + response.message);
        $("#error").show();
      }
  });
}

// Update page to display user's account information and list of devices with apikeys
function statusResponse(data, status, xhr) {
  $("#email").html(data.email);
  $("#fullName").html(data.fullName);
  // $("#lastAccess").html(data.lastAccess);

  if(data.verified) {
    $("#addDevice").show();
    $("#addDevice").click(showAddDeviceForm);
    $("#verifyEmailNotice").hide();
  } else {
    $("#verifyEmailNotice").show();
    $("#verifyEmailNotice button").click({email: data.email}, sendVerifyEmail);
  }

  // Add the devices to the table
  for (var device of data.devices) {
    // Populate each device into table.
    composeRowOfDeviceTable(device.deviceId, device.apikey);
  }
}

function showEditDeviceId(event) {
  var deviceId = event.data.deviceId;
  var deviceIdElement = $("#" + deviceId + " td:eq(1)"); // 2nd td is deviceId
  var deviceIdText = deviceIdElement.text();
  deviceIdElement.html('<input type="text" col="50" value=' + '"' + deviceIdText + '">');
  // console.log(deviceId + ": Edit");

  $("#" + deviceId + " .btn-group").hide();
  $("#" + deviceId + " .edit-device-id").show();

  $("#" + deviceId + " button:contains('Done')").click(
    {deviceId: deviceId}, editDeviceId);

  $("#" + deviceId + " button:contains('Cancel')").click(function() {
    // console.log(deviceId + ": Cancel");
    $("#" + deviceId + " .btn-group").show();
    $("#" + deviceId + " .edit-device-id").hide();
    deviceIdElement.html(deviceId);
  });
}

function editDeviceId(event) {
  var deviceId = event.data.deviceId;
  var deviceIdElement = $("#" + deviceId + " td:eq(1) input"); // 2nd td is deviceId
  var newDeviceIdText = deviceIdElement.val();

  if (isDeviceIdLegal(newDeviceIdText)) {
    $.ajax({
      url: '/device/edit',
      type: 'PUT',
      headers: { 'x-auth': window.localStorage.getItem("token") },
      data: { deviceId: deviceId, newDeviceId: newDeviceIdText },
      responseType: 'json',
      success: function() {
        // Update element's id
        // console.log("ajax success: " + newDeviceIdText);
        $("#" + deviceId).attr('id',newDeviceIdText);

        // Toogle UI
        $("#" + newDeviceIdText + " .btn-group").show();
        $("#" + newDeviceIdText + " .edit-device-id").hide();

        // Replace input area with text.
        $("#" + newDeviceIdText + " td:eq(1)").html(newDeviceIdText);
      },
      error: function(jqXHR, status, error) {
        var response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
      }
    });
  }
}

// Delete device by deviceId
function deviceIdDelete(event) {
  // console.log(event.data.deviceId + ": Delete");

  $.ajax({
      url: '/device/delete/' + event.data.deviceId,
      type: 'DELETE',
      headers: { 'x-auth': window.localStorage.getItem("token") },
      responseType: 'json',
      success: function() {
        // Remove the row of deviceId from the web page's table.
        $('tr#' + event.data.deviceId).remove();
       },
      error: function(jqXHR, status, error) {
          var response = JSON.parse(jqXHR.responseText);
          $("#error").html("Error: " + response.message);
          $("#error").show();
      }
  });
}

// Registers the specified device with the server.
function registerDevice() {
  var deviceIdVal = $("#deviceId").val();

  if (isDeviceIdLegal(deviceIdVal)) {
    $.ajax({
      url: '/device/register',
      type: 'POST',
      headers: { 'x-auth': window.localStorage.getItem("token") },
      data: { deviceId: deviceIdVal },
      responseType: 'json',
      success: deviceRegistered,
      error: function(jqXHR, status, error) {
          var response = JSON.parse(jqXHR.responseText);
          $("#error").html("Error: " + response.message);
          $("#error").show();
      }
    });
  }
}

// Device successfully register. Update the table of devices and hide the add device form
function deviceRegistered(data, status, xhr) {
  var deviceIdValue = $("#deviceId").val();

  // Add registered device into table.
  composeRowOfDeviceTable(deviceIdValue, data["apikey"]);

  hideAddDeviceForm();
}

// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
   $("#deviceId").val("");           // Clear the input for the device ID
   $("#addDeviceControl").hide();    // Hide the add device link
   $("#addDeviceForm").slideDown();  // Show the add device form
}

// Hides the add device form and shows the add device button (link)
function hideAddDeviceForm() {
   $("#addDeviceControl").show();  // Hide the add device link
   $("#addDeviceForm").slideUp();  // Show the add device form
   $("#error").hide();
}

function showEditUserInfo() {
  var emailText = $("#email").text();
  var fullNameText = $("#fullName").text();
  $("#editUserInfo").hide();
  $("#confirmEditUserInfo").show();
  $("#email").html('<input type="email" col="50" value=' + '"' + emailText + '">');
  $("#fullName").html('<input type="email" col="50" value=' + '"' + fullNameText + '">');
  $("#confirmEditUserInfo a:contains('Cancel')").click(
    {
      orgEmail: emailText,
      orgName: fullNameText
    }, abortEditUserInfo);

  // User press done, PUT new user info to server.
  $("#confirmEditUserInfo a:contains('Done')").click(
    {
      orgEmail: emailText
    }, editUserInfo);
}

function abortEditUserInfo(event) {
  $("#editUserInfo").show();
  $("#confirmEditUserInfo").hide();
  $("#email").html(event.data.orgEmail);
  $("#fullName").html(event.data.orgName);
}

function editUserInfo(event) {
  var inputEmail = $("#email input").val();
  var inputName = $("#fullName input").val();

  if (isEmailLegal(inputEmail)) {
    $.ajax({
      url: '/users/edit',
      type: 'PUT',
      headers: { 'x-auth': window.localStorage.getItem("token") },
      data: { email: inputEmail, fullName: inputName },
      responseType: 'json',
      success: function(data, status, xhr) {
        // If email is revised, have to re-login to update token.
        if (event.data.orgEmail !== inputEmail) {
          // The signOut() is in utility.js
          signOut();
        } else {
          $("#editUserInfo").show();
          $("#confirmEditUserInfo").hide();
          $("#email").html(inputEmail);
          $("#fullName").html(inputName);
        }
      },
      error: function(jqXHR, status, error) {
        var response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
      }
    });
  }
}

// Handle authentication on page load
$(function() {
  if( !window.localStorage.getItem('token') ) {
    window.location = "signin.html";
  } else {
    sendReqForStatus();
  }

  // Register event listeners
  $("#registerDevice").click(registerDevice);
  $("#cancel").click(hideAddDeviceForm);
  $("#editUserInfo").click(showEditUserInfo);
});
