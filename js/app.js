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
