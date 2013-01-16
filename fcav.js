(function ($) {
    "use strict";

    var EventEmitter = window.EventEmitter,
        fcav = {},
        app;

    fcav.App = function () {
        EventEmitter.call(this);
        this.map         = undefined; // OpenLayers map object
        this.zoomInTool  = undefined; // OpenLayers zoom in tool
        this.zoomOutTool = undefined; // OpenLayers zoom out tool
        this.dragPanTool = undefined; // OpenLayers dragpan tool
        this.maxExtent   = {
            xmin : -15000000,  //NOTE: These values get replaced by settings from the config file.
            ymin : 2000000,    //      Don't worry about keeping these in sync if the config fil 
            xmax : -6000000,   //      changes; these are just here to prevent a crash if we ever
            ymax : 7000000     //      read a config file that is missing the <extent> element.
        };
        this.baseLayers       = []; // list of BaseLayer instances holding info about base layers from config file
        this.accordionGroups  = []; // list of AccordionGroup instances holding info about accordion groups from config file
        this.themes           = []; // list of Theme instances holding info about themes from config file
        this.currentBaseLayer = undefined;
        this.currentTheme     = undefined;
        this.shareUrl = function() {
            if (!this.currentTheme) { return undefined; }
            if (!this.currentAccordionGroup) { return undefined; }
            if (!this.currentBaseLayer) { return undefined; }

            var extent      = this.map.getExtent(),
                layerLids   = [],
                layerAlphas = [],
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
                    layerLids.push(this.fcavLayer.lid);
                    layerAlphas.push(op);
                }
            });

            url   = window.location.toString();
            url = url.replace(/\?.*$/, '');
            url = url.replace(/\/$/, '');
            return url + '?' + (new ShareUrlInfo({
                themeName         : this.currentTheme.name,
                layerLids         : layerLids,
                layerAlphas       : layerAlphas,
                accordionGroupGid : this.currentAccordionGroup.gid,
                baseLayerName     : this.currentBaseLayer.name,
                extent            : extent
            })).urlArgs();
        };
        this.updateShareMapUrl = function() {
            if (this.currentTheme) {
                var url = this.shareUrl();
                if (url) {
                    $('#mapToolsDialog textarea.shareMapUrl').val(url);
                }
            }
        };
    };
    EventEmitter.declare(fcav.App);

    function BaseLayer(settings) {
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.url   = settings.url;
        this.index = settings.index;
        //app.baseLayersByName[this.name] = this;
    }
    function AccordionGroup(settings) {
        this.sublists = [];
        if (!settings) { return; }
        this.gid              = settings.gid;
        this.name             = settings.name;
        this.label            = settings.label;
        this.selectedInConfig = settings.selectedInConfig;
        this.index            = settings.index;
    }
    function AccordionGroupSublist(settings) {
        this.layers = [];
        if (!settings) { return; }
        this.label  = settings.label;
    }
    function Layer(settings) {
        EventEmitter.call(this);
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
                                             maxExtent   : new OpenLayers.Bounds(app.maxExtent),
                                             transparent : true
                                         },
                                         options
                                        );
            this.openLayersLayer.setOpacity(1-parseFloat(this.transparency)/100.0);
            this.openLayersLayer.fcavLayer = this;
            return this.openLayersLayer;
        };
        this.activate = function(suppressCheckboxUpdate) {
            app.map.addLayer(this.createOpenLayersLayer());
            this.addToLegend();
            this.emit("activate");
        };
        this.deactivate = function(suppressCheckboxUpdate) {
            if (this.openLayersLayer) {
                app.map.removeLayer(this.openLayersLayer);
                this.removeFromLegend();
            }
            this.emit("deactivate");
        };
        this.addToLegend = function() {
            var that = this;
            this.$legendItem = $('<div id="lgd'+this.lid+'"><img src="'+this.legend+'"/></div>') .
                appendTo($('#legend')) .
                click(function() {
                    that.deactivate();
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
            this.emit({type : 'transparency', value : this.transparency});
        };
        //app.layersByLid[this.lid] = this;
    }
    EventEmitter.declare(Layer);

    function Theme(settings) {
        this.accordionGroups = [];
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.index = settings.index;
        //app.themesByName[this.name] = this;
    }


    function displayError(message) {
        console.log(message);
    }

    fcav.init = function() {

        app = new fcav.App();

        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());

        $.ajax({
            url: './config/ews_config.xml',
            dataType: "xml",
            success: function(configXML) {
                parseConfig(configXML, shareUrlInfo);
            },
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
        app.addListener("accordiongroupchange", function() {
            $('#layerPickerAccordion').accordion('activate', app.currentAccordionGroup.index);
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

        app.addListener("themechange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("baselayerchange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("accordiongroupchange", function () {
            app.updateShareMapUrl();
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
            setBaseLayer(app.baseLayers[i]);
        });
        app.addListener("baselayerchange", function() {
            $('#baseCombo').val(app.currentBaseLayer.index);
        });

        //
        // theme layer combo change handler
        //
        $('#themeCombo').change(function() {
            var i = parseInt($("#themeCombo").val(), 10);
            setTheme(app.themes[i]);
        });
        app.addListener("themechange", function() {
            $('#themeCombo').val(app.currentTheme.index);
        });


        // 
        // pan button
        // 
        $("#btnPan").click(function() {
            deactivateActiveOpenLayersControls();
            app.dragPanTool.activate();
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
            app.zoomInTool.activate();
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
            app.zoomOutTool.activate();
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
            app.map.zoomToExtent(new OpenLayers.Bounds(app.maxExtent.xmin, app.maxExtent.ymin, app.maxExtent.xmax, app.maxExtent.ymax), false);
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
            console.log(app.shareUrl());
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
    };

    function deactivateActiveOpenLayersControls() {
        for (var i = 0; i < app.map.controls.length; i++) {
            if ((app.map.controls[i].active==true)
                &&
                ((app.map.controls[i].displayClass=="olControlZoomBox")
                 ||
                 (app.map.controls[i].displayClass=="olControlWMSGetFeatureInfo")
                 ||
                 (app.map.controls[i].displayClass=="ClickTool"))) {
                app.map.controls[i].deactivate();
            }
        }
    }

    function ShareUrlInfo(settings) {
        if (settings === undefined) {
            settings = {};
        }
        this.themeName         = settings.themeName;
        this.accordionGroupGid = settings.accordionGroupGid;
        this.baseLayerName     = settings.baseLayerName;
        this.extent            = settings.extent;
        this.layerLids         = settings.layerLids;
        this.layerAlphas       = settings.layerAlphas;
        if (this.extent === undefined) {
            this.extent = {};
        }
        if (this.layerLids === undefined) {
            this.layerLids = [];
        }
        if (this.layerAlphas === undefined) {
            this.layerAlphas = [];
        }
    }
    ShareUrlInfo.parseUrl = function(url) {
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
    ShareUrlInfo.prototype.urlArgs = function() {
        return Mustache.render(
            (''
             + 'theme={{{theme}}}'
             + '&layers={{{layers}}}'
             + '&alphas={{{alphas}}}'
             + '&accgp={{{accgp}}}'
             + '&basemap={{{basemap}}}'
             + '&extent={{{extent.left}}},{{{extent.bottom}}},{{{extent.right}}},{{{extent.top}}}'
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

    function parseConfig(configXML, shareUrlInfo) {
        var $configXML = $(configXML),
            initialBaseLayer,
            initialTheme,
            shareUrlLayerAlpha,
            themeOptions = {};

        if (shareUrlInfo !== undefined) {
            shareUrlLayerAlpha = {};
            $.each(shareUrlInfo.layerLids, function(i) {
                shareUrlLayerAlpha[shareUrlInfo.layerLids[i]] = shareUrlInfo.layerAlphas[i];
            });
        }

        // parse and store max map extent from config file
        var $extent = $configXML.find("extent");
        if ($extent && $extent.length > 0) {
            app.maxExtent = {
                xmin : parseFloat($extent.attr('xmin')),
                ymin : parseFloat($extent.attr('ymin')),
                xmax : parseFloat($extent.attr('xmax')),
                ymax : parseFloat($extent.attr('ymax'))
            };
        }

        // parse base layers and populate combo box
        $configXML.find("images image").each(function(i) {
            var $image    = $(this),
                selected  = $image.attr('selected'),
                baseLayer = new BaseLayer({
                    name     : $image.attr('name'),
                    label    : $image.attr('label'),
                    url      : $image.attr('url'),
                    index    : i
                });
            app.baseLayers.push(baseLayer);
            $('#baseCombo').append($('<option value="'+i+'">'+baseLayer.label+'</option>'));
            if ((  shareUrlInfo  &&   (shareUrlInfo.baseLayerName===baseLayer.name))
                ||
                ( !shareUrlInfo  &&   ($image.attr('selected')                    ))) {
                initialBaseLayer = baseLayer;
            }
        });
        if (initialBaseLayer === undefined) {
            initialBaseLayer = app.baseLayers[0];
        }

        // parse layer groups and layers
        var accordionGroupsByName = {};
        $configXML.find("wmsGroup").each(function(i) {
            var $wmsGroup      = $(this), // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
                accordionGroup = new AccordionGroup({
                    gid              : $wmsGroup.attr('gid'),
                    name             : $wmsGroup.attr('name'),
                    label            : $wmsGroup.attr('label'),
                    selectedInConfig : ($wmsGroup.attr('selected') === "true"),
                    index            : i
                });
            app.accordionGroups.push(accordionGroup);
            accordionGroupsByName[accordionGroup.name] = accordionGroup;
            if (shareUrlInfo && (shareUrlInfo.accordionGroupGid === accordionGroup.gid)) {
                themeOptions.accordionGroup = accordionGroup;
            }
            $wmsGroup.find("wmsSubgroup").each(function() {
                var $wmsSubgroup = $(this), // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                    sublist      = new AccordionGroupSublist({
                        label : $wmsSubgroup.attr('label')
                    });
                accordionGroup.sublists.push(sublist);
                $wmsSubgroup.find("wmsLayer").each(function() {
                    var $wmsLayer = $(this),
                        layer = new Layer({
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
                        });
                    sublist.layers.push(layer);
                    if (shareUrlInfo && (shareUrlLayerAlpha[layer.lid] !== undefined)) {
                        if (themeOptions.layers === undefined) {
                            themeOptions.layers = [];
                        }
                        themeOptions.layers.push(layer);
                        layer.setTransparency(100*(1-shareUrlLayerAlpha[layer.lid]));
                    }
                });
            });
        });

        // parse themes
        $configXML.find("mapviews view").each(function(i) {
            var $view = $(this),
                theme = new Theme({
                    name  : $view.attr('name'),
                    label : $view.attr('label'),
                    index : i
                });
            app.themes.push(theme);
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
            if ((  shareUrlInfo  &&   (shareUrlInfo.themeName===theme.name))
                ||
                ( !shareUrlInfo  &&   ($view.attr('selected')                    ))) {
                initialTheme = theme;
            }
        });
        if (initialTheme === undefined) {
            initialTheme = app.themes[0];
        }

        // also need to address from share url:
        //    layers, alphas
        //    extent
        //    accgp

        app.zoomInTool   = new OpenLayers.Control.ZoomBox();
        app.zoomOutTool  = new OpenLayers.Control.ZoomBox({out:true});
        app.dragPanTool  = new OpenLayers.Control.DragPan();
        app.identifyTool = createIdentifyTool();

        var initialExtent = undefined;

        if (shareUrlInfo) {
            initialExtent = shareUrlInfo.extent;
        }

        $.ajax({
            url: initialBaseLayer.url + '?f=json&pretty=true',
            dataType: "jsonp",
            success:  function (baseLayerInfo) {
                initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });

    }

    function initOpenLayers(baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
        var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
            layerInfo: baseLayerInfo
        });
        
        var maxExtentBounds = new OpenLayers.Bounds(app.maxExtent.xmin, app.maxExtent.ymin,
                                                    app.maxExtent.xmax, app.maxExtent.ymax);
        var initialExtentBounds;
        if (initialExtent !== undefined) {
            initialExtentBounds = new OpenLayers.Bounds(initialExtent.left, initialExtent.bottom,
                                                        initialExtent.right, initialExtent.top);
        } else {
            initialExtentBounds = maxExtentBounds;
        }
        app.map = new OpenLayers.Map('map', {
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
                app.zoomInTool,
                app.zoomOutTool,
                app.identifyTool
            ],
            eventListeners: 
            {
                "moveend": mapEvent,
                "zoomend": mapEvent
            },               
            zoom: 1,
            projection: new OpenLayers.Projection("EPSG:900913")
        });    
        
        // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
        // to fetch the layerInfo, which in this case we already have
        app.currentBaseLayer = baseLayer;
        app.emit("baselayerchange");

        app.map.addLayers([layer]);
        app.map.setLayerIndex(layer, 0);
        setTheme(theme, themeOptions);
        app.map.zoomToExtent(initialExtentBounds, true);
    }

    function setAccordionGroup(accordionGroup) {
        app.currentAccordionGroup = accordionGroup;
        app.emit("accordiongroupchange");
    }

    function setBaseLayer(baseLayer) {
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

    function setTheme(theme, options) {
        $('#layerPickerAccordion').empty();
        $("#layerPickerAccordion").accordion('destroy');
        $('#layerPickerAccordion').listAccordion({
            clearStyle : true,
            autoHeight : false,
            change     : function(event, ui) {
                var accordionGroupIndex = $("#layerPickerAccordion").accordion('option', 'active');
                setAccordionGroup(theme.accordionGroups[accordionGroupIndex]);
            }
        });

        $('#legend').empty();
        var accordionGroup;

        if (options === undefined) {
            options = {};
        }

        $.each(theme.accordionGroups, function (i, accGp) {
            // Decide whether to open this accordion group.  If we received an
            // `accordionGroup` setting in the options are, activate this accordion
            // group only if it equals that setting.  If we did not receive an
            // `accordionGroup` setting in the options are, activate this accordion
            // group if its "selected" attribute was true in the config file.
            if ((options.accordionGroup && (accGp === options.accordionGroup))
                ||
                (!options.accordionGroup && accGp.selectedInConfig)) {
                    accordionGroup = accGp;
            }
            var g = $('#layerPickerAccordion').listAccordion('addSection', '<a>'+accGp.label+'</a>');
            $.each(accGp.sublists, function (j, sublist) {
                var s = $('#layerPickerAccordion').listAccordion('addSublist', g, sublist.label);
                $.each(sublist.layers, function (k, layer) {
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

                    // add the layer to the accordion group
                    $('#layerPickerAccordion').listAccordion('addSublistItem', s,
                                                             [createLayerToggleCheckbox(layer),
                                                              $('<label for="chk'+layer.lid+'">'+layer.name+'</label>'),
                                                              createLayerPropertiesIcon(layer)]);
                    // Decide whether to activate the layer.  If we received a layer list in the
                    // options arg, active the layer only if it appears in that list.  If we
                    // received no layer list in the options arg, activate the layer if the layer's
                    // "selected" attribute was true in the config file.
                    if (((options.layers !== undefined) && (arrayContainsElement(options.layers, layer)))
                        ||
                        ((options.layers === undefined) && layer.selectedInConfig)) {
                        layer.activate();
                    }
                });
            });
        });
        if (!accordionGroup) {
            // if we get to this point and don't have an accordion group to open,
            // default to the first one
            accordionGroup = theme.accordionGroups[0];
        }
        setAccordionGroup(accordionGroup);
        app.currentTheme = theme;
        app.emit("themechange");
    }

    function createLayerToggleCheckbox(layer) {
        // create the checkbox
        var $checkbox = $('<input type="checkbox" id="chk'+layer.lid+'"></input>').click(function() {
            if ($(this).is(':checked')) {
                layer.activate(true);
            } else {
                layer.deactivate(true);
            }
        });
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $checkbox.attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $checkbox.attr('checked', false);
        });
        // return the new checkbox jQuery object
        return $checkbox;
    }

    function createLayerPropertiesIcon(layer) {
        return $('<img class="layerPropertiesIcon" id="'+layer.lid+'" src="icons/settings.png"/>').click(function() {
            createLayerPropertiesDialog(layer);
        });
    }


    function createLayerPropertiesDialog(layer) {

        if (createLayerPropertiesDialog.$html[layer.lid]) {
            createLayerPropertiesDialog.$html[layer.lid].dialog('destroy');
            createLayerPropertiesDialog.$html[layer.lid].remove();
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
                layer.setTransparency(ui.value);
            }
        });
        layer.addListener("transparency", function (e) {
            $html.find('.transparency-slider').slider("value", e.value);
        });
        $html.find('input.transparency-text').change(function() {
            var newValueFloat = parseFloat($(this).val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $(this).val(layer.transparency);
                return;
            }
            layer.setTransparency($(this).val());
        });
        layer.addListener("transparency", function (e) {
            $html.find('input.transparency-text').val(e.value);
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
                createLayerPropertiesDialog.$html[layer.lid] = undefined;
            }
        });
        createLayerPropertiesDialog.$html[layer.lid] = $html;
    }
    // Object to be used as hash for tracking the $html objects created by createLayerPropertiesDialog;
    // keys are layer lids:
    createLayerPropertiesDialog.$html = {};


    function mapEvent(event) {
        app.updateShareMapUrl();
        // ... update shareMapURL ...
    }    


    function activateIdentifyTool()
    {
        deactivateActiveOpenLayersControls();
        app.identifyTool.activate();
    }

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
        var extent = app.map.getExtent();
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
                $.each(app.map.layers, function () {
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
                app.map.addPopup(new OpenLayers.Popup.FramedCloud(
                    "identify_popup",                   // id
                    app.map.getLonLatFromPixel(e.xy),  // lonlat
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

    function arrayContainsElement(array, element) {
        var i;
        if (array === undefined) {
            return false;
        }
        for (i=0; i<array.length; ++i) {
            if (array[i] === element) {
                return true;
            }
        }
        return false;
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
    fcav.ShareUrlInfo                      = ShareUrlInfo;
    window.fcav                            = fcav;
    
}(jQuery));
