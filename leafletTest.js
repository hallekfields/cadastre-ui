// the url for the tiles
// var mapboxUrl = 'https://api.mapbox.com/styles/v1/dmichaels19/cjg2p9i8604622spb0mwgn5x1/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZG1pY2hhZWxzMTkiLCJhIjoiY2pnMm91ZWx6MDAybDJxbzNkbHpvbHI4NSJ9.QMGAMC9IgPony0j7FwPrNA';
var mapboxSatelliteUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NDg1bDA1cjYzM280NHJ5NzlvNDMifQ.d6e-nNyBDtmQCVwVNivz7A#2/0/0';
// attribution text
var mapboxAttrib = '&copy <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>';
// creating the actual leaflet map (with slippy functionality)
var map = new L.Map('mapid', { center: new L.LatLng(4.650814, -74.174559), zoom: 17 });
// adding the mapbox tile data as a layer to the map
// var mapbox = L.tileLayer(mapboxUrl, { maxZoom: 20, attribution: mapboxAttrib }).addTo(map);
var mapboxSatellite = L.tileLayer(mapboxSatelliteUrl, { maxZoom: 20, attribution: mapboxAttrib }).addTo(map);
// adding another layer for drawing polygons
var existingPolygons = polygons;
var drawnPolygons = L.geoJSON(existingPolygons).addTo(map);
console.log(existingPolygons);

map.addControl(new L.Control.Draw({
    edit: {
        featureGroup: drawnPolygons,
        poly: { allowIntersection: false }
    },
    draw: {
      // polygon: { allowIntersection: false, showArea: true }
        polygon: { allowIntersection: false, metric: true,
                   shapeOptions: { color: '#ff0000'}
                 }
    }
}));

function finishPolygon(polygon) {
  polygon.type = "Feature";
  var i;

  for (i = 0; i < polygon.geometry.coordinates[0].length - 1; i++) {
    if (polygon.geometry.coordinates[0][i][0] == polygon.geometry.coordinates[0][i+1][0]
        && polygon.geometry.coordinates[0][i][1] == polygon.geometry.coordinates[0][i+1][1])
          polygon.geometry.coordinates[0].splice(i+1, 1);
  }
  //Doesn't check for uniqueness, odds of a repeat on an 8 digit number are essentially 0
  polygon.properties.cadastreID = (Math.floor(Math.random()*90000000) + 10000000).toString();
  polygon.properties.neighbors = [];
  return(polygon);
}

function checkOverlap(polygon, existingPolygons) {
  var i;
  for (i = 0; i < existingPolygons.length; i++) {
    var overlap = turf.intersect(polygon, existingPolygons[i])
    if (overlap == null) {
      continue;
    } else if (overlap.geometry.type == "Polygon"
        || overlap.geometry.type == "MultiPolygon") {
      return (true);
    } else if (overlap.geometry.type == "Point"
               || overlap.geometry.type == "LineString"
               || overlap.geometry.type == "MultiLineString") {
        var neighbor = {neighborID: existingPolygons[i].properties.cadastreID,
                        sharedpoints: overlap};
        polygon.properties.neighbors.push(neighbor);
        continue;
      }
  }
  return (false);
}

function snapPoints(polygon, existingPolygons){
	var i;
	var j;
	var k;
  var snapped = false;
	var snapRadius = 0.01
	for (i = 0; i < existingPolygons.length; i++) {
		for(j = 0; j < polygon.geometry.coordinates[0].length; j++){
			for(k = 0; k < existingPolygons[i].geometry.coordinates[0].length; k++){
				if(turf.distance(polygon.geometry.coordinates[0][j], existingPolygons[i].geometry.coordinates[0][k], {units: 'miles'}) < snapRadius){
          snapped = true;
					console.log(polygon.geometry.coordinates[0][j]);
					polygon.geometry.coordinates[0][j] = existingPolygons[i].geometry.coordinates[0][k];
					console.log(polygon.geometry.coordinates[0][j]);
					console.log(existingPolygons[i].geometry.coordinates[0][k]);
				}
			}
		}
	}
  return (snapped);
}

map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    //console.log(layer)
    //console.log(layer.editing._poly.toGeoJSON());
    newPolygon = finishPolygon(layer.editing._poly.toGeoJSON());

    var snapped = snapPoints(newPolygon, existingPolygons);

    if (checkOverlap(newPolygon, existingPolygons)) {
      //ERROR MESSAGE
	    /*console.log(newPolygon.geometry.coordinates[0]);
	    console.log(newPolygon.geometry.coordinates[0][newPolygon.geometry.coordinates[0].length - 1]);
      L.marker(newPolygon.geometry.coordinates[0][newPolygon.geometry.coordinates[0].length - 1]).addTo(map)
	    .bindPopup('This polygon overlaps with an existing one')
	    .openPopup();
      console.log('ERROR: OVERLAP DETECTED!!!!!!!!!!');
      */
      window.alert("You cannot overlap existing polygons.");
    } else {
      if (snapped) {
        console.log("HELLO");
        layer = L.geoJSON(newPolygon);
      }
      existingPolygons.push(newPolygon);
      //console.log(newPolygon);
      drawnPolygons.addLayer(layer);
    }
    //console.log(drawnItems);
    console.log(existingPolygons);
});

// fetch("url", {
//   method: "POST"
// })
// .then(function(res){
//   return res.json()
// }).then(function(res){
//   L.geoJSON(res).addTo(map);
// })
