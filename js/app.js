 require([
        "esri/arcgis/utils",
         "esri/map",
         "esri/dijit/Scalebar",
         "esri/geometry/Extent",
         "esri/layers/WebTiledLayer",
         "./js/bootstrapmap.js",
         "dojo/domReady!",
     ],
     function(arcgisUtils, Map, Scalebar, Extent, WebTiledLayer, BootstrapMap) {
         <!-- Get a reference to the ArcGIS Map class -->
         var map = null;
         /* BootstrapMap.create("mapDiv", {
             basemap: 'gray',
             center: [-117.1, 33.6],
             zoom: 9
         }); */
         var deferred = arcgisUtils.createMap("8b3ce9af79724f30a9f924c7bca1d339", "mapDiv").then(function(response) {
             //update the app 
             dom.byId("title").innerHTML = response.itemInfo.item.title;
             dom.byId("subtitle").innerHTML = response.itemInfo.item.snippet;

             map = response.map;
         });
         
         // 8b3ce9af79724f30a9f924c7bca1d339

         $(document).ready(function() {
             $("#basemapList li").click(function(e) {
                 var l, options;
                 BootstrapMap.clearBaseMap(map);
                 switch (e.target.text) {
                     case "Water Color":


                         options = {
                             id: 'Water Color',
                             copyright: 'stamen',
                             resampling: true,
                             subDomains: ['a', 'b', 'c', 'd']
                         };
                         l = new WebTiledLayer('http://${subDomain}.tile.stamen.com/watercolor/${level}/${col}/${row}.jpg', options);
                         map.addLayer(l);
                         break;

                     case "MapBox Space":

                         options = {
                             id: 'mapbox-space',
                             copyright: 'MapBox',
                             resampling: true,
                             subDomains: ['a', 'b', 'c', 'd']
                         };
                         l = new WebTiledLayer('http://${subDomain}.tiles.mapbox.com/v3/eleanor.ipncow29/${level}/${col}/${row}.jpg', options);
                         map.addLayer(l);
                         break;

                     case "Pinterest":
                         options = {
                             id: 'mapbox-pinterest',
                             copyright: 'Pinterest/MapBox',
                             resampling: true,
                             subDomains: ['a', 'b', 'c', 'd']
                         };
                         l = new WebTiledLayer('http://${subDomain}.tiles.mapbox.com/v3/pinterest.map-ho21rkos/${level}/${col}/${row}.jpg', options);
                         map.addLayer(l);
                         break;
                     case "Streets":
                         map.setBasemap("streets");
                         break;
                     case "Imagery":
                         map.setBasemap("hybrid");
                         break;
                     case "National Geographic":
                         map.setBasemap("national-geographic");
                         break;
                     case "Topographic":
                         map.setBasemap("topo");
                         break;
                     case "Gray":
                         map.setBasemap("gray");
                         break;
                     case "Open Street Map":
                         map.setBasemap("osm");
                         break;
                 }
             });
             var addresses = new Bloodhound({
                 name: 'ago-geocode',
                 datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                 queryTokenizer: Bloodhound.tokenizers.whitespace,
                 remote: {
                     url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=%QUERY&maxLocations=2&f=pjson',
                     filter: function(response) {
                         return $.map(response.suggestions, function(location) {
                             return {
                                 text: location.text,
                                 magicKey: location.magicKey
                             };
                         });
                     }
                 }
             });

             addresses.initialize();
             /*addresses.get('Sweden', function(suggestions) {
              console.log(suggestions);
                $(suggestions).each(function(suggestion) {
                    console.log(suggestion);
                });
              });*/
             $('.typeahead').typeahead(null, {
                 name: 'text',
                 displayKey: 'text',
                 source: addresses.ttAdapter()
             }).on('typeahead:selected', function($e, datum) {
                 //http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text="<text1>"&magicKey="<magicKey1>"&f=json
                 var url = 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=' + datum.text + '&magicKey=' + datum.magicKey + '&f=json';
                 $.get(url, function(data) {
                     var result = JSON.parse(data);
                     var extent = new Extent(result.locations[0].extent);
                     map.setExtent(extent, true);
                 });

             });

         });
     });
