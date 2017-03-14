module.exports = function ($, app) {
    var ClickTool = require('./clicktool.js'),
        stringContainsChar = require('./stringContainsChar.js');

    var getLegendStringFromPixelValue = require('./legend_config.js')($, app)

    function createIdentifyTool () {
        return new ClickTool(
            function (e) {
                // This function gets called when the user clicks a point in the map while the
                // identify tool is active.  The argument `e` is the click event; the coordinates
                // of the clicked point are (e.x, e.y).

                // First remove any existing popup window left over from a previous identify
                $('#identify_popup').remove();

                if (app.id_markerLayer) {
                    app.map.removeLayer(app.id_markerLayer);
                }

                // This coords object is not really in lon/lat; it's in the display projection of the map,
                // which is EPSG:900913.
                var coords = app.map.getLonLatFromPixel(e.xy);

                //add marker
                var styleMap = new OpenLayers.StyleMap({
                    pointRadius: 4,
                    fillColor: "yellow",
                    fillOpacity: 0.75
                });

                var feature = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(coords.lon, coords.lat)
                );

                app.id_markerLayer = new OpenLayers.Layer.Vector(
                    "markerLayer",
                    {styleMap: styleMap}
                );

                app.id_markerLayer.addFeatures(feature);
                app.map.addLayer(app.id_markerLayer);

                // Then loop over all the current (non-base) layers in the map to construct the
                // GetFeatureInfo requests. There will be one request for each unique WMS layer
                // service URL and SRS combination. (Typically, and in all cases I know of that
                // we are using at the momenet, all layers from the same WMS service use the
                // same SRS, so this amounts to one request per WMS service, but coding it to
                // depend on the SRS as well makes it more flexible for the future, in case ever
                // have multiple layers from the same WMS using different SRSes).  This loop
                // populates the `services` object with one entry per url/srs combination; each
                // entry records a url, srs, and list of layers, corresponding to one
                // GetFeatureInfo request that will need to be made.  We also builds up the html
                // that will display the results in the popup window here.
                var services = [],
                    service, urlsrs;
                var layersAdded = [];
                var html = '<table id="identify_results">';

                $.each(app.map.layers, function () {
                    var name, label;
                    if (!this.isBaseLayer && this.params && (!("seldonLayer" in this) || (String(this.seldonLayer.identify) !== "false"))) {
                        name  = this.params.LAYERS;

                        // Added by mbp Mon Aug 24 15:54:58 2015 to adjust for ArcGIS server WMS differences:
                        if (String(name).match(/^\d+$/)) {
                            label = this.name;
                        } else {
                            label = (String(name).indexOf("MaskFor") !== -1) ? name.substring(0, name.indexOf("MaskFor")) : name;
                        }

                        if (layersAdded.indexOf(label) !== -1) return;

                        layersAdded.push(label);
                        services.push({
                            url   : this.url,
                            srs   : this.projection.projCode,
                            name  : name,
                            label : label
                        });

                        html = html + Mustache.render(
                            (''
                             + '<tr id="{{label}}-label">'
                             +   '<td class="layer-label"><b>{{label}}:</b></td>'
                             +   '<td class="layer-results"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></td>'
                             + '</tr>'
                            ),
                            {
                                label : label
                            }
                        );
                    }
                });
                html = html + "</table>";

                // If there are no services to query, stop now, before the popup is shown
                if (services.length === 0) { return; }

                var popup = $(document.createElement('div'));
                popup.attr("id", "identify_popup");
                popup.html(html);
                popup.dialog({
                    width     : 600,
                    height    : 300,
                    resizable : true,
                    title     : "Identify Results",
                    close : function (event, ui) {
                        app.map.removeLayer(app.id_markerLayer);
                        app.id_markerLayer = undefined;
                        $(this).remove();
                    },
                });

                // Now loop over each item in the `services` array, generating the GetFeatureInfo request for it
                var i, l;
                for (i = 0, l = services.length; i < l; i++) {
                    handleIdentifyRequest(services[i], e);
                }
            }
        );
    }

    function handleIdentifyRequest (service, e) {
        //NOTE: the correct coords to use in the request are (e.xy.y,e.xy.y), which are NOT the same as (e.x,e.y).
        //      I'm not sure what the difference is, but (e.xy.y,e.xy.y) seems to be what GetFeatureInfo needs.
        var requestUrl = createWMSGetFeatureInfoRequestURL(service.url, service.name, service.srs, e.xy.x, e.xy.y);

        if (seldon.useProxyScript === "True") {
            requestUrl = $(location).attr('href') + "proxy?url=" + encodeURIComponent(requestUrl);
        }
        $.ajax({
            url: requestUrl,
            dataType: "text",
            success: function (response) {
                var $gml = $($.parseXML(response));
                var $group = $("#" + service.label + "-label");
                var newTableContents = '';
                var i;
                var layerIDCount = 0;

                $group.find("img").remove();

                // jdm: Check to see if we are using ArcGIS
                // if so handle the xml that comes back differently
                // on a related note ArcGIS WMS Raster layers do not support
                // GetFeatureInfo
                var result = (seldon.gisServerType === "ArcGIS") ?
                    getLayerResultsFromArcXML($gml, service.name, layerIDCount) :
                    getLayerResultsFromGML($gml, service.name);

                // loop through the result and build up new table structure
                for (i = 1; i < result.length; ++i) {
                    var valueLabel = String(result[i][0])
                    var value = result[i][1]
                    var valueDescription = getLegendStringFromPixelValue(service.name, value)
                    var tableRow = valueDescription === '' ? value
                        : value + ' (' + valueDescription + ')' 
                    if (valueDescription !== '') valueDescription += ': '
                    newTableContents += (''
                        + '<tr class="identify-result">'
                        +   '<td class="label">'+valueLabel.replace("_0","")+':&nbsp&nbsp</td>'
                        +   '<td>' + tableRow + '</td>'
                        + '</tr>'
                       );
                }

                $(newTableContents).insertAfter($group);

                if (!newTableContents) $group.find(".layer-results").text("N/A");
            },
            error: function(jqXHR, textStatus, errorThrown) {
                //alert(textStatus);
            }
        });
    }

    // Return a string representing a GetFeatureInfo request URL for the current map,
    // based on the passed parameters:
    //
    //   serviceUrl: the URL of the WMS service
    //   layer: layer to query
    //   srs: the SRS of the layer
    //   (x,y): (pixel) coordinates of query point
    //
    function createWMSGetFeatureInfoRequestURL (serviceUrl, layer, srs, x, y) {
        var extent = app.map.getExtent();
        if (seldon.gisServerType === "ArcGIS") {
            extent = extent.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection(seldon.projection));
        }
        return Mustache.render(
            (''
             + serviceUrl
             + '{{{c}}}LAYERS={{layer}}'
             + '&QUERY_LAYERS={{layer}}'
             + '&STYLES=,'
             + '&SERVICE=WMS'
             + '&VERSION=1.1.1'
             + '&REQUEST=GetFeatureInfo'
             + '&BBOX={{left}},{{bottom}},{{right}},{{top}}'
             + '&FEATURE_COUNT=100'
             + '&HEIGHT={{height}}'
             + '&WIDTH={{width}}'
             + '&FORMAT=image/png'
             + '&INFO_FORMAT=application/vnd.ogc.gml'
             + '&SRS={{srs}}'
             + '&X={{x}}'
             + '&Y={{y}}'
            ),
            {
                c      : stringContainsChar(serviceUrl, '?') ? '&' : '?',
                layer  : layer,
                height : app.map.size.h,
                width  : app.map.size.w,
                left   : extent.left,
                bottom : extent.bottom,
                right  : extent.right,
                top    : extent.top,
                srs    : srs,
                x      : x,
                y      : y
            }
        );
    }

    function getLayerResultsFromArcXML ($xml, layerName, layerIDCount) {
        var dataVals = [];
        try {
            var fields     = $xml.find( "FIELDS" ),
                attributes = fields[layerIDCount].attributes,
                i;
            for (i = 0; i < attributes.length; ++i) {
                dataVals[i] = [attributes[i].name, attributes[i].value];
            }
        } catch(err){
            dataVals[0] = ["Error description:", err.message];
        }
        return dataVals;
    }

    function getLayerResultsFromGML ($gml, layerName) {
        var children = $gml.find(layerName + '_feature').first().children(),
            returnVals = [],
            i;

        // Scan the children of the first <layerName_feature> element, looking for the first
        // child which is an element whose name is something other than `gml:boundedBy`; take
        // the text content of that child as the result for this layer.
        for (i = 0; i < children.length; ++i) {
            if (children[i].nodeName !== 'gml:boundedBy') {
                // jdm: IE doesn't have textContent on children[i], but Chrome and FireFox do
                var value = (children[i].textContent) ? children[i].textContent : children[i].text;
                if ((stringStartsWith(layerName, "EFETAC-NASA") || stringStartsWith(layerName, "RSAC-FHTET")) &&
                    (children[i].nodeName === "value_0")) {
                    value = value + sprintf(" (%.2f %%)", parseFloat(value,10) * 200.0 / 255.0 - 100);
                }
				if ((stringStartsWith(layerName.toUpperCase(), "NDMI-ARCHIVE") || stringStartsWith(layerName.toUpperCase(), "NDVI-ARCHIVE") || stringStartsWith(layerName.toUpperCase(), "SWIR-ARCHIVE") || stringStartsWith(layerName.toUpperCase(), "SOUTHEAST-NDVI-CURRENT") || stringStartsWith(layerName.toUpperCase(), "SOUTHEAST-NDMI-CURRENT") || stringStartsWith(layerName.toUpperCase(), "SOUTHEAST-SWIR-CURRENT")) &&
                    (children[i].nodeName === "value_0")) {
                    value = sprintf("%.0f %%", parseFloat(value,10) - 128);
                }
                returnVals[i] = [children[i].nodeName, value];
            }
        }
        return returnVals;
        //return undefined;
    }

    function stringStartsWith (string, prefix) {
        return (string.substring(0, prefix.length) === prefix);
    }

    return createIdentifyTool;
}
