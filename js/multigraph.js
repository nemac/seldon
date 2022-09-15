module.exports = function ($, app) {
    var ClickTool = require('./clicktool.js');

    app.graphCount = 0;

    function createMultigraphTool ($configXML) {
        var muglPrefix = $configXML.find("tools tool[name=Phenograph]").attr("muglPrefix");
        if (muglPrefix === undefined || muglPrefix === "") {
            //console.log("WARNING: no muglPrefix for Phenograph tool found; Phenographs will not work");
        }
        return new ClickTool(
            function (e) {
                // This function gets called when the user clicks a point in the map while the
                // Multigraph tool is active.  The argument `e` is the click event; the coordinates
                // of the clicked point are (e.x, e.y).
                app.graphCount++;
                var offset = 10 * (app.graphCount-1);

                // This coords object is not really in lon/lat; it's in the display projection of the map,
                // which is EPSG:900913.
                var coords = app.map.getLonLatFromPixel(e.xy);

                // Here we convert it to actual lon/lat:
                var lonlat = app.map.getLonLatFromPixel(e.xy);
                lonlat.transform(app.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

                var styleMap = new OpenLayers.StyleMap({
                    pointRadius: 4,
                    fillColor: "yellow",
                    fillOpacity: 0.75
                });

                var markerLayer = new OpenLayers.Layer.Vector(
                    "markerLayer",
                    {styleMap: styleMap}
                );

                var feature = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(coords.lon, coords.lat),
                    {some:'data'}
                );

                markerLayer.addFeatures(feature);
                app.map.addLayer(markerLayer);

                var popup = $(document.createElement('div'));
                popup.id = "#seldonMultigraphMessageDiv"+app.graphCount+"";

                if (!window.multigraph.core.browserHasCanvasSupport() && !window.multigraph.core.browserHasSVGSupport()) {
                    popup.html('<div id="seldonMultigraph'+app.graphCount+'" style="overflow-y: hidden; width: 600px; height: 330px;" ></div>');
                } else {
                    popup.html('<div class="multigraphLoader"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></div><div id="seldonMultigraph'+app.graphCount+'" style="overflow-y: hidden; width: 600px; height: 330px;" ></div>');
                }
                popup.dialog({
                    width     : 600,
                    resizable : false,
                    position  : { my: "center+" + offset + " center+" + offset, at: "center", of: window },
                    title     : Mustache.render('Sentinel-3 NDVI for Lat: {{{lat}}} Lon: {{{lon}}}',
                                                {
                                                    lat : sprintf("%.4f", lonlat.lat),
                                                    lon : sprintf("%.4f", lonlat.lon)
                                                }
                    ),
                    close : function( event, ui ) {
                        // app.graphCount--;
                        app.map.removeLayer(markerLayer);
                        $(this).remove();
                    },
                });

                var seldonMultigraph = $('#seldonMultigraph'+app.graphCount+''),
                    promise = seldonMultigraph.multigraph({
                        //NOTE: coords.lon and coords.lat on the next line are really x,y coords in EPSG:900913, not lon/lat:
                        'mugl'   : muglPrefix + lonlat.lon + "," + lonlat.lat,
                        'swf'    : "libs/seldon/libs/Multigraph.swf"
                    });
                seldonMultigraph.multigraph('done', function (m) {
                    if (m) {
                        $(m.div()).parent().children(".multigraphLoader").remove();
                    }
                });
            });
    }

    return createMultigraphTool;
}
