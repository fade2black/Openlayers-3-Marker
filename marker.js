var MapMaker = function() {
  var map;
  var markerClickCallbacks;

  var callbackMarkersOnClick = function(pixel) {
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      (markerClickCallbacks[feature.getId()])({
        id: feature.getId()
      });
    })
  };

  return {
    createOSMap: function(lon, lat, zoom) {
      //a layer for markers - initially it has no markers
      var markerLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [],
          projection: 'EPSG:4326'
        })
      });

      var baseLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
      });

      map = new ol.Map({
        target: 'map', // The DOM element that will contains the map
        renderer: 'canvas', // Force the renderer to be used
        layers: [baseLayer, markerLayer],
        // Create a view centered on the specified location and zoom level
        view: new ol.View({
          center: ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'),
          zoom: zoom
        })
      });

      map.on('singleclick', function(evt) {
        callbackMarkersOnClick(evt.pixel);
      });

      markerClickCallbacks = Object();

    }, //ENDOF createOSMap

    addMarker: function(id, lon, lat) {
      //create a point
      var geom = new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'));
      var feature = new ol.Feature(geom);

      feature.setStyle([
        new ol.style.Style({
          image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            opacity: 1,
            src: 'https://openlayers.org/en/v3.19.1/examples/data/icon.png'
          }))
        })
      ]);

      if (id != null) {
        feature.setId(id);
      }

      map.getLayers().item(1).getSource().addFeature(feature);
    }, //ENDOF addMarker

    deleteMarkerById: function(id) {
      var id = map.getLayers().item(1).getSource().getFeatureById(id);
      map.getLayers().item(1).getSource().removeFeature(id);
      delete markerClickCallbacks[id];
    }, //ENDOF deleteMarkerById


    moveMarker: function(id, lon, lat) {
      var feature = map.getLayers().item(1).getSource().getFeatureById(id);
      if (feature != null) {
        feature.setGeometry(new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')));
      } else {
        this.addMarker(id, lon, lat);
      }
    }, //ENDOF moveMarker

    removeAllMarkers: function() {
      map.getLayers().item(1).getSource().clear();
      markerClickCallbacks = Object();
    }, //ENDOF removeAllMarkers

    markerCount: function() {
      return map.getLayers().item(1).getSource().getFeatures().length;
    }, //ENDOF markerCount

    onMarkerSingleClick: function(id, callback) {
        markerClickCallbacks[id] = callback;
      } //ENDOF onMarkerSingleClick

  } //return
};
