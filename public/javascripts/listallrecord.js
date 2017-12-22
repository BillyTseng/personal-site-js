function sendReqForAllRecord() {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", allRecordResponse);
    xhr.responseType = "json";
    xhr.open("GET", '/record/all');
    xhr.send();
}

function allRecordResponse() {
    var responseDiv = document.getElementById('ServerResponse');
    var responseHTML;

    // 200 is the response code for a successful GET request
    if (this.status === 200) {
        responseHTML = '<table class="table">';
        responseHTML += '<tr><th>Device ID</th><th>Latitude</th><th>Longitude</th>' +
                            '<th>UV Index</th><th>Submitted Time</th></tr>';
        for (var rec of this.response.record) {
          responseHTML += '<tr><td>' + rec.deviceId + '</td><td>' + rec.latitude + '</td>';
          responseHTML += '<td>' + rec.longitude + '</td><td>' + rec.uv + '</td>';
          responseHTML += '<td>' + rec.time + '</td></tr>';
        }
        responseHTML += "</table>"
    } else {
        responseHTML = "<span>";
        responseHTML += "Error: " + this.response.message;
        responseHTML += "</span>"
    }

    // Update the response div in the webpage and make it visible
    responseDiv.style.display = "block";
    responseDiv.innerHTML = responseHTML;
}

sendReqForAllRecord();
