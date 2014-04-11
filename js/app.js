 require([
         "esri/config",
         "esri/arcgis/utils",
         "esri/map",
         "esri/dijit/Scalebar",
         "esri/geometry/Extent",
         "esri/layers/WebTiledLayer",
         "esri/dijit/LayerSwipe",
         "dojo/dom",
         "dojo/on",
         "./js/bootstrapmap.js",
         "./js/OAuthHelper.js",
         "./config/defaults.js",
         "dojo/domReady!",
         "esri/IdentityManager"
     ],
     function(esriConfig, arcgisUtils, Map, Scalebar, Extent, WebTiledLayer, LayerSwipe, dom, on, BootstrapMap, OAuthHelper, config) {
         var map = null;
         var operationalLayers = null;
         var bookmarks = null;
         var swipeWidget = null;
         var currentSelection = null;
         var layerListLeft = $('#layerListLeft');
         var layerListRight = $('#layerListRight');
         var switchBoard = null;
         var basemap = "MapBox Space";
         var webmap = "8b3ce9af79724f30a9f924c7bca1d339";

         var deferred = arcgisUtils.createMap(webmap, "mapDiv").then(function(response) {

             map = response.map;
             operationalLayers = response.itemInfo.itemData.operationalLayers;
             bookmarks = response.itemInfo.itemData.bookmarks;

             $("#title").text(response.itemInfo.item.title);
             $("#subtitle").text(response.itemInfo.item.snippet);

             var selectList = [];

             for (var i = operationalLayers.length - 1; i >= 0; --i) {
                 selectList.push('<option value="' + i + '">' + operationalLayers[i].title + '</option>');
             }
             $('select.layers').append(selectList.join(''));

             var bookmarkList = [];
             $.each(bookmarks, function(i, item) {
                 bookmarkList.push('<li><a id="' + i + '" href="#">' + item.name + '</a></li>');
             });
             $('#bookmarks').append(bookmarkList.join(''));
             $('#bookmarks').click(function(event) {
                 console.log(event.target.id);
                 console.log(bookmarks[event.target.id]);
                 setExtent(bookmarks[event.target.id].extent);
             });

             switchBoard = new SwitchBoard(layerListLeft, layerListRight, operationalLayers, setSwipeLayer);

             var onChange = function(event) {
                 switchBoard.update(event.currentTarget);
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
             //switchToBasemap(basemap);
             switchBoard.update();

         });
         var removeLayers = function(list) {
             $.each(list, function(i, layerInfo) {
                 map.removeLayer(layerInfo.layerObject);
             });
         }
         var setSwipeLayer = function(layers) {
             swipeWidget.disable();
             removeLayers(operationalLayers);
             map.addLayers([layers[0].layerObject, layers[1].layerObject]);
             swipeWidget.layers = [layers[1].layerObject];
             swipeWidget.enable();
             swipeWidget.swipe();
         }
         var setupOAuth = function(id, portal) {
             OAuthHelper.init({
                 appId: id,
                 portal: portal,
                 expiration: (14 * 24 * 60) //2 weeks (in minutes)
             });
         };
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
             this.update = function(target) {
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
             };

         }
         // do some searching
         $(document).ready(function() {
             if (urlObject.query !== null && urlObject.query.webmap !== null) {
                 webmap = urlObject.query.webmap;
             }
             if (config.oauthappid) {
                 setupOAuth(config.oauthappid, config.sharinghost);
             }
             $("#basemapList li").click(function(e) {
                 map.removeAllLayers();
                 switchToBasemap(e.target.text);
                 switchBoard.refresh();
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
                     setExtent(result.locations[0].extent);
                 });
             });
         });
         var setExtent = function(object) {
             var extent = new Extent(object);
             map.setExtent(extent, true);
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
     });
