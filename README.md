
## Introduction
OpenLayers 3 does not provide a class for creating markers on a map. In this tutorial I want to create a Javascript wrapper object that provides a method for creating a marker on a map by latitude and longitude.
### Map Maker
We start with the method <code>createOSMap</code> which takes <code>lon</code>, <code>lat</code>, <code>zoom</code> values and creates a map. It also creates additional layer for markers.
```javascript
var MapMaker = function()
{
  var map;

  return {
      createOSMap: function (lon, lat, zoom)
      {
        //a layer for markers - initially it has no markers
  			var markerLayer = new ol.layer.Vector({
  					source: new ol.source.Vector({ features: [], projection: 'EPSG:4326' })
  			});

        var baseLayer = new ol.layer.Tile( {
  				source: new ol.source.OSM()
  			});

        map = new ol.Map({
            target: 'map',  // The DOM element that will contains the map
            renderer: 'canvas', // Force the renderer to be used
            layers: [ baseLayer, markerLayer ],
            // Create a view centered on the specified location and zoom level
            view: new ol.View({
                center:  ol.proj.transform([lon, lat ], 'EPSG:4326', 'EPSG:3857'),
                zoom: zoom
            })
        });
      }//ENDOF createOSMap
  }
};
```
We save this code in <code>mapmaker.js</code> and test it as following
```html
<html lang="en">
  <head>
    <link rel="stylesheet" href="http://openlayers.org/en/v3.19.1/css/ol.css" type="text/css">
    <script src="http://openlayers.org/en/v3.19.1/build/ol.js" type="text/javascript"></script>
    <script src="mapmaker.js" type="text/javascript"></script>
    <title>Map Maker</title>
  </head>
  <body>
    <h2>Welcome to Ashgabat</h2>
    <div id="map" class="map"></div>
    <script type="text/javascript">
      mymap = MapMaker();
      mymap.createOSMap(58.368245318110304,37.89354632472305, 16);
    </script>
  </body>
</html>
```
Now let's create a method that adds a marker to a map at a specific position. This method takes three arguments: <code>id</code>, <code>lon</code>, and <code>lat</code>. We also assign a unique <code>id</code> to each marker (on a map) in order to distinguish one marker from another.
```javascript
addMarker: function(id, lon, lat)
{
   //create a point
   var geom = new ol.geom.Point( ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857') );
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

   if (id != null)
   {
     feature.setId(id);
   }

   map.getLayers().item(1).getSource().addFeature(feature);
}
```
We also should be able to delete a marker from the map. We delete the marker by passing its id:
```javascript
deleteMarkerById: function(id)
{
  var id = map.getLayers().item(1).getSource().getFeatureById(id);
  map.getLayers().item(1).getSource().removeFeature(id);
}
``` 
Now let's create a method to move a marker to a new position. The following methods takes marker id and moves it to a new position
```javascript
moveMarker: function(id, lon, lat)
{
  var feature = map.getLayers().item(1).getSource().getFeatureById(id);
  if(feature != null)
  {
    feature.setGeometry(new ol.geom.Point( ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857') ));
  }
  else
  {
    this.addMarker(id, lon, lat);
  }  
}
```
For example, 
```javascript
//...
mymap = MapMaker();
mymap.createOSMap(58.368245318110304,37.89354632472305, 16);
mymap.addMarker(1, 58.350200008110304,37.89834632472305);
mymap.addMarker(2, 58.369345318110304,37.89354632472305);
setTimeout(function(){
  mymap.deleteMarkerById(1);
  mymap.moveMarker(2, 58.350200008110304,37.89834632472305);
}, 3000);
//...
```
Finally we create two more methods which may come handy:
```javascript
removeAllMarkers: function()
{
  map.getLayers().item(1).getSource().clear();
}

markerCount: function()
{
  return map.getLayers().item(1).getSource().getFeatures().length;
}
```
 
### Making Markers Interactive
Now that our map maker is ready we make markers interactive, in particular markers will response to the single-click event. We will add method <code>onMarkerSingleClick</code> which takes two arguments <code>id</code> and <code>callback</code> function. So, we introduce a new variable <code>markerClickCallbacks</code> to store callbacks:
```javascript
var MapMaker = function()
{
  var map;
  var markerClickCallbacks;
//...
};
```
Wee add the following lines just after we create map (in <code>createOSMap</code>) 
```javascript
createOSMap: function (lon, lat, zoom)
{
  //...
  map.on('singleclick', function(evt)
  {
    callbackMarkersOnClick(evt.pixel);
  });

  markerClickCallbacks = Object();
}
```
When we click on a map, the function <code>callbackMarkersOnClick</code> is invoked which loops on each "clicked" marker and invokes callbacks. So we add the function <code>callbackMarkersOnClick</code> (as a map-maker's method)
```javascript
var MapMaker = function()
{
  var map;
  var markerClickCallbacks;

  callbackMarkersOnClick: function(pixel)
  {
    map.forEachFeatureAtPixel(pixel, function(feature, layer){
       (markerClickCallbacks[feature.getId()])({id:feature.getId()});
    })
  }

//...
```
and finally we need to add the following method
```javascript
onMarkerSingleClick: function(id, callback)
{
  markerClickCallbacks[id] = callback;
}
```
We use it as following:
```javascript
//...
mymap = MapMaker();
mymap.createOSMap(58.368245318110304,37.89354632472305, 16);
mymap.addMarker(1, 58.350200008110304,37.89834632472305);
mymap.addMarker(2, 58.369345318110304,37.89354632472305);

mymap.onMarkerSingleClick(1, function(obj){
   alert("Hi, my id is " + obj.id)
});
mymap.onMarkerSingleClick(2, function(obj){
     alert("Hello, my id is " + obj.id)
});
```
And finally we need to delete callbacks when we delete markers, so add <code>delete markerClickCallbacks[id]</code> to <code>deleteMarkerById</code> method, and <code>markerClickCallbacks = Object()</code> to <code>removeAllMarkers</code>.
The final version of <code>mapmaker.js</code>, together with example, is [here](https://jsfiddle.net/bayram_kuliyev/ondk4vmu/). 

### Marker Animation
```html
<html lang="en">
  <head>
    <link rel="stylesheet" href="https://openlayers.org/en/v3.19.1/css/ol.css" type="text/css">
    <script src="https://openlayers.org/en/v3.19.1/build/ol.js" type="text/javascript"></script>
    <script src="mapmaker.js" type="text/javascript"></script>
    <title>Map Maker</title>
  </head>
  <body>
    <h2>Welcome to Ashgabat</h2>
    <div id="map" class="map"></div>
    <script type="text/javascript">

      mymap = MapMaker();

      function generate_points(lat1, lon1, lat2, lon2, pcount)
      {
        var delta_lat = (lat2 - lat1) / (pcount * 1.0);
        var delta_lon = (lon2 - lon1) / (pcount * 1.0);
        var points = [];

        for(var i=0; i<pcount; i++)
        {
          points.push({lat: lat1 + delta_lat*i, lon:lon1 + delta_lon*i })
        }

        points.push({lat:lat2, lon:lon2});
        return points;
      }

      function animate(points)
      {
        mymap.addMarker(2005, points[0].lon, points[0].lat );
        var pointIndex = 0;
        var setIntervalId = setInterval(
         function()
         {
           if (pointIndex < points.length-1)
           {
             pointIndex++;
             mymap.moveMarker(2005, points[pointIndex].lon, points[pointIndex].lat);
           }
           else
           {
             clearInterval(setIntervalId);
           }

         }, 10);
      }

      mymap.createOSMap(58.368245318110304,37.89354632472305, 15);
      var start = {lat: 37.89741536207012, lon:58.369356322245636};
      var finish = {lat: 37.900048319061995, lon:58.350462841944726};
      //generate 640 points
      animate(generate_points(start.lat, start.lon, finish.lat, finish.lon, 640));

    </script>
  </body>
</html>
```
[This](https://jsfiddle.net/bayram_kuliyev/1d9dbc1q/) is animation in action.
