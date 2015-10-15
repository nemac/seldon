/**
 * search.js includes contributions by William Clark (wclark1@unca.edu)
 *
 * This function takes a user specified location, transforms it to the appropriate extent
 * coordinates and zooms the map to that location.
 */
module.exports = function ($) {
    function handle_search (location, app) {
        var rest_endpoint = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=" + location + "&f=json";

        $.getJSON(rest_endpoint, function (data) {
            var locations = data["locations"][0];
            if (locations === undefined) {
                return;
            }

            var extent = locations["extent"];
            var bounds = new OpenLayers.Bounds(extent.xmin, extent.ymin, extent.xmax, extent.ymax).transform(
                new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")
            );
            app.zoomToExtent(bounds, true);
        });
    }

    return handle_search;
}
