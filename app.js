map = L.map('map', {
    scrollWheelZoom: true
}).setView([53.68583, 23.83812], 13);

var layerGroupGeolocation = new L.layerGroup();
var busStopArray = [];
var clusters = L.markerClusterGroup();
var bus_stop_with_rel = [];

L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright" title="OpenStreetMap" target="_blank">OpenStreetMap</a> contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" title="MapQuest" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" width="16" height="16">',
    subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
}).addTo(map);

function getMyLocation() {

    map.locate({setView: true, maxZoom: 16});

    function onLocationFound(e) {

        var radius = e.accuracy / 2;
        var marker = L.marker(e.latlng)
            .bindPopup("You are within " + radius + " meters from this point");

        var circle = L.circle(e.latlng, radius);

        clearGeolocationPosition();
        layerGroupGeolocation.addLayer(marker).addTo(map);
        layerGroupGeolocation.addLayer(circle).addTo(map);

        geolocationFlag = true;
    }

    //found lcation
    map.on('locationfound', onLocationFound);

    //don't find location
    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationerror', onLocationError);

}

function clearGeolocationPosition() {
    layerGroupGeolocation.clearLayers();
}

function getAllBusStop() {

    if (clusters.length != 0) {
        clearAllBusStop()
    };

    $.getJSON('geo.json', function (json) {
        busStopArray = json;
        var myCluster = L.geoJson(busStopArray, {
            pointToLayer: function (feature, latlng) {
                var popup = feature.properties['name'];
                var rel = [];
                var transportArray = [];
                if (feature.properties['@relations']) {
                    rel = feature.properties['@relations'];

                    for (var i = 0; i < rel.length; i++) {
                        transportArray.push({
                                "number": rel[i].reltags.ref,
                                "name": rel[i].reltags.name
                            }
                        )
                    }
                }
                var text = popup;

                bus_stop_with_rel.push({
                    'name': popup,
                    'rel': transportArray
                });

                function onClick(e) {
                    var popupText = this.getPopup().getContent();
                    var routes = getRel(popupText);
                    var bus_stop_dom_element = document.getElementById('bus_stop');

                    if (bus_stop_dom_element) {

                        //remove child form div element
                        while (bus_stop_dom_element.firstChild) {
                            bus_stop_dom_element.removeChild(bus_stop_dom_element.firstChild);
                        }
                        routes = sortRoutes(routes, popupText);

                        //add new childs
                        for (var i = 0; i < routes.length; i++) {

                            var newEl = document.createElement('div');
                            newEl.innerHTML = '<div><b>Номер маршрута: </b> ' + routes[i].number +
                                '   <b>Название:</b> ' + routes[i].name + '</div>';

                            bus_stop_dom_element.appendChild(newEl);
                        }
                    }
                }

                var marker = L.marker(latlng);
                marker.on('click', onClick);
                marker.bindPopup(text);

                transportArray = [];

                return marker;
            }
        });
        clusters.addLayer(myCluster);
        map.addLayer(clusters);
    });


}

function sortRoutes(r, busStopName) {

    for (var i = 0; i < r.length - 1; i++) {
        for (var j = i + 1; j < r.length; j++) {
            if (r[i].number == r[j].number) {
                if (r[i].name.indexOf(busStopName) > r[j].name.indexOf(busStopName)) {
                    r.splice(i, 1);
                } else {
                    r.splice(j, 1);
                }
            }
        }
    }
    r.sort(compareTwoRoutes);
    return r;
}

function compareTwoRoutes(r1, r2) {
    if (r1.name > r2.name) return 1;
    if (r1.name < r2.name) return -1;
}

function getRel(name) {
    var result = '';
    for (var i = 0; i < bus_stop_with_rel.length; i++) {
        if (name === bus_stop_with_rel[i].name)
            return bus_stop_with_rel[i].rel;
    }
    return result
}

function clearAllBusStop() {
    clusters.clearLayers();
}
