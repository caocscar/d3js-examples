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
  if (e && e.point.x < 80 && e.point.y < 50) return // check if click in legend area 
	marker ? marker.setLngLat(e.lngLat) : addMarker(e)
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
  markerButton.text("Remove Marker");
  svButton.property('disabled', false);
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

// project any point to map's current state
function projectPoint(lon, lat) {
  let point = map.project(new mapboxgl.LngLat(lon, lat));
  this.stream.point(point.x, point.y);
}

function makeGeojson(data) {
  let HvPts = data.map(d => [d.HvLongitude, d.HvLatitude])
  let RvPts = data.map(d => [d.RvLongitude, d.RvLatitude])
  HvPts = HvPts.filter(d => d[0] != null & d[1] != null)
  RvPts = RvPts.filter(d => d[0] != null & d[1] != null)
  return {"Hv": {"type": "LineString", "coordinates": HvPts},
          "Rv": {"type": "LineString", "coordinates": RvPts},
          }
}

// map initialization
initMap()

// setup our svg layer that we can manipulate with d3
let container = map.getCanvasContainer()
let svgMap = d3.select(container).append("svg")
    .attr('id','mapbox')

// mapbox legend
svgMap.append('rect')
    .attr('class', 'legendBkgd')
    .attr('width', 70)
    .attr('height', 40)

let legend = svgMap.selectAll('.legend')
  .data(['host','remote'])
  .join('g')
    .attr("class", "legend")
    .attr("transform", (d,i) => `translate(0,${i*20})`)
    .on('click', function(d) {
      tf = d3.select(this).classed('hidden')
      d3.select(this).classed('hidden', !tf)
      d3.selectAll(`.${d}`).attr('opacity', tf ? 1 : 0 )
    })

const xoffset = 5,
      yoffset = 10,
      colorObj = {'host':'yellow', 'remote':'orange'};

legend.append('line')
    .attr('class', 'lpt')
    .attr('x1', xoffset)
    .attr('y1', yoffset)
    .attr('x2', xoffset+20)
    .attr('y2', yoffset)
    .style('stroke', d => colorObj[d])
    .style('stroke-width', 5);

legend.append("text")
    .attr("x", xoffset+25)
    .attr("y", yoffset)
    .attr("dy", ".2em")
    .style("text-anchor", "start")
    .text(d => d);

// projection function
let transform = d3.geoTransform({point: projectPoint});
let path = d3.geoPath().projection(transform);   
