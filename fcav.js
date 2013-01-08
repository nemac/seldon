(function ($) {
    "use strict";

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

/*
        // arrange to open/close layerPicker dialog when layer button (image) is clicked:
        $("#btnTglLyrPick").click(function() {
		    if ($( "#layerPickerDialog" ).dialog('isOpen')) {
			    $( "#layerPickerDialog" ).dialog('close');
            } else {
			    $( "#layerPickerDialog" ).dialog('open');
            }
        });

        // turn layerPickerDialog div into a jQuery UI dialog:
        $("#layerPickerDialog").dialog({ zIndex:10050, 
                                         position:"left",
                                         autoOpen: true,
                                         hide:"explode"
                                       });

        // configure alternate image for hovering over layer image
console.log($('#btnTglLyrPick'));
        $('#btnTglLyrPick').hover(
            function(){
console.log('at 1');
                document.getElementById("tglLyrPickPic").src = 'icons/layers_over.png';
                $("#btnTglLyrPick").attr('title', 'Show/hide Layer Picker');
            },
            function(){
console.log('at 2');
                document.getElementById("tglLyrPickPic").src = 'icons/layers.png';
            }
        ); 	
console.log('end document ready');
*/




        /*
        $("#btnTglMapTools").click(function() {
		    if ($( "#mapToolsDialog" ).dialog('isOpen')) {
			    $( "#mapToolsDialog" ).dialog('close');
            } else {
			    $( "#mapToolsDialog" ).dialog('open');
            }
        });

        $("#mapToolsDialog").dialog({ zIndex:10050, 
                                      position:"right",
                                      autoOpen: true,
                                      hide:"explode"
                                    });


        // initialize maptools accordion
        //$("#mapToolsAccordion").draggable({handle: '.mapTools-header'});
        $("#mapToolsAccordion").accordion({ clearStyle: true, autoHeight: false });
        $('#mapToolsAccordion').accordion('activate', 1);
        //$('#mapToolsAccordion').resizable();  
        
        $('#btnTglMapTools').hover(
            function(){
                document.getElementById("tglLegendPic").src = 'icons/legend_over.png';
                $("#btnTglMapTools").attr('title', 'Show/hide Legend');
            },
            function(){
                document.getElementById("tglLegendPic").src = 'icons/legend.png';
            }
        ); 	    
        
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

    function parseConfig(document) {
        console.log('got a config file!');
    }


}(jQuery));