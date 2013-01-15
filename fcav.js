(function ($) {
    "use strict";

    var fcav = {
        map         : undefined, // OpenLayers map object
        zoomInTool  : undefined, // OpenLayers zoom in tool
        zoomOutTool : undefined, // OpenLayers zoom out tool
        dragPanTool : undefined, // OpenLayers dragpan tool
        maxExtent   : {
            xmin : -15000000,  //NOTE: These values get replaced by settings from the config file.
            ymin : 2000000,    //      Don't worry about keeping these in sync if the config fil 
            xmax : -6000000,   //      changes; these are just here to prevent a crash if we ever
            ymax : 7000000     //      read a config file that is missing the <extent> element.
        },
        baseLayers       : [], // list of BaseLayer instances holding info about base layers from config file
        baseLayersByName : {}, // hash of pointers to BaseLayer instances from `baseLayers` list, keyed by layer name
        accordionGroups  : [], // list of AccordionGroup instances holding info about accordion groups from config file
        themes           : [], // list of Theme instances holding info about themes from config file
        themesByName     : {}, // hash of pointers to Theme instances from `themes` list, keyed by theme name
        layersByLid      : {}, // hash of pointers to Layer instances, keyed by lid
        propertiesDialog$Html : {},
        currentBaseLayer : undefined,
        currentTheme     : undefined,
        state            : function() {
            var state               = new FcavState();
            state.baseLayerName     = this.currentBaseLayer.name;
            state.themeName         = this.currentTheme.name;
            var accordionGroupIndex = $("#layerPickerAccordion").accordion('option', 'active');
            state.accordionGroupGid = this.currentTheme.accordionGroups[accordionGroupIndex].gid;
            var extent              = this.map.getExtent();
            state.extent            = extent.left + ',' + extent.bottom + ',' + extent.right + ',' + extent.top;
            $.each(this.map.layers, function () {
                if (! this.isBaseLayer) {
                    var op;
                    if (this.opacity === 1) {
                        op = "1";
                    } else if (this.opacity === 0) {
                        op = "0";
                    } else {
                        op = sprintf("%.2f", this.opacity);
                    }
                    state.layerLids.push(this.fcavLayer.lid);
                    state.layerAlphas.push(op);
                }
            });
            return state;
        },
        shareUrl         : function() {
            var state = this.state();
            var url   = window.location.toString();
            url = url.replace(/\?.*$/, '');
            url = url.replace(/\/$/, '');
            return url + '?' + state.urlArgs();
        },
        updateShareMapUrl : function() {
            $('#mapToolsDialog textarea.shareMapUrl').val(this.shareUrl());
        }
    };

    function BaseLayer(settings) {
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.url   = settings.url;
        this.index = settings.index;
        fcav.baseLayersByName[this.name] = this;
    }
    function AccordionGroup(settings) {
        this.sublists = [];
        if (!settings) { return; }
        this.gid              = settings.gid;
        this.name             = settings.name;
        this.label            = settings.label;
        this.selectedInConfig = settings.selectedInConfig;
    }
    function AccordionGroupSublist(settings) {
        this.layers = [];
        if (!settings) { return; }
        this.label  = settings.label;
    }
    function Layer(settings) {
        if (!settings) { return; }
        this.lid                = settings.lid;
        this.visible            = settings.visible;
        this.url                = settings.url;
        this.srs                = settings.srs;
        this.layers             = settings.layers;
        this.styles             = settings.styles;
        this.identify           = settings.identify;
        this.name               = settings.name;
        this.legend             = settings.legend;
        this.transparency       = 0;
        this.selectedInConfig   = settings.selectedInConfig;
        this.$checkbox          = undefined;
        this.$propertiesIcon    = undefined;
        this.openLayersLayer    = undefined;
        this.createOpenLayersLayer = function() {
            if (this.openLayersLayer !== undefined) {
                return this.openLayersLayer;
            }
            var options = {
                isBaseLayer      : false, 
                transitionEffect : 'resize'
            };

            if (stringContainsChar(this.url, 'wlayers')) {
                options.tileSize = new OpenLayers.Size(500,500);
                options.ratio    = 1;
                options.buffer   = 2;
            } else {
                options.singleTile = true;
                options.ratio      = 1;
            }
            this.openLayersLayer =
                new OpenLayers.Layer.WMS(this.name,
                                         this.url,
                                         {
                                             projection  : new OpenLayers.Projection("EPSG:900913"), 
                                             units       : "m", 
                                             layers      : this.layers, 
                                             maxExtent   : new OpenLayers.Bounds(fcav.maxExtent),
                                             transparent : true
                                         },
                                         options
                                        );
            this.openLayersLayer.fcavLayer = this;
            return this.openLayersLayer;
        };
        this.addToMap = function(suppressCheckboxUpdate) {
            fcav.map.addLayer(this.createOpenLayersLayer());
            if (this.$checkbox && !suppressCheckboxUpdate) {
                this.$checkbox.attr('checked', true);
            }
            this.addToLegend();
        };
        this.removeFromMap = function(suppressCheckboxUpdate) {
            if (this.openLayersLayer) {
                fcav.map.removeLayer(this.openLayersLayer);
                if (this.$checkbox && !suppressCheckboxUpdate) {
                    this.$checkbox.attr('checked', false);
                }
                this.removeFromLegend();
            }
        };
        this.addToLegend = function() {
            var that = this;
            this.$legendItem = $('<div id="lgd'+this.lid+'"><img src="'+this.legend+'"/></div>') .
                appendTo($('#legend')) .
                click(function() {
                    that.removeFromMap();
                });
        };
        this.removeFromLegend = function() {
            if (this.$legendItem) {
                this.$legendItem.remove();
            }
        };
        this.setTransparency = function(transparency) {
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(1-parseFloat(transparency)/100.0);
            }
            this.transparency = transparency;
        };
        fcav.layersByLid[this.lid] = this;
    }

    function Theme(settings) {
        this.accordionGroups = [];
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.index = settings.index;
        fcav.themesByName[this.name] = this;
    }


    function displayError(message) {
        console.log(message);
    }

    function init() {

        $.ajax({
            url: './config/ews_config.xml', // name of file you want to parse
            dataType: "xml", // type of file you are trying to read
            success: parseConfig, // name of the function to call upon success
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });

        //
        // layerPicker button:
        //
        $("#btnTglLyrPick").click(function() {
            if ($( "#layerPickerDialog" ).dialog('isOpen')) {
                $( "#layerPickerDialog" ).dialog('close');
            } else {
                $( "#layerPickerDialog" ).dialog('open');
            }
        }).hover(
            function(){
                $("#tglLyrPickPic").attr("src", "icons/layers_over.png");
                $("#btnTglLyrPick").attr('title', 'Show/hide Layer Picker');
            },
            function(){
                $("#tglLyrPickPic").attr("src", "icons/layers.png");
            }
        );  

        //
        // turn layerPickerDialog div into a jQuery UI dialog:
        //
        $("#layerPickerDialog").dialog({ zIndex:10050, 
                                         position:"left",
                                         autoOpen: true,
                                         hide:"explode"
                                       });


        //
        // mapTools button:
        //
        $("#btnTglMapTools").click(function() {
            if ($( "#mapToolsDialog" ).dialog('isOpen')) {
                $( "#mapToolsDialog" ).dialog('close');
            } else {
                $( "#mapToolsDialog" ).dialog('open');
            }
        }).hover(
            function(){
                $('#tglLegendPic').attr('src', 'icons/legend_over.png');
                $("#btnTglMapTools").attr('title', 'Show/hide Legend');
            },
            function(){
                $('#tglLegendPic').attr('src', 'icons/legend.png');
            }
        );      

        //
        // turn mapToolsDialog div into a jQuery UI dialog:
        //
        $("#mapToolsDialog").dialog({ zIndex:10050, 
                                      position:"right",
                                      autoOpen: true,
                                      hide:"explode"
                                    });

        //
        // mapTools accordion
        //

        //    initialize
        $("#mapToolsAccordion").accordion({ clearStyle: true, autoHeight: false });

        //    find the 'legend' layer in the mapTools accordion, and make sure it is initially turned on
        var accordionGroupIndexToOpen = 0;
        $('#mapToolsAccordion').find('div').each(function(i) {
            if (this.id === "legend") {
                accordionGroupIndexToOpen = i;
                return false;
            }
            return true;
        });
        $('#mapToolsAccordion').accordion('activate', accordionGroupIndexToOpen);

        //
        // base layer combo change handler
        //
        $('#baseCombo').change(function() {
            var i = parseInt($("#baseCombo").val(), 10);
            setArcGISCacheBaseLayer(fcav.baseLayers[i]);
            // ... rebuild share url here ...
        });

        //
        // theme layer combo change handler
        //
        $('#themeCombo').change(function() {
            var i = parseInt($("#themeCombo").val(), 10);
            setTheme(fcav.themes[i]);
            // ... rebuild share url here ...
        });

        // 
        // pan button
        // 
        $("#btnPan").click(function() {
            deactivateActiveOpenLayersControls();
            fcav.dragPanTool.activate();
        }).hover(
            function(){
                $('#panPic').attr('src',   'icons/pan_over.png');
                $("#btnPan").attr('title', 'Pan tool');
            },
            function(){
                $('#panPic').attr('src',   'icons/pan.png');
            }
        ); 

        // 
        // zoom in button
        // 
        $("#btnZoomIn").click(function() {
            deactivateActiveOpenLayersControls();
            fcav.zoomInTool.activate();
        }).hover(
            function(){
                $("#zoomInPic").attr('src',   'icons/zoom-in_over.png');
                $("#btnZoomIn").attr('title', 'Zoom in tool');
            },
            function(){
                $("#zoomInPic").attr('src',   'icons/zoom-in.png');
            }
        );

        // 
        // zoom out button
        // 
        $("#btnZoomOut").click(function() {
            deactivateActiveOpenLayersControls();
            fcav.zoomOutTool.activate();
        }).hover(
            function() {
                $("#zoomOutPic").attr('src',   'icons/zoom-out_over.png');
                $("#btnZoomOut").attr('title', 'Zoom out tool');
            },
            function() {
                $("#zoomOutPic").attr('src',   'icons/zoom-out.png');
            }
        ); 

        // 
        // zoom to full extent button
        // 
        $("#btnZoomExtent").click(function() {
            fcav.map.zoomToExtent(new OpenLayers.Bounds(fcav.maxExtent.xmin, fcav.maxExtent.ymin, fcav.maxExtent.xmax, fcav.maxExtent.ymax), false);
        });
        $('#btnZoomExtent').hover(
            function(){
                $("#btnZoomExtentPic").attr('src',  'icons/zoom-extent_over.png');
                $("#btnZoomExtent").attr('title', 'Full Extent tool');
            },
            function(){
                $("#btnZoomExtentPic").attr('src',  'icons/zoom-extent.png');
            }
        ); 
        
        // 
        // identify button
        // 
        
        $("#btnID").click(function() {
            //alert("Handler for IDcalled.");
            activateIdentifyTool();
        });
        
        $('#btnID').hover(
            function(){
                $("#idPic").attr('src',  'icons/map-info_over.png');
                $("#btnID").attr('title', 'Identify tool');
            },
            function(){
                $("#idPic").attr('src',  'icons/map-info.png');
            }
        ); 
            
        // 
        // help button
        // 
        $("#btnHelp").click(function() {
            console.log(fcav.shareUrl());
            //alert("Handler for help called.");
            //getCurrentExtent();
        });
        $('#btnHelp').hover(
            function(){
                $("#btnPic").attr('src', 'icons/help_over.png');
                $("#btnHelp").attr('title', 'Get help');
            },
            function(){
                $("#btnPic").attr('src', 'icons/help.png');
            }
        ); 


/*        
        // 
        // multigraph button
        // 
        $("#btnMultiGraph").click(function() {
            //http://openlayers.org/dev/examples/click.html
            //http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Handler/Click-js.html
            //http://rain.nemac.org/timeseries/tsmugl_product.cgi?args=CONUS_NDVI,-11915561.548108513,4714792.352997124
            deactivateActiveOpenLayersControls();
            map.addControl(clickTool);
            clickTool.activate();        
        });
        $('#btnMultiGraph').hover(
            function(){
                document.getElementById("multiGraphPic").src = 'icons/multigraph_over.png';
                $("#btnMultiGraph").attr('title', 'MultiGraph tool');
            },
            function(){
                document.getElementById("multiGraphPic").src = 'icons/multigraph.png';
            }
        ); 

         */
    }

    function deactivateActiveOpenLayersControls() {
        for (var i = 0; i < fcav.map.controls.length; i++) {
            if ((fcav.map.controls[i].active==true)
                &&
                ((fcav.map.controls[i].displayClass=="olControlZoomBox")
                 ||
                 (fcav.map.controls[i].displayClass=="olControlWMSGetFeatureInfo")
                 ||
                 (fcav.map.controls[i].displayClass=="ClickTool"))) {
                fcav.map.controls[i].deactivate();
            }
        }
    }

    function parseConfig(configXML) {
        var $configXML = $(configXML);

        // parse and store max map extent from config file
        var $extent = $configXML.find("extent");
        if ($extent && $extent.length > 0) {
            fcav.maxExtent = {
                xmin : parseFloat($extent.attr('xmin')),
                ymin : parseFloat($extent.attr('ymin')),
                xmax : parseFloat($extent.attr('xmax')),
                ymax : parseFloat($extent.attr('ymax'))
            };
        }

        // parse base layers and populate combo box
        var selectedBaseLayerIndex = 0;
        $configXML.find("images image").each(function(i) {
            var $image    = $(this),
                selected  = $image.attr('selected'),
                baseLayer = new BaseLayer({
                    name     : $image.attr('name'),
                    label    : $image.attr('label'),
                    url      : $image.attr('url'),
                    index    : i
                });
            fcav.baseLayers.push(baseLayer);
            fcav.baseLayersByName[baseLayer.name] = baseLayer;
            $('#baseCombo').append($('<option value="'+i+'">'+baseLayer.label+'</option>'));
            if (selected) {
                selectedBaseLayerIndex = i;
            }
        });

        // parse layer groups and layers
        var accordionGroupsByName = {};
        $configXML.find("wmsGroup").each(function() {
            var $wmsGroup      = $(this), // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
                accordionGroup = new AccordionGroup({
                    gid              : $wmsGroup.attr('gid'),
                    name             : $wmsGroup.attr('name'),
                    label            : $wmsGroup.attr('label'),
                    selectedInConfig : ($wmsGroup.attr('selected') === "true")
                });
            fcav.accordionGroups.push(accordionGroup);
            accordionGroupsByName[accordionGroup.name] = accordionGroup;
            $wmsGroup.find("wmsSubgroup").each(function() {
                var $wmsSubgroup = $(this), // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                    sublist      = new AccordionGroupSublist({
                        label : $wmsSubgroup.attr('label')
                    });
                accordionGroup.sublists.push(sublist);
                $wmsSubgroup.find("wmsLayer").each(function() {
                    var $wmsLayer = $(this);
                    sublist.layers.push(new Layer({
                        lid              : $wmsLayer.attr('lid'),
                        visible          : $wmsLayer.attr('visible'),
                        url              : $wmsLayer.attr('url'),
                        srs              : $wmsLayer.attr('srs'),
                        layers           : $wmsLayer.attr('layers'),
                        styles           : $wmsLayer.attr('styles'),
                        identify         : $wmsLayer.attr('identify'),
                        name             : $wmsLayer.attr('name'),
                        legend           : $wmsLayer.attr('legend'),
                        selectedInConfig : ($wmsLayer.attr('selected') === "true")
                    }));
                });
            });
        });

        // parse themes
        var selectedThemeIndex = 0;
        $configXML.find("mapviews view").each(function(i) {
            var $view = $(this),
                selected  = $view.attr('selected'),
                theme = new Theme({
                    name  : $view.attr('name'),
                    label : $view.attr('label'),
                    index : i
                });
            fcav.themes.push(theme);
            $('#themeCombo').append($('<option value="'+i+'">'+theme.label+'</option>'));
            $view.find("viewGroup").each(function() {
                var $viewGroup     = $(this),
                    name           = $viewGroup.attr('name'),
                    accordionGroup = accordionGroupsByName[name];
                if (accordionGroup) {
                    theme.accordionGroups.push(accordionGroup);
                } else {
                    displayError("Unknown accordion group name '" + name + "' found in theme '" + theme.name + "'");
                }
            });
            if (selected) {
                selectedThemeIndex = i;
            }
        });

        // initialize the OpenLayers map object
        initOpenLayers(selectedBaseLayerIndex, selectedThemeIndex);
        //setArcGISCacheBaseLayer(fcav.baseLayers[selectedBaseLayerIndex]);

        //setTheme(fcav.themes[selectedThemeIndex]);
        //$('#themeCombo').val(selectedThemeIndex);



    }

    function initializeFromState(state) {
        var theme     = fcav.themesByName[state.themeName];
        var baseLayer = fcav.baseLayersByName[state.baseLayerName];

        var layers = {};
        $.each(state.layerLids, function (i,lid) {
            fcav.layersByLid[lid].transparency = state.layerAlphas[i];
            layers[lid] = true;
        });

        setArcGISCacheBaseLayer(baseLayer);
        $('#baseCombo').val(baseLayer.index);

        setTheme(theme, {
            openAccordionGroupGid : state.accordionGroupGid,
            layers                : layers
        });
        $('#themeCombo').val(theme.index);
        console.log(state.extent);
        fcav.map.zoomToExtent(parseExtent(state.extent), false);
    }

    function FcavState () {
        this.themeName         = undefined;
        this.accordionGroupGid = undefined;
        this.baseLayerName     = undefined;
        this.extent            = undefined;
        this.layerLids         = [];
        this.layerAlphas       = [];
        this.urlArgs           = function() {
            return Mustache.render(
                (''
                 + 'theme={{{theme}}}'
                 + '&layers={{{layers}}}'
                 + '&alphas={{{alphas}}}'
                 + '&accgp={{{accgp}}}'
                 + '&basemap={{{basemap}}}'
                 + '&extent={{{extent}}}'
                ),
                {
                    theme   : this.themeName,
                    layers  : this.layerLids.join(','),
                    alphas  : this.layerAlphas.join(','),
                    accgp   : this.accordionGroupGid,
                    basemap : this.baseLayerName,
                    extent  : this.extent
                });
        };
    }

    FcavState.createFromURL = function (url) {
        var state = new FcavState(),
            vars  = [],
            hash,
            q;

        if (url === undefined) {
            return state;
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

        state.themeName         = vars.theme;
        state.accordionGroupGid = vars.accgp;
        state.baseLayerName     = vars.basemap;
        state.extent            = vars.extent;
        if (vars.layers) {
            $.each(vars.layers.split(','), function () {
                state.layerLids.push(this);
            });
        }
        if (vars.alphas) {
            $.each(vars.alphas.split(','), function () {
                state.layerAlphas.push(this);
            });
        }

        return state;
    };

    function initOpenLayers(baseLayerIndex, themeIndex) {

        var baseLayer = fcav.baseLayers[baseLayerIndex];
        $('#baseCombo').val(baseLayerIndex);

        fcav.zoomInTool   = new OpenLayers.Control.ZoomBox();
        fcav.zoomOutTool  = new OpenLayers.Control.ZoomBox({out:true});
        fcav.dragPanTool  = new OpenLayers.Control.DragPan();
        fcav.identifyTool = createIdentifyTool();

        $.ajax({
            url: baseLayer.url + '?f=json&pretty=true',
            dataType: "jsonp",
            success:  function (layerInfo) {
                var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                    layerInfo: layerInfo
                });
                var maxExtentBounds = new OpenLayers.Bounds(fcav.maxExtent.xmin, fcav.maxExtent.ymin,
                                                   fcav.maxExtent.xmax, fcav.maxExtent.ymax);
                fcav.map = new OpenLayers.Map('map', {
                    maxExtent:         maxExtentBounds,
                    units:             'm',
                    resolutions:       layer.resolutions,
                    numZoomLevels:     layer.numZoomLevels,
                    tileSize:          layer.tileSize,
                    controls: [
                        new OpenLayers.Control.Navigation({
                            dragPanOptions: {
                                enableKinetic: true
                            }
                        }),
                        new OpenLayers.Control.Attribution(),
                        fcav.zoomInTool,
                        fcav.zoomOutTool,
                        fcav.identifyTool
                    ],
                    eventListeners: 
                    {
                        "moveend": mapEvent,
                        "zoomend": mapEvent
                    },               
                    zoom: 1,
                    projection: new OpenLayers.Projection("EPSG:900913")
                });    
                
                fcav.currentBaseLayer = baseLayer;
                fcav.map.addLayers([layer]);
                fcav.map.setLayerIndex(layer, 0);
                setTheme(fcav.themes[themeIndex]);
                $('#themeCombo').val(themeIndex);
                fcav.map.zoomToExtent(maxExtentBounds, false);

                // process shared url, if any
                var shareState = FcavState.createFromURL(window.location.toString());
                if (shareState.extent) {
                    // Only act on the url parameters if they includes an extent parameter.  This
                    // is simply a quick & dirty way to insure that the parameters are valid.
                    // We proabably ought to strengthen this to do a better validity check.
                    initializeFromState(shareState);
                }

            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });

    }

    function setArcGISCacheBaseLayer(baseLayer) {
        $.ajax({
            url: baseLayer.url + '?f=json&pretty=true',
            dataType: "jsonp",
            success:  function (layerInfo) {
                var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                    layerInfo: layerInfo
                });
                fcav.map.removeLayer(fcav.map.layers[0]);
                fcav.currentBaseLayer = baseLayer;
                fcav.map.addLayers([layer]);
                fcav.map.setLayerIndex(layer, 0);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });
    }

    function setTheme(theme, options) {
        $('#layerPickerAccordion').empty();
        $("#layerPickerAccordion").accordion('destroy');
        $('#layerPickerAccordion').listAccordion({ clearStyle: true, autoHeight: false });
        $('#legend').empty();
        var openAccordionGroupIndex = 0;

        if (options === undefined) {
            options = {};
        }

        $.each(theme.accordionGroups, function (i, accordionGroup) {
            if (options.openAccordionGroupGid) {
                if (accordionGroup.gid === options.openAccordionGroupGid ) {
                    openAccordionGroupIndex = i;
                }
            } else {
                if (accordionGroup.selectedInConfig) {
                    openAccordionGroupIndex = i;
                }
            }
            var g = $('#layerPickerAccordion').listAccordion('addSection', '<a>'+accordionGroup.label+'</a>');
            $.each(accordionGroup.sublists, function (j, sublist) {
                var s = $('#layerPickerAccordion').listAccordion('addSublist', g, sublist.label);
                $.each(sublist.layers, function (k, layer) {
                    $('#layerPickerAccordion').listAccordion('addSublistItem', s,
                                                             [createLayerToggleCheckbox(layer),
                                                              $('<label for="chk'+layer.lid+'">'+layer.name+'</label>'),
                                                              createLayerPropertiesIcon(layer)]);
                    if (options.layers) {
                        if (options.layers[layer.id]) {
                            layer.addToMap();
                        }
                    } else {
                        if (layer.selectedInConfig) {
                            layer.addToMap();
                        }
                    }
                });
            });
        });
        $('#layerPickerAccordion').accordion('activate', openAccordionGroupIndex);
        fcav.currentTheme = theme;
    }

    function createLayerToggleCheckbox(layer) {
        layer.$checkbox = $('<input type="checkbox" id="chk'+layer.lid+'"></input>').click(function() {
            if ($(this).is(':checked')) {
                layer.addToMap(true);
            } else {
                layer.removeFromMap(true);
            }
        });
        return layer.$checkbox;
    }

    function createLayerPropertiesIcon(layer) {
        layer.$propertiesIcon = $('<img class="layerPropertiesIcon" id="'+layer.lid+'" src="icons/settings.png"/>').click(function() {
            createLayerPropertiesDialog(layer);
        });
        return layer.$propertiesIcon;
    }


    function createLayerPropertiesDialog(layer) {

        if (fcav.propertiesDialog$Html[layer.lid]) {
            fcav.propertiesDialog$Html[layer.lid].dialog('destroy');
            fcav.propertiesDialog$Html[layer.lid].remove();
        }

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
        $html.find('.transparency-slider').slider({
            min   : 0,
            max   : 100,
            step  : 1,
            value : layer.transparency,
            slide : function(event, ui) {
                $html.find('input.transparency-text').val(ui.value);
                layer.setTransparency(ui.value);
            }
        });
        $html.find('input.transparency-text').change(function() {
            var newValueFloat = parseFloat($(this).val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $(this).val($html.find('.transparency-slider').slider('value'));
                return;
            }
            $html.find('.transparency-slider').slider("value", $(this).val());
            layer.setTransparency($(this).val());
        });

        $html.dialog({
            zIndex    : 10050, 
            position  : "left",
            autoOpen  : true,
            hide      : "explode",
            title     : layer.name,
            width     : 'auto',
            close     : function() {
                $(this).dialog('destroy');
                $html.remove();
                fcav.propertiesDialog$Html[layer.lid] = undefined;
            }
        });
        fcav.propertiesDialog$Html[layer.lid] = $html;
    }


    function mapEvent(event) {
        fcav.updateShareMapUrl();
        // ... update shareMapURL ...
    }    


    function activateIdentifyTool()
    {
        deactivateActiveOpenLayersControls();
        fcav.identifyTool.activate();
    }


//    function pickInfo(e)
//    {
//        console.log('hey there!');
//        /*
//        var strInfo;
//        strInfo = e.text;
//        var gmlData = processGML(strInfo);
//         */
//        fcav.map.addPopup(new OpenLayers.Popup.FramedCloud(
//          "Feature Info:", 
//          fcav.map.getLonLatFromPixel(e.xy),
//          null,
//          e.text, //gmlData,
//          null,
//          true
//      ));
//    }


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

        initialize: function(clickHandler) {
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

    // Return a string representing a GetFeatureInfo request URL for the current map,
    // based on the passed parameters:
    //
    //   serviceUrl: the URL of the WMS service
    //   layers: list of layers to query
    //   srs: the SRS of the layers
    //   (x,y): (pixel) coordinates of query point
    //
    function createWMSGetFeatureInfoRequestURL(serviceUrl, layers, srs, x, y) {
        var extent = fcav.map.getExtent();
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
                height : fcav.map.size.h,
                width  : fcav.map.size.w,
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

    
    function createIdentifyTool() {
        return new ClickTool(
            function (e) {
                // This function gets called when the user clicks a point in the map while the
                // identify tool is active.  The argument `e` is the click event; the coordinates
                // of the clicked point are (e.x, e.y).

                var services = {},
                    service, urlsrs;

                // First remove any exiting popup window left over from a previous identify
                $('#identify_popup').remove();
                
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
                var html = '<table id="identify_results">';
                $.each(fcav.map.layers, function () {
                    var srs, url, name, urlsrs;
                    if (! this.isBaseLayer) {
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
                             +   '<td class="layer-results"><img src="icons/ajax-loader.gif"</td>'
                             + '</tr>'
                            ),
                            {
                                name  : name,
                                label : this.fcavLayer.name
                            }
                        );
                    }
                });
                html = html + "</table>";
                
                // Display the popup window; we'll populate the results later, asynchronously,
                // as they arrive.
                fcav.map.addPopup(new OpenLayers.Popup.FramedCloud(
                    "identify_popup",                   // id
                    fcav.map.getLonLatFromPixel(e.xy),  // lonlat
                    null,                               // contentSize
                    html,                               // contentHTML
                    null,                               // anchor
                    true,                               // closeBox
                    null                                // closeBoxCallback
                ));
                
                // Now loop over each item in the `services` object, generating the GetFeatureInfo request for it
                for (urlsrs in services) {
                    (function () {
                        var service = services[urlsrs],
                            //NOTE: the correct coords to use in the request are (e.xy.y,e.xy.y), which are NOT the same as (e.x,e.y).
                            //      I'm not sure what the difference is, but (e.xy.y,e.xy.y) seems to be what GetFeatureInfo needs.
                            requestUrl = createWMSGetFeatureInfoRequestURL(service.url, service.layers, service.srs, e.xy.x, e.xy.y);
                        $.ajax({
                            url: requestUrl,
                            dataType: "xml",
                            success: function(response) {
                                var $gml = $(response);
                                // For each layer that this request was for, parse the GML for the results
                                // for that layer, and populate the corresponding result in the popup
                                // created above.
                                $.each(service.layers, function () {
                                    var result = getLayerResultsFromGML($gml, this);
                                    $('#identify_results_for_'+this+' td.layer-results').text(result);
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                console.log('got error');
                                alert(textStatus);
                            }
                        });
                    }());
                }
            }
        );
    }

    function getLayerResultsFromGML($gml, layerName) {
        var i,
            children = $gml.find(layerName + '_feature').first().children();
        // Scan the children of the first <layerName_feature> element, looking for the first
        // child which is an element whose name is something other than `gml:boundedBy`; take
        // the text content of that child as the result for this layer.
        for (i=0; i<children.length; ++i) {
            if (children[i].nodeName !== 'gml:boundedBy') {
                return children[i].textContent;
            }
        }
        return undefined;
    }


    function stringContainsChar(string, c) {
        return (string.indexOf(c) >= 0);
    }


    // Accepts an array of strings, and returns a JavaScript object containing a property corresponding
    // to each element in the array; the value of each property is 'true'.
    function arrayToBooleanHash(a) {
        var h = {}, i;
        for (i=0; i<a.length; ++i) {
            h[a[i]] = true;
        }
        return h;
    }

    function parseExtent(extent) {
        var vals = extent.split(',');
        var bounds = new OpenLayers.Bounds(parseFloat(vals[0]), parseFloat(vals[1]), parseFloat(vals[2]), parseFloat(vals[3]));
        return bounds;
    }

    //
    // exports, for testing:
    //
    fcav.BaseLayer                         = BaseLayer;
    fcav.AccordionGroup                    = AccordionGroup;
    fcav.AccordionGroupSublist             = AccordionGroupSublist;
    fcav.Layer                             = Layer;
    fcav.Theme                             = Theme;
    fcav.createWMSGetFeatureInfoRequestURL = createWMSGetFeatureInfoRequestURL;
    fcav.stringContainsChar                = stringContainsChar;
    fcav.FcavState                         = FcavState ;
    fcav.init                              = init ;
    window.fcav                            = fcav;
    
}(jQuery));
