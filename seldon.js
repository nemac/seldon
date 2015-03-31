(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function ($) {
     function clearAccordionSections (accordionGroup) {
        $(accordionGroup).empty();
        $(accordionGroup).data('listAccordion').sections = [];
        $(accordionGroup).accordion('refresh');
    };

    return clearAccordionSections;
}

},{}],2:[function(require,module,exports){
function AccordionGroup (settings) {
    if (!settings) { return; }
    this.sublists         = [];
    this.gid              = settings.gid;
    this.name             = settings.name;
    this.label            = settings.label;
    this.selectedInConfig = settings.selectedInConfig;
}

module.exports = AccordionGroup;

},{}],3:[function(require,module,exports){
function setAccordionGroup (accordionGroup) {
    this.currentAccordionGroup = accordionGroup;
    this.emit("accordiongroupchange");
}

module.exports = setAccordionGroup;

},{}],4:[function(require,module,exports){
function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.type   = settings.type;
}

module.exports = AccordionGroupSublist;

},{}],5:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSection (accordionGroup, title) {
        var sectionObj = {
            title          : title,
            titleElement   : $('<h3>' + title + '</h3>'),
            contentElement : $('<div></div>'),
            sublists    : []
        };
        $(accordionGroup).data('listAccordion').sections.push(sectionObj);
        $(accordionGroup).append(sectionObj.titleElement)
            .append(sectionObj.contentElement);
        $(accordionGroup).accordion('refresh');
        return sectionObj;
    }

    return addAccordionSection;
}

},{}],6:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSublists (g, items) {
        $(g.contentElement).append(items);
    }

    return addAccordionSublists;
}

},{}],7:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSublistItems (s, items) {
        var contents = $('<div class="layer"></div>');
        contents.append(items);
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
        s.contentElement.append(layer.contentElement);
    }

    return addAccordionSublistItems;
}

},{}],8:[function(require,module,exports){
module.exports = function ($) {
     function addMaskToLegend (layer) {
         var app = this;

        var maskName = layer.lid.substring(layer.lid.indexOf("MaskFor"),layer.lid.length);
        //clear out old legend graphic if necessary
        if ($(document.getElementById("lgd" + maskName))) {
            $(document.getElementById("lgd" + maskName)).remove();
        }
        layer.$legendItem = $(document.createElement("div")).attr("id", "lgd" + maskName)
            .prepend($(document.createElement("img")).attr("src", layer.legend))
            .prependTo($('#legend'))
            .click(function () {
                app.setMaskByMask(false, maskName);
            });
    }

    return addMaskToLegend
}


},{}],9:[function(require,module,exports){
module.exports = function ($) {
    var EventEmitter = window.EventEmitter;

    function App () {
        EventEmitter.call(this);
        this.map         = undefined; // OpenLayers map object
        this.tileManager = undefined;
        this.projection  = undefined; // OpenLayers map projection
        this.gisServerType = undefined; //The type of server that the wms layers will be served from
        this.useProxyScript = undefined;
        this.scalebar    = undefined;
        this.zoomInTool  = undefined; // OpenLayers zoom in tool
        this.zoomOutTool = undefined; // OpenLayers zoom out tool
        this.dragPanTool = undefined; // OpenLayers dragpan tool
        this.id_markerLayer = undefined;
        this.maxExtent   = {
            left   : -15000000,  //NOTE: These values get replaced by settings from the config file.
            bottom : 2000000,    //      Don't worry about keeping these in sync if the config fil
            right  : -6000000,   //      changes; these are just here to prevent a crash if we ever
            top    : 7000000     //      read a config file that is missing the <extent> element.
        };
        this.baseLayers            = []; // list of BaseLayer instances holding info about base layers from config file
        this.accordionGroups       = []; // list of AccordionGroup instances holding info about accordion groups from config file
        this.themes                = []; // list of Theme instances holding info about themes from config file
        this.maskParentLayers      = []; // list of currently active global mask parent layers
        this.masks                 = [];
        this.defaultMasks          = ["MaskForForest"];
        this.radioButtonList       = [];
        this.radioButtonLayers     = [];
        this.dropdownBoxList       = [];
        this.dropdownBoxLayers     = [];
        this.currentBaseLayer      = undefined;
        this.currentAccordionGroup = undefined;
        this.currentTheme          = undefined;
        this.identifyTool          = undefined;
        this.multigraphTool        = undefined;

        // array of saved extent objects; each entry is a JavaScript object of the form
        //     { left : VALUE, bottom : VALUE, right : VALUE, top : VALUE }
        this.savedExtents = [];

        // index of the "current" extent in the above array:
        this.currentSavedExtentIndex = -1;

        this.saveCurrentExtent = require("./extent_save.js");
        this.zoomToExtent = require("./extent_zoom.js");
        this.zoomToPreviousExtent = require("./extent_zoom_previous.js");
        this.zoomToNextExtent = require("./extent_zoom_next.js");
        this.printSavedExtents = require("./extent_print.js");
        this.setBaseLayer = require("./set_base_layer.js")($);
        this.setAccordionGroup = require("./accordion_group_set.js");
        this.clearAccordionSections = require("./accordion_clear.js")($);
        this.addAccordionSection = require("./accordion_section_add.js")($);
        this.addAccordionSublists = require("./accordion_sublist_add.js")($);
        this.addAccordionSublistItems = require("./accordion_sublist_item_add.js")($);
        this.setTheme = require("./set_theme.js")($);
        this.shareUrl = require("./share_url.js")($);
        this.updateShareMapUrl = require("./update_share_url.js")($);
        this.launch = require("./launch.js")($);
        this.count = require("./count.js");
        this.addMaskToLegend = require("./add_mask_legend.js")($); 
        this.setMaskByMask = require("./set_mask_by_mask.js")($);
        this.setMaskByLayer = require("./set_mask_by_layer.js")($);
        this.parseConfig = require("./parse_config.js")($);
        this.initOpenLayers = require("./init_openlayers.js");
        this.removeMaskFromLegend = function (layer) {};

        OpenLayers.Util.onImageLoadErrorColor = 'transparent';
        OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    };

    EventEmitter.declare(App);

    return App;
}

},{"./accordion_clear.js":1,"./accordion_group_set.js":3,"./accordion_section_add.js":5,"./accordion_sublist_add.js":6,"./accordion_sublist_item_add.js":7,"./add_mask_legend.js":8,"./count.js":13,"./extent_print.js":16,"./extent_save.js":17,"./extent_zoom.js":18,"./extent_zoom_next.js":19,"./extent_zoom_previous.js":20,"./init_openlayers.js":25,"./launch.js":26,"./parse_config.js":37,"./set_base_layer.js":41,"./set_mask_by_layer.js":42,"./set_mask_by_mask.js":43,"./set_theme.js":44,"./share_url.js":46,"./update_share_url.js":50}],10:[function(require,module,exports){
function arrayContainsElement (array, element) {
    var i;
    if (array === undefined) {
        return false;
    }
    for (i = 0; i < array.length; ++i) {
        if (array[i] === element) {
            return true;
        }
    }
    return false;
}

module.exports = arrayContainsElement;

},{}],11:[function(require,module,exports){
function BaseLayer (settings) {
    if (!settings) { return; }
    this.name  = settings.name;
    this.label = settings.label;
    this.url   = settings.url;
    this.index = settings.index;
}

module.exports = BaseLayer;

},{}],12:[function(require,module,exports){
// The following creates a new OpenLayers tool class called ClickTool
// which calls a function whenever the user clicks in the map.  Each
// instance of ClickTool corresponds to a specific callback function.
// To create an instance of ClickTool:
//
//   tool = new ClickTool(function (e) {
//       // this is the click callback function
//   });
//
var ClickTool = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single'          : true,
        'double'          : false,
        'pixelTolerance'  : 0,
        'stopSingle'      : false,
        'stopDouble'      : false
    },

    initialize: function (clickHandler) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
        );
        this.displayClass = 'ClickTool';
        this.handler = new OpenLayers.Handler.Click(
            this, {
                'click': clickHandler
            }, this.handlerOptions
        );
    }
});

module.exports = ClickTool;

},{}],13:[function(require,module,exports){
function count (array, value) {
    var counter = 0,
        i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === value) counter++;
    }
    return counter;
}

module.exports = count;

},{}],14:[function(require,module,exports){
module.exports = function ($) {
    function createArcGIS93RestParams ($layer) {
        //  $layer is a jQuery object corresponding to a <restLayer> section in the config file.
        //  For example:
        //
        //    <restLayer
        //      name="Climate Wizard"
        //      url="http://www.climatewizard.org:6080/ArcGIS/rest/services/ClimateWizard/US/ImageServer/exportImage/exportImage"
        //      legend="yaya-placeholder.png"
        //      lid="CC9999"
        //      visible="true">
        //        <param name="noData" value="0" />
        //        <param name="format" value="png" />
        //        <param name="interpolation" value="RSP_NearestNeighbor" />
        //        <param name="transparent" value="true" />
        //        <param name="mosaicRule">
        //            <param name="mosaicMethod" value="esriMosaicAttribute" />
        //            <param name="where" value="Name = 'm_ensemble_50_a2_pptPct_14_2040_2069'" />
        //            <param name="sortField" value="Name" />
        //        </param>
        //        <param name="imageSR" value="102100" />
        //        <param name="bboxSR" value="102100" />
        //        <param name="f" value="json" />
        //    </restLayer>
        //
        //  This function constructs and returns a (nested) JS Object corresponding
        //  to the <param> subelements.
        var obj = {};
        $layer.find('>param').each(function(i,param) {
            var $param = $(param);
            if (param.hasAttribute('value')) {
                obj[$param.attr('name')] = $param.attr('value');
            } else {
                obj[$param.attr('name')] = createArcGIS93RestParams($param);
            }
        });
        return obj;
    }

    return createArcGIS93RestParams;
}

},{}],15:[function(require,module,exports){
module.exports = function (app, activeBtn) {
    function deactivateActiveOpenLayersControls () {
        var controls,
            i;
        for (i = 0; i < app.map.controls.length; i++) {
            controls = app.map.controls[i];
            if ((controls.active === true) &&
                (
                 (controls.displayClass === "olControlZoomBox")           ||
                 (controls.displayClass === "olControlWMSGetFeatureInfo") ||
                 (controls.displayClass === "ClickTool")
                )) {

                controls.deactivate();
                $('.icon-active').removeClass('icon-active');
            }
        }
    }

    return deactivateActiveOpenLayersControls;
}

},{}],16:[function(require,module,exports){
function printSavedExtents () {
    // This function is for debugging only and is not normally used.  It returns an HTML
    // table showing the current savedExtents list, and the current position within the list.
    var html = "<table>";
    var len = this.savedExtents.length;
    var i, e;
    for (i = len-1; i >= 0; --i) {
        e = this.savedExtents[i];
        html += Mustache.render('<tr><td>{{{marker}}}</td><td>{{{number}}}</td>'
                                + '<td>left:{{{left}}}, bottom:{{{bottom}}}, right:{{{right}}}, top:{{{top}}}</td></tr>',
                                {
                                    marker : (i === this.currentSavedExtentIndex) ? "==&gt;" : "",
                                    number : i,
                                    left : e.left,
                                    bottom : e.bottom,
                                    right : e.right,
                                    top : e.top
                                });
    }
    html += "</table>";
    return html;
}

module.exports = printSavedExtents;

},{}],17:[function(require,module,exports){
var extentsAreEqual = require("./extents_equal.js");

// save the current extent into the savedExtents array, if it is different from
// the "current" one.  It is important to only save it if it differs from the
// current one, because sometimes OpenLayers fires multiple events when the extent
// changes, causing this function to be called multiple times with the same
// extent
function saveCurrentExtent () {
    var newExtent,
        currentSavedExtent,
        newSavedExtents,
        i;

    newExtent = (function (extent) {
        return { left : extent.left, bottom : extent.bottom, right : extent.right, top : extent.top };
    }(this.map.getExtent()));

    if (this.currentSavedExtentIndex >= 0) {
        currentSavedExtent = this.savedExtents[this.currentSavedExtentIndex];
        if (extentsAreEqual(currentSavedExtent, newExtent)) {
            return;
        }
    }

    // chop off the list after the current position
    newSavedExtents = [];
    for (i = 0; i <= this.currentSavedExtentIndex; ++i) {
        newSavedExtents.push(this.savedExtents[i]);
    }
    this.savedExtents = newSavedExtents;

    // append current extent to the list
    this.savedExtents.push(newExtent);
    ++this.currentSavedExtentIndex;
}

module.exports = saveCurrentExtent;

},{"./extents_equal.js":21}],18:[function(require,module,exports){
function zoomToExtent (extent, save) {
    if (save === undefined) {
        save = true;
    }
    var bounds = new OpenLayers.Bounds(extent.left, extent.bottom, extent.right, extent.top);
    this.map.zoomToExtent(bounds, true);
    if (save) {
        this.saveCurrentExtent();
    }
}

module.exports = zoomToExtent;

},{}],19:[function(require,module,exports){
function zoomToNextExtent () {
    if (this.currentSavedExtentIndex < this.savedExtents.length-1) {
        ++this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToNextExtent;

},{}],20:[function(require,module,exports){
function zoomToPreviousExtent () {
    if (this.currentSavedExtentIndex > 0) {
        --this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToPreviousExtent;

},{}],21:[function(require,module,exports){
function extentsAreEqual (e1, e2) {
    var tolerance = 0.001;
    return ((Math.abs(e1.left - e2.left)        <= tolerance)
            && (Math.abs(e1.bottom - e2.bottom) <= tolerance)
            && (Math.abs(e1.right  - e2.right)  <= tolerance)
            && (Math.abs(e1.top    - e2.top)    <= tolerance));
}

module.exports = extentsAreEqual;

},{}],22:[function(require,module,exports){
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

},{"./clicktool.js":12,"./stringContainsChar.js":48}],23:[function(require,module,exports){
module.exports = function (app, activeBtn) {
    var deactivateActiveOpenLayersControls = require('./deactivate_controls.js')(app, activeBtn);

    function activateIdentifyTool () {
        deactivateActiveOpenLayersControls();
        app.identifyTool.activate();
    }

    return activateIdentifyTool;
}

},{"./deactivate_controls.js":15}],24:[function(require,module,exports){
module.exports = function (app) {
    var ShareUrlInfo = require('./share.js');

    function init (config, projection, gisServerType, useProxyScript) {
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.launch(config, shareUrlInfo);
        seldon.app = app;
        seldon.projection = projection;
        seldon.gisServerType = gisServerType;
        seldon.useProxyScript = useProxyScript;
    }

    return init;
}

},{"./share.js":45}],25:[function(require,module,exports){
function initOpenLayers (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
    var app = this;

    if (baseLayer.name.indexOf("Google") > -1) {
        var layer = new OpenLayers.Layer.Google("Google Streets", {numZoomLevels: 20});
    } else { //assume arcgis
        var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
            layerInfo: baseLayerInfo
        });
    }

    var maxExtentBounds = new OpenLayers.Bounds(app.maxExtent.left, app.maxExtent.bottom,
                                                app.maxExtent.right, app.maxExtent.top);

    if (initialExtent === undefined) {
        //take the extent coming from the config file
        initialExtent = app.maxExtent;
    } else {
        //take the extent of the share map url
        maxExtentBounds = new OpenLayers.Bounds(initialExtent.left, initialExtent.bottom,
                                                initialExtent.right, initialExtent.top);
    }

    app.tileManager = new OpenLayers.TileManager({
        cacheSize: 12,
        moveDelay: 1000,
        zoomDelay: 1000
    });

    app.map = new OpenLayers.Map('map', {
        maxExtent:         maxExtentBounds,
        units:             'm',
        resolutions:       layer.resolutions,
        numZoomLevels:     layer.numZoomLevels,
        tileSize:          layer.tileSize,
        tileManager:       app.tileManager,
        controls: [
            new OpenLayers.Control.Navigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.Attribution(),
            app.zoomInTool,
            app.zoomOutTool,
            app.identifyTool,
            app.multigraphTool
        ],
        eventListeners:
        {
            "moveend": function() { app.emit("extentchange"); },
            "zoomend": function() { app.emit("extentchange"); }
        },
        zoom: 1,
        projection: new OpenLayers.Projection(seldon.projection)
    });

    // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
    // to fetch the layerInfo, which in this case we already have
    app.currentBaseLayer = baseLayer;
    app.emit("baselayerchange");
    app.map.addControl(new OpenLayers.Control.ScaleLine({bottomOutUnits: 'mi'}));
    app.map.addLayers([layer]);
    app.map.setLayerIndex(layer, 0);
    app.setAccordionGroup(app.setTheme(theme, themeOptions));
    app.zoomToExtent(initialExtent);
    app.map.events.register("mousemove", app.map, function (e) {
        var pixel = app.map.events.getMousePosition(e);
        var lonlat = app.map.getLonLatFromPixel(pixel);
        lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
        OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
    });
    app.map.addControl(new OpenLayers.Control.PanZoomBar());
}

module.exports = initOpenLayers;

},{}],26:[function(require,module,exports){
module.exports = function ($) {
    var createSplashScreen = require("./splash.js")($);

    var areasList = [];
    var activeBtn = [];

    function launch (configFile, shareUrlInfo) {
        var deactivateActiveOpenLayersControls = require("./deactivate_controls.js")(this, activeBtn);
        var activateIdentifyTool = require("./identify_activate.js")(this, activeBtn);
        var activateMultigraphTool = require("./multigraph_activate.js")(this, activeBtn);
        var printMap = require("./print.js")($, this);

        var app = this;

        $.ajax({
            url: configFile,
            dataType: "xml",
            success: function (configXML) {
                app.parseConfig(configXML, shareUrlInfo);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });

        //
        // layerPicker button:
        //
        $("#btnTglLyrPick").click(function () {
            var $layerPickerDialog = $("#layerPickerDialog");
            if ($layerPickerDialog.dialog('isOpen')) {
                $layerPickerDialog.dialog('close');
            } else {
                $layerPickerDialog.dialog('open');
            }
        });

        //
        // turn layerPickerDialog div into a jQuery UI dialog:
        //
        $("#layerPickerDialog").dialog({
            zIndex   : 10050,
            position : { my : "left top", at: "left+5 top+100"},
            autoOpen : true,
            hide     : "fade"
        });

        app.addListener("accordiongroupchange", function () {
            if (app.currentTheme) {
                $('#layerPickerAccordion').accordion({
                        active      : app.currentTheme.getAccordionGroupIndex(app.currentAccordionGroup),
                        collapsible : true
                });
            }
        });

        //
        // mapTools button:
        //
        $("#btnTglMapTools").click(function () {
            var $mapToolsDialog = $("#mapToolsDialog");
            if ($mapToolsDialog.dialog('isOpen')) {
                $mapToolsDialog.dialog('close');
            } else {
                $mapToolsDialog.dialog('open');
            }
        });

        //
        // turn mapToolsDialog div into a jQuery UI dialog:
        //
        $("#mapToolsDialog").dialog({
            zIndex   : 10050,
            position : { my : "right top", at: "right-5 top+100"},
            autoOpen : true,
            hide     : "fade"
        });
        app.addListener("themechange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("baselayerchange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("accordiongroupchange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("extentchange", function () {
            app.saveCurrentExtent();
            app.updateShareMapUrl();
            app.map.setOptions({maxExtent: app.map.getExtent()});
        });

        //
        // mapTools accordion
        //
        var $mapToolsAccordion = $("#mapToolsAccordion"),
            accordionGroupIndexToOpen = 0;

        //    initialize
        $mapToolsAccordion.accordion({
            heightStyle : 'content',
            collapsible : true
        });

        //    find the 'legend' layer in the mapTools accordion, and make sure it is initially turned on
        $mapToolsAccordion.find('div').each(function (i) {
            if (this.id === "legend") {
                accordionGroupIndexToOpen = i;
                return false;
            }
            return true;
        });
        $mapToolsAccordion.accordion('option', 'active', accordionGroupIndexToOpen);

        //
        // base layer combo change handler
        //
        $('#baseCombo').change(function () {
            var i = parseInt($(this).val(), 10);
            app.setBaseLayer(app.baseLayers[i]);
        });
        app.addListener("baselayerchange", function () {
            $('#baseCombo').val(app.currentBaseLayer.index);
        });

        //
        // theme layer combo change handler
        //
        $('#themeCombo').change(function () {
            var i = parseInt($(this).val(), 10);
            app.setTheme(app.themes[i]);
        });
        app.addListener("themechange", function () {
            $('#themeCombo').val(app.currentTheme.index);
        });

        //
        // pan button
        //
        $("#btnPan").click(function () {
            deactivateActiveOpenLayersControls();
            app.dragPanTool.activate();
        });

        //
        // print button
        //
        $("#btnPrint").click(function () {
            printMap();
        });

        //
        // zoom in button
        //
        $("#btnZoomIn").click(function () {
            deactivateActiveOpenLayersControls();
            app.zoomInTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // zoom out button
        //
        $("#btnZoomOut").click(function () {
            deactivateActiveOpenLayersControls();
            app.zoomOutTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // zoom to full extent button
        //
        $("#btnZoomExtent").click(function () {
            app.zoomToExtent(app.maxExtent);
        });

        //
        // identify button
        //
        $("#btnID").click(function () {
            activateIdentifyTool();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // about button
        //
        $("#btnAbout").click(function () {
            // I don't think the following line is needed. but am leaving it in
            // just in case - jrf
            //                deactivateActiveOpenLayersControls();
            var splashScreen = $("#splashScreenContainer");
            if (splashScreen.dialog("isOpen")) {
                splashScreen.dialog("close");
            } else {
                splashScreen.dialog("open");
            }
        });

        //
        // previous extent button
        //
        $("#btnPrev").click(function () {
            app.zoomToPreviousExtent();
        });

        //
        // next extent button
        //
        $("#btnNext").click(function () {
            app.zoomToNextExtent();
        });

        //
        // multigraph button
        //
        $("#btnMultiGraph").click(function () {
            activateMultigraphTool();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // splash screen
        //
        createSplashScreen();

        //Find Area
        var $findArea = $('#findArea');
        $findArea.findArea();
        areasList = $findArea.findArea('getAreasList');
        $findArea.autocomplete({
            source: areasList
        });
        $findArea.keypress(function (e) {
            if (e.which == 13) {
                var areaExtent = $findArea.findArea('getAreaExtent', $findArea.val(), areasList);
                app.zoomToExtent(areaExtent);
            }
        });

        //jdm: 7/9/12 - for global mask functionality
        $(function () {
            $('.mask-toggle').on('click', function () {
                if ($(this).is(':checked')) {
                    //console.log("setMaskByMask at line 789");
                    app.setMaskByMask(true, this.value);
                } else {
                    app.setMaskByMask(false, this.value);
                }
            });
        });

        $('textarea').focus(function () {
            var $this = $(this);

            $this.select();

            // webkit issue
            window.setTimeout(function () {
                $this.select();
            }, 1);

            function mouseUpHandler () {
                // Prevent further mouseup intervention
                $this.off("mouseup", mouseUpHandler);
                return false;
            }

            $this.mouseup(mouseUpHandler);
        });

        // closes accordion tools by default on small browsers
        if ($(window).width() < 650) {
            $('#mapToolsDialog').dialog('close');
            $('#layerPickerDialog').dialog('close');
        }

        // closes and reopens accordion tools on mobile devices. They tend to lose their proper
        // position otherwise.
        if (window.addEventListener) {
            window.addEventListener("orientationchange", function () {
                var $mapToolsDialog    = $('#mapToolsDialog'),
                    $layerPickerDialog = $('#layerPickerDialog');

                window.scroll(0, 0);
                if ($mapToolsDialog.dialog('isOpen')) {
                    $mapToolsDialog.dialog('close').dialog('open');
                }

                if ($layerPickerDialog.dialog('isOpen')) {
                    $layerPickerDialog.dialog('close').dialog('open');
                }
            }, false);
        }

    };

    return launch;
}

},{"./deactivate_controls.js":15,"./identify_activate.js":23,"./multigraph_activate.js":35,"./print.js":38,"./splash.js":47}],27:[function(require,module,exports){
module.exports = function ($, app) {
    var stringContainsChar = require('./stringContainsChar.js');

    function Layer (settings) {
        EventEmitter.call(this);
        if (!settings) { return; }
        $.extend(true, this, settings); // copy all properties from `settings` into `this`
        this.transparency = 0;
        if (this.index == undefined) {
            this.index = 0;
        }
        if (this.type == undefined) {
            this.type = "WMS";
        }
        this.openLayersLayer    = undefined;
        this.createOpenLayersLayer = function () {
            if (this.openLayersLayer !== undefined) {
                return this.openLayersLayer;
            }
            var options = {
                isBaseLayer      : false,
                transitionEffect : 'resize',
                buffer : 0
            };

            options.singleTile = true;
            options.ratio = 1;

            //console.log("new OpenLayers.Layer.WMS "+" of "+this.layers);
            if (this.type === "ArcGIS93Rest") {
                this.openLayersLayer =
                    new OpenLayers.Layer.ArcGIS93Rest(this.name,
                                                      this.url,
                                                      // The following expression returns either this.params, if it has no mosaicRule property, or
                                                      // a copy of this.params in which the mosaicRule property has been stringified, if this
                                                      // mosaicRule property is present:
                                                      (  this.params.mosaicRule
                                                         ? $.extend(true, {}, this.params, { 'mosaicRule' : JSON.stringify(this.params.mosaicRule) })
                                                         : this.params),
                                                      options
                                                     );
            } else {
                this.openLayersLayer =
                    new OpenLayers.Layer.WMS(this.name,
                                             this.url,
                                             {
                                                 projection  : new OpenLayers.Projection(seldon.projection),
                                                 units       : "m",
                                                 layers      : this.layers,
                                                 maxExtent   : new OpenLayers.Bounds(app.maxExtent),
                                                 transparent : true
                                             },
                                             options
                                            );
            }

            var loadingimage = $('<img class="layer-loader-image ' + this.name + '" src="icons/loading.gif"/>');
            $("#map").append(loadingimage);
            this.openLayersLayer.loadingimage = loadingimage;

            this.openLayersLayer.events.register("loadstart", this.openLayersLayer, function () {
                this.loadingimage.addClass("loading");
            });
            this.openLayersLayer.events.register("loadend", this.openLayersLayer, function () {
                this.loadingimage.removeClass("loading");
            });
            this.openLayersLayer.setOpacity(1-parseFloat(this.transparency)/100.0);
            this.openLayersLayer.seldonLayer = this;
            return this.openLayersLayer;
        };

        this.activate = function () {
            //console.log("app.map.addLayer "+this.name);
            app.map.addLayer(this.createOpenLayersLayer());
            //Only add legend for parent layers
            if (this.lid.indexOf("MaskFor") > -1) {
                //Handle mask legend differently
                // console.log("call app.addMaskToLegend()");
                app.addMaskToLegend(this);
            } else {
                this.addToLegend();
            }

            this.emit("activate");
            this.visible="true";
            if ((this.mask == "true") && (this.lid.indexOf("MaskFor") == -1)) {
                if (app.masks.length>0) {
                    app.setMaskByLayer(true,this);
                }
            }

            //View order rules:
            //1. Vector layers (vlayers) always on top
            //2. otherwise things go by seldon layer index.
            if (app.map.getNumLayers()>1) {
                var lyrJustAdded = app.map.layers[app.map.getNumLayers()-1];
                if (lyrJustAdded.url.indexOf("vlayers") == -1) {
                    for (var i = app.map.getNumLayers()-2; i > 0; i--) {
                        var nextLayerDown = app.map.layers[i];
                        if (nextLayerDown.url.indexOf("vlayers") == -1) {
                            if (nextLayerDown.seldonLayer.index < lyrJustAdded.seldonLayer.index) {
                                app.map.setLayerIndex(lyrJustAdded, i);
                            }
                        } else {
                            app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1);
                        }
                    }
                } else {
                    app.map.setLayerIndex(lyrJustAdded, app.map.layers.length-1);
                }
            }
            app.updateShareMapUrl();
            app.map.updateSize();
        };

        this.deactivate = function () {
            if (this.openLayersLayer) {
                if (this.visible=="true") {
                    //console.log("deactivate "+this.name);
                    app.map.removeLayer(this.openLayersLayer);
                    this.removeFromLegend();
                    this.visible="false";
                } else { //we are dealing with a inactive parent layer to mask
                    this.removeFromLegend();
                    app.setMaskByLayer(false,this);
                }

                if (this.openLayersLayer.loadingimage) {
                    this.openLayersLayer.loadingimage.removeClass("loading");
                }
            }

            this.emit("deactivate");
        };

        this.addToLegend = function () {
            var that = this;
            //clear out old legend graphic if necessary
            if ($(document.getElementById("lgd" + this.lid))) {
                $(document.getElementById("lgd" + this.lid)).remove();
            }
            if (this.url.indexOf("vlayers")>-1) {
                this.$legendItem = $(document.createElement("div")).attr("id", "lgd" + this.lid)
                .prepend($(document.createElement("img")).attr("src", this.legend))
                .prependTo($('#legend'))
                .click(function () {
                    that.deactivate();
                });
            } else {
                this.$legendItem = $(document.createElement("div")).attr("id", "lgd" + this.lid)
                .append($(document.createElement("img")).attr("src", this.legend))
                .appendTo($('#legend'))
                .click(function () {
                    that.deactivate();
                });
            }
        };

        this.removeFromLegend = function () {
            if (this.$legendItem) {
                if (this.lid.indexOf("MaskFor")>-1) {
                    // console.log("call app.removeMaskFromLegend()");
                    app.removeMaskFromLegend(this);
                } else {
                    this.$legendItem.remove();
                }
            }
        };

        this.setTransparency = function (transparency) {
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(1-parseFloat(transparency)/100.0);
            }
            this.transparency = transparency;

            //Comment this out for now
            //Essentially emits the following two commands:
            try {
                this.emit({type : 'transparency', value : this.transparency});
            }
            catch (err) {
                var test = this.transparency;
                var errTxt = err.Message;
            }

            //Handle transparency for mask
            //Still need to make this parent-layer specific
            if (app.map != undefined) {
                for (var i = app.map.getNumLayers()-2; i > 0; i--) {
                    var currentLayer = app.map.layers[i];
                    if (stringContainsChar(currentLayer.name, 'Mask')) {
                        if ((currentLayer.seldonLayer.openLayersLayer) && (currentLayer.seldonLayer.lid.substring(0, currentLayer.seldonLayer.lid.indexOf("MaskFor")) == this.lid)){
                            currentLayer.seldonLayer.openLayersLayer.setOpacity(1-parseFloat(transparency)/100.0);
                            currentLayer.seldonLayer.transparency = transparency;
                        }
                    }
                }
            }
        };
    }

    window.EventEmitter.declare(Layer);

    return Layer;
}

},{"./stringContainsChar.js":48}],28:[function(require,module,exports){
module.exports = function ($) {
    function createLayerToggleCheckbox (layer) {
        // create the checkbox
        var checkbox = document.createElement("input"),
            $checkbox;
        checkbox.type = "checkbox";
        checkbox.id = "chk" + layer.lid;
        checkbox.onclick = function () {
            if ($(this).is(':checked')) {
                layer.activate();
            } else {
                layer.deactivate();
            }
        };
        $checkbox = $(checkbox);
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $checkbox.attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $checkbox.attr('checked', false);
        });
        // return the new checkbox DOM element
        return checkbox;
    }

    return createLayerToggleCheckbox;
}

},{}],29:[function(require,module,exports){
    //This function gets called every time the layer properties icon gets clicked
module.exports = function ($) {
    function createLayerPropertiesDialog (layer) {
        var localTransparency = 0;
        var $html = $(''
                      + '<div class="layer-properties-dialog">'
                      +   '<table>'
                      +     '<tr>'
                      +       '<td>Transparency:</td>'
                      +       '<td>'
                      +         '<div class="transparency-slider"></div>'
                      +       '</td>'
                      +       '<td>'
                      +        '<input class="transparency-text" type="text" size="2"/>%'
                      +       '</td>'
                      +     '</tr>'
                      +   '</table>'
                      + '</div>'
                     );

        $html.find('input.transparency-text').val(layer.transparency);

        // if ((layer.transparency>0) && (app.maskParents.indexOf(layer.lid) > -1)) {
        if (layer.transparency > 0) {
            localTransparency = layer.transparency;
            layer.setTransparency(localTransparency);
        }

        $html.find('.transparency-slider').slider({
            min   : 0,
            max   : 100,
            step  : 1,
            value : localTransparency,
            slide : function(event, ui) {
                try {
                    layer.setTransparency(ui.value);
                }
                catch(err) {
                    var errTxt = err.message;
                    // layer.setTransparency($('input.transparency-text').val());
                }
            }
        });
        //This seems redundant as there is already a listener on the slider object
        //So, for now I will comment this out
        // layer.addListener("transparency", function (e) {
        // $html.find('.transparency-slider').slider("value", e.value);
        // });
        $html.find('input.transparency-text').change(function () {
            var $this = $(this),
                newValueFloat = parseFloat($this.val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $this.val(layer.transparency);
                return;
            }
            layer.setTransparency($this.val());
        });

        layer.addListener("transparency", function (e) {
            $html.find('input.transparency-text').val(e.value);
        });

        //jdm 5/14/13: add listener for mask functionality
        //for every mask checkbox we check we getting a click event

        $html.dialog({
            zIndex    : 10050,
            position  : "left",
            autoOpen  : true,
            hide      : "explode",
            title     : layer.name,
            width     : 'auto',
            close     : function () {
                $(this).dialog('destroy');
                $html.remove();
                createLayerPropertiesDialog.$html[layer.lid] = undefined;
            }
        });
        createLayerPropertiesDialog.$html[layer.lid] = $html;
    } //end function createLayerPropertiesDialog (layer)

    // Object to be used as hash for tracking the $html objects created by createLayerPropertiesDialog;
    // keys are layer lids:
    createLayerPropertiesDialog.$html = {};

    return createLayerPropertiesDialog;
}


},{}],30:[function(require,module,exports){
module.exports = function ($) {
    var createLayerPropertiesDialog = require("./layer_dialog.js")($);

    function createLayerPropertiesIcon (layer) {
        var img = document.createElement("img");
        img.id = layer.lid;
        img.src = "icons/settings.png";
        img.className = "layerPropertiesIcon";
        img.onclick = function () {
            createLayerPropertiesDialog(layer);
        };
        return img;
    }

    return createLayerPropertiesIcon;
}

},{"./layer_dialog.js":29}],31:[function(require,module,exports){
module.exports = function ($, app) {
    var Layer = require('./layer.js')($, app);

    function createLayerToggleRadioButton (layer, radioGroupName) {
        // create the radio buttons
        var checkbox = document.createElement("input"),
            $checkbox;
        checkbox.type = "radio";
        checkbox.name = radioGroupName;
        checkbox.id = layer.lid;
        if (layer.selectedInConfig) {
            checkbox.checked = true;
        }
        checkbox.onchange = function () {
            //Loop through other radio buttons and deactivate those layers accordingly.
            $('input:radio').each(function() {
                if($(this).is(':checked')) {
                    var wanted_layer = undefined;
                    var wanted_lid = undefined;
                    var selectLayer = undefined;
                    for (var i = 0; i < app.dropdownBoxList[0].length; i++) {
                        if (app.dropdownBoxList[0][i].selected) {
                            if (app.dropdownBoxList[0][i].innerHTML=="select...") {
                                alert("Please make a selection from the appropriate dropdown list");
                                break;
                            }
                            selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
                            wanted_lid = selectLayer.lid;
                        }
                    }
                    for (var i = 0; i < app.radioButtonList.length; i++) {
                        if (app.radioButtonList[i].checked) {
                            wanted_layer = parseInt(selectLayer.layers)+parseInt(app.radioButtonLayers[i].layers);
                            wanted_lid = app.radioButtonLayers[i].lid+wanted_lid;
                        }
                    }
                    if (selectLayer!=undefined) {
                        var checkBoxLayer = new Layer({
                            lid              : wanted_lid,
                            visible          : selectLayer.visible,
                            url              : selectLayer.url,
                            srs              : selectLayer.srs,
                            layers           : wanted_layer,
                            identify         : selectLayer.identify,
                            name             : wanted_lid,
                            mask             : selectLayer.mask,
                            legend           : selectLayer.legend,
                            index            : selectLayer.index
                        });
                        checkBoxLayer.activate();
                    }
                } else {
                    for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                        var currLayer = app.map.layers[i];
                        //Outer loop radio buttons
                        for (var j = 0; j < app.radioButtonLayers.length; j++) {
                            //Inner loop drop-down list
                            for (var k = 0; k < app.dropdownBoxLayers.length; k++) {
                                //console.log(app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid);
                                if ((currLayer.seldonLayer.lid==app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid) &&
                                    (app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid!==getActiveDropdownBoxRadioLID()))
                                    currLayer.seldonLayer.deactivate();
                            }
                        }
                    }
                }
            });
        }; //End checkbox.onchange
        $checkbox = $(checkbox);
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $checkbox.attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $checkbox.attr('checked', false);
        });
        // return the new checkbox DOM element
        return checkbox;
    }

    return createLayerToggleRadioButton;
}

},{"./layer.js":27}],32:[function(require,module,exports){
module.exports = function ($, app) {
    function createLayerToggleDropdownBox (lastLayerInGroup, selectBoxLayers, selectBoxGroupName) {
        var selectBox = document.createElement("select"),$selectBox;
        selectBox.setAttribute("id", selectBoxGroupName);
        var options = [];
        //Loop through selectBoxLayers adding to options accordingly
        for (var i = 0; i < selectBoxLayers.length; i++) {
            // options.push(selectBoxLayers[i].layers+":"+selectBoxLayers[i].name);
            options.push(selectBoxLayers[i].name);
        }
        //Loop through options adding to the selectBox
        for (var x in options) {
            if (options.hasOwnProperty(x)) {
                var option = document.createElement("option");
                option.value = x;
                option.appendChild(document.createTextNode(options[x]));
                selectBox.appendChild(option);
            }
        }
        //add one blank one at the top
        var option = document.createElement("option");
        option.value = options.length;
        option.appendChild(document.createTextNode("select..."));
        selectBox.appendChild(option);
        selectBox.selectedIndex = options.length;
        $selectBox = $(selectBox);
        //Change event listener
        $selectBox.change(function () {
            var wanted_layer = undefined;
            var wanted_lid = undefined;
            var selectLayer = undefined;
            // var selectedDropDownBoxIndex = app.dropdownBoxList[0].selectedIndex
            for (var i = 0; i < app.dropdownBoxList[0].length; i++) {
                if (app.dropdownBoxList[0][i].selected) {
                    if (app.dropdownBoxList[0][i].innerHTML=="select...") {
                        alert("Please make a selection from the appropriate dropdown list");
                        break;
                    }
                    selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
                    wanted_lid = selectLayer.lid;
                }
            }
            for (var i = 0; i < app.radioButtonList.length; i++) {
                if (app.radioButtonList[i].checked) {
                    wanted_layer = parseInt(selectLayer.layers)+parseInt(app.radioButtonLayers[i].layers, 10);
                    wanted_lid = app.radioButtonLayers[i].lid+wanted_lid;
                }
            }
            if (selectLayer!=undefined) {
                var checkBoxLayer = new Layer({
                    lid              : wanted_lid,
                    visible          : selectLayer.visible,
                    url              : selectLayer.url,
                    srs              : selectLayer.srs,
                    layers           : wanted_layer,
                    identify         : selectLayer.identify,
                    name             : wanted_lid,
                    mask             : selectLayer.mask,
                    legend           : selectLayer.legend,
                    index            : selectLayer.index
                });
                checkBoxLayer.activate();
            }
            //Clear out any previously active layers, not needed any more
            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                var currLayer = app.map.layers[i];
                //Outer loop radio buttons
                for (var j = 0; j < app.radioButtonLayers.length; j++) {
                    //Inner loop drop-down list
                    for (var k = 0; k < app.dropdownBoxLayers.length; k++) {
                        //console.log(app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid);
                        if ((currLayer.seldonLayer.lid==app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid) &&
                            (app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid!==getActiveDropdownBoxRadioLID()))
                            currLayer.seldonLayer.deactivate();
                    }
                }
            }
        });
        return selectBox;
    }

    function getActiveDropdownBoxRadioLID () {
        var wanted_lid = undefined;
        var selectLayer = undefined;
        for (var i = 0; i < app.dropdownBoxList[0].length; i++) {
            if (app.dropdownBoxList[0][i].selected) {
                selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
                wanted_lid = selectLayer.lid;
            }
        }
        for (var i = 0; i < app.radioButtonList.length; i++) {
            if (app.radioButtonList[i].checked) {
                wanted_lid = app.radioButtonLayers[i].lid+wanted_lid;
            }
        }
        return wanted_lid;
    };

    return createLayerToggleDropdownBox;
}

},{}],33:[function(require,module,exports){
function Mask (maskName) {
    window.EventEmitter.call(this);
    this.maskName = maskName;
    this.maskLayers = [];
}

module.exports = Mask;

},{}],34:[function(require,module,exports){
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

                var styleMap = new OpenLayers.StyleMap({pointRadius: 4,
                                                        fillColor: "yellow",
                                                        fillOpacity: 0.75,});

                var markerLayer = new OpenLayers.Layer.Vector("markerLayer",
                                                              {styleMap: styleMap});
                var feature = new OpenLayers.Feature.Vector(
                                                            new OpenLayers.Geometry.Point(coords.lon, coords.lat),
                                                            {some:'data'});
                markerLayer.addFeatures(feature);
                app.map.addLayer(markerLayer);

                var popup = $(document.createElement('div'));
                popup.id = "#seldonMultigraphMessageDiv"+app.graphCount+"";

                if (!window.multigraph.core.browserHasCanvasSupport() && !window.multigraph.core.browserHasSVGSupport()) {
                    popup.html('<div id="seldonMultigraph'+app.graphCount+'" style="width: 600px; height: 300px;" ></div>');
                } else {
                    popup.html('<div class="multigraphLoader"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></div><div id="seldonMultigraph'+app.graphCount+'" style="width: 600px; height: 300px;" ></div>');
                }
                popup.dialog({
                    width     : 600,
                    resizable : false,
                    position  : { my: "center+" + offset + " center+" + offset, at: "center", of: window },
                    title     : Mustache.render('MODIS NDVI for Lat: {{{lat}}} Lon: {{{lon}}}',
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
                        'mugl'   : muglPrefix + coords.lon + "," + coords.lat,
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

},{"./clicktool.js":12}],35:[function(require,module,exports){
module.exports = function (app, activeBtn) {
    var deactivateActiveOpenLayersControls = require('./deactivate_controls.js')(app, activeBtn);

    function activateMultigraphTool () {
        deactivateActiveOpenLayersControls();
        app.multigraphTool.activate();
    }

    return activateMultigraphTool;
}

},{"./deactivate_controls.js":15}],36:[function(require,module,exports){
module.exports = function ($) {
    //jdm: override of js remove function
    //This is very useful for removing items from array by value
    //See: http://michalbe.blogspot.com/2010/04/removing-item-with-given-value-from.html
    Array.prototype.remove = function(value) {
        if (this.indexOf(value)!==-1) {
           this.splice(this.indexOf(value), 1);
           return true;
       } else {
          return false;
       };
    }

    // jrf: Overrides OpenLayers.Map.getCurrentSize since by default it does not
    //      account for padding, and seldon requires padding on the top and bottom
    //      for its layout.
    OpenLayers.Map.prototype.getCurrentSize = function () {
        var size = new OpenLayers.Size(this.div.clientWidth,
                                       this.div.clientHeight);

        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            size.w = this.div.offsetWidth;
            size.h = this.div.offsetHeight;
        }
        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            size.w = parseInt(this.div.style.width, 10);
            size.h = parseInt(this.div.style.height, 10);
        }

        // getCurrentSize now accounts for padding
        size.h = size.h - parseInt($(this.div).css("padding-top"), 10) - parseInt($(this.div).css("padding-bottom"), 10);

        return size;
    };

    // Override of offending jquery ui original method per ticket
    // https://github.com/nemac/seldon/issues/18
    // see http://bugs.jqueryui.com/ticket/9364
    // and http://www.markliublog.com/override-jquery-ui-widget.html
    $.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
        _moveToTop: function(arg) { //_methodName is the new method or override method
            if (arg) {
                if (arg.handleObj.type!="mousedown") {
                    var moved = !!this.uiDialog.nextAll(":visible").insertBefore( this.uiDialog ).length;
                    if ( moved && !silent ) {
                        this._trigger( "focus", event );
                    }
                    return moved;
                }
            }
        }
    }));
}

},{}],37:[function(require,module,exports){
module.exports = function ($) {
    var createArcGIS93RestParams = require("./create_arcgis_rest_params.js")($);
    var AccordionGroup = require("./accordion_group.js");
    var AccordionGroupSublist = require("./accordion_group_sublist.js");
    var BaseLayer = require("./baselayer.js");
    var Theme = require("./theme.js");

    function parseConfig (configXML, shareUrlInfo) {
        var Layer = require("./layer.js")($, this);
        var createIdentifyTool = require("./identify.js")($, this);
        var createMultigraphTool = require("./multigraph.js")($, this);

        var app = this,
            $configXML = $(configXML),
            initialBaseLayer,
            initialTheme,
            shareUrlLayerAlpha,
            themeOptions = {},
            i, j, k,
            l, ll, lll;

        if (shareUrlInfo !== undefined) {
            shareUrlLayerAlpha = {};
            for (i = 0, l = shareUrlInfo.layerLids.length; i < l; i++) {
                shareUrlLayerAlpha[shareUrlInfo.layerLids[i]] = shareUrlInfo.layerAlphas[i];
            }
        }

        // parse and store max map extent from config file
        var $extent = $configXML.find("extent");
        if ($extent && $extent.length > 0) {
            app.maxExtent = {
                left   : parseFloat($extent.attr('xmin')),
                bottom : parseFloat($extent.attr('ymin')),
                right  : parseFloat($extent.attr('xmax')),
                top    : parseFloat($extent.attr('ymax'))
            };
        }

        // parse base layers and populate combo box
        var $baseCombo = $("#baseCombo"),
            $images = $configXML.find("images image"),
            $image,
            selected,
            baseLayer;

        for (i = 0, l = $images.length; i < l; i++) {
            $image = $($images[i]);
            selected  = $image.attr('selected');
            baseLayer = new BaseLayer({
                name     : $image.attr('name'),
                label    : $image.attr('label'),
                url      : $image.attr('url'),
                index    : i
            });
            app.baseLayers.push(baseLayer);
            $baseCombo.append($(document.createElement("option")).attr("value", i).text(baseLayer.label));
            if ((  shareUrlInfo  &&   (shareUrlInfo.baseLayerName === baseLayer.name)) ||
                ( !shareUrlInfo  &&   selected                                    )) {
                initialBaseLayer = baseLayer;
            }
        }

        if (initialBaseLayer === undefined) {
            initialBaseLayer = app.baseLayers[0];
        }

        // parse layer groups and layers
        var $wmsGroups = $configXML.find("wmsGroup"),
            $wmsGroup,
            $wmsSubgroups,
            $wmsSubgroup,
            $wmsLayers,
            $wmsLayer,
            accordionGroupsByName = {},
            accordionGroup,
            sublist,
            layer,
            index = 0;
        for (i = 0, l = $wmsGroups.length; i < l; i++) {
            $wmsGroup = $($wmsGroups[i]); // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
            accordionGroup = new AccordionGroup({
                gid              : $wmsGroup.attr('gid'),
                name             : $wmsGroup.attr('name'),
                label            : $wmsGroup.attr('label'),
                selectedInConfig : ($wmsGroup.attr('selected') === "true")
            });
            app.accordionGroups.push(accordionGroup);
            accordionGroupsByName[accordionGroup.name] = accordionGroup;
            if (shareUrlInfo && (shareUrlInfo.accordionGroupGid === accordionGroup.gid)) {
                themeOptions.accordionGroup = accordionGroup;
            }
            $wmsSubgroups = $wmsGroup.find("wmsSubgroup");
            for (j = 0, ll = $wmsSubgroups.length; j < ll; j++) {
                $wmsSubgroup = $($wmsSubgroups[j]); // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                sublist      = new AccordionGroupSublist({
                    label : $wmsSubgroup.attr('label'),
                    type  : $wmsSubgroup.attr('type')
                });
                accordionGroup.sublists.push(sublist);
                $wmsLayers = $wmsSubgroup.find("wmsLayer,restLayer");
                for (k = 0, lll = $wmsLayers.length; k < lll; k++) {
                    $wmsLayer = $($wmsLayers[k]);
                    if ($wmsLayer[0].tagName === "wmsLayer") {
                        layer = new Layer({
                            type             : "WMS",
                            lid              : $wmsLayer.attr('lid'),
                            visible          : $wmsLayer.attr('visible'),
                            url              : $wmsLayer.attr('url'),
                            srs              : $wmsLayer.attr('srs'),
                            layers           : $wmsLayer.attr('layers'),
                            styles           : $wmsLayer.attr('styles'),
                            identify         : $wmsLayer.attr('identify'),
                            name             : $wmsLayer.attr('name'),
                            legend           : $wmsLayer.attr('legend'),
                            mask             : $wmsLayer.attr('mask'),
                            selectedInConfig : ($wmsLayer.attr('selected') === "true")
                        });
                    } else {
                        layer = new Layer({
                            type             : "ArcGIS93Rest",
                            name             : $wmsLayer.attr('name'),
                            lid              : $wmsLayer.attr('lid'),
                            legend           : $wmsLayer.attr('legend'),
                            visible          : $wmsLayer.attr('visible'),
                            url              : $wmsLayer.attr('url'),
                            selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                            params           : createArcGIS93RestParams($wmsLayer),
                            identify         : $wmsLayer.attr('identify')
                        });
                    }
                    layer.index = index;
                    sublist.layers.push(layer);
                    if (shareUrlInfo && (shareUrlLayerAlpha[layer.lid] !== undefined)) {
                        if (themeOptions.layers === undefined) {
                            themeOptions.layers = [];
                        }
                        themeOptions.layers.push(layer);
                        layer.setTransparency(100*(1-shareUrlLayerAlpha[layer.lid]));
                    }
                    index = index + 1;
                }
            }
        }

        //jdm: add to list of mask for checking later in this function
        //put the mask from the share url onto the themeOptions for later processing
        //within the setTheme() function
        if (shareUrlInfo !== undefined) {
            if (themeOptions.shareUrlMasks === undefined) {
                themeOptions.shareUrlMasks = [];
            }
            for (i = 0, l = shareUrlInfo.layerMask.length; i < l; i++) {
                themeOptions.shareUrlMasks[i]=shareUrlInfo.layerMask[i];
            }
        }

        // parse themes
        var $themeCombo = $("#themeCombo"),
            $views      = $configXML.find("mapviews view"),
            $view,
            $viewGroups,
            $viewGroup,
            theme,
            name;
        for (i = 0, l = $views.length; i < l; i++) {
            $view = $($views[i]);
            theme = new Theme({
                name  : $view.attr('name'),
                label : $view.attr('label'),
                                    zoom  : $view.attr('zoom'),
                                    xmin  : $view.attr('xmin'),
                                    ymin  : $view.attr('ymin'),
                                    xmax  : $view.attr('xmax'),
                                    ymax  : $view.attr('ymax'),
                index : i
            });
            app.themes.push(theme);
            $themeCombo.append($(document.createElement("option")).attr("value", i).text(theme.label));
            $viewGroups = $view.find("viewGroup");
            for (j = 0, ll = $viewGroups.length; j < ll; j++) {
                $viewGroup     = $($viewGroups[j]);
                name           = $viewGroup.attr('name');
                accordionGroup = accordionGroupsByName[name];
                if (accordionGroup) {
                    theme.accordionGroups.push(accordionGroup);
                } else {
                    displayError("Unknown accordion group name '" + name + "' found in theme '" + theme.name + "'");
                }
            }
            if ((  shareUrlInfo  &&   (shareUrlInfo.themeName === theme.name)) ||
                ( !shareUrlInfo  &&   ($view.attr('selected')                    ))) {
                initialTheme = theme;
            }
        }

        if (initialTheme === undefined) {
            initialTheme = app.themes[0];
        }

        // also need to address from share url:
        //    layers, alphas
        //    extent
        //    accgp

        app.zoomInTool     = new OpenLayers.Control.ZoomBox();
        app.zoomOutTool    = new OpenLayers.Control.ZoomBox({out:true});
        app.dragPanTool    = new OpenLayers.Control.DragPan();
        app.identifyTool   = createIdentifyTool();
        app.multigraphTool = createMultigraphTool($configXML);

        var initialExtent;

        if (shareUrlInfo) {
            initialExtent = shareUrlInfo.extent;
        }

        // Hardcoded service information here for faster loading
        // Now assuming street maps is always init base layer
        // comes from: initialBaseLayer.url + '?f=json&pretty=true'
        var baseLayerInfo = {"currentVersion":10.01,"serviceDescription":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including our terms of use, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.","mapName":"Layers","description":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including the terms of use, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map","copyrightText":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012","layers":[{"id":0,"name":"World Street Map","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"tables":[],"spatialReference":{"wkid":102100},"singleFusedMapCache":true,"tileInfo":{"rows":256,"cols":256,"dpi":96,"format":"JPEG","compressionQuality":90,"origin":{"x":-20037508.342787,"y":20037508.342787},"spatialReference":{"wkid":102100},"lods":[{"level":0,"resolution":156543.033928,"scale":591657527.591555},{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},{"level":3,"resolution":19567.8792409999,"scale":73957190.948944},{"level":4,"resolution":9783.93962049996,"scale":36978595.474472},{"level":5,"resolution":4891.96981024998,"scale":18489297.737236},{"level":6,"resolution":2445.98490512499,"scale":9244648.868618},{"level":7,"resolution":1222.99245256249,"scale":4622324.434309},{"level":8,"resolution":611.49622628138,"scale":2311162.217155},{"level":9,"resolution":305.748113140558,"scale":1155581.108577},{"level":10,"resolution":152.874056570411,"scale":577790.554289},{"level":11,"resolution":76.4370282850732,"scale":288895.277144},{"level":12,"resolution":38.2185141425366,"scale":144447.638572},{"level":13,"resolution":19.1092570712683,"scale":72223.819286},{"level":14,"resolution":9.55462853563415,"scale":36111.909643},{"level":15,"resolution":4.77731426794937,"scale":18055.954822},{"level":16,"resolution":2.38865713397468,"scale":9027.977411},{"level":17,"resolution":1.19432856685505,"scale":4513.988705},{"level":18,"resolution":0.597164283559817,"scale":2256.994353},{"level":19,"resolution":0.298582141647617,"scale":1128.497176}]},"initialExtent":{"xmin":-28872328.0888923,"ymin":-11237732.4896886,"xmax":28872328.0888923,"ymax":11237732.4896886,"spatialReference":{"wkid":102100}},"fullExtent":{"xmin":-20037507.0671618,"ymin":-19971868.8804086,"xmax":20037507.0671618,"ymax":19971868.8804086,"spatialReference":{"wkid":102100}},"units":"esriMeters","supportedImageFormatTypes":"PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP","documentInfo":{"Title":"World Street Map","Author":"Esri","Comments":"","Subject":"streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ","Category":"transportation(Transportation Networks) ","Keywords":"World, Global, Europe, Japan, Hong Kong, North America, United States, Canada, Mexico, Southern Africa, Asia, South America, Australia, New Zealand, India, Argentina, Brazil, Chile, Venezuela, Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, Switzerland, Russia, Thailand, Turkey, 2012","Credits":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"},"capabilities":"Map"};
        app.initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);
    }

    function displayError (message) {
        //console.log(message);
    }

    return parseConfig;
}

},{"./accordion_group.js":2,"./accordion_group_sublist.js":4,"./baselayer.js":11,"./create_arcgis_rest_params.js":14,"./identify.js":22,"./layer.js":27,"./multigraph.js":34,"./theme.js":49}],38:[function(require,module,exports){
module.exports = function ($, app) {
    function printMap () {
        // go through all layers, and collect a list of objects
        // each object is a tile's URL and the tile's pixel location relative to the viewport
        var offsetX = parseInt(app.map.layerContainerDiv.style.left, 10);
        var offsetY = parseInt(app.map.layerContainerDiv.style.top, 10);
        var size  = app.map.getSize();
        var tiles = [];
        for (var i = 0; i < app.map.layers.length; ++i) {
            // if the layer isn't visible at this range, or is turned off, skip it
            try {
                var layer = app.map.layers[i];
                if (!layer.getVisibility()) continue;
                if (!layer.calculateInRange()) continue;
                // iterate through their grid's tiles, collecting each tile's extent and pixel location at this moment
                // for (var tilerow in layer.grid) {
                for (var j = 0; j < layer.grid.length; ++j) {
                    // for (var tilei in layer.grid[tilerow]) {
                    for (var k = 0; k < layer.grid[j].length; ++k) {
                        var tile     = layer.grid[j][k];
                        var url      = layer.getURL(tile.bounds);
                        var position = tile.position;
                        var tilexpos = position.x + offsetX;
                        var tileypos = position.y + offsetY;
                        var opacity  = layer.opacity ? parseInt(100*layer.opacity, 10) : 100;
                        tiles[tiles.length] = {url:url, x:tilexpos, y:tileypos, opacity:opacity};
                    }
                }
            } //end try
            catch(err) {
                alert(err.message);
            }
        }

        //the legend url's to pass along
        var layerLegendsURLs   = [];
        $('#legend').find('div').each(function(){
            var innerDivId = $(this).attr('id');
            var innerDivImgSrc = $('#'+innerDivId).children('img').attr('src');
            layerLegendsURLs[layerLegendsURLs.length]= {url:innerDivImgSrc};
        });

        // hand off the list to our server-side script, which will do the heavy lifting
        var tiles_json = JSON.stringify(tiles);
        var legends_json = JSON.stringify(layerLegendsURLs);
        // var printparams = 'width='+size.w + '&height='+size.h + '&tiles='+escape(tiles_json) ;

        var printPopup = $(document.createElement('div'));
        printPopup.id = "#printPopupDiv";
        printPopup.html('<div id="printMapLoader"><center><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></center></div>');
        printPopup.dialog({
            resizable : false,
            height    : 75,
            title     : 'Creating Image for Print...',
            close : function( event, ui ) {
                $(this).remove();
            }
        });

        OpenLayers.Request.POST({
            url: 'http://'+window.location.hostname+window.location.pathname+'cgi-bin/print.cgi',
            data: OpenLayers.Util.getParameterString({width:size.w,height:size.h,tiles:tiles_json,legends:legends_json}),
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            callback: function(request) {
                $("#printMapLoader").html('<center><a href="http://'+window.location.hostname+window.location.pathname+'cgi-bin/printed_map.jpg" style="color:blue" target="_new">print image result</a></center>');
                printPopup.dialog('option', 'title', 'Print Image Created!');
            }
        });
    }

    return printMap;
};

},{}],39:[function(require,module,exports){
function RepeatingOperation (op, yieldEveryIteration) {
    var count = 0;
    var instance = this;
    this.step = function (args) {
        if (++count >= yieldEveryIteration) {
            count = 0;
            setTimeout(function () { op(args); }, 1, []);
            return;
        }
        op(args);
    };
}

module.exports = RepeatingOperation;

},{}],40:[function(require,module,exports){
(function ($) {
    "use strict";

    require("./overrides.js")($);

    var seldon = {
        App: require("./app.js")($)
    }

    var app = new seldon.App();
    seldon.init = require("./init.js")(app);
    window.seldon = seldon;
}(jQuery));

},{"./app.js":9,"./init.js":24,"./overrides.js":36}],41:[function(require,module,exports){
module.exports = function ($) {
    function setBaseLayer (baseLayer) {
        var app = this;
        if (baseLayer.name.indexOf("Google") > -1) {
            var layer = new OpenLayers.Layer.Google("Google Streets");
            app.map.removeLayer(app.map.layers[0]);
            app.currentBaseLayer = baseLayer;
            app.map.addLayers([layer]);
            app.map.setLayerIndex(layer, 0);
            app.emit("baselayerchange");
        } else { //assuming esri base layer at this point
            $.ajax({
                url: baseLayer.url + '?f=json&pretty=true',
                dataType: "jsonp",
                success:  function (layerInfo) {
                    var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                        layerInfo: layerInfo
                    });
                    app.map.removeLayer(app.map.layers[0]);
                    app.currentBaseLayer = baseLayer;
                    app.map.addLayers([layer]);
                    app.map.setLayerIndex(layer, 0);
                    app.emit("baselayerchange");
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
        }
    }

    return setBaseLayer;
}


},{}],42:[function(require,module,exports){
module.exports = function ($) {
    function setMaskByLayer (toggle, parentLayer) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        if (toggle) {
            app.maskParentLayers.push(parentLayer);
            for (var m = 0; m < app.masks.length; m++) {
                var maskLayer = new Layer({
                    lid              : parentLayer.lid+app.masks[m].maskName.replace("/",""),
                    visible          : 'true',
                    url              : parentLayer.url,
                    srs              : parentLayer.srs,
                    layers           : parentLayer.layers+app.masks[m].maskName.replace("/",""),
                    identify         : parentLayer.identify,
                    name             : parentLayer.lid+app.masks[m].maskName.replace("/",""),
                    mask             : 'false',
                    legend           : parentLayer.legend,
                    index            : parentLayer.index
                });
                maskLayer.parentLayer = parentLayer;
                maskLayer.activate();
                app.masks[m].maskLayers.push(maskLayer);
                if (parentLayer.visible=="true") {
                    parentLayer.deactivate();
                    parentLayer.visible="false";
                }
                $("#"+app.masks[m].maskName.replace("MaskFor","")).get(0).checked = true;
                $('#mask-status'+ parentLayer.lid).text("(m)");
                $("#chk"+parentLayer.lid).prop('checked', true);
            }
        } else {
            //deactivate and remove from mask.maskLayers[]
            for (var m = 0; m < app.masks.length; m++) {
                var currentMask = app.masks[m];
                var maskLayersToDelete = [];
                for (var ml = 0; ml < app.masks[m].maskLayers.length; ml++) {
                    var currentMaskLayer = app.masks[m].maskLayers[ml];
                    if (currentMaskLayer.parentLayer.lid == parentLayer.lid) {
                        currentMaskLayer.deactivate();
                        $('#mask-status'+ currentMaskLayer.parentLayer.lid).text("")
                        maskLayersToDelete.push(currentMaskLayer);
                    }
                }
                for (var mld = 0; mld < maskLayersToDelete.length; mld++) {
                    currentMask.maskLayers.remove(maskLayersToDelete[mld]);
                }
            }
            //remove from maskParentLayers and activate parentLayer
            app.maskParentLayers.remove(parentLayer);
            if (parentLayer.visible == "false") {
                parentLayer.visible = "true";
            } else {
                parentLayer.visible == "true";
                parentLayer.deactivate();
            }
            $('#mask-status'+ parentLayer.lid).text("");
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByLayer()

    return setMaskByLayer;
}

},{"./layer.js":27}],43:[function(require,module,exports){
module.exports = function ($) {
    var Mask = require("./mask.js");

    // jdm: 11/27-12/5/14 - re-wrote to use Mask object, doing things in a more
    //      object oriented fashion!
    function setMaskByMask (toggle, maskName) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        if (toggle) {
            //if ForestOnly grey out the sub-forest types
            if (maskName == "MaskForForest") {
                $("#ConiferForest").attr("disabled", true);
                $("#DeciduousForest").attr("disabled", true);
                $("#MixedForest").attr("disabled", true);
            }

            var mask = new Mask(maskName);
            app.masks.push(mask);

            // Loop through app.map.layers making sure that
            // app.maskParentLayers is correct
            for (var l = 0; l < app.map.layers.length; l++) {
                if (app.map.layers[l].seldonLayer) {
                    if (app.map.layers[l].seldonLayer.mask=="true") {
                        if (app.count(app.maskParentLayers,app.map.layers[l].seldonLayer)==0) {
                            app.maskParentLayers.push(app.map.layers[l].seldonLayer);
                            app.map.layers[l].seldonLayer.visible="true";
                        }
                    }
                }
            }

            for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                //console.log("creating maskLayer for "+ app.maskParentLayers[mp].name);
                var maskLayer = new Layer({
                    lid              : app.maskParentLayers[mp].lid+maskName.replace("/",""),
                    visible          : 'true',
                    url              : app.maskParentLayers[mp].url,
                    srs              : app.maskParentLayers[mp].srs,
                    layers           : app.maskParentLayers[mp].layers+maskName.replace("/",""),
                    identify         : app.maskParentLayers[mp].identify,
                    name             : app.maskParentLayers[mp].lid+maskName.replace("/",""),
                    mask             : 'false',
                    legend           : app.maskParentLayers[mp].legend,
                    index            : app.maskParentLayers[mp].index
                });
                maskLayer.parentLayer = app.maskParentLayers[mp];
                maskLayer.activate();
                mask.maskLayers.push(maskLayer);
                if (app.maskParentLayers[mp].visible=="true") {
                    app.maskParentLayers[mp].deactivate();
                    app.maskParentLayers[mp].visible=="false";
                }
                $("#"+maskName.replace("MaskFor","")).get(0).checked = true;
                $('#mask-status'+ app.maskParentLayers[mp].lid).text("(m)");
                $("#chk"+app.maskParentLayers[mp].lid).prop('checked', true);
            }
        } //end if (toggle)
        else { //we have just turned off a mask
            //if ForestOnly grey out the sub-forest types
            if (maskName=="MaskForForest") {
                $( "#ConiferForest" ).attr("disabled", false);
                $( "#DeciduousForest" ).attr("disabled", false);
                $( "#MixedForest" ).attr("disabled", false);
            }
            // Loop through app.masks and find maskName
            // When you find it, deactivate all of its maskLayers
            // Keep track of the number of mask in app.masks
            for (var m = 0; m < app.masks.length; m++) {
                if (app.masks[m].maskName==maskName) {
                    for (var ml = 0; ml < app.masks[m].maskLayers.length; ml++) {
                        app.masks[m].maskLayers[ml].deactivate();
                    }
                    //Remove the mask from app.masks that you just cleared out
                    app.masks.remove(app.masks[m]);
                    $("#"+maskName.replace("MaskFor","")).get(0).checked = false;
                    $(document.getElementById("lgd" + maskName)).remove();
                }
            }
            // If it was the only mask in app.Mask (e.g. app.masks.length ==0) to begin with
            // Then loop through app.maskParentLayers and activate those layer
            // Remove those layers from app.maskParentLayers that you just activated
            if (app.masks.length==0) {
                var layersToRemove = [];
                for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                    app.maskParentLayers[mp].activate();
                    app.maskParentLayers[mp].visible="true";
                    layersToRemove.push(app.maskParentLayers[mp]);
                }
                for (var l = 0; l < layersToRemove.length; l++) {
                    app.maskParentLayers.remove(layersToRemove[l]);
                    $('#mask-status'+ layersToRemove[l].lid).text("");
                }
            }
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByMask()

    return setMaskByMask;
}

},{"./layer.js":27,"./mask.js":33}],44:[function(require,module,exports){
module.exports = function ($) {
    var RepeatingOperation = require("./repeating_operation.js");
    var ShareUrlInfo = require("./share.js");
    var createLayerToggleCheckbox = require("./layer_checkbox.js")($);
    var createLayerPropertiesIcon = require("./layer_icon.js")($);
    var arrayContainsElement = require("./array_contains_element.js");

    function setTheme (theme, options) {
        var createLayerToggleDropdownBox = require("./layer_select.js")($, this);
        var createLayerToggleRadioButton = require("./layer_radio.js")($, this);

        var app = this,
            $layerPickerAccordion = $("#layerPickerAccordion"),
            flag,
            accordionGroup,
            labelElem,
            brElem,
            textElem,
            maskLabelElem,
            maskTextElem,
            activeMaskLayers = [];

        //jdm 1/3/14: set the default forest mask
        //TODO: There should be a more eloquent way to handle default mask
        if ($.isEmptyObject(options) && (app.masks.length==0)) {
            for (var dm = 0; dm < app.defaultMasks.length; dm++) {
                //console.log("setMaskByMask at line 247");
                app.setMaskByMask(true, app.defaultMasks[dm]);
            }
        }

        //jdm (11/1/13): fix for changing themes and accounting for active layers
        //we have changed a theme here, but we need to account for active layers.
        //This accounts for active mask on theme change also.
        if (options === undefined) {
            options = {};
            options.layers = [];
            options.shareUrlMasks = [];
            var shareUrlInfo = ShareUrlInfo.parseUrl(app.shareUrl());
            //get previously active accordion group e.g. accgp=G04
            var gid = shareUrlInfo.accordionGroupGid;
            //get previously active layers e.g. layers=AD,AAB
            var lids = shareUrlInfo.layerLids;
            //loop through the accordion groups the active one accordingly
            for (var a = 0, b = this.accordionGroups.length; a < b; a++) {
                if (this.accordionGroups[a].gid==gid) {
                    options.accordionGroup = this.accordionGroups[a];
                }
            }

            //options.layers = lids;
            //loop through the layers active one accordingly
            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                var currLayer = app.map.layers[i];
                for (var j=0; j<lids.length; j++) {
                    if (lids[j] == currLayer.seldonLayer.lid) {
                        options.layers.push(currLayer.seldonLayer);
                    }
                }
            }
        }

        if ($layerPickerAccordion.length === 0) {
            flag = true;
            $layerPickerAccordion = $(document.createElement("div"))
                .attr("id", "layerPickerAccordion")
                .addClass("layerAccordionClass")
                .css("height", "400px");
        }

        //Clear our previous accordion on theme change
        if ($layerPickerAccordion.data('listAccordion')) {
            // $layerPickerAccordion.listAccordion('clearSections');
            app.clearAccordionSections($layerPickerAccordion);
        }

        //Initialize listAccordion
        $layerPickerAccordion.accordion({
            heightStyle : 'content',
            change      : function (event, ui) {
                var accordionGroupIndex = $layerPickerAccordion.accordion('option', 'active');
                app.setAccordionGroup(theme.accordionGroups[accordionGroupIndex]);
            }
        });
        if ( ! $layerPickerAccordion.data('listAccordion') ) {
            $layerPickerAccordion.data('listAccordion', {
                accordionOptions     : options,
                sections             : []
            });
            $layerPickerAccordion.accordion('option', 'active');
        }

        //jdm: re-wrote loop using traditional for loops (more vintage-IE friendly)
        //vintage-IE does work with jquery each loops, but seems to be slower
        // for (var a = 0, b = theme.accordionGroups.length; a < b; a++) {
        var a = 0;
        var defaultAccordionGroup = undefined;
        var ro1 = new RepeatingOperation(function () {
            var accGp = theme.accordionGroups[a],
                accordionGroupOption = options.accordionGroup;
            // Decide whether to open this accordion group.  If we received an
            // `accordionGroup` setting in the options are, activate this accordion
            // group only if it equals that setting.  If we did not receive an
            // `accordionGroup` setting in the options are, activate this accordion
            // group if its "selected" attribute was true in the config file.
            if ((accordionGroupOption && (accGp === accordionGroupOption)) ||
                (!accordionGroupOption && accGp.selectedInConfig)) {
                accordionGroup = accGp;
            }
            var g = app.addAccordionSection($layerPickerAccordion, accGp.label);
            var selectBoxLayers = [];
            var sublistItems = [];
            for (var i = 0, j = accGp.sublists.length; i < j; i++) {
                var sublist = accGp.sublists[i];
                var sublistObj = {
                    heading : sublist.label,
                    items : [],
                    contentElement : $('<div><h4>' + sublist.label + '</h4></div>')
                };
                g.sublists.push(sublistObj);
                sublistItems.push(sublistObj.contentElement);
                var sublistLayerItems = [];
                for (var k = 0, l = sublist.layers.length; k < l; k++) {
                    var layer = sublist.layers[k];
                    // remove any previously defined listeners for this layer, in case this isn't the first
                    // time we've been here
                    layer.removeAllListeners("activate");
                    layer.removeAllListeners("deactivate");
                    layer.removeAllListeners("transparency");
                    // listen for changes to this layer, and update share url accordingly
                    layer.addListener("activate", function () {
                        app.updateShareMapUrl();
                    });
                    layer.addListener("deactivate", function () {
                        app.updateShareMapUrl();
                    });
                    layer.addListener("transparency", function () {
                        app.updateShareMapUrl();
                    });

                    labelElem = document.createElement("label");
                    brElem = document.createElement("br");
                    textElem = document.createTextNode(layer.name);
                    labelElem.setAttribute("for", "chk" + layer.lid);
                    labelElem.appendChild(textElem);

                    //jdm 5/28/13: if there is a mask for this layer then we will provide a status
                    //as to when that mask is active
                    var $testForMask = layer.mask;
                    var radioButton;
                    var dropdownBox;
                    if ($testForMask) {
                        maskLabelElem = document.createElement("label");
                        maskTextElem = document.createTextNode(""); //empty until active, if active then put (m)
                        maskLabelElem.setAttribute("id", "mask-status" + layer.lid);
                        maskLabelElem.appendChild(maskTextElem);
                        sublistLayerItems.push([createLayerToggleCheckbox(layer),
                                                labelElem,
                                                createLayerPropertiesIcon(layer),
                                                maskLabelElem,brElem]);
                    } else { //no mask for this layer (most will be of this type outside of FCAV)
                        // add the layer to the accordion group
                        if (sublist.type=="radiobutton") { //radio button type
                            sublistLayerItems.push([radioButton=createLayerToggleRadioButton(layer, sublist.label.replace(/\s+/g, '')),
                                                    labelElem,
                                                    createLayerPropertiesIcon(layer),brElem]);
                            app.radioButtonList.push(radioButton);
                            app.radioButtonLayers.push(layer);
                        } else if (sublist.type=="dropdownbox") { //dropdownbox type
                            // Using sublist.layers.length build up array of layer information to pass to 
                            // the dropdownbox such that only one call to createLayerToggleDropdownBox.
                            // Assumption #1: A dropdownbox is always preceded in the config file by a 
                            // radiobutton and therefore the dropdownbox needs to know about its corresponding radiobutton group
                            if (((selectBoxLayers.length+1)<sublist.layers.length) || (selectBoxLayers.length == undefined)){
                                selectBoxLayers.push(layer);
                                app.dropdownBoxLayers.push(layer);
                            } else {
                                selectBoxLayers.push(layer);
                                sublistLayerItems.push([dropdownBox=createLayerToggleDropdownBox(layer, selectBoxLayers, sublist.label.replace(/\s+/g, ''))]);
                                app.dropdownBoxList.push(dropdownBox);
                                app.dropdownBoxLayers.push(layer);
                            }
                        } else { // assume checkbox type
                            sublistLayerItems.push([createLayerToggleCheckbox(layer),
                                                    labelElem,
                                                    createLayerPropertiesIcon(layer),brElem]);
                        }
                    }

                    // Decide whether to activate the layer.  If we received a layer list in the
                    // options arg, active the layer only if it appears in that list.  If we
                    // received no layer list in the options arg, activate the layer if the layer's
                    // "selected" attribute was true in the config file.
                    if (((options.layers !== undefined) &&
                         (arrayContainsElement(options.layers, layer))) ||
                        ((options.layers === undefined) &&
                         layer.selectedInConfig) && (sublist.type!="radiobutton")) {
                        //console.log("activate at line 449");
                        layer.activate();
                    }
                    //we shouldn't have to re-activate an active layer on theme change
                    //But, rather just verify that it is checked as such
                    if (lids !== undefined) {
                        for (var m = 0; m < lids.length; m++) {
                            if ($("#chk"+lids[m])[0] !== undefined) {
                                $("#chk"+lids[m])[0].checked = true;
                            }
                        }
                    }
                } // end loop for sublist.layers
                app.addAccordionSublistItems(sublistObj, sublistLayerItems);
            } // end loop for accGp.sublists
            app.addAccordionSublists(g, sublistItems);
            if (++a < theme.accordionGroups.length) {
                ro1.step();
            } else {
                //jdm 10/21/14: If the accordionGroup is not currently set,
                //go ahead and assign it to the current accordion group
                if (accordionGroup === undefined) {
                    accordionGroup = accGp.gid
                }
                defaultAccordionGroup = accordionGroup;
                setThemeContinue(app, theme, options, accordionGroup);
            }
        }, 5);
        ro1.step();
        // } //end loop for theme.accordionGroups

        $layerPickerAccordion.accordion("refresh");
        // if page doesn't have layerPickerAccordion, insert it
        if (flag === true) {
            $("#layerPickerDialog").append($layerPickerAccordion);
        }

        return defaultAccordionGroup;

    };


    function setThemeContinue (app, theme, options, accordionGroup) {
        app.currentTheme = theme;
        app.setAccordionGroup(accordionGroup);
        $('#layerPickerDialog').scrollTop(0);
        $('#mapToolsDialog').scrollTop(0);
        app.emit("themechange");

        //jdm 6/28/13: do a check to see if there is a corresponding active mask in options.shareUrlMasks
        //can be multiple mask per a parent layer
        if (options.shareUrlMasks !== undefined) {
            for (var m = 0; m < options.shareUrlMasks.length; m++) {
                //we have already activated the respective parent layers
                //so so we have to go through the masking process
                //console.log("setMaskByMask at line 239");
                app.setMaskByMask(true, "MaskFor"+options.shareUrlMasks[m]);
            }
        }

        //if zoom parameter on theme to to that extent
        if (theme.zoom) {
            var zoomExtent = {
                left : theme.xmin,
                bottom : theme.ymin,
                right : theme.xmax,
                top : theme.ymax };
            app.zoomToExtent(zoomExtent);
        }

        if (!accordionGroup) {
            // if we get to this point and don't have an accordion group to open,
            // default to the first one
            accordionGroup = theme.accordionGroups[0];
        }

        for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
            $('#mask-status'+ app.maskParentLayers[mp].lid).text("(m)");
            $("#chk"+app.maskParentLayers[mp].lid).prop('checked', true);
        }

    }

    return setTheme;
}

},{"./array_contains_element.js":10,"./layer_checkbox.js":28,"./layer_icon.js":30,"./layer_radio.js":31,"./layer_select.js":32,"./repeating_operation.js":39,"./share.js":45}],45:[function(require,module,exports){
function ShareUrlInfo (settings) {
    if (settings === undefined) {
        settings = {};
    }
    this.themeName         = settings.themeName;
    this.accordionGroupGid = settings.accordionGroupGid;
    this.baseLayerName     = settings.baseLayerName;
    this.extent            = settings.extent;
    this.layerLids         = settings.layerLids;
    this.layerMask         = settings.layerMask;
    this.layerAlphas       = settings.layerAlphas;
    if (this.extent === undefined) {
        this.extent = {};
    }
    if (this.layerLids === undefined) {
        this.layerLids = [];
    }
    if (this.layerMask === undefined) {
        this.layerMask = [];
    }
    if (this.layerAlphas === undefined) {
        this.layerAlphas = [];
    }
}

ShareUrlInfo.parseUrl = function (url) {
    var info = new ShareUrlInfo(),
        vars = [],
        hash,
        q;

    if (url === undefined) {
        return undefined;
    }
    // Remove everything up to and including the first '?' char.
    url = url.replace(/^[^\?]*\?/, '');

    $.each(url.split('&'), function () {
        var i = this.indexOf('='),
            name, value;
        if (i >= 0) {
            name  = this.substring(0,i);
            value = this.substring(i+1);
        } else {
            name  = this;
            value = undefined;
        }
        vars[name] = value;
    });

    info.themeName         = vars.theme;
    info.accordionGroupGid = vars.accgp;
    info.baseLayerName     = vars.basemap;

    if (vars.extent) {
        var extentCoords = vars.extent.split(',');
        info.extent = {
            left   : extentCoords[0],
            bottom : extentCoords[1],
            right  : extentCoords[2],
            top    : extentCoords[3]
        };
    }

    if (vars.layers) {
        $.each(vars.layers.split(','), function () {
            info.layerLids.push(this);
        });
    }
    if (vars.mask) {
        $.each(vars.mask.split(','), function () {
            info.layerMask.push(this);
        });
    }
    if (vars.alphas) {
        $.each(vars.alphas.split(','), function () {
            info.layerAlphas.push(this);
        });
    }
    if (info.themeName && info.baseLayerName) {
        return info;
    }
    return undefined;
};

ShareUrlInfo.prototype.urlArgs = function () {
    return Mustache.render(
        (''
         + 'theme={{{theme}}}'
         + '&layers={{{layers}}}'
         + '&mask={{{mask}}}'
         + '&alphas={{{alphas}}}'
         + '&accgp={{{accgp}}}'
         + '&basemap={{{basemap}}}'
         + '&extent={{{extent.left}}},{{{extent.bottom}}},{{{extent.right}}},{{{extent.top}}}'
        ),
        {
            theme   : this.themeName,
            layers  : this.layerLids.join(','),
            mask    : this.layerMask.join(','),
            alphas  : this.layerAlphas.join(','),
            accgp   : this.accordionGroupGid,
            basemap : this.baseLayerName,
            extent  : this.extent
        });
};

module.exports = ShareUrlInfo;

},{}],46:[function(require,module,exports){
module.exports = function ($) {
    var stringContainsChar = require("./stringContainsChar.js");
    var ShareUrlInfo = require("./share.js");

    function shareUrl () {
        if (!this.currentTheme) { return undefined; }
        if (!this.currentAccordionGroup) { return undefined; }
        if (!this.currentBaseLayer) { return undefined; }

        var extent      = this.map.getExtent(),
            layerLids   = [],
            layerAlphas = [],
            layerMask   = [],
            url;

        if (!extent) { return undefined; }

        $.each(this.map.layers, function () {
            var op;
            if (! this.isBaseLayer) {
                if (this.opacity === 1) {
                    op = "1";
                } else if (this.opacity === 0) {
                    op = "0";
                } else {
                    op = sprintf("%.2f", this.opacity);
                }
                if (stringContainsChar(this.name, 'MaskFor')) {
                    //if this layer is a mask add to layerMask list
                    if (layerMask.indexOf(this.seldonLayer.lid.substring(this.seldonLayer.lid.indexOf("MaskFor"),this.seldonLayer.lid.length).replace("MaskFor","")) == -1) {
                        layerMask.push(this.seldonLayer.lid.substring(this.seldonLayer.lid.indexOf("MaskFor"),this.seldonLayer.lid.length).replace("MaskFor",""));
                    }
                    //make sure the parent to the layerMask stays on the share map url
                    if (layerLids.indexOf(this.name.substring(0, this.name.indexOf("MaskFor"))) == -1) {
                        layerLids.push(this.name.substring(0, this.name.indexOf("MaskFor")));
                        layerAlphas.push(op);
                    }
                    var test = "";
                } else {
                    //otherwise add to layerLids
                    if (this.seldonLayer) {
                        layerLids.push(this.seldonLayer.lid);
                        layerAlphas.push(op);
                    }
                } //end
            }
        });

        url = window.location.toString();
        url = url.replace(/\?.*$/, '');
        url = url.replace(/\/$/, '');
        url = url.replace("#", '');
        return url + '?' + (new ShareUrlInfo({
            themeName         : this.currentTheme.name,
            layerLids         : layerLids,
            layerMask         : layerMask,
            layerAlphas       : layerAlphas,
            accordionGroupGid : this.currentAccordionGroup.gid,
            baseLayerName     : this.currentBaseLayer.name,
            extent            : extent
        })).urlArgs();
    };

    return shareUrl;
}

},{"./share.js":45,"./stringContainsChar.js":48}],47:[function(require,module,exports){
module.exports = function ($) {
    function createSplashScreen () {
        var $splashScreenContainer = $("#splashScreenContainer"),
            $document    = $(document),
            windowWidth  = Math.round($document.width()/2);
        $('#splashScreenContent').load('splashScreen.html');
        $splashScreenContainer.dialog({
            zIndex      : 10051,
            maxHeight   : $document.height(),
            width       : windowWidth,
            minWidth    : 300,
            dialogClass : 'splashScreenStyle',
            hide        : "explode"
        });
        $splashScreenContainer.dialog("close");
    }

    return createSplashScreen;
}

},{}],48:[function(require,module,exports){
function stringContainsChar (string, c) {
    return (string.indexOf(c) >= 0);
}

module.exports = stringContainsChar;

},{}],49:[function(require,module,exports){
function Theme (settings) {
    this.accordionGroups = [];
    if (!settings) { return; }
    this.name  = settings.name;
    this.label = settings.label;
    this.index = settings.index;
    this.zoom = settings.zoom;
    this.xmin = settings.xmin;
    this.ymin = settings.ymin;
    this.xmax = settings.xmax;
    this.ymax = settings.ymax;
    this.getAccordionGroupIndex = function (accordionGroup) {
        // return the index of a given AccordionGroup in this theme's list,
        // or -1 if it is not in the list
        var i;
        for (i = 0; i < this.accordionGroups.length; ++i) {
            if (this.accordionGroups[i] === accordionGroup) {
                return i;
            }
        }
        return -1;
    };
}

module.exports = Theme;

},{}],50:[function(require,module,exports){
module.exports = function ($) {
    function updateShareMapUrl () {
        if (this.currentTheme) {
            var url = this.shareUrl();
            if (url) {
                $('#mapToolsDialog textarea.shareMapUrl').val(url);
            }
        }
    }

    return updateShareMapUrl;
}

},{}]},{},[40]);
