module.exports = function ($, app) {
    var ClickTool = require('./clicktool.js'),
        stringContainsChar = require('./stringContainsChar.js');

    function createIdentifyTool () {
        return new ClickTool(
            function (e) {
                // This function gets called when the user clicks a point in the map while the
                // identify tool is active.  The argument `e` is the click event; the coordinates
                // of the clicked point are (e.x, e.y).

                var services = {},
                    service, urlsrs;

                // First remove any existing popup window left over from a previous identify
                $('#identify_popup').remove();

                // This coords object is not really in lon/lat; it's in the display projection of the map,
                // which is EPSG:900913.
                var coords = app.map.getLonLatFromPixel(e.xy);
                //add marker
                var styleMap = new OpenLayers.StyleMap({pointRadius: 4,
                                                        fillColor: "yellow",
                                                        fillOpacity: 0.75,});

                if (app.id_markerLayer) {
                    app.map.removeLayer(app.id_markerLayer);
                    app.id_markerLayer = undefined;
                }
                app.id_markerLayer = new OpenLayers.Layer.Vector("markerLayer",
                                                                 {styleMap: styleMap});
                var feature = new OpenLayers.Feature.Vector(
                                                            new OpenLayers.Geometry.Point(coords.lon, coords.lat),
                                                            {some:'data'});
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
                var html = '<table id="identify_results" height="100">';
                $.each(app.map.layers, function () {
                    var srs, url, name, urlsrs;
                    if ((!this.isBaseLayer) && (this.params)) {
                        srs    = this.projection.projCode;
                        url    = this.url;
                        name   = this.params.LAYERS;
                        urlsrs = url + ',' + srs;
                        if (services[urlsrs] === undefined) {
                            services[urlsrs] = { url : url, srs : srs, layers : [] };
                        }
                        services[urlsrs].layers.push(name);
                        html = html + Mustache.render(
                            (''
                             + '<tr id="identify_results_for_{{name}}">'
                             +   '<td class="layer-label">{{label}}:</td>'
                             +   '<td class="layer-results"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></td>'
                             + '</tr>'
                            ),
                            {
                                name  : name,
                                label : this.seldonLayer.name
                            }
                        );
                    }
                });
                html = html + "</table>";

                var popup = $(document.createElement('div'));
                popup.attr("id", "identify_popup");
                popup.id = "#identify_popup";
                popup.html(html);
                popup.dialog({
                    width     : 600,
                    height     : 300,
                    resizable : true,
                    title     : "Identify Results",
                    close : function( event, ui ) {
                        // app.map.removeLayer(markerLayer);
                        app.map.removeLayer(app.id_markerLayer);
                        app.id_markerLayer = undefined;
                        $(this).remove();
                    },
                });

                // Now loop over each item in the `services` object, generating the GetFeatureInfo request for it
                for (urlsrs in services) {
                    var firstResultsYet = 0;
                    (function () {
                        var service = services[urlsrs],
                            //NOTE: the correct coords to use in the request are (e.xy.y,e.xy.y), which are NOT the same as (e.x,e.y).
                            //      I'm not sure what the difference is, but (e.xy.y,e.xy.y) seems to be what GetFeatureInfo needs.
                            requestUrl = createWMSGetFeatureInfoRequestURL(service.url, service.layers, service.srs, e.xy.x, e.xy.y);
                        if (seldon.useProxyScript === "True") {
                            requestUrl = $(location).attr('href')+"/cgi-bin/proxy.cgi?url="+encodeURIComponent(requestUrl);
                        }
                        $.ajax({
                            url: requestUrl,
                            dataType: "text",
                            success: function (response) {
                                var $gml = $($.parseXML(response)),
                                    $identify_results = $("#identify_results");
                                // For each layer that this request was for, parse the GML for the results
                                // for that layer, and populate the corresponding result in the pop-up
                                // created above.
                                if (firstResultsYet < 1) {
                                    $identify_results.empty(); //first clear out original
                                    firstResultsYet = firstResultsYet + 1;
                                }
                                var layerIDCount     = 0,
                                    newTableContents = '',
                                    lastURL          = '';
                                var previousMaskLayer;
                                $.each(service.layers, function () {
                                    // jdm: Check to see if we are using ArcGIS
                                    // if so handle the xml that comes back differently
                                    // on a related note ArcGIS WMS Raster layers do not support
                                    // GetFeatureInfo
                                    if (seldon.gisServerType == "ArcGIS") {
                                        var result = getLayerResultsFromArcXML($gml, this, layerIDCount);
                                    } else { //assuming MapServer at this point
                                        var result = getLayerResultsFromGML($gml, this);
                                    }
                                    //check for previous mask
                                    if (previousMaskLayer != service.layers[layerIDCount].substring(0,service.layers[layerIDCount].indexOf("MaskFor"))) {
                                        var layerTitle = service.layers[layerIDCount];
                                        if (layerTitle.indexOf("MaskFor") > -1) {
                                            layerTitle = layerTitle.substring(0, layerTitle.indexOf('MaskFor'));
                                        }
                                        //jdm: with this list back from getLayerResultsFromGML
                                        //loop through and build up new table structure
                                        newTableContents = (''
                                                            + '<tr>'
                                                            +   '<td><b>'+layerTitle+'</b></td>'
                                                            +   '<td>&nbsp</td>'
                                                            + '</tr>'
                                                            );
                                        $identify_results.append(newTableContents);
                                        var i;
                                        for (i = 1; i < result.length; ++i) {
                                            newTableContents = (''
                                                                + '<tr>'
                                                                +   '<td class="label">'+String(result[i][0]).replace("_0","")+':&nbsp&nbsp</td>'
                                                                +   '<td>'+result[i][1]+'</td>'
                                                                + '</tr>'
                                                                );
                                            $identify_results.append(newTableContents);
                                        }
                                    }
                                    //populate for previous mask
                                    if (service.layers[layerIDCount].indexOf("MaskFor") > -1) {
                                        previousMaskLayer = service.layers[layerIDCount].substring(0,service.layers[layerIDCount].indexOf("MaskFor"));
                                    }
                                    layerIDCount++;
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                alert(textStatus);
                            }
                        });
                    }());
                }
                //jdm: last thing make the popup bigger
                //this doesn't work for some reason
                //app.map.popups[0].updateSize(new OpenLayers.Size(500, 500));
            }
        );
    }

    // Return a string representing a GetFeatureInfo request URL for the current map,
    // based on the passed parameters:
    //
    //   serviceUrl: the URL of the WMS service
    //   layers: list of layers to query
    //   srs: the SRS of the layers
    //   (x,y): (pixel) coordinates of query point
    //
    function createWMSGetFeatureInfoRequestURL (serviceUrl, layers, srs, x, y) {
        var extent = app.map.getExtent();
        if (seldon.gisServerType === "ArcGIS") {
            extent = extent.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection(seldon.projection));
        }
        return Mustache.render(
            (''
             + serviceUrl
             + '{{{c}}}LAYERS={{layers}}'
             + '&QUERY_LAYERS={{layers}}'
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
                layers : layers.join(','),
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
                if ((stringStartsWith(layerName,"EFETAC-NASA") || stringStartsWith(layerName,"RSAC-FHTET")) &&
                    (children[i].nodeName === "value_0")) {
                    value = value + sprintf(" (%.2f %%)", parseFloat(value,10) * 200.0 / 255.0 - 100);
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
