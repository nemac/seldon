(function ($) {
    "use strict";

    var fcav = {
          map         : undefined, // the OpenLayers map object
          zoomInTool  : undefined,
          zoomOutTool : undefined,
          dragPanTool : undefined,
          maxExtent   : {
              xmin : -15000000,
              ymin : 2000000,
              xmax : -6000000,
              ymax : 7000000
          },
          baseLayers  : []
    };

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
                                         autoOpen: false,
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
                                      autoOpen: false,
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
            setArcGISCacheBaseLayer(fcav.baseLayers[i].url);
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



/*        
        // 
        // identify button
        // 
        $("#btnID").click(function() {
            //alert("Handler for IDcalled.");
            identify();
        });
        $('#btnID').hover(
            function(){
                document.getElementById("idPic").src = 'icons/map-info_over.png';
                $("#btnID").attr('title', 'Identify tool');
            },
            function(){
                document.getElementById("idPic").src = 'icons/map-info.png';
            }
        ); 

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
		    if ((fcav.map.controls[i].active==true) && (fcav.map.controls[i].displayClass=="olControlZoomBox")){
                fcav.map.controls[i].deactivate();
            }
		    if ((fcav.map.controls[i].active==true) && (fcav.map.controls[i].displayClass=="olControlWMSGetFeatureInfo")){
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
            var $image   = $(this),
                name     = $image.attr('name'),
                label    = $image.attr('label'),
                url      = $image.attr('url'),
                selected = $image.attr('selected');
            fcav.baseLayers.push({
                name     : name,
                label    : label,
                url      : url
            });
            $('#baseCombo').append($('<option value="'+i+'">'+label+'</option>'));
            if (selected) {
                selectedBaseLayerIndex = i;
            }
        });
        setArcGISCacheBaseLayer(fcav.baseLayers[selectedBaseLayerIndex].url);
        $('#baseCombo').val(selectedBaseLayerIndex);

        // parse layer groups and layers
        var accordionGroups = {};
        $configXML.find("wmsGroup").each(function() {
            var $wmsGroup = $(this), // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
                gid       = $wmsGroup.attr('gid'),
                name      = $wmsGroup.attr('name'),
                label     = $wmsGroup.attr('label');
            accordionGroups[name] = label;
            $wmsGroup.find("wmsSubgroup").each(function() {
                var $wmsSubgroup = $(this), // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                    label = $wmsGroup.attr('label');
                $wmsSubgroup.find("wmsLayer").each(function() {
                    var $wmsLayer = $(this),
                        lid       = $wmsLayer.attr('lid'),
                        visible   = $wmsLayer.attr('visible'),
                        url       = $wmsLayer.attr('url'),
                        srs       = $wmsLayer.attr('srs'),
                        layers    = $wmsLayer.attr('layers'),
                        styles    = $wmsLayer.attr('styles'),
                        identify  = $wmsLayer.attr('identify'),
                        name      = $wmsLayer.attr('name'),
                        legend    = $wmsLayer.attr('legend');
                });
            });
        });

        // parse themes
        $configXML.find("mapviews view").each(function() {
            var $view = $(this),
                name  = $view.attr('name'),
                label = $view.attr('label');
            $('#themeCombo').append($('<option value="'+name+'">'+label+'</option>'));
            $view.find("viewGroup").each(function() {
                var $viewGroup = $(this),
                    name       = $viewGroup.attr('name');
                if (accordionGroups[name] === undefined) {
                    displayError('Unknown accordion group name: ' + name);
                }

            });
        });

    }

    function initOpenLayers() {

        fcav.zoomInTool  = new OpenLayers.Control.ZoomBox();
        fcav.zoomOutTool = new OpenLayers.Control.ZoomBox({out:true});
        fcav.dragPanTool = new OpenLayers.Control.DragPan();

        fcav.map = new OpenLayers.Map('map', {
	        controls: [
		        new OpenLayers.Control.Navigation({
			        dragPanOptions: {
				        enableKinetic: true
			        }
			    }),
		        new OpenLayers.Control.Attribution(),
                fcav.zoomInTool,
                fcav.zoomOutTool
		    ],
            eventListeners: 
            {
                "moveend": mapEvent,
                "zoomend": mapEvent
            },               
		    maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),

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

    function setArcGISCacheBaseLayer(url) {
        $.ajax({
            url: url + '?f=json&pretty=true',
            dataType: "jsonp",
            success:  function (layerInfo) {
                var baseLayer = new OpenLayers.Layer.ArcGISCache("AGSCache", url, {
                    layerInfo: layerInfo
                });
                //NOTE: "x = !!y" sets x to a Boolean, true if and only if y is truthy
                //      (not null and not undefined, in this case)
                var hadBaseLayer = !!fcav.map.baseLayer;
                if (hadBaseLayer) {
                    fcav.map.removeLayer(fcav.map.layers[0]);
                }
                fcav.map.addLayers([baseLayer]);
                fcav.map.setLayerIndex(baseLayer, 0);
                if (! hadBaseLayer) {
                    fcav.map.zoomToExtent(new OpenLayers.Bounds(fcav.maxExtent.xmin, fcav.maxExtent.ymin, fcav.maxExtent.xmax, fcav.maxExtent.ymax), false);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });
    }


    function mapEvent(event) {
        // ... update shareMapURL ...
    }    



}(jQuery));
