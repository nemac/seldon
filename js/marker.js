module.exports = function ($, app) {
    var ClickTool = require('./clicktool.js');
    var saveAs = require('../libs/FileSaver/FileSaver.js').saveAs;
    console.log(saveAs)

    var popupId = "marker-dialog";

    var points = [];

    var pointStyle = new OpenLayers.StyleMap({
        pointRadius: 4,
        fillColor: "blue",
        fillOpacity: 0.75
    });

    function marker () {
//        createPopup();
        return new ClickTool(markerHandler);
    }

    function markerHandler (e) {
        var coords = app.map.getLonLatFromPixel(e.xy);
        var lonlat = app.map.getLonLatFromPixel(e.xy);
        lonlat.transform(app.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

        var markerLayer = new OpenLayers.Layer.Vector(
            "markerLayer",
            {styleMap: pointStyle}
        );

        var feature = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(coords.lon, coords.lat),
            {some:'data'}
        );

        markerLayer.addFeatures(feature);
        app.map.addLayer(markerLayer);

        if (!$("#" + popupId).length) {
            createPopup();
        }

        if ($(".marker-points").length) {
            createPointItem(lonlat);
        }

        points.push({
            "lonlat" : lonlat,
            "layer" : markerLayer
        });
    }

    function createPointItem (coords) {
        var itemString = '';
        itemString += '<div class="marker-point-item">';
        itemString += '  <div class="marker-point-label">';
        itemString += '    <span class="marker-point-coords-label">Lat:</span>';
        itemString += '    <span class="marker-point-coords-coords">' + coords.lat + '</span>';
        itemString += '  </div>';
        itemString += '  <div class="marker-point-label">';
        itemString += '    <span class="marker-point-coords-label">Lon:</span>';
        itemString += '    <span class="marker-point-coords-coords">' + coords.lon + '</span>';
        itemString += '  </div>';
        itemString += '  <div class="marker-point-label">';
        itemString += '    <span class="marker-point-coords-label">Notes:</span>';
        itemString += '    <div><textarea></textarea></div>';
        itemString += '  </div>';
        itemString += '</div>';
        var item = $(itemString);
        $(".marker-points").append(item);
    }

    function createPopup () {
        var popup = $('<div id="' + popupId + '"><div class="marker-points"></div><div class="marker-button-wrapper"><button class="marker-button-download">Download Points</button><button class="marker-button-clear">Clear Points</button></div></div>');

        $("body").append(popup);

        $(".marker-button-download").click(exportFileHandler);
        $(".marker-button-clear").click(clearPointsHandler);

        popup.dialog({
            width     : 300,
            height    : 400,
            resizable : false,
            position  : "right",
            title     : "Mark areas of interest",
            close : function (event, ui) {
                var i;
                for (i = 0; i < points.length; i++) {
//                    app.map.removeLayer(points[i].layer);
                }
                $(this).remove();
            }
        });
    }

    function exportFileHandler () {
        var lat, lon, url;
        var ZOOM = "10z";
        var SEP = "|";
        var i;

        var csvContent = 'sep=' + SEP + '\n';
        csvContent += 'lat' + SEP + 'long' + SEP + 'google maps link\n';
        for (i = 0; i < points.length; i++) {
            lat = points[i].lonlat.lat;
            lon = points[i].lonlat.lon;
            url = 'https://www.google.com/maps/@' + lat + ',' + lon + ',' + ZOOM;
            csvContent += lat + SEP + lon + SEP + url + '\n';
        }

        var date = new Date();
        var year = date.getFullYear().toString();
        var month = (date.getMonth() + 1).toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        var day = date.getDate().toString();
        if (day.length === 1) {
            day = "0" + day;
        }

        var filename = 'poi_' + year + month + day + '.csv';

        var csv = new Blob([csvContent], {
            type: "text/csv;"
        });

        saveAs(csv, filename);
    }

    function clearPointsHandler (e) {
        var i;

        for (i = 0; i < points.length; i++) {
            removeLayer(points[i].layer);
        }

        points = [];
        $(".marker-points").empty();
    }

    function removeLayer (layer) {
        app.map.removeLayer(layer);
    }

    return marker;
}
