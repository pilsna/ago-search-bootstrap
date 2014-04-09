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
         var layerListLeft = $('#layerListLeft');
         var layerListRight = $('#layerListRight');
         var switchBoard = null;
         var basemap = "Gray";

         var deferred = arcgisUtils.createMap("8b3ce9af79724f30a9f924c7bca1d339", "mapDiv").then(function(response) {
             map = response.map;
             operationalLayers = response.itemInfo.itemData.operationalLayers;

             $("#title").text(response.itemInfo.item.title);
             $("#subtitle").text(response.itemInfo.item.snippet);

             var selectList = [];
             $.each(operationalLayers, function(i, item) {
                 selectList.push('<option value="' + i + '">' + item.title + '</option>');
             }); // close each()
             $('select.layers').append(selectList.join(''));

             /* .empty() */
             switchBoard = new SwitchBoard(layerListLeft, layerListRight, operationalLayers, setSwipeLayer);

             var onChange = function(event) {
                 switchBoard.update(event.currentTarget, $(this).val());
                 console.log(event);
                 console.log($(this).val());
             }
             layerListLeft.change(onChange);
             layerListRight.change(onChange);

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
         var removeLayers = function(list) {
             $.each(list, function(i, layerInfo) {
                 map.removeLayer(layerInfo.layerObject);
             });
         }
         var setSwipeLayer = function(layers) {
             swipeWidget.disable();
             removeLayers(operationalLayers);
             //switchToBasemap(basemap);
             map.addLayers([layers[0].layerObject, layers[1].layerObject]);
             swipeWidget.layers = [layers[1].layerObject];
             swipeWidget.enable();
         }

         var SwitchBoard = function(divLeft, divRight, layers, callback) {
             this.setSwipeLayer = callback;
             this.layersToShow = [];
             this.refresh = function() {
                 if (this.layersToShow.length === 2) {
                     this.setSwipeLayer(this.layersToShow);
                 } else {
                     console.log("Could not refresh " + this.layersToShow);
                 }
             }
             this.update = function(target, value) {
                 var roll = function(id) {
                     $.each(layers, function(index, layer) {
                         if (id !== layer.id) {
                             return layer.id;
                         }
                     });
                 }
                 if (divLeft.val() === '-1') {
                     divLeft.val(0);
                 }
                 if (divRight.val() === '-1') {
                     divRight.val(0);
                 }
                 if (divRight[0] === target) {
                     this.layersToShow[0] = layers[divRight.val()];
                     this.layersToShow[1] = layers[divLeft.val()];
                 } else {
                     this.layersToShow[1] = layers[divLeft.val()];
                     this.layersToShow[0] = layers[divRight.val()];
                 }
                 this.refresh();

                 console.log(divRight[0] === $(this)[0]);
                 console.log("event value " + value);
             };
             //divLeft.change(this.onChange);
             //divRight.change(this.onChange);


         }
         var switchToBasemap = function(name) {
             basemap = name;
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
         // do some searching
         $(document).ready(function() {
             $("#basemapList li").click(function(e) {
                 map.removeAllLayers();
                 switchToBasemap(e.target.text);
                 switchBoard.refresh();
                 //map.addLayers([operationalLayers[2].layerObject, operationalLayers[0].layerObject]);
                 //setSwipeLayer(operationalLayers[0].layerObject);
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
