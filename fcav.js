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
        baseLayers      : [], // list of BaseLayer instances holding info about base layers from config file
        accordionGroups : [], // list of AccordionGroup instances holding info about accordion groups from config file
        themes          : [], // list of Theme instances holding info about themes from config file
        propertiesLayer : undefined // reference to Layer() instance of the layer that should receive changes
                                    // made in layerProperties dialog (opacity, etc)
    };

    function BaseLayer(settings) {
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.url   = settings.url;
    }
    function AccordionGroup(settings) {
        this.sublists = [];
        if (!settings) { return; }
        this.gid      = settings.gid;
        this.name     = settings.name;
        this.label    = settings.label;
    }
    function AccordionGroupSublist(settings) {
        this.layers = [];
        if (!settings) { return; }
        this.label  = settings.label;
    }
    function Layer(settings) {
        if (!settings) { return; }
        this.lid		        = settings.lid;
        this.visible	        = settings.visible;
        this.url		        = settings.url;
        this.srs		        = settings.srs;
        this.layers		        = settings.layers;
        this.styles		        = settings.styles;
        this.identify	        = settings.identify;
        this.name		        = settings.name;
        this.legend		        = settings.legend;
        this.opacity            = 100;
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

            if (this.url.indexOf('wlayers') === -1) {
                options.singleTile = true;
                options.ratio      = 1;
            } else {
                options.tileSize = new OpenLayers.Size(500,500);
                options.ratio    = 1;
                options.buffer   = 2;
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
        this.setOpacity = function(opacity) {
            console.log('opacity of layer ' + this.name + ' set to ' + opacity);
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(parseFloat(opacity)/100.0);
            }
            this.opacity = opacity;
        };

    }

    function Theme(settings) {
        this.accordionGroups = [];
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
    }


    function displayError(message) {
        console.log(message);
    }

    $('document').ready(function() {

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
                document.getElementById("zoomExtentPic").src = 'icons/zoom-extent_over.png';
                $("#btnZoomExtent").attr('title', 'Full Extent tool');
            },
            function(){
                document.getElementById("zoomExtentPic").src = 'icons/zoom-extent.png';
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

        // 
        // help button
        // 
        $("#btnHelp").click(function() {
            //alert("Handler for help called.");
            //getCurrentExtent();
        });
        $('#btnHelp').hover(
            function(){
                document.getElementById("helpPic").src = 'icons/help_over.png';
                $("#btnHelp").attr('title', 'Get help');
            },
            function(){
                //$('#btnHelp')[0].firstElementChild.src = 'icons/help.png';
                document.getElementById("helpPic").src = 'icons/help.png';
            }
        ); 
         */

    });

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

        // initialize the OpenLayers map object
        initOpenLayers();

        // parse base layers and populate combo box
        var selectedBaseLayerIndex = 0;
        $configXML.find("images image").each(function(i) {
            var $image    = $(this),
                selected  = $image.attr('selected'),
                baseLayer = new BaseLayer({
                    name     : $image.attr('name'),
                    label    : $image.attr('label'),
                    url      : $image.attr('url')
                });
            fcav.baseLayers.push(baseLayer);
            $('#baseCombo').append($('<option value="'+i+'">'+baseLayer.label+'</option>'));
            if (selected) {
                selectedBaseLayerIndex = i;
            }
        });
        setArcGISCacheBaseLayer(fcav.baseLayers[selectedBaseLayerIndex]);
        $('#baseCombo').val(selectedBaseLayerIndex);

        // parse layer groups and layers
        var accordionGroupsByName = {};
        $configXML.find("wmsGroup").each(function() {
            var $wmsGroup      = $(this), // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
                accordionGroup = new AccordionGroup({
                    gid   : $wmsGroup.attr('gid'),
                    name  : $wmsGroup.attr('name'),
                    label : $wmsGroup.attr('label')
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
                        lid       : $wmsLayer.attr('lid'),
                        visible   : $wmsLayer.attr('visible'),
                        url       : $wmsLayer.attr('url'),
                        srs       : $wmsLayer.attr('srs'),
                        layers    : $wmsLayer.attr('layers'),
                        styles    : $wmsLayer.attr('styles'),
                        identify  : $wmsLayer.attr('identify'),
                        name      : $wmsLayer.attr('name'),
                        legend    : $wmsLayer.attr('legend')
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
                    label : $view.attr('label')
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
        setTheme(fcav.themes[selectedThemeIndex]);
        $('#themeCombo').val(selectedThemeIndex);


    }

    function initOpenLayers() {

        fcav.zoomInTool   = new OpenLayers.Control.ZoomBox();
        fcav.zoomOutTool  = new OpenLayers.Control.ZoomBox({out:true});
        fcav.dragPanTool  = new OpenLayers.Control.DragPan();
        fcav.identifyTool = createIdentifyTool();

        fcav.map = new OpenLayers.Map('map', {
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
		    maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
//numZoomLevels
//tileSize
            resolutions: [156543.033928,
                          78271.5169639999,
                          39135.7584820001,
                          19567.8792409999,
                          9783.93962049996,
                          4891.96981024998,
                          2445.98490512499,
                          1222.99245256249,
                          611.49622628138,
                          305.748113140558,
                          152.874056570411,
                          76.4370282850732,
                          38.2185141425366,
                          19.1092570712683,
                          9.55462853563415,
                          4.77731426794937,
                          2.38865713397468,
                          1.19432856685505,
                          0.597164283559817,
                          0.298582141647617],

	        zoom: 1,
		    units: 'm',
		    projection: new OpenLayers.Projection("EPSG:900913")
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
                //NOTE: "x = !!y" sets x to a Boolean, true if and only if y is truthy
                //      (not null and not undefined, in this case)
                var hadBaseLayer = !!fcav.map.baseLayer;
                if (hadBaseLayer) {
                    fcav.map.removeLayer(fcav.map.layers[0]);
                }
                fcav.map.addLayers([layer]);
                fcav.map.setLayerIndex(layer, 0);
                if (! hadBaseLayer) {
                    fcav.map.zoomToExtent(new OpenLayers.Bounds(fcav.maxExtent.xmin, fcav.maxExtent.ymin, fcav.maxExtent.xmax, fcav.maxExtent.ymax), false);
                }
                fcav.map.resolutions = layerInfo.resolutions;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });
    }

    function setTheme(theme) {

        $('#layerPickerAccordion').empty();
        $("#layerPickerAccordion").accordion('destroy');
        $('#layerPickerAccordion').listAccordion({ clearStyle: true, autoHeight: false });

        $('#legend').empty();

        $.each(theme.accordionGroups, function (i, accordionGroup) {
            var g = $('#layerPickerAccordion').listAccordion('addSection', '<a>'+accordionGroup.label+'</a>');
            $.each(accordionGroup.sublists, function (j, sublist) {
                var s = $('#layerPickerAccordion').listAccordion('addSublist', g, sublist.label);
                $.each(sublist.layers, function (k, layer) {
                    $('#layerPickerAccordion').listAccordion('addSublistItem', s,
                                                             [createLayerToggleCheckbox(layer),
                                                              $('<label for="chk'+layer.lid+'">'+layer.name+'</label>'),
                                                              createLayerPropertiesIcon(layer)]);
                });
            });
        });
        $('#layerPickerAccordion').accordion('activate', 0);

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
            new LayerPropertiesDialog(layer);
        });
        return layer.$propertiesIcon;
    }


    function LayerPropertiesDialog(layer) {
        var $html = $(''
                      + '<div class="layer-properties-dialog" style="width:auto;">'
                      +   '<table>'
                      +     '<tr>'
                      +       '<td>Opacity:</td>'
                      +        '<td>'
                      +          '<div class="opacity-slider"></div>'
                      +        '</td>'
                      +       '<td>'
                      +         '<input class="opacity-text" style="border-color:transparent;" type="text" size="2"/>%'
                      +       '</td>'
                      +     '</tr>'
                      +   '</table>'
                      + '</div>'
                     );
            

        $html.find('input.opacity-text').val(layer.opacity);
        $html.find('.opacity-slider').slider({
            min   : 0,
            max   : 100,
            step  : 1,
            value : layer.opacity,
		    slide : function(event, ui) {
                $html.find('input.opacity-text').val(ui.value);
                layer.setOpacity(ui.value);
            }
        });
        $html.find('input.opacity-text').change(function() {
            var newValueFloat = parseFloat($(this).val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $(this).val($html.find('.opacity-slider').slider('value'));
                return;
            }
            $html.find('.opacity-slider').slider("value", $(this).val());
            layer.setOpacity($(this).val());
        });

        $html.dialog({
            zIndex    : 10050, 
            position  : "left",
            autoOpen  : true,
            hide      : "explode",
            title     : layer.name,
            close     : function() {
                $(this).dialog('destroy');
                $html.remove();
            }
        });
    }


    function mapEvent(event) {
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
//			"Feature Info:", 
//			fcav.map.getLonLatFromPixel(e.xy),
//			null,
//			e.text, //gmlData,
//			null,
//			true
//		));
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
                c      : (serviceUrl.indexOf('?') === -1) ? '?' : '&',
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
                
                // First we loop over all the current (non-base) layers in the map to
                // construct the GetFeatureInfo requests. There will be one request for each
                // unique WMS layer service URL and SRS combination. (Typically, and in all
                // cases I know of that we are using at the momenet, all layers from the same
                // WMS service use the same SRS, so this amounts to one request per WMS
                // service, but coding it to depend on the SRS as well makes it more flexible
                // for the future, in case ever have multiple layers from the same WMS using
                // different SRSes).  This loop populates the `services` object with one
                // entry per url/srs combination; each entry records a url, srs, and list of
                // layers, corresponding to one GetFeatureInfo request that will need to be
                // made.  We also builds up the html that will display the results in the
                // popup window here.
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
			        "Feature Info:",                    // id
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
                            requestUrl = createWMSGetFeatureInfoRequestURL(service.url, service.layers, service.srs, e.x, e.y);
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
            

    
}(jQuery));

