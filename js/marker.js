/**
 * Adds functionality that allows users to mark points on a map,
 * then download a csv of the points and some metadata about them.
 */
module.exports = function ($, app) {
    var ClickTool = require('./clicktool.js');
    var saveAs = require('../libs/FileSaver/FileSaver.js').saveAs;

    var popupId = "marker-dialog";

    var points = [];

    var pointStyleDefault = {
        pointRadius: 4,
        fillColor: "blue",
        fillOpacity: 0.75
    };

    var pointStyleHover = {
        pointRadius: 5,
        fillColor: "orange",
        fillOpacity: 0.75
    };

    var pointStyle = new OpenLayers.StyleMap(pointStyleDefault);

    /**
     * Function that is exported. Creates handler for point marker functionality
     */
    function marker () {
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
            new OpenLayers.Geometry.Point(coords.lon, coords.lat)
        );

        markerLayer.addFeatures(feature);
        app.map.addLayer(markerLayer);

        if (!$("#" + popupId).length) {
            createPopup();
        }

        if ($(".marker-points").length) {
            createPointItem(lonlat, markerLayer);
        }

        points.push({
            "lonlat" : lonlat,
            "layer" : markerLayer
        });

        if (typeof ga !== 'undefined') {
         ga('send', {
            'hitType': 'event',          // Required.
            'eventCategory': 'User Generated Points',   // Required.
            'eventAction': 'Create New Point',      // Required.
            'eventLabel': lonlat.lon + ', ' + lonlat.lat
          });
        }
    }

    /**
     * Creates and appends the html for documenting the points that have been marked
     */
    function createPointItem (coords, layer) {
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
        itemString += '    <div><textarea class="marker-point-notes"></textarea></div>';
        itemString += '  </div>';
        itemString += '</div>';
        var item = $(itemString);
        item.data("point", layer)
        item.on("mouseenter", handlePointHoverEnter)
            .on("mouseleave", handlePointHoverLeave);
        $(".marker-points").append(item);

    }

    /**
     * Makes point distinct when you hover over the text area for it
     */
    function handlePointHoverEnter (e) {
        var point = $(this).data("point");
        point.style = pointStyleHover;
        point.redraw();
    }

    /**
     * Returns point to default style when you loeave the text area for it
     */
    function handlePointHoverLeave (e) {
        var point = $(this).data("point");
        point.style = pointStyleDefault;
        point.redraw();
    }

    /**
     * Creates the popup for managing points, and binds the relevant events
     */
    function createPopup () {
        var popup = $('<div id="' + popupId + '"><div class="marker-points"></div><div class="marker-button-wrapper"><button class="marker-button-download">Download Points</button><button class="marker-button-clear">Clear Points</button></div></div>');

        $("body").append(popup);

        $(".marker-button-download").click(exportFileHandler);
        $(".marker-button-clear").click(clearPointsHandler);

        popup.dialog({
            width     : 300,
            height    : 400,
            resizable : false,
            position  : { my: "right top", at: "right-5 top+120" },
            title     : "Mark areas of interest",
            close : function (event, ui) {
                clearPointsHandler();
                $(this).remove();
            }
        });
    }

    /**
     * Creates the csv file that users can save
     */
    function exportFileHandler () {
        var lat, lon, url, notes;
        var SEP = "|";
        var i;

        var csvContent = 'sep=' + SEP + '\n';
        csvContent += 'lat' + SEP + 'long' + SEP + 'google maps link' + SEP + 'notes\n';
        for (i = 0; i < points.length; i++) {
            lat = points[i].lonlat.lat;
            lon = points[i].lonlat.lon;
            url = makeMapUrl(lat, lon);
            notes = getNotes(i);
            csvContent += lat + SEP + lon + SEP + url + SEP + notes + '\n';
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

        if (typeof ga !== 'undefined') { 
         ga('send', {
            'hitType': 'event',          // Required.
            'eventCategory': 'User Generated Points',   // Required.
            'eventAction': 'Click',      // Required.
            'eventLabel': 'Download Points'
          });
        }

        saveAs(csv, filename);
    }

    /**
     * Creates the google maps url that lets the user get directions to their selections
     */
    function makeMapUrl (lat, lon) {
        var ZOOM = "12z";
        var degMinSec = getDegMinSec(lat, "lat") + "+" + getDegMinSec(lon, "lon");
        return 'https://www.google.com/maps/place/' + degMinSec + '/@' + lat + ',' + lon + ',' + ZOOM;
    }

    /**
     * Converts decimal lon/lat to deg/min/sec
     */
    function getDegMinSec (value, type) {
        var direction;
        if (type === "lat" && value >= 0) {
            direction = "N";
        } else if (type === "lat" && value < 0) {
            direction = "S";
        } else if (type === "lon" && value >= 0) {
            direction = "E";
        } else if (type === "lon" && value < 0) {
            direction = "W";
        }

        value = Math.abs(value);

        var degree = Math.floor(value);
        value = (value - degree) * 60;
        var minute = Math.floor(value);
        var second = (value - minute) * 60;
        return degree + "%C2%B0" + minute + "'" + second + "%22" + direction;
    }


    /**
     * Gets the value of the notes field for a point
     */
    function getNotes (index) {
      if (typeof ga !== 'undefined') {
        var label = $(".marker-point-item").eq(index).find(".marker-point-notes").val();
        ga('send', {
          'hitType': 'event',          // Required.
          'eventCategory': 'User Generated Points',   // Required.
          'eventAction': 'Notes',      // Required.
          'eventLabel': label
        });
      }

      return $(".marker-point-item").eq(index).find(".marker-point-notes").val();    
    }

    /**
     * Removes the points from the map and removes the metadata for each point
     */
    function clearPointsHandler () {
        var i;

        for (i = 0; i < points.length; i++) {
            removeLayer(points[i].layer);
        }

        $(".marker-point-item").off("mouseenter", handlePointHoverEnter)
            .off("mouseleave", handlePointHoverLeave);

        if (typeof ga !== 'undefined') {
         ga('send', {
            'hitType': 'event',          // Required.
            'eventCategory': 'User Generated Points',   // Required.
            'eventAction': 'Click',      // Required.
            'eventLabel': 'Clear Points'
          });
        }

        points = [];
        $(".marker-points").empty();
    }

    /**
     * Helper function that removes a layer from the map
     */
    function removeLayer (layer) {
        app.map.removeLayer(layer);
    }

    return marker;
}
