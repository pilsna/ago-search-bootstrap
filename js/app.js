 require([
         "esri/arcgis/utils",
         "esri/map",
         "esri/dijit/Scalebar",
         "esri/geometry/Extent",
         "esri/layers/WebTiledLayer",
         "esri/dijit/LayerSwipe",
         "dojo/dom",
         "dojo/on",
         "./js/bootstrapmap.js",
         "dojo/domReady!",
     ],
     function(arcgisUtils, Map, Scalebar, Extent, WebTiledLayer, LayerSwipe, dom, on, BootstrapMap) {
         var map = null;
         var operationalLayers = null;
         var swipeWidget = null;
         var currentSelection = null;

         var deferred = arcgisUtils.createMap("8b3ce9af79724f30a9f924c7bca1d339", "mapDiv").then(function(response) {
             map = response.map;
             operationalLayers = response.itemInfo.itemData.operationalLayers;

             $("#title").text(response.itemInfo.item.title);
             $("#subtitle").text(response.itemInfo.item.snippet);

             var selectList = [];
             $.each(operationalLayers, function(i, item) {
                 selectList.push('<option value="' + i + '">' + item.title + '</option>');
                 console.log(item);
             }); // close each()
             $('select.layers').append(selectList.join(''));

             swipeWidget = new LayerSwipe({
                 type: "vertical", //Try switching to "scope" or "horizontal"
                 map: map,
                 layers: [operationalLayers[2].layerObject]
             }, "swipeContainer");
             swipeWidget.startup();
             /* on(swipeWidget, 'swipe', function(layers) {
                 console.log(layers);
             }); */
         });
         var setSwipelayer = function(layer) {
             swipeWidget.layers = [layer];
         }
         // 8b3ce9af79724f30a9f924c7bca1d339
         var switchToBasemap = function(name) {
             var l, options;
             switch (name) {
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
         }

         $(document).ready(function() {
             $("#basemapList li").click(function(e) {
                 map.removeAllLayers();
                 switchToBasemap(e.target.text);
                 map.addLayers([operationalLayers[2].layerObject, operationalLayers[0].layerObject]);
                 setSwipelayer(operationalLayers[0].layerObject);
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

             $('.typeahead').typeahead(null, {
                 name: 'text',
                 displayKey: 'text',
                 source: addresses.ttAdapter()
             }).on('typeahead:selected', function($e, datum) {
                 var url = 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=' + datum.text + '&magicKey=' + datum.magicKey + '&f=json';
                 $.get(url, function(data) {
                     var result = JSON.parse(data);
                     var extent = new Extent(result.locations[0].extent);
                     map.setExtent(extent, true);
                 });

             });

         });
     });
