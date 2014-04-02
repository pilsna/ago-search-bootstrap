var addresses = new Bloodhound({
    name: 'ago-geocode',
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
        url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=%QUERY&maxLocations=2&f=pjson',
        filter: function(response) {
            return $.map(response.suggestions, function(location) {
                return {
                    name: location.text,
                    location: location.magicKey
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
    name: 'name',
    displayKey: 'name',
    source: addresses.ttAdapter()
});
