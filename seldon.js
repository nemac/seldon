(function ($) {
    "use strict";

    var EventEmitter = window.EventEmitter,
        seldon = {},
        areasList = [],
        app;

    seldon.App = function () {
        EventEmitter.call(this);
        OpenLayers.Util.onImageLoadErrorColor = 'transparent';
        OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
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

        this.saveCurrentExtent = require("./js/extent_save.js");
        this.zoomToExtent = require("./js/extent_zoom.js");
        this.zoomToPreviousExtent = require("./js/extent_zoom_previous.js");
        this.zoomToNextExtent = require("./js/extent_zoom_next.js");
        this.printSavedExtents = require("./js/extent_print.js");

        this.checkForExistingItemInArray = function (arr,item) {
            var isItemInArray = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i]=item) {
                    isItemInArray = true;
                }
            }
            return isItemInArray;
        };

        this.setBaseLayer = require("./js/set_base_layer.js")($);

        // Begin Accordion Group Specific Functions
        this.setAccordionGroup = function (accordionGroup) {
            this.currentAccordionGroup = accordionGroup;
            this.emit("accordiongroupchange");
        };

        this.clearAccordionSections = function (accordionGroup) {
            $(accordionGroup).empty();
            $(accordionGroup).data('listAccordion').sections = [];
            $(accordionGroup).accordion('refresh');
        };

        this.addAccordionSection = function (accordionGroup, title) {
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

        this.addAccordionSublists = function (g, items) {
            $(g.contentElement).append(items);
        }

        this.addAccordionSublistItems = function (s, items) {
            var contents = $('<div class="layer"></div>');
            contents.append(items);
            var layer = {
                name : name,
                contentElement : contents
            };
            s.items.push(layer);
            s.contentElement.append(layer.contentElement);
        }

        // End Accordion Group Specific Functions

        this.setTheme = require("./js/set_theme.js")($);

        this.shareUrl = require("./js/share_url.js")($);

        this.updateShareMapUrl = require("./js/update_share_url.js")($);

        this.launch = require("./js/launch.js")($);

        this.count = function (array, value) {
            var counter = 0;
            for(var i = 0; i < array.length; i++) {
                if (array[i] === value) counter++;
            }
            return counter;
        }

        this.addMaskToLegend = require("./js/add_mask_legend.js")($); 
        this.removeMaskFromLegend = function (layer) {}

        this.setMaskByMask = require("./js/set_mask_by_mask.js")($);
        this.setMaskByLayer = require("./js/set_mask_by_layer.js")($);

        this.parseConfig = require("./js/parse_config.js")($);

        this.initOpenLayers = require("./js/init_openlayers.js");

    };
    EventEmitter.declare(seldon.App);

    app = new seldon.App();

    function displayError (message) {
        //console.log(message);
    }

    seldon.init = require("./js/init.js")(app);
    require("./js/overrides.js")($);

    //
    // exports, for testing:
    //
//    seldon.BaseLayer                         = BaseLayer;
//    seldon.AccordionGroup                    = AccordionGroup;
//    seldon.AccordionGroupSublist             = AccordionGroupSublist;
//    seldon.Layer                             = Layer;
//    seldon.Theme                             = Theme;
//    seldon.createWMSGetFeatureInfoRequestURL = createWMSGetFeatureInfoRequestURL;
//    seldon.stringContainsChar                = stringContainsChar;
//    seldon.ShareUrlInfo                      = ShareUrlInfo;
    window.seldon                            = seldon;

}(jQuery));
