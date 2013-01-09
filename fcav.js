(function ($) {
    "use strict";

    var fcav = {
          map         : undefined, // the OpenLayers map object
          zoomInTool  : undefined,
          zoomOutTool : undefined,
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
                //console.log(errorThrown);
            }
        });

        //
        // layerPicker button:
        //

        //    click action:
        $("#btnTglLyrPick").click(function() {
		    if ($( "#layerPickerDialog" ).dialog('isOpen')) {
			    $( "#layerPickerDialog" ).dialog('close');
            } else {
			    $( "#layerPickerDialog" ).dialog('open');
            }
        });

        //    hover behavior:
        $('#btnTglLyrPick').hover(
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

        //    click action:
        $("#btnTglMapTools").click(function() {
		    if ($( "#mapToolsDialog" ).dialog('isOpen')) {
			    $( "#mapToolsDialog" ).dialog('close');
            } else {
			    $( "#mapToolsDialog" ).dialog('open');
            }
        });

        //    hover behavior:
        $('#btnTglMapTools').hover(
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


        // base layer combo change handler
        $('#baseCombo').change(function() {

            var i = parseInt($("#baseCombo").val(), 10);
            setArcGISCacheBaseLayer(fcav.baseLayers[i].url);

/*
            //alert($("#baseCombo").val());
            //layer is always at index zero so swap that one out accordingly
            map.removeLayer(map.layers[0]);
            
            i=0
            if ($("#baseCombo").val()=="Basic"){
                i=1;
                shareMapBaseMap = "Basic";
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
            }
            else if ($("#baseCombo").val()=="Imagery"){
                i=2;
                shareMapBaseMap = "Imagery";
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
            }
            else if ($("#baseCombo").val()=="Topo_Map"){
                i=3;
                shareMapBaseMap = "Topo_Map";
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
            }
            else if ($("#baseCombo").val()=="Relief"){
                i=4;
                shareMapBaseMap = "Relief";
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
            }         
            
            map.addLayers([baseMapLayers[i].OLBaseMapLayer]);
            //put the new base back in the 0 spot
            var baseLyr = map.getLayersByName(baseMapLayers[i].OLBaseMapLayer.name)[0];
            map.setLayerIndex(baseLyr, 0);
*/

        });



/*        
        
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
        $("#btnPan").click(function() {
            deactivateActiveUserControls();
            dragPanTool.activate();
        });
        $('#btnPan').hover(
            function(){
                document.getElementById("panPic").src = 'icons/pan_over.png';
                $("#btnPan").attr('title', 'Pan tool');
            },
            function(){
                document.getElementById("panPic").src = 'icons/pan.png';
            }
        ); 
        $("#btnZoomExtent").click(function() {
            //zoomToExtent: function(bounds,closest)
            //array should consist of four values (left, bottom, right, top)
            var leftBottom = new OpenLayers.LonLat("-123.486328125", "32.76880048488168").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
            var rightTop = new OpenLayers.LonLat("-68.02734375", "45.460130637921004").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
            var bounds = new OpenLayers.Bounds(leftBottom.lon,leftBottom.lat,rightTop.lon,rightTop.lat);	
            map.zoomToExtent(bounds,false);
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
        $("#btnMultiGraph").click(function() {
            //http://openlayers.org/dev/examples/click.html
            //http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Handler/Click-js.html
            //http://rain.nemac.org/timeseries/tsmugl_product.cgi?args=CONUS_NDVI,-11915561.548108513,4714792.352997124
            deactivateActiveUserControls();
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
        $("#btnZoomIn").click(function() {
            deactivateActiveUserControls();
            zoomInTool.activate();
        });
        $('#btnZoomIn').hover(
            function(){
                document.getElementById("zoomInPic").src = 'icons/zoom-in_over.png';
                $("#btnZoomIn").attr('title', 'Zoom in tool');
            },
            function(){
                document.getElementById("zoomInPic").src = 'icons/zoom-in.png';
            }
        ); 
        $("#btnZoomOut").click(function() {
            deactivateActiveUserControls();
            zoomOutTool.activate();
        });
        $('#btnZoomOut').hover(
            function(){
                document.getElementById("zoomOutPic").src = 'icons/zoom-out_over.png';
                $("#btnZoomOut").attr('title', 'Zoom out tool');
            },
            function(){
                document.getElementById("zoomOutPic").src = 'icons/zoom-out.png';
            }
        ); 
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

    function parseConfig(configXML) {
        var $configXML = $(configXML);

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
            //console.log('accordion group: gid=' + gid + ' name=' + name + ' label=' + label);
            $wmsGroup.find("wmsSubgroup").each(function() {
                var $wmsSubgroup = $(this), // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                    label = $wmsGroup.attr('label');
                //console.log('   accordion sublist: label=' + label);
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
                    //console.log('       layer: lid=' + lid + ' name=' + name);
                });
            });
        });

        // parse themes
        $configXML.find("mapviews view").each(function() {
            var $view = $(this),
                name  = $view.attr('name'),
                label = $view.attr('label');
            $('#themeCombo').append($('<option value="'+name+'">'+label+'</option>'));
            //console.log('view name=' + name + ' label=' + label);
            $view.find("viewGroup").each(function() {
                var $viewGroup = $(this),
                    name       = $viewGroup.attr('name');
                //console.log('    viewGroup name=' + name);
                if (accordionGroups[name] === undefined) {
                    displayError('Unknown accordion group name: ' + name);
                }

            });
        });

    }

    function initOpenLayers() {

        fcav.zoomInTool  = new OpenLayers.Control.ZoomBox();
        fcav.zoomOutTool = new OpenLayers.Control.ZoomBox({out:true});

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
		    //displayProjection: new OpenLayers.Projection("EPSG:4326")
        });    


        //setArcGISCacheBaseLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
        //setArcGISCacheBaseLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer");
        //setArcGISCacheBaseLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer");
        //setArcGISCacheBaseLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer");
//   setArcGISCacheBaseLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
        //setArcGISCacheBaseLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
        //setArcGISCacheBaseLayer("http://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer");
        //setArcGISCacheBaseLayer("http://arcgisserver7.nemac.org/ArcGIS/rest/services/US/US_Jurisdictions_filled2/MapServer/");

    }

    function setArcGISCacheBaseLayer(url) {
        $.ajax({
            url: url + '?f=json&pretty=true',
            dataType: "jsonp",
            success:  function (layerInfo) {
                var baseLayer = new OpenLayers.Layer.ArcGISCache("AGSCache", url, {
                    layerInfo: layerInfo
                });
                var hadBaseLayer = (fcav.map.baseLayer !== null);
                if (hadBaseLayer) {
                    fcav.map.removeLayer(fcav.map.layers[0]);
                }
                fcav.map.addLayers([baseLayer]);
                fcav.map.setLayerIndex(baseLayer, 0);
                if (! hadBaseLayer) {
                    var lat=39.095962936305476,
                        lon=-96.0859375,
                        zoom=5,
                        lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), fcav.map.getProjectionObject());
                    fcav.map.setCenter(lonLat, zoom);
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
