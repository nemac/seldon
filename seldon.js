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
module.exports = function ($) {
  function setupCollapsibleSublists (ui) {
    var app = this;

    if (ui.newPanel.length === 0) {
      return
    }

    var $sublists = ui.newPanel.children('.sublist.collapsible')

    if ($sublists.length === 0) {
      return
    }

    // Set a click handler on accordion section sublist headers
    $sublistHeaders = $sublists.children('.sublist-header')

    $sublistHeaders.each(function () {
      var $header = $(this)
      if (!!$header[0].onclick) {
        return
      }
      $header[0].onclick = function (event) {
        var $this = $(this);
        var $sublist = $this.parent('.sublist')
        // If the sublist is collapsed, uncollapse it and set the header icon
        var $layerGroup = $sublist.children('.layer-group');
        var $icon = $this.children('.ui-accordion-header-icon')
        if ($layerGroup.hasClass('collapsed')) {
          $layerGroup.removeClass('collapsed');
          $icon.removeClass('ui-icon-triangle-1-e');
          $icon.addClass('ui-icon-triangle-1-s');
        } else {
        // If the sublist is uncollapsed, collapse it and set the header icon
          $layerGroup.addClass('collapsed');
          $icon.removeClass('ui-icon-triangle-1-s');
          $icon.addClass('ui-icon-triangle-1-e');
        }
      }

    })
    
  }
  return setupCollapsibleSublists;
}




},{}],3:[function(require,module,exports){
function AccordionGroup (settings) {
    if (!settings) { return; }
    this.sublists         = [];
    this.gid              = settings.gid;
    this.name             = settings.name;
    this.label            = settings.label;
    //this.selectedInConfig = settings.selectedInConfig;
}

module.exports = AccordionGroup;

},{}],4:[function(require,module,exports){
function setAccordionGroup (accordionGroup) {
    this.currentAccordionGroup = accordionGroup;
    this.emit("accordiongroupchange");
}

module.exports = setAccordionGroup;

},{}],5:[function(require,module,exports){
function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.sid = settings.sid
    this.type   = settings.type;
    this.description = settings.description
    this.collapsible = settings.collapsible
    this.break = settings.break
}

module.exports = AccordionGroupSublist;

},{}],6:[function(require,module,exports){
module.exports = function ($) {
  function MoreInfoButton(el) {
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.className = 'accordion-more-info-button';
    // If el is a subgroup, use the sid prop; if layer, use lid prop
    var dialogClass = 'tooltip-for-' + (el.sid ? el.sid : el.lid)
    this.element.onclick = function (event) {
      var dialogOpen = $('.'+dialogClass).filter(':visible').length
      if (!dialogOpen) {
        var dialogDiv = ''
          +'<div>'
            +'<p class="tooltip-content">'+el.description+'</p>'
          +'</div>'
        $(dialogDiv).dialog({
          'title' : (el.label || el.name),
          'dialogClass' : 'tooltip-dialog ' + dialogClass,
        })
      }
    }
  }

  return MoreInfoButton;
}

},{}],7:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSection (accordionGroup, title) {
        var sectionObj = {
            title          : title,
            titleElement   : $('<h3>' + title + '</h3>'),
            contentElement : $('<div></div>'),
            sublists       : []
        };
        var $accordionGroup = $(accordionGroup);
        $accordionGroup.data('listAccordion').sections.push(sectionObj);
        $accordionGroup.append(sectionObj.titleElement)
            .append(sectionObj.contentElement);
        $accordionGroup.accordion('refresh');
        return sectionObj;
    }

    return addAccordionSection;
}

},{}],8:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSublists (g, items) {
        $(g.contentElement).append(items);
    }

    return addAccordionSublists;
}

},{}],9:[function(require,module,exports){
module.exports = function ($) {
    function addAccordionSublistItems (s, items, theme, accGp) {
        var collapsed = s.collapsible ? 'collapsed ' : ''
        var contents = $('<div class="'+collapsed+'layer-group"></div>');

        for (var i=0, l=items.length; i<l; i++) {
            contents.append($('<div class="layer"></div>').append(items[i]));
        }
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
        s.contentElement.append(layer.contentElement);

    }

    return addAccordionSublistItems;
}

},{}],10:[function(require,module,exports){
module.exports = function ($) {
    function addMaskToLegend (layer) {
        var app = this;

        var maskName = layer.lid.substring(layer.lid.indexOf("MaskFor"), layer.lid.length);
        //clear out old legend graphic if necessary
        $("#lgd" + maskName).remove();
        layer.$legendItem = $(document.createElement("div")).attr("id", "lgd" + maskName)
            .prepend($(document.createElement("img")).attr("src", layer.legend))
            .prependTo($('#legend'))
            .click(function () {
                app.setMaskByMask(false, maskName);
            });
    }

    return addMaskToLegend
}


},{}],11:[function(require,module,exports){
module.exports = function ($) {
    var EventEmitter = window.EventEmitter;

    function App () {
        EventEmitter.call(this);
        this.map            = undefined; // OpenLayers map object
        this.tileManager    = undefined;
        this.projection     = undefined; // OpenLayers map projection
        this.gisServerType  = undefined; //The type of server that the wms layers will be served from
        this.useProxyScript = undefined;
        this.scalebar       = undefined;
        this.zoomInTool     = undefined; // OpenLayers zoom in tool
        this.zoomOutTool    = undefined; // OpenLayers zoom out tool
        this.dragPanTool    = undefined; // OpenLayers dragpan tool
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
        this.maskModifiers         = [];
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
        this.markerTool        = undefined;

        // array of saved extent objects; each entry is a JavaScript object of the form
        //     { left : VALUE, bottom : VALUE, right : VALUE, top : VALUE }
        this.savedExtents = [];

        // index of the "current" extent in the above array:
        this.currentSavedExtentIndex = -1;

        this.saveCurrentExtent        = require("./extent_save.js");
        this.zoomToExtent             = require("./extent_zoom.js");
        this.zoomToPreviousExtent     = require("./extent_zoom_previous.js");
        this.zoomToNextExtent         = require("./extent_zoom_next.js");
        this.printSavedExtents        = require("./extent_print.js");
        this.setBaseLayer             = require("./set_base_layer.js")($);
        this.setAccordionGroup        = require("./accordion_group_set.js");
        this.clearAccordionSections   = require("./accordion_clear.js")($);
        this.addAccordionSection      = require("./accordion_section_add.js")($);
        this.addAccordionSublists     = require("./accordion_sublist_add.js")($);
        this.addAccordionSublistItems = require("./accordion_sublist_item_add.js")($);
        this.setTheme                 = require("./set_theme.js")($);
        this.shareUrl                 = require("./share_url.js")($);
        this.updateShareMapUrl        = require("./update_share_url.js")($);
        this.launch                   = require("./launch.js")($);
        this.count                    = require("./count.js");
        this.addMaskToLegend          = require("./add_mask_legend.js")($); 
        this.setMaskByMask            = require("./set_mask_by_mask.js")($);
        this.setMaskByLayer           = require("./set_mask_by_layer.js")($);
        this.handleMaskModifier       = require("./mask_modifier.js"); 
        this.handleMaskModifierGroup  = require("./mask_modifier_group.js")($); 
        this.parseConfig              = require("./parse_config.js")($);
        this.initOpenLayers           = require("./init_openlayers.js");
        this.setupCollapsibleSublists = require("./accordion_collapsible_sublist_setup.js")($)
        this.removeMaskFromLegend     = function (layer) {};

        OpenLayers.Util.onImageLoadErrorColor = 'transparent';
        OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    };

    EventEmitter.declare(App);

    return App;
}

},{"./accordion_clear.js":1,"./accordion_collapsible_sublist_setup.js":2,"./accordion_group_set.js":4,"./accordion_section_add.js":7,"./accordion_sublist_add.js":8,"./accordion_sublist_item_add.js":9,"./add_mask_legend.js":10,"./count.js":15,"./extent_print.js":18,"./extent_save.js":19,"./extent_zoom.js":20,"./extent_zoom_next.js":21,"./extent_zoom_previous.js":22,"./init_openlayers.js":26,"./launch.js":27,"./mask_modifier.js":38,"./mask_modifier_group.js":39,"./parse_config.js":42,"./set_base_layer.js":47,"./set_mask_by_layer.js":49,"./set_mask_by_mask.js":50,"./set_theme.js":51,"./share_url.js":53,"./update_share_url.js":57}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
function BaseLayer (settings) {
    if (!settings) { return; }
    this.name  = settings.name;
    this.label = settings.label;
    this.url   = settings.url;
    this.index = settings.index;
    this.type  = settings.type;
    this.style = settings.style;
    this.layer = settings.layer,
    this.tileMatrixSet = settings.tileMatrixSet;
    this.numZoomLevels = settings.numZoomLevels;
}

module.exports = BaseLayer;

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
function count (array, value) {
    var counter = 0,
        i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === value) counter++;
    }
    return counter;
}

module.exports = count;

},{}],16:[function(require,module,exports){
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
        $layer.find('>param').each(function(i, param) {
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

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
var extentsAreEqual = require("./extents_equal.js");

// save the current extent into the savedExtents array, if it is different from
// the "current" one.  It is important to only save it if it differs from the
// current one, because sometimes OpenLayers fires multiple events when the extent
// changes, causing this function to be called multiple times with the same
// extent
function saveCurrentExtent () {
    var newExtent = formatExtent(this.map.getExtent()),
        newSavedExtents = [],
        currentSavedExtent,
        i;

    if (this.currentSavedExtentIndex >= 0) {
        currentSavedExtent = this.savedExtents[this.currentSavedExtentIndex];
        if (extentsAreEqual(currentSavedExtent, newExtent)) {
            return;
        }
    }

    // chop off the list after the current position
    for (i = 0; i <= this.currentSavedExtentIndex; ++i) {
        newSavedExtents.push(this.savedExtents[i]);
    }
    this.savedExtents = newSavedExtents;

    // append current extent to the list
    this.savedExtents.push(newExtent);
    ++this.currentSavedExtentIndex;
}

function formatExtent (extent) {
    return { left : extent.left, bottom : extent.bottom, right : extent.right, top : extent.top };
}

module.exports = saveCurrentExtent;

},{"./extents_equal.js":23}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
function zoomToNextExtent () {
    if (this.currentSavedExtentIndex < this.savedExtents.length-1) {
        ++this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToNextExtent;

},{}],22:[function(require,module,exports){
function zoomToPreviousExtent () {
    if (this.currentSavedExtentIndex > 0) {
        --this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToPreviousExtent;

},{}],23:[function(require,module,exports){
function extentsAreEqual (e1, e2) {
    var tolerance = 0.001;
    return ((Math.abs(e1.left - e2.left)        <= tolerance)
            && (Math.abs(e1.bottom - e2.bottom) <= tolerance)
            && (Math.abs(e1.right  - e2.right)  <= tolerance)
            && (Math.abs(e1.top    - e2.top)    <= tolerance));
}

module.exports = extentsAreEqual;

},{}],24:[function(require,module,exports){
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
                            label : label,
                            proxyServerType: this.seldonLayer.proxyServerType // allows us to specify server type for proxied layers
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
                var result = (service.proxyServerType === "ArcGIS" || seldon.gisServerType === "ArcGIS") ?
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
                if ((
                     layerName.indexOf("FW2") >= 0 ||
                     stringStartsWith(layerName, "EFETAC-NASA") ||
                     stringStartsWith(layerName, "RSAC-FHTET")
                    ) && children[i].nodeName === "value_0"
                   ) {
                    value = value + sprintf(" (%.2f %%)", ((parseFloat(value,10)-127) / 128.0 ) * 100);
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

},{"./clicktool.js":14,"./legend_config.js":35,"./stringContainsChar.js":55}],25:[function(require,module,exports){
module.exports = function (app) {
    var ShareUrlInfo = require('./share.js');

    function init (config, projection, legendLookup, gisServerType, useProxyScript) {
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.projection = projection;
        seldon.projection = projection;
        app.legendLookup = legendLookup
        seldon.gisServerType = gisServerType;
        seldon.useProxyScript = useProxyScript;
        app.launch(config, shareUrlInfo);
        seldon.app = app;
    }

    return init;
}

},{"./share.js":52}],26:[function(require,module,exports){
function initOpenLayers (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
    var app = this;
    var resolutions = [
        156543.03390625,    // 0
        78271.516953125,    // 1
        39135.7584765625,   // 2
        19567.87923828125,  // 3
        9783.939619140625,  // 4
        4891.9698095703125, // 5
        2445.9849047851562, // 6
        1222.9924523925781, // 7
        611.4962261962891,  // 8
        305.74811309814453, // 9
        152.87405654907226, // 10
        76.43702827453613,  // l1
        38.218514137268066, // 12
        19.109257068634033, // 13
        9.554628534317017,  // 14
        4.777314267158508,  // 15
        2.388657133579254,  // 16
        1.194328566789627,  // 17
        0.5971642833948135  // 18
    ]
    if (baseLayer.type == 'Google') {
        var layer = new OpenLayers.Layer.Google("Google Streets", {numZoomLevels: 20});
    } else if (baseLayer.type == 'WMTS')  {
        var settings = {
            isBaseLayer: true,
            name: baseLayer.name,
            style: baseLayer.style,
            url: baseLayer.url,
            layer: baseLayer.name,
            matrixSet: baseLayer.tileMatrixSet,
            sphericalMercator: true,
            resolutions: resolutions
        }
        if (baseLayer.numZoomLevels) {
            var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
            settings.resolutions = resolutions
            settings.serverResolutions = serverResolutions
        }
        var layer = new OpenLayers.Layer.WMTS(settings)
    } else if (baseLayer.type == 'ArcGISCache') {
        var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
            layerInfo: baseLayerInfo,
        });
    }

    var maxExtentBounds;
    if (theme.xmax && theme.xmin && theme.ymax && theme.ymin) {
    maxExtentBounds = new OpenLayers.Bounds(
        theme.xmin,
        theme.ymin,
        theme.xmax,
        theme.ymax
    );
    } else {
    maxExtentBounds = new OpenLayers.Bounds(
            app.maxExtent.left,
            app.maxExtent.bottom,
            app.maxExtent.right,
            app.maxExtent.top
    );
    }

    if (initialExtent === undefined) {
        //take the extent coming from the config file
        initialExtent = app.maxExtent;
    }

    app.tileManager = new OpenLayers.TileManager({
        cacheSize: 12,
        moveDelay: 750,
        zoomDelay: 750
    });

    app.map = new OpenLayers.Map('map', {
        maxExtent:         maxExtentBounds,
        units:             'm',
        resolutions:       layer.resolutions,
        numZoomLevels:     layer.numZoomLevels,
        tileManager:       app.tileManager,
        controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.Attribution(),
            app.zoomInTool,
            app.zoomOutTool,
            app.identifyTool,
            app.multigraphTool,
            app.markerTool
        ],
        eventListeners:
        {
            "moveend": function () { app.emit("extentchange"); },
            "zoomend": function () { app.emit("extentchange"); }
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
    app.setTheme(theme, themeOptions);
    app.zoomToExtent(initialExtent);
    app.map.events.register("mousemove", app.map, function (e) {
        var pixel = app.map.events.getMousePosition(e);
        var lonlat = app.map.getLonLatFromPixel(pixel);
        lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:3857"), new OpenLayers.Projection("EPSG:4326"));
        OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
    });
    app.map.addControl(new OpenLayers.Control.PanZoomBar());
}

module.exports = initOpenLayers;

},{}],27:[function(require,module,exports){
module.exports = function ($) {
    var createSplashScreen = require("./splash.js")($);
    var handle_search = require("./search.js")($);
    var ga_events = require("./set_google_analytics_events.js");

    var areasList = [];
    var activeBtn = [];

    function launch (configFile, shareUrlInfo) {
        var deactivateActiveOpenLayersControls = require("./deactivate_controls.js")(this, activeBtn);
        var printMap = require("./print.js")($, this);
        
        var app = this;

        app.initialThemeLoad = true;

        var $configXML;

        $.ajax({
            url: configFile,
            dataType: "xml",
            success: function (configXML) {
                $configXML = app.parseConfig(configXML, shareUrlInfo);
                ga_events($);
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
            position : { my: "left top", at: "left+5 top+100" },
            autoOpen : true,
            hide     : "fade",
            width    : 330
        });

        app.addListener("accordiongroupchange", function () {
            if (app.currentTheme) {
                $('#layerPickerAccordion').accordion({
                        active      : app.currentTheme.getAccordionGroupIndex(app.currentAccordionGroup),
                        collapsible : true,
                        beforeActivate: function (event, ui) {
                            if (!app.initialThemeLoad) {
                                $("#layerPickerDialog").scrollTop(0)
                            }
                        },
                        activate: function (event, ui) {
                            app.setupCollapsibleSublists(ui)
                            if (app.initialThemeLoad) {
                                app.initialThemeLoad = false
                                $("#layerPickerDialog").scrollTop(755)
                            }
                        }
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
            position : { my: "right top", at: "right-5 top+100" },
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
            //jdm 4/28/15: removed this as it seem to be throwing things off
                        //when panning outside of current view extent.  Instead moved it to the bottom of
                        //setTheme because that is where a change such as switching to the Alaska theme
                        //can be caught.  However, in general it shouldn't be necessary to be updating the
                        //maxExtent within the CONUS which will be the case 99% of the time
                        // app.map.setOptions({maxExtent: app.map.getExtent()});
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
            if ($configXML !== undefined) {
                printMap($configXML);
            } else {
                console.log("Can't print yet; config file not yet parsed");
            }
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
            deactivateActiveOpenLayersControls();
            app.identifyTool.activate();
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
            deactivateActiveOpenLayersControls();
            app.multigraphTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // marker button
        //
        $("#btnMarker").click(function () {
            deactivateActiveOpenLayersControls();
            app.markerTool.activate();
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

        // Location based search
        $("#address_lookup").on("click", function () {
            var location = $("#address_field").val();
            handle_search(location, app);
        });

        $("#address_field").on("keypress", function (e) {
            if (e.which === 13) {
                var location = $(this).val();
                handle_search(location, app);
            }
        });

        //jdm: 7/9/12 - for global mask functionality
        $('.mask-toggle').on('click', function () {
            if ($(this).is(':checked')) {
                //console.log("setMaskByMask at line 789");
                app.setMaskByMask(true, this.value);
            } else {
                app.setMaskByMask(false, this.value);
            }
        });

        $("[data-mask-grouper='true']").on("change", function () {
            var disabled = $(this).is(':checked') ? true : false;
            $("[data-mask-parent='" + this.value + "']").attr('disabled', disabled);
        });

        $('.mask-modifier').on('change', function () {
            var value = $(this).is(':checked') ? this.value : "";
            var index = $(this).data("index");

            if ($(this).data("maskGrouper") === true) {
                app.handleMaskModifierGroup(this.value, $(this).is(':checked'));
            }

            app.handleMaskModifier(value, index);
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

},{"./deactivate_controls.js":17,"./print.js":43,"./search.js":45,"./set_google_analytics_events.js":48,"./splash.js":54}],28:[function(require,module,exports){
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
        this.createOpenLayersLayer = function () {
            if (this.openLayersLayer !== undefined) {
                return this.openLayersLayer;
            }

            var options = {
                isBaseLayer      : false,
                transitionEffect : 'resize',
                buffer           : 0,
                singleTile       : true,
                ratio            : 1
            };

            if (this.type === "WMTS") {
                var settings = {
                    name: this.name,
                    url: this.url,
                    layer: this.layers,
                    style: this.style,
                    matrixSet: this.srs,
                    isBaseLayer: false,
                    transitionEffect: "resize",
                    format: "image/jpg",
                    sphericalMercator: true,
                }
                if (this.lid.indexOf("GLAM") > -1) {
                    $.extend(true, settings, {
                        serverResolutions: [
                          156543.033928041,
                          78271.5169640205,
                          39135.7584820102,
                          19567.8792410051,
                          9783.9396205026,
                          4891.9698102513,
                          2445.9849051256,
                          1222.9924525628,
                          611.4962262814,
                          305.7481131407048,
                        ],
                        units: "m",
                        tileOrigin: new OpenLayers.LonLat(-20037508.34, 20037508.34)
                    })
                }
                this.openLayersLayer = new OpenLayers.Layer.WMTS(settings)

            } else if (this.type === "XYZ") {
                this.openLayersLayer = new OpenLayers.Layer.XYZ(
                    this.name,
                    this.url,
                    { isBaseLayer: false,
                      projection  : new OpenLayers.Projection(seldon.projection)
                    }
                )
            } else if (this.type === "ArcGIS93Rest") {
                this.openLayersLayer = new OpenLayers.Layer.ArcGIS93Rest(
                    this.name,
                    this.url,
                    // The following expression returns either this.params, if it has no mosaicRule property, or
                    // a copy of this.params in which the mosaicRule property has been stringified, if this
                    // mosaicRule property is present:
                    ( this.params.mosaicRule ?
                      $.extend(true, {}, this.params, { 'mosaicRule' : JSON.stringify(this.params.mosaicRule) }) :
                      this.params),
                    options
                );
            } else {
                if (this.maxResolution) {
                    options.maxResolution = parseFloat(this.maxResolution);
                }
                var layer = this.layers + (("mask" in this) ? app.maskModifiers.join("") : "");

                this.openLayersLayer = new OpenLayers.Layer.WMS(
                    this.name,
                    this.url,
                    {
                        projection  : new OpenLayers.Projection(seldon.projection),
                        units       : "m",
                        layers      : layer,
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
            this.openLayersLayer.setOpacity(1 - parseFloat(this.transparency)/100.0);
            this.openLayersLayer.seldonLayer = this;
            return this.openLayersLayer;
        };

        this.activate = function (options) {
            options = options || {}

            this.addToLegend();

            this.emit("activate");
            // Is "this" a parent layer that supports masking?
            if (this.mask === "true" && this.lid.indexOf("MaskFor") === -1) { 
                // Are any masks currently active? 
                if (app.masks.length > 0) {
                    // There's at least one mask active.
                    // Add mask layers to the map for each active mask.
                    app.setMaskByLayer(true, this);
                } else {
                    // No active masks, so add parent layer to the map.
                    this.visible = "true"
                    app.map.addLayer(this.createOpenLayersLayer());
               }
               // Add parent layer to maskParentLayers array, but only if it's not already there... (this is to avoid an infinite for loop elsewhere)
               var inMaskParentLayers = app.maskParentLayers.filter(function(layer) {
                   return this === layer;
               }, this).length;
               if (!inMaskParentLayers) {
                   app.maskParentLayers.push(this)
               }
 
            } else {
                // "this" is either a mask layer or a layer that does not support landscape masks.
                // Either way, we can just add it to the map.
                this.visible = "true";
                app.map.addLayer(this.createOpenLayersLayer())
            }

            vectorServices = [ 'vlayers', 'fire', 'ads' ]
            boundaryServices = [ 'boundaries' ]
            allVectorServices = vectorServices
            Array.prototype.push.apply(allVectorServices, boundaryServices)

            var isVectorLayer = function (layer, serviceNames) {
                return serviceNames.filter(function (serviceName) {
                    return layer.url && layer.url.indexOf(serviceName + "?") > -1
                }).length
            }

            //View order rules:
            // 1. Baselayer (always stays at index 0, so always skip here)
            // 2. Boundaries (last for loop)
            // 3. Non-boundary vector layers (second loop)
            // 4. Raster layers (ordered by seldon index)
            
            // Note: layers with a higher openlayers index draw on top of layers with a lower index
            // Layers with a lower seldonLayer index draw on top of layers with a higher seldonLayer index

            if (app.map.getNumLayers() > 1) {

                var lyrJustAdded = app.map.layers[app.map.getNumLayers() - 1]

                if (!isVectorLayer(lyrJustAdded, allVectorServices)) {

                    // Order by seldon index first (based on order the layer appears in the may layer picker)
                    for (var i = app.map.getNumLayers() - 2; i > 0; i--) {
                        var nextLayerDown = app.map.layers[i];
                        if (!isVectorLayer(nextLayerDown, allVectorServices)) {
                            if (nextLayerDown.seldonLayer.index < lyrJustAdded.seldonLayer.index) {
                                app.map.setLayerIndex(lyrJustAdded, i)
                            }
                        }

                    }

                }

                for (var i = app.map.getNumLayers() - 1; i > 0; i--) {
                    var nextLayerDown = app.map.layers[i];
                    if (isVectorLayer(nextLayerDown, vectorServices)) {
                        app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1)
                    }
                }

                for (var i = app.map.getNumLayers() - 1; i > 0; i--) {
                    var nextLayerDown = app.map.layers[i];
                    if (isVectorLayer(nextLayerDown, boundaryServices)) {
                        app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1)
                    }
                }
            }

            app.updateShareMapUrl();
            app.map.updateSize();
        };

        this.deactivate = function (options) {
            options = options || {}
            if (this.visible === "true") {
                app.map.removeLayer(this.openLayersLayer);
                this.visible = "false"
            }

            if (!this.parentLayer) {
                app.setMaskByLayer(false, this);
            }

            if (options.removeFromLegend) {
                this.removeFromLegend()

            }

            if (options.removeFromParentMaskLayers) {
                app.maskParentLayers = app.maskParentLayers.filter(function (layer) {
                    return layer.lid !== this.lid
                }, this)
            }

            if (this.openLayersLayer && this.openLayersLayer.loadingimage) {
                this.openLayersLayer.loadingimage.removeClass("loading");
            }

            this.emit("deactivate");
        };

        this.addToLegend = function () {
            var that = this;
            var $legend = $("#legend");
            //clear out old legend graphic if necessary
            var lid = this.parentLayer ? this.parentLayer.lid : this.lid
            $(document.getElementById("lgd" + lid)).remove();

            this.$legendItem = $(document.createElement("div")).attr("id", "lgd" + lid)
                .prepend($(document.createElement("img")).attr("src", this.legend))
                .click(function () {
                    that.deactivate();
                    if (that.parentLayer) {
                        that.parentLayer.deactivate({ removeFromParentMaskLayers: true });
                    }
                    that.removeFromLegend()
                });

            if (this.url.indexOf("vlayers") > -1) {
                this.$legendItem.prependTo($legend);
            } else {
                this.$legendItem.appendTo($legend);
            }
        };

        this.removeFromLegend = function () {
            if (this.$legendItem) this.$legendItem.remove();
        };

        this.setTransparency = function (transparency) {
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(1 - parseFloat(transparency)/100.0);
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

            // Handle transparency for mask
            // Still need to make this parent-layer specific
            if (app.map !== undefined) {
                var currentLayer, openLayersLayer, lid;
                var i;
                for (i = app.map.getNumLayers()-2; i > 0; i--) {
                    currentLayer = app.map.layers[i];
                    openLayersLayer = currentLayer.seldonLayer.openLayersLayer;
                    lid = currentLayer.seldonLayer.lid;

                    if (stringContainsChar(currentLayer.name, 'Mask')) {
                        if (openLayersLayer && (lid.substring(0, lid.indexOf("MaskFor")) === this.lid)) {
                            openLayersLayer.setOpacity(1 - parseFloat(transparency)/100.0);
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

},{"./stringContainsChar.js":55}],29:[function(require,module,exports){
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
                layer.deactivate({ removeFromLegend: true, removeFromParentMaskLayers: true });
            }
        };
        $checkbox = $(checkbox);
        $checkbox.addClass(layer.lid)
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $('input.'+this.lid).attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $('input.'+this.lid).attr('checked', false);
        });
        // return the new checkbox DOM element
        return checkbox;
    }

    return createLayerToggleCheckbox;
}

},{}],30:[function(require,module,exports){
// This function gets called every time the layer properties icon gets clicked
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


},{}],31:[function(require,module,exports){
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

},{"./layer_dialog.js":30}],32:[function(require,module,exports){
module.exports = function ($, app) {
    var generalRadioHandler = require("./layer_radio_handler.js")($, app);

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
        $checkbox = $(checkbox);

        $checkbox.change(radioHandler);

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

    function radioHandler () {
        generalRadioHandler(app);
    }

    return createLayerToggleRadioButton;
}

},{"./layer_radio_handler.js":33}],33:[function(require,module,exports){
module.exports = function ($, app) {
    var Layer = require('./layer.js')($, app);

    function radioHandler (app) {
        var $selectedOption = $(app.dropdownBoxList[0]).find(":selected");
        if ($selectedOption.text() === "select...") {
            clearRadioLayers(app, null);
            return;
        }

        var selectLayer = app.dropdownBoxLayers[$selectedOption.val()];
        var wanted_lid = getActiveDropdownBoxRadioLID(app);
        var wanted_layer = undefined;
        var i;

        for (i = 0; i < app.radioButtonList.length; i++) {
            if (app.radioButtonList[i].checked) {
                wanted_layer = parseInt(selectLayer.layers, 10) + parseInt(app.radioButtonLayers[i].layers, 10);
            }
        }

        var checkBoxLayer = new Layer({
            lid      : wanted_lid,
            visible  : selectLayer.visible,
            url      : selectLayer.url,
            srs      : selectLayer.srs,
            layers   : wanted_layer,
            identify : selectLayer.identify,
            name     : wanted_lid,
            mask     : selectLayer.mask,
            legend   : selectLayer.legend,
            index    : selectLayer.index
        });
        checkBoxLayer.activate();

        // Clear out any previously active layers, not needed any more
        clearRadioLayers(app, wanted_lid);
    }

    function clearRadioLayers (app, wanted_lid) {
        var currLayer, testLid;
        var i, j, k;
        for (i = app.map.getNumLayers() - 1; i > 0; i--) {
            currLayer = app.map.layers[i].seldonLayer;
            // Outer loop radio buttons
            for (j = 0; j < app.radioButtonLayers.length; j++) {
                // Inner loop drop-down list
                for (k = 0; k < app.dropdownBoxLayers.length; k++) {
                    testLid = app.radioButtonLayers[j].lid + app.dropdownBoxLayers[k].lid;
                    if (currLayer.lid === testLid && wanted_lid !== testLid)
                        currLayer.deactivate();
                }
            }
        }
    }

    function getActiveDropdownBoxRadioLID (app) {
        var selectLayer = app.dropdownBoxLayers[$(app.dropdownBoxList[0]).find(":selected").val()];
        var i;

        if (selectLayer) {
            var wanted_lid = selectLayer.lid;
        } else {
            return null;
        }

        for (i = 0; i < app.radioButtonList.length; i++) {
            if (app.radioButtonList[i].checked) {
                wanted_lid = app.radioButtonLayers[i].lid + wanted_lid;
                break;
            }
        }
        return wanted_lid;
    }

    return radioHandler;
}

},{"./layer.js":28}],34:[function(require,module,exports){
module.exports = function ($, app) {
    var radioHandler = require("./layer_radio_handler.js")($, app);

    function createLayerToggleDropdownBox (lastLayerInGroup, selectBoxLayers, selectBoxGroupName) {
        var selectBox = document.createElement("select"), $selectBox;
        var i;

        selectBox.setAttribute("id", selectBoxGroupName);

        // Loop through selectBoxLayers adding to options accordingly
        for (i = 0; i < selectBoxLayers.length; i++) {
            selectBox.insertAdjacentHTML("afterbegin", "<option value='" + i + "'>" + selectBoxLayers[i].name + "</option>");
        }

        // add one blank one at the top
        selectBox.insertAdjacentHTML("afterbegin", "<option value='-1' selected>select...</option>");

        // Change event listener
        $(selectBox).change(selectHandler);

        return selectBox;
    }

    function selectHandler () {
        radioHandler(app);
    }

    return createLayerToggleDropdownBox;
}

},{"./layer_radio_handler.js":33}],35:[function(require,module,exports){
/**
 * Layer legends often correspond a number with a description
 * with certain colors. When a user clicks on the map while using
 * the identify tool, a GetFeatureInfo request is made to MapServer
 * to get the pixel values for all active layers at the clicked point.
 * This file stores the legend descriptions associated with the pixel values
 * for all relevant layers, and has some functions for
 * managing and retrieving these descriptions.
 */

module.exports = function ($, app) {

  function isLayerInLegendConfig(layerId) {
    return layerId in app.legendLookup
  }

  function getLegendStringFromPixelValue(layerId, pixelValue) {
    var legendString = ''
    if (isLayerInLegendConfig(layerId)) {
      legendString = app.legendLookup[layerId][pixelValue]
      if (!legendString) {
        console.error('No legend string set for pixel value',
          pixelValue, 'for layer', layerId
        )
      }
    }
    return legendString
  }
  
  return getLegendStringFromPixelValue
}



},{}],36:[function(require,module,exports){
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

},{"../libs/FileSaver/FileSaver.js":58,"./clicktool.js":14}],37:[function(require,module,exports){
function Mask (maskName) {
    window.EventEmitter.call(this);
    this.maskName = maskName;
    this.maskLayers = [];
}

module.exports = Mask;

},{}],38:[function(require,module,exports){
function handleMaskModifier(name, index) {
    var app = this;
    var seldonLayer;
    var i;

    app.maskModifiers[index] = name;

    for (i = 0; i < app.map.layers.length; i++) {
        seldonLayer = app.map.layers[i].seldonLayer;
        if (seldonLayer && ("mask" in seldonLayer)) {
            seldonLayer.openLayersLayer.params.LAYERS = seldonLayer.layers + app.maskModifiers.join('');
            seldonLayer.openLayersLayer.redraw(true);
        }
    }

    for (i = 0; i < app.maskParentLayers.length; i++) {
        seldonLayer = app.maskParentLayers[i];
        if (seldonLayer && ("mask" in seldonLayer)) {
            seldonLayer.openLayersLayer.params.LAYERS = seldonLayer.layers + app.maskModifiers.join('');
            seldonLayer.openLayersLayer.redraw(true);
        }
    }
    app.updateShareMapUrl();
}

module.exports = handleMaskModifier;

},{}],39:[function(require,module,exports){
module.exports = function ($) {
    /**
     * When a mask grouper is enabled this function removes any modifiers from
     * its children. When a mask grouper is disabled the function re-enables any
     * modifiers that were disabled.
     */
    function handleMaskModifierGroup(parent, disabled) {
        var app = this;
        var children = $("[data-mask-parent='" + parent + "']");
        var child;
        var name;
        var index;
        var i;

        for (i = 0; i < children.length; i++) {
            child = children[i];
            if (disabled === true) {
                name = "";
            } else if ($(child).is(':checked')) {
                name = child.value;
            } else {
                name = "";
            }
            index = $(child).data("index");
            app.maskModifiers[index] = name;
        }
    }

    return handleMaskModifierGroup;
}


},{}],40:[function(require,module,exports){
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

},{"./clicktool.js":14}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
module.exports = function ($) {
    var createArcGIS93RestParams = require("./create_arcgis_rest_params.js")($);
    var AccordionGroup           = require("./accordion_group.js");
    var AccordionGroupSublist    = require("./accordion_group_sublist.js");
    var BaseLayer                = require("./baselayer.js");
    var Theme                    = require("./theme.js");

    function parseConfig (configXML, shareUrlInfo) {
        var Layer = require("./layer.js")($, this);
        var createIdentifyTool = require("./identify.js")($, this);
        var createMultigraphTool = require("./multigraph.js")($, this);
        var marker = require("./marker.js")($, this);

        var app = this,
            $configXML = $(configXML),
            initialBaseLayer,
            initialTheme,
            shareUrlLayerAlpha = {},
            themeOptions = {},
            i, j, k,
            l, ll, lll;

        if (shareUrlInfo !== undefined) {
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
                index    : i,
                layer: $image.attr('layers'),
                type: $image.attr('type'),
                style: $image.attr('style'),
                tileMatrixSet: $image.attr('tileMatrixSet'),
                numZoomLevels: $image.attr('numZoomLevels')
            });
            app.baseLayers.push(baseLayer);
            $baseCombo.append($(document.createElement("option")).attr("value", i).text(baseLayer.label));
            if ((shareUrlInfo && shareUrlInfo.baseLayerName === baseLayer.name) ||
                (!shareUrlInfo  && selected)) {
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
                //selectedInConfig : ($wmsGroup.attr('selected') === "true")
            });
            app.accordionGroups.push(accordionGroup);
            accordionGroupsByName[accordionGroup.name] = accordionGroup;
            if (shareUrlInfo && (shareUrlInfo.accordionGroupGid === accordionGroup.gid)) {
                themeOptions.accordionGroup = accordionGroup;
            }
            $wmsSubgroups = $wmsGroup.find("wmsSubgroup");
            for (j = 0, ll = $wmsSubgroups.length; j < ll; j++) {
                $wmsSubgroup = $($wmsSubgroups[j]); // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                sublist = new AccordionGroupSublist(
                    $.extend({}, {
                        sid   : $wmsSubgroup.attr('sid'),
                        label : $wmsSubgroup.attr('label'),
                        type  : $wmsSubgroup.attr('type'),
                        description : $wmsSubgroup.attr('description'),
                        collapsible : ($wmsSubgroup.attr('collapsible') === "true"),
                        break : ($wmsSubgroup.attr('break') === "true")
                    })
                );

                accordionGroup.sublists.push(sublist);
                $wmsLayers = $wmsSubgroup.find("wmsLayer,restLayer,wmtsLayer,xyzLayer");
                for (k = 0, lll = $wmsLayers.length; k < lll; k++) {
                    $wmsLayer = $($wmsLayers[k]);
                    if ($wmsLayer[0].tagName === "wmtsLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "WMTS",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                srs              : $wmsLayer.attr('srs'),
                                layers           : $wmsLayer.attr('layers'),
                                styles           : $wmsLayer.attr('styles'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                attribution      : $wmsLayer.attr('attribution'),
                                format           : $wmsLayer.attr('format'),
                                numZoomLevels    : $wmsLayer.attr('numZoomLevels'),
                                description      : ($wmsLayer.attr('description') ? $wmsLayer.attr('description') : undefined),                               
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined)
                            })
                        )
                    }
                    else if ($wmsLayer[0].tagName === "wmsLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "WMS",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                srs              : $wmsLayer.attr('srs'),
                                layers           : $wmsLayer.attr('layers'),
                                styles           : $wmsLayer.attr('styles'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                proxyServerType  : ($wmsLayer.attr('proxyServerType')) ? $wmsLayer.attr('proxyServerType') : undefined,
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                description      : ($wmsLayer.attr('description') ? $wmsLayer.attr('description') : undefined),
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined),
                                maxResolution    : $wmsLayer.attr('maxResolution') ? $wmsLayer.attr('maxResolution') : undefined
                            })
                        );
                    }
                    else if ($wmsLayer[0].tagName === "xyzLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "XYZ",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                description      : ($wmsLayer.attr('description') ? $wmsLayer.attr('description') : undefined),
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined),
                            })
                        );

                    } else {
                        layer = new Layer({
                            type             : "ArcGIS93Rest",
                            name             : $wmsLayer.attr('name'),
                            lid              : $wmsLayer.attr('lid'),
                            visible          : $wmsLayer.attr('visible'),
                            url              : $wmsLayer.attr('url'),
                            identify         : $wmsLayer.attr('identify'),
                            legend           : $wmsLayer.attr('legend'),
                            selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                            params           : createArcGIS93RestParams($wmsLayer),
                            description      : ($wmsLayer.attr('description') ? $wmsLayer.attr('description') : undefined),
                            break            : ($wmsLayer.attr('break') == "true" ? true : undefined)
                        })
                    }
                    layer.index = index;
                    sublist.layers.push(layer);
                    if (shareUrlInfo && (shareUrlLayerAlpha[layer.lid] !== undefined)) {
                        if (themeOptions.layers === undefined) {
                            themeOptions.layers = [];
                        }
                        layerInThemeOptionsLayers = themeOptions.layers.filter(function (optionLayer) {
                            return layer.lid === optionLayer.lid
                        }).length
                        if (!layerInThemeOptionsLayers) {
                            layer.selectedInConfig = true
                            themeOptions.layers.push(layer);
                            layer.setTransparency(100 * (1-shareUrlLayerAlpha[layer.lid]));
                        }
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
            if (themeOptions.maskModifiers === undefined) {
                themeOptions.maskModifiers = [];
            }
            for (i = 0, l = shareUrlInfo.maskModifiers.length; i < l; i++) {
                themeOptions.maskModifiers.push(shareUrlInfo.maskModifiers[i]);
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
                    accordionGroup.selectedInConfig = $viewGroup.attr('selected') === 'true';
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
        app.markerTool = marker();

        var initialExtent;

        if (shareUrlInfo) {
            initialExtent = shareUrlInfo.extent;
        }

        // Hardcoded service information here for faster loading
        // Now assuming street maps is always init base layer
        // comes from: initialBaseLayer.url + '?f=json&pretty=true'
        var baseLayerInfo = {"currentVersion":10.01,"serviceDescription":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including our terms of use, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.","mapName":"Layers","description":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including the terms of use, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map","copyrightText":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012","layers":[{"id":0,"name":"World Street Map","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"tables":[],"spatialReference":{"wkid":102100},"singleFusedMapCache":true,"tileInfo":{"rows":256,"cols":256,"dpi":96,"format":"JPEG","compressionQuality":90,"origin":{"x":-20037508.342787,"y":20037508.342787},"spatialReference":{"wkid":102100},"lods":[{"level":0,"resolution":156543.033928,"scale":591657527.591555},{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},{"level":3,"resolution":19567.8792409999,"scale":73957190.948944},{"level":4,"resolution":9783.93962049996,"scale":36978595.474472},{"level":5,"resolution":4891.96981024998,"scale":18489297.737236},{"level":6,"resolution":2445.98490512499,"scale":9244648.868618},{"level":7,"resolution":1222.99245256249,"scale":4622324.434309},{"level":8,"resolution":611.49622628138,"scale":2311162.217155},{"level":9,"resolution":305.748113140558,"scale":1155581.108577},{"level":10,"resolution":152.874056570411,"scale":577790.554289},{"level":11,"resolution":76.4370282850732,"scale":288895.277144},{"level":12,"resolution":38.2185141425366,"scale":144447.638572},{"level":13,"resolution":19.1092570712683,"scale":72223.819286},{"level":14,"resolution":9.55462853563415,"scale":36111.909643},{"level":15,"resolution":4.77731426794937,"scale":18055.954822},{"level":16,"resolution":2.38865713397468,"scale":9027.977411},{"level":17,"resolution":1.19432856685505,"scale":4513.988705},{"level":18,"resolution":0.597164283559817,"scale":2256.994353},{"level":19,"resolution":0.298582141647617,"scale":1128.497176}]},"initialExtent":{"xmin":-28872328.0888923,"ymin":-11237732.4896886,"xmax":28872328.0888923,"ymax":11237732.4896886,"spatialReference":{"wkid":102100}},"fullExtent":{"xmin":-20037507.0671618,"ymin":-19971868.8804086,"xmax":20037507.0671618,"ymax":19971868.8804086,"spatialReference":{"wkid":102100}},"units":"esriMeters","supportedImageFormatTypes":"PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP","documentInfo":{"Title":"World Street Map","Author":"Esri","Comments":"","Subject":"streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ","Category":"transportation(Transportation Networks) ","Keywords":"World, Global, Europe, Japan, Hong Kong, North America, United States, Canada, Mexico, Southern Africa, Asia, South America, Australia, New Zealand, India, Argentina, Brazil, Chile, Venezuela, Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, Switzerland, Russia, Thailand, Turkey, 2012","Credits":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"},"capabilities":"Map"};
        app.initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);

        return $configXML;
    }

    function displayError (message) {
        //console.log(message);
    }

    return parseConfig;
}

},{"./accordion_group.js":3,"./accordion_group_sublist.js":5,"./baselayer.js":13,"./create_arcgis_rest_params.js":16,"./identify.js":24,"./layer.js":28,"./marker.js":36,"./multigraph.js":40,"./theme.js":56}],43:[function(require,module,exports){
module.exports = function ($, app) {
    function printMap ($configXML) {
        // go through all layers, and collect a list of objects
        // each object is a tile's URL and the tile's pixel location relative to the viewport
        var offsetX = parseInt(app.map.layerContainerDiv.style.left, 10);
        var offsetY = parseInt(app.map.layerContainerDiv.style.top, 10);
        var size  = app.map.getSize();
        var tiles = [];
        var layer, tile, position;
        var i, j, k;

        for (i = 0; i < app.map.layers.length; ++i) {
            // if the layer isn't visible at this range, or is turned off, skip it
            try {
                layer = app.map.layers[i];
                if (!layer.getVisibility()) continue;
                if (!layer.calculateInRange()) continue;
                // iterate through their grid's tiles, collecting each tile's extent and pixel location at this moment
                // for (var tilerow in layer.grid) {
                for (j = 0; j < layer.grid.length; ++j) {
                    for (k = 0; k < layer.grid[j].length; ++k) {
                        tile     = layer.grid[j][k];
                        position = tile.position;
                        tiles.push({
                            url     : layer.getURL(tile.bounds),
                            x       : position.x + offsetX,
                            y       : position.y + offsetY,
                            opacity : layer.opacity ? parseInt(100*layer.opacity, 10) : 100
                        });
                    }
                }
            } //end try
            catch(err) {
                alert(err.message);
            }
        }

        //the legend url to pass along
        var layerLegendsURLs = [];
        $('#legend').find('div').each(function () {
            var url = $(this).children('img').attr('src');
            if (!url.match(/^http/)) {
                // it's a relative URL, so make it absolute
                url = window.location.href.replace(/\/[^\/]*$/, "/") + url;
            }
            layerLegendsURLs.push({ url: url });
        });

        // hand off the list to our server-side script, which will do the heavy lifting
        var tiles_json = JSON.stringify(tiles);
        var legends_json = JSON.stringify(layerLegendsURLs);
        var printPopup = $(document.createElement('div'));
        printPopup.id = "printPopupDiv";
        printPopup.html('<div id="printMapLoader"><center><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></center></div>');
        printPopup.dialog({
            resizable : false,
            height    : 75,
            title     : 'Creating Image for Print...',
            close     : function (event, ui) {
                $(this).remove();
            }
        });

        // Note: in what follows, we use default values for the print configuration so that
        // in viewer installations which do not configure <tool name="Print"> with details,
        // we fall back on the previous seldon print behavior, which was hardcoded to work
        // for FCAV.
        var service_url = $configXML.find("tools tool[name=Print]").attr("service_url");
        if (!service_url) {
            service_url = 'http://'+window.location.hostname+window.location.pathname; // default
        }
        service_url = service_url.replace(/\/$/, "");
        var service_name = $configXML.find("tools tool[name=Print]").attr("service_name");
        if (!service_name) {
            service_name = 'cgi-bin/print.cgi'; // default
        }
        var title = $configXML.find("tools tool[name=Print]").attr("title");
        if (!title) {
            title = "U.S Forest Change Assessment Viewer"; // default
        }
        // NOTE: use $.ajax() here rather than OpenLayers.Request.POST(), because OpenLayers.Request.POST()
        // seems to act poorly when dealing with cross-domain requests (specifically, it omits passing
        // the `data` object in that case!).  mbp Tue May 26 17:38:32 2015
        $.ajax({
            url: service_url + "/" + service_name,
            type: "POST",
            data: OpenLayers.Util.getParameterString({width:size.w,height:size.h,tiles:tiles_json,legends:legends_json,title:title}),
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            success: function(data,status,jqxhr) {
                data = data.replace(/\s+/, ""); // remove all whitespace from data string; what's left is the rel URL of the image
                var href = service_url + "/cgi-bin/printed_map.jpg";
                if (data) {
                    href = service_url + "/" + data; // default
                }
                $("#printMapLoader").html('<center><a href="' + href + '" style="color:blue" target="_new">print image result</a></center>');
                printPopup.dialog('option', 'title', 'Print Image Created!');
            },
            error:  function(jqxhr,status,err) {
                $("#printMapLoader").html('<center>An error happended.</center>');
                printPopup.dialog('option', 'title', 'NO Print Image Created!');
            }
        });

    }

    return printMap;
};

},{}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{"./app.js":11,"./init.js":25,"./overrides.js":41}],47:[function(require,module,exports){
module.exports = function ($) {
    function setBaseLayer (baseLayer) {
        // Resolutions for GoogleMapsCompatible Well-Known Scale Set
        // See Table E.4 in Appendix E of WMTS Spec (https://portal.ogc.org/files/?artifact_id=35326)
        var resolutions = [
            156543.03390625,    // 0
            78271.516953125,    // 1
            39135.7584765625,   // 2
            19567.87923828125,  // 3
            9783.939619140625,  // 4
            4891.9698095703125, // 5
            2445.9849047851562, // 6
            1222.9924523925781, // 7
            611.4962261962891,  // 8
            305.74811309814453, // 9
            152.87405654907226, // 10
            76.43702827453613,  // l1
            38.218514137268066, // 12
            19.109257068634033, // 13
            9.554628534317017,  // 14
            4.777314267158508,  // 15
            2.388657133579254,  // 16
            1.194328566789627,  // 17
            0.5971642833948135  // 18
        ]
        var app = this;
        if (baseLayer.type == 'Google') {
            var layer = new OpenLayers.Layer.Google("Google Streets");
            handleBaseLayer(app, layer, baseLayer);
        }
        else if (baseLayer.type == 'ArcGISCache') { //assuming esri base layer at this point
            $.ajax({
                url: baseLayer.url + '?f=json&pretty=true',
                dataType: "jsonp",
                success:  function (layerInfo) {
                    var options = { layerInfo: layerInfo }
                    if (baseLayer.numZoomLevels) {
                        options.numZoomLevels = baseLayer.numZoomLevels
                        if (baseLayer.numZoomLevels) {
                            var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
                            options.serverResolutions = serverResolutions
                            options.resolutions = resolutions
                        }

                    }
                    var layer = new OpenLayers.Layer.ArcGISCache(baseLayer.name, baseLayer.url, options)
                    handleBaseLayer(app, layer, baseLayer);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
        }
        else if (baseLayer.type == 'WMTS') {
            var settings = {
                isBaseLayer: true,
                name: baseLayer.name,
                style: baseLayer.style,
                url: baseLayer.url,
                layer: baseLayer.name,
                matrixSet: baseLayer.tileMatrixSet,
                sphericalMercator: true
            }
            if (baseLayer.numZoomLevels) {
                var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
                settings.resolutions = resolutions
                settings.serverResolutions = serverResolutions
            }
            var layer = new OpenLayers.Layer.WMTS(settings)
            handleBaseLayer(app, layer, baseLayer)
        }
    }

    function handleBaseLayer (app, layer, baseLayer) {
        app.map.removeLayer(app.map.layers[0]);
        app.currentBaseLayer = baseLayer;
        app.map.addLayers([layer]);
        app.map.setLayerIndex(layer, 0);
        app.emit("baselayerchange");
    }

    return setBaseLayer;
}


},{}],48:[function(require,module,exports){
function ga_events ($) {


  var eventAdded = false;
  //check if trackevent is installed
  try {
    $.ga.trackEvent
    eventAdded = true;
  }
  catch(err) {
      eventAdded = false;
  }

  //check if google analytics installed only set listners if
  //installed otherwise do nothing
  if (typeof ga !== 'undefined') {
    //check if event traking plugin is refrenced
    if (eventAdded){

      //track map extent change
      //  records the new map extent
      seldon.app.map.events.register("moveend", seldon.app.map, function () {

          var newMapExtent = seldon.app.map.getExtent();
          //alert(ext);
          $.ga.trackEvent({
            category : 'Map Extent',
            action : 'Change',
            label : newMapExtent.toString(),
            nonInteractive: true
          });
      });

      //track click in sharemap url
      //  records the text of the textarea
      $( ".shareMapUrl" ).click(function(event) {
        $.ga.trackEvent({
          category : 'Share Map URL',
          action : 'Click',
          label : $('.shareMapUrl').val()
        });
      });

      //track change in base map
      //  records the text of the option
      $( "#mapTheme  #themeCombo" ).change(function(event) {
        $.ga.trackEvent({
          category : 'Map Theme',
          action : 'Change',
          label : $('#mapTheme  #themeCombo option:selected').text()
        });
      });

      //track find area search when user click enter this forces serach
      //  records the text the input
      $( "#txtFindArea input#address_field" ).keyup(function(event) {
        if (event.which === 13){
          $.ga.trackEvent({
            category : 'Find Area',
            action : 'Search Enter',
            label : $(this).val()
          });
        }
      });

      //track find area search when user click the serarch button
      //  this also forces serach
      //  records the text the input
      $( "#txtFindArea  #address_lookup img" ).click(function(event) {
        $.ga.trackEvent({
          category : 'Find Area',
          action : 'Search Button',
          label : $( "#txtFindArea input#address_field" ).val()
        });
      });

      //track change in base map
      //  records the text of the option
      $( "#mapBase  #baseCombo" ).change(function(event) {
        $.ga.trackEvent({
          category : 'Base Map',
          action : 'Change',
          label : $('#mapBase  #baseCombo option:selected').text()
        });
      });

      //track nav bar clicks (zoom,pan,identify,toogles)
      //  records the tittle attribute as the label
      $('.header-bar .header-bar img.icon').gaTrackEvent({
        category: 'Nav Bar',
        action: 'click',
        useLabel: true,
        labelAttribute: "title",
        useEvent: true,
        event: 'click'
      });

      //track base layer toggles when check box clicked
      // records the for attribute as the label
      $("#mapToolsDialog label[for^='chk']").gaTrackEvent({
        category: 'Map Tools',
        action: 'Toogle',
        useLabel: true,
        labelAttribute: "for",
        useEvent: true,
        event: 'click'
      });

      //track base layer toggles when the label for the check box is clickded
      //  records the id attribute as the label
      $("#mapToolsDialog input").gaTrackEvent({
        category: 'Map Tools',
        action: 'Toogle',
        useLabel: true,
        labelAttribute: "id",
        useEvent: true,
        event: 'click'
      });

      //track Layer Picker toggles when check box clicked
      // records the for attribute as the label
      $("#layerPickerDialog label[for^='chk']").gaTrackEvent({
        category: 'Base Layer',
        action: 'Toogle',
        useLabel: true,
        labelAttribute: "for",
        useEvent: true,
        event: 'click'
      });

      //track Layer Picker toggles when the label for the check box is clickded
      //  records the id attribute as the label
      $("#layerPickerDialog input").gaTrackEvent({
        category: 'Base Layer',
        action: 'Toogle',
        useLabel: true,
        labelAttribute: "id",
        useEvent: true,
        event: 'click'
      });

      //track accordion header expand and un-expand
      //  records the text of the header (h3)
      $("h3.ui-accordion-header").gaTrackEvent({
        category: 'Base Layer',
        action: 'Toggle Accordion',
        useLabel: true,
        label: function(){return $(this).text();},
        useEvent: true,
        event: 'click'
      });


      //track user generated points.
      //  records download points
      $( "#marker-dialog .marker-button-wrapper .marker-button-download" ).click(function(event) {
        $.ga.trackEvent({
          category: 'User Generated Points',
          action: 'Click',
          label : 'Download Points'
        });
      });


      //track user generated points.
      //  records clear points
      $( "#marker-dialog .marker-button-wrapper .marker-button-clear" ).click(function(event) {
        $.ga.trackEvent({
          category: 'User Generated Points',
          action: 'Click',
          label : 'Clear Points'
        });
      });


      //track user generated points.
      //  records notes
      $( "#marker-dialog .marker-point-label .marker-point-coords-label" ).focusout(function(event) {
          $.ga.trackEvent({
            category : 'User Generated Points',
            action : 'Notes',
            label : $(this).val()
          });
      });

      //track open layers pan zoom tool slide zoom
      // records text for action
      $( "img[src$='slider.png']" ).mouseup(function(event) {
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Slide',
              label : 'Zoom Slider'
            });
      })

      //track open layers pan zoom tool
      // records text for action
      $( ".olButton" ).click(function(event) {

        var eleId = $(this).attr('id');
        switch (true) {
          //zoom bar.  zoom to zoo level
          case (eleId.indexOf("ZoombarOpenLayers_Map") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Zoom Bar'
            });
          break;
          //pan left
          case (eleId.indexOf("panleft") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Pan Left'
            });
          break;
          //pan right
          case (eleId.indexOf("panright") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Pan right'
            });
          break;
          //pan up
          case (eleId.indexOf("panup") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Pan up'
            });
          break;
          //pan down
          case (eleId.indexOf("pandown") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Pan down'
            });
          break;
          //zoom in
          case (eleId.indexOf("zoomin") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Zoom in'
            });
          break;
          //zoom out
          case (eleId.indexOf("zoomout") > -1):
            $.ga.trackEvent({
              category : 'OpenLayers Buttons',
              action : 'Click',
              label : 'Zoom Out'
            });
          break;

          default:
        }
      })

    }//check event tracking exits
  }//check google analytics exits
}

module.exports = ga_events;

},{}],49:[function(require,module,exports){
module.exports = function ($) {
    function setMaskByLayer (toggle, parentLayer) {
        var Layer = require("./layer.js")($, this);

        var app = this;
        var maskLayer, maskName, cleanMaskName;
        var m, ml, mld;

        if (toggle) {
            for (m = 0; m < app.masks.length; m++) {
                maskName = app.masks[m].maskName;
                cleanMaskName = maskName.replace("/","");
                maskLayer = new Layer({
                    parentLayer   : parentLayer,
                    lid         : parentLayer.lid + cleanMaskName,
                    visible     : 'true',
                    url         : parentLayer.url,
                    srs         : parentLayer.srs,
                    layers      : parentLayer.layers + cleanMaskName,
                    identify    : parentLayer.identify,
                    name        : parentLayer.lid + cleanMaskName,
                    mask        : 'false',
                    legend      : parentLayer.legend,
                    index       : parentLayer.index,
                    parentLayer : parentLayer,
                    description : (parentLayer.description ? parentLayer.description : undefined)
                });
                maskLayer.activate();

                app.masks[m].maskLayers.push(maskLayer);

                $("#" + maskName.replace("MaskFor", "")).get(0).checked = true;
                $("#mask-status" + parentLayer.lid).text("(m)");
                $("#chk" + parentLayer.lid).prop('checked', true);
            }
        } else {
            //deactivate and remove from mask.maskLayers[]
            for (m = 0; m < app.masks.length; m++) {
                var currentMask = app.masks[m];
                var maskLayersToDelete = [];
                for (ml = 0; ml < currentMask.maskLayers.length; ml++) {
                    var currentMaskLayer = currentMask.maskLayers[ml];
                    if (currentMaskLayer.parentLayer.lid == parentLayer.lid) {
                        currentMaskLayer.deactivate({removeFromLegend: true});
                        $('#mask-status'+ currentMaskLayer.parentLayer.lid).text("")
                        maskLayersToDelete.push(currentMaskLayer);
                    }
                }
                for (mld = 0; mld < maskLayersToDelete.length; mld++) {
                    currentMask.maskLayers.remove(maskLayersToDelete[mld]);
                }
            }
            
            $('#mask-status'+ parentLayer.lid).text("");
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByLayer()

    return setMaskByLayer;
}

},{"./layer.js":28}],50:[function(require,module,exports){
module.exports = function ($) {
    var Mask = require("./mask.js");

    // jdm: 11/27-12/5/14 - re-wrote to use Mask object, doing things in a more
    //      object oriented fashion!
    function setMaskByMask (toggle, maskName) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        var maskParentLayers = app.maskParentLayers;
        var maskParentLayer, maskLayer;
        var i;
        var maskId = "#" + maskName.replace("MaskFor", "");

        $(maskId).get(0).checked = toggle;
        $("[data-mask-parent='" + maskName + "']").attr('disabled', toggle);

        if (toggle) {
            var seldonLayer;

            var mask = new Mask(maskName);
            app.masks.push(mask);
            var cleanMaskName = maskName.replace("/","");

            for (i = 0; i < maskParentLayers.length; i++) {
                maskParentLayer = maskParentLayers[i];
                maskLayer = new Layer({
                    parentLayer : maskParentLayer,
                    lid         : maskParentLayer.lid + cleanMaskName,
                    visible     : "true",
                    url         : maskParentLayer.url,
                    srs         : maskParentLayer.srs,
                    layers      : maskParentLayer.layers + cleanMaskName,
                    identify    : maskParentLayer.identify,
                    name        : maskParentLayer.lid + cleanMaskName,
                    mask        : "false",
                    legend      : maskParentLayer.legend,
                    index       : maskParentLayer.index,
                    parentLayer : maskParentLayer,
                    description : (maskParentLayer.description ? maskParentLayer.description : undefined)
                });


                if (maskParentLayer.visible === "true") {
                    maskParentLayer.deactivate();
                    maskParentLayer.visible = "false";
                }
                
                maskLayer.activate();
                maskLayer.setTransparency(maskParentLayer.transparency);
                mask.maskLayers.push(maskLayer);

                $('#mask-status' + maskParentLayer.lid).text("(m)");
                $("#chk" + maskParentLayer.lid).prop('checked', true);
            }
        } //end if (toggle)
        else { //we have just turned off a mask
            // Loop through app.masks and find maskName
            // When you find it, deactivate all of its maskLayers
            // Keep track of the number of mask in app.masks
            for (var m = 0; m < app.masks.length; m++) {
                if (app.masks[m].maskName == maskName) {
                    for (var ml = 0; ml < app.masks[m].maskLayers.length; ml++) {
                        app.masks[m].maskLayers[ml].deactivate();
                    }
                    //Remove the mask from app.masks that you just cleared out
                    app.masks.remove(app.masks[m]);
                }
            }
            // If it was the only mask in app.Mask (e.g. app.masks.length ==0) to begin with
            // Then loop through app.maskParentLayers and activate those layer
            // Remove those layers from app.maskParentLayers that you just activated
            if (app.masks.length === 0) {
                for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                    app.maskParentLayers[mp].activate();
                }

            }
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByMask()

    return setMaskByMask;
}

},{"./layer.js":28,"./mask.js":37}],51:[function(require,module,exports){
module.exports = function ($) {
    var RepeatingOperation = require("./repeating_operation.js");
    var ShareUrlInfo = require("./share.js");
    var createLayerToggleCheckbox = require("./layer_checkbox.js")($);
    var createLayerPropertiesIcon = require("./layer_icon.js")($);
    var arrayContainsElement = require("./array_contains_element.js");
    var MoreInfoButton = require("./accordion_more_info_button.js")($);

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


        if ($.isEmptyObject(options) && (app.masks.length==0)) {
            for (var dm=0; dm < app.defaultMasks.length; dm++) {
                app.setMaskByMask(true, app.defaultMasks[dm]);
            }
        }

        //fix for changing themes and accounting for active layers
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

        if (options.shareUrlMasks !== undefined) {
            for (var m = 0; m < options.shareUrlMasks.length; m++) {
                //we have already activated the respective parent layers
                //so so we have to go through the masking process
                app.setMaskByMask(true, "MaskFor"+options.shareUrlMasks[m]);
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
            activate: function (event, ui) {
                app.setupCollapsibleSublists(ui)
            },
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
        var activatedLayers = [];
        var ro1 = new RepeatingOperation(function () {
            var accGp = theme.accordionGroups[a],
                accordionGroupOption = options.accordionGroup;
            // Decide whether to open this accordion group.  If we received an
            // `accordionGroup` setting in the options are, activate this accordion
            // group only if it equals that setting.  If we did not receive an
            // `accordionGroup` setting in the options are, activate this accordion
            // group if its "selected" attribute was true in the config file.
            if (accGp.selectedInConfig) {
                accordionGroup = accGp;
            }
            var g = app.addAccordionSection($layerPickerAccordion, accGp.label);
            var selectBoxLayers = [];
            var sublistItems = [];
            for (var i = 0, j = accGp.sublists.length; i < j; i++) {
                var sublist = accGp.sublists[i];
                var sublistEmptyClass = sublist.layers.length > 0 || sublist.break ? '' : ' empty'
                var collapsibleClass = sublist.collapsible ? ' collapsible' : ''
                var collapseHeaderIcon = sublist.collapsible ?
                    '<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span>' : ''
                var sublistObj = {
                    heading : sublist.label,
                    items : [],
                    collapsible: sublist.collapsible,
                    contentElement : $(
                        '<div class="sublist'+collapsibleClass+sublistEmptyClass+'">'
                            +'<div class="sublist-header">'
                                + collapseHeaderIcon
                                +'<h4>' + sublist.label + '</h4>'
                            +'</div>'
                        +'</div>'
                    )
                };

                if (sublist.description) {
                    var sublistInfoButton = new MoreInfoButton(sublist)
                    sublistObj.contentElement.children('.sublist-header').append(sublistInfoButton.element)
                }

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
                    var layerItems = [];
                    if ($testForMask) {
                        maskLabelElem = document.createElement("label");
                        maskTextElem = document.createTextNode(""); //empty until active, if active then put (m)
                        maskLabelElem.setAttribute("id", "mask-status" + layer.lid);
                        maskLabelElem.appendChild(maskTextElem);
                        layerItems.push(
                            createLayerToggleCheckbox(layer),
                            labelElem,
                            createLayerPropertiesIcon(layer),
                            maskLabelElem
                        );
                        if (layer.description) {
                            var layerInfoButton = new MoreInfoButton(layer);
                            layerItems.push(layerInfoButton.element);
                        }
                        layerItems.push(brElem);
                        if (layer.break) {
                            // can't add brElem again, since it references the same DOM node
                            layerItems.push(document.createElement("br"));
                        }
                    } else { //no mask for this layer (most will be of this type outside of FCAV)
                        // add the layer to the accordion group
                        if (sublist.type=="radiobutton") { //radio button type
                            layerItems.push(radioButton=createLayerToggleRadioButton(layer, sublist.label.replace(/\s+/g, '')),
                                                    labelElem,
                                                    createLayerPropertiesIcon(layer),brElem);
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
                                layerItems.push(dropdownBox=createLayerToggleDropdownBox(layer, selectBoxLayers, sublist.label.replace(/\s+/g, '')));
                                app.dropdownBoxList.push(dropdownBox);
                                app.dropdownBoxLayers.push(layer);
                            }
                        } else { // assume checkbox type
                            layerItems.push(
                                createLayerToggleCheckbox(layer),
                                labelElem,
                                createLayerPropertiesIcon(layer)
                            );
                            if (layer.description) {
                                var layerInfoButton = new MoreInfoButton(layer);
                                layerItems.push(layerInfoButton.element)
                            }
                            layerItems.push(brElem);
                            if (layer.break) {
                                layerItems.push(document.createElement("br"));
                            }
                        }
                    }
                    sublistLayerItems.push(layerItems);

                    // Decide whether to activate the layer.  If we received a layer list in the
                    // options arg, active the layer only if it appears in that list.  If we
                    // received no layer list in the options arg, activate the layer if the layer's
                    // "selected" attribute was true in the config file.

                    if (options.layers !== undefined) {
                        var layerInOptionsLayers = options.layers.filter(function (optionLayer) {
                            return layer.lid === optionLayer.lid
                        }).length
                        if (layerInOptionsLayers) {
                            var duplicateLayerIsActive = app.map.layers.filter(function (oLayer) {
                                return oLayer.seldonLayer && oLayer.seldonLayer.lid === layer.lid
                            }).length 
                            if (!duplicateLayerIsActive) {
                                layer.activate()
                                activatedLayers.push(layer)
                            }
                       } 
                    }
                    else if (options.layers === undefined &&
                             layer.selectedInConfig &&
                             sublist.type!="radiobutton") {
                        layer.activate();
                        activatedLayers.push(layer)
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
                app.addAccordionSublistItems(sublistObj, sublistLayerItems, theme, accGp);
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
                setThemeContinue(app, theme, options, accordionGroup, activatedLayers);
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


    function setThemeContinue (app, theme, options, accordionGroup, activatedLayers) {
        app.currentTheme = theme;
        app.setAccordionGroup(accordionGroup);
        $('#layerPickerDialog').scrollTop(0);
        $('#mapToolsDialog').scrollTop(0);
        app.emit("themechange");

        if (options.maskModifiers !== undefined) {
            var modifier, checkbox;
            for (var m = 0; m < options.maskModifiers.length; m++) {
                modifier = options.maskModifiers[m];
                checkbox = $("#" + modifier);
                if (checkbox.data("mask-grouper") === true) {
                    app.handleMaskModifierGroup(modifier, true);
                    $("[data-mask-parent='" + modifier + "']").attr('disabled', true);
                }
                app.handleMaskModifier(modifier, checkbox.data("index"));
                checkbox.prop("checked", true);
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

        for (var i=0; i<activatedLayers.length; i++) {
            $("#chk"+activatedLayers[i].lid).prop('checked', true);
        }

        for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
            $('#mask-status'+ app.maskParentLayers[mp].lid).text("(m)");
            $("#chk"+app.maskParentLayers[mp].lid).prop('checked', true);
        }
    }

    return setTheme;
}

},{"./accordion_more_info_button.js":6,"./array_contains_element.js":12,"./layer_checkbox.js":29,"./layer_icon.js":31,"./layer_radio.js":32,"./layer_select.js":34,"./repeating_operation.js":44,"./share.js":52}],52:[function(require,module,exports){
function ShareUrlInfo (settings) {
    if (settings === undefined) settings = {};

    this.themeName         = settings.themeName;
    this.accordionGroupGid = settings.accordionGroupGid;
    this.baseLayerName     = settings.baseLayerName;
    this.extent            = settings.extent || {};
    this.layerLids         = settings.layerLids || [];
    this.layerMask         = settings.layerMask || [];
    this.maskModifiers     = settings.maskModifiers || [];
    this.layerAlphas       = settings.layerAlphas || [];
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

    url = url.replace(/\%2[c|C]/g, ',');

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
    if (vars.modifiers) {
        $.each(vars.modifiers.split(','), function () {
            info.maskModifiers.push(this);
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
         + '{{{modifiers}}}'
         + '&alphas={{{alphas}}}'
         + '&accgp={{{accgp}}}'
         + '&basemap={{{basemap}}}'
         + '&extent={{{extent.left}}},{{{extent.bottom}}},{{{extent.right}}},{{{extent.top}}}'
        ),
        {
            theme   : this.themeName,
            layers  : this.layerLids.join(','),
            mask    : this.layerMask.join(','),
            modifiers : this.maskModifiers.length > 0 ? "&modifiers=" + this.maskModifiers.join(',') : "",
            alphas  : this.layerAlphas.join(','),
            accgp   : this.accordionGroupGid,
            basemap : this.baseLayerName,
            extent  : this.extent
        });
};

module.exports = ShareUrlInfo;

},{}],53:[function(require,module,exports){
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
            var op, lid, test;
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
                    lid = this.seldonLayer.lid;
                    test = lid.substring(lid.indexOf("MaskFor"), lid.length).replace("MaskFor","")
                    if (layerMask.indexOf(test) === -1) {
                        layerMask.push(test);
                    }

                    //make sure the parent to the layerMask stays on the share map url
                    test = this.name.substring(0, this.name.indexOf("MaskFor"));
                    if (layerLids.indexOf(test) === -1) {
                        layerLids.push(test);
                        layerAlphas.push(op);
                    }
                } else {
                    //otherwise add to layerLids
                    if (this.seldonLayer) {
                        layerLids.push(this.seldonLayer.lid);
                        layerAlphas.push(op);
                    }
                } //end
            }
        });

        if (this.hasOwnProperty("maskModifiers")) {
            var modifiers = this.maskModifiers.filter(function (val) { return val !== ""; });
        }

        url = window.location.toString();
        url = url.replace(/\?.*$/, '');
        url = url.replace(/\/$/, '');
        url = url.replace("#", '');
        return url + '?' + (new ShareUrlInfo({
            themeName         : this.currentTheme.name,
            layerLids         : layerLids,
            layerMask         : layerMask,
            maskModifiers     : modifiers,
            layerAlphas       : layerAlphas,
            accordionGroupGid : this.currentAccordionGroup.gid,
            baseLayerName     : this.currentBaseLayer.name,
            extent            : extent
        })).urlArgs();
    };

    return shareUrl;
}

},{"./share.js":52,"./stringContainsChar.js":55}],54:[function(require,module,exports){
module.exports = function ($) {
    function createSplashScreen () {
        var $document    = $(document),
            windowWidth  = Math.round($document.width()/2);
        $('#splashScreenContent').load('splashScreen.html');
        $("#splashScreenContainer").dialog({
            autoOpen    : false,
            zIndex      : 10051,
            maxHeight   : $document.height(),
            width       : windowWidth,
            minWidth    : 300,
            dialogClass : 'splashScreenStyle',
            hide        : "explode"
        });
    }

    return createSplashScreen;
}

},{}],55:[function(require,module,exports){
function stringContainsChar (string, c) {
    return (string.indexOf(c) >= 0);
}

module.exports = stringContainsChar;

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

},{}]},{},[46]);
