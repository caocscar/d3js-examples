let marker = null,
    markerButton = d3.select('#svMarker').on('click', toggleMarker),
    svButton = d3.select('#svEnterExit').on('click', toggleStreetView);

// Mapbox functions
function initMapbox() {
	mapboxgl.accessToken = 'pk.eyJ1IjoiY2FvYSIsImEiOiJjazFncHJqZzYwMXkyM2hxcWp6d2hucTk1In0.5Z7Nmggo79voVuNvU2i7sQ';
	map = new mapboxgl.Map({
		container: 'mapbox',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-83.53,40.27],
		zoom: 9,
    attributionControl: false,
    doubleClickZoom: false,
	})
	map.addControl(new mapboxgl.NavigationControl({visualizePitch: true}), 'top-right');
	map.addControl(new mapboxgl.AttributionControl({compact: true}));
  map.on('click', updateMarker);
}  

function updateMarker(e) {
	if (marker) {
    marker.setLngLat(e.lngLat)
  } else {
    addMarker(e)
    markerButton.text("Remove Marker")
    svButton.property('disabled', false)
  }
  updateCoords();
}

function updateCoords() {
	const lnglat = marker.getLngLat();
  streetView.setPosition({lng: lnglat.lng, lat: lnglat.lat});
}

function addMarker(e) {
  marker = new mapboxgl.Marker({draggable: true});
  marker.setLngLat(e ? e.lngLat : map.getCenter());
  marker.addTo(map);
  marker.on('dragend', updateCoords);
}

function removeMarker() {
	marker.remove();
	marker = null;
	markerButton.text("Add Marker");
  svButton.property('disabled', true);
}

function toggleMarker() {
	marker ? removeMarker() : updateMarker();
}

// Google Maps street view functions
function initGoogleMap() {
  gmap = new google.maps.Map(d3.select('#gmap').node(), {
    center: map.getCenter(),
    zoom: map.getZoom(),
	});
}

function initStreetView() {
  streetView = new google.maps.StreetViewPanorama(d3.select('#gmap').node(), {
    position: map.getCenter(),
    pov: { heading: 0, pitch: 0 }, // facing north
    fullscreenControl: false,
    visible: false,
  });
  gmap.setStreetView(streetView);
}

function enterStreetView() {
  streetView.setVisible(true)
  map.getContainer().style.visibility = 'hidden';  
  markerButton.property('disabled', true)
  svButton.text("Exit Street View");
}

function exitStreetView() {
	map.getContainer().style.visibility = 'visible'
	streetView.setVisible(false)
  markerButton.property('disabled', false)
  svButton.text("Enter Street View");
}

function toggleStreetView() {
	markerButton.property('disabled') ? exitStreetView() : enterStreetView()
}

function initMap() {
  initMapbox();
	initGoogleMap();
  initStreetView();
}


