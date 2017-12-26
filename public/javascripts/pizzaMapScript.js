var map, largeInfowindow;
var markers = [];
var defaultIcon;
var clickedIcon;
function initMap() {
  var centerOfMap = {lat: 32.2217429, lng: -110.926479};
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: centerOfMap,
    zoom: 13,
    mapTypeControl: false,
    clickableIcons: false   // make original map icons are not clickable.
  });

  defaultIcon = makeMarkerIcon('FE7569');
  clickedIcon = makeMarkerIcon('06E86C');

  foursquareRequest(centerOfMap);
}

/**
 * Error callback for GMap API request
 */
function mapError() {
  alert("Load Google Maps API error!!");
}

// This function populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, infowindow) {
  var htmlStr = "";
  if (marker.phone)
    htmlStr = '<div>' + marker.title + '</div>' + '<div>Phone:&nbsp' + marker.phone + '</div>';
  else
    htmlStr = '<div>' + marker.title + '</div>' + '<div>Phone:&nbspN/A</div>';

  infowindow.marker = marker;
  infowindow.setContent(htmlStr);
  infowindow.open(map, marker);
  // Make sure the marker property is cleared if the infowindow is closed.
  infowindow.addListener('closeclick',function(){
    infowindow.close();
    infowindow.marker.setIcon(defaultIcon);
  });
}

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

// This function send a foursquare request and draw makers on the map.
function foursquareRequest(centerOfMap) {
  url = 'https://billytseng.duckdns.org/pizzamap?lat=' + centerOfMap.lat +
        '&lon=' + centerOfMap.lng

  largeInfowindow = new google.maps.InfoWindow();

  $.getJSON(url,
    function(result) {
      $.each(result.data.venues, function(i, venues){
        var marker = new google.maps.Marker({
          map: map,
          position: {lat: venues.location.lat, lng: venues.location.lng},
          title: venues.name,
          animation: google.maps.Animation.DROP,
          icon: defaultIcon,
          id: venues.id,
          phone: venues.contact.formattedPhone
        });
        // Push the marker to array of markers.
        markers.push(marker);
        marker.addListener('click', function() {
          setAllIconstoDefault();
          this.setIcon(clickedIcon);
          populateInfoWindow(this, largeInfowindow);
        });
      });

      // Apply knockout to maintain the side list.
      ko.applyBindings(new MarkersViewModel());
    })
    .fail(function() { alert("Load FOURSQUARE API error"); });
}

function KoMarker(data) {
  this.title = ko.observable(data.title);
  this.id = ko.observable(data.id);
}

function MarkersViewModel() {
  var self = this;
  this.markerList = ko.observableArray([]);
  markers.forEach(function(markerItem) {
    self.markerList.push(new KoMarker(markerItem));
  });

  this.markerSwitcher = function(clickedMarker) {
    markers.find(function(marker, index) {
      if (marker.id === clickedMarker.id()) {
        setAllIconstoDefault();
        marker.setIcon(clickedIcon);
        populateInfoWindow(marker, largeInfowindow);
      }
    });
  };

  this.searchText = ko.observable("");
  this.search = function() {
    var searchText = this.searchText();
    self.markerList.removeAll();
    markers.find(function(markerItem) {
      largeInfowindow.close();
      markerItem.setVisible(false);
      if (markerItem.title.toLowerCase().search(searchText) >= 0) {
        markerItem.setVisible(true);
        self.markerList.push(new KoMarker(markerItem));
      }
    });
  };
}

// This function turn all markers' color to default color
function setAllIconstoDefault() {
  for (var j = 0; j < markers.length; j++) {
    markers[j].setIcon(defaultIcon);
  }
}
