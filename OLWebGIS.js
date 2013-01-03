//On 9/30/12 discovered via http://stackoverflow.com/questions/6889376/a-javascript-script-only-works-on-internet-explorer-when-the-internet-explorer
//that console.log is not liked per say by IE 9 so comment those out for production
//begin global declarations-----------------------------------
var map, info, mapLayers;
var currThemeIndex = 0;  //initialize our theme index 
var layerBool = true;
var legendBool = true;
var initShareMapURL = document.URL;
//check for ?
var n=initShareMapURL.indexOf("?")
if (n!=-1) //this is one that has already vars added to it
{
	initShareMapURL = initShareMapURL.substring(0, n)
}
//add ? back
initShareMapURL = initShareMapURL.replace("#","")+"?";
var shareMapURL = document.URL.replace("#","");
var shareMapTheme = "";
var shareMapAccordionGrp = "";
var shareMapBaseMap = "Streets";
var shareMapExtent = "";
var sharedMapURL = false;
//Begin define object arrays-----------------------------------------
var activeMapLayers = new Array();
function activeMapLayer(lid,opacity)
{
    this.lid=lid;
    this.opacity=opacity;
}

var mapViews = new Array();
function mapView(label,name,viewGroups)
{
    this.label=label;
    this.name=name;
    this.viewGroups=viewGroups;
}

var wmsGroups = new Array();
function wmsGroup(gid,label,name, wmsSubGroups)
{
    this.gid=gid; 
    this.label=label;
    this.name=name;
    this.wmsSubGroups=wmsSubGroups;
}

//Keep track of all of the active wms layers for layerPicker
var activeWMSLayers = new Array();
function activeWMSLayer(lid,name,layers,url,legend)
{
    this.lid=lid; 
    this.name=name;
    this.layers=layers;
    this.url=url;
    this.legend=legend;
}

var activeOLWMSLayers = new Array();//need to keep track of all of the active OL wms layers
function activeOLWMSLayer(lid, legend, OLWMSLayer)
{
    this.lid=lid; 
    this.legend=legend;
    this.OLWMSLayer=OLWMSLayer;
}
//End object arrays------------------------------------------

var lastPopup = undefined;

//Begin Controls Toolbox-------------------------------------------------------------------------------------
//Panel control is a container for other controls
var zoomInTool = new OpenLayers.Control.ZoomBox();
var zoomOutTool = new OpenLayers.Control.ZoomBox({out:true});
var dragPanTool = new OpenLayers.Control.DragPan();
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
                defaultHandlerOptions: {
                    'single': true,
                    'double': false,
                    'pixelTolerance': 0,
                    'stopSingle': false,
                    'stopDouble': false
                },
                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    ); 
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.trigger
                        }, this.handlerOptions
                    );
                }, 
                trigger: function(e) {
                    var lonlat = map.getLonLatFromPixel(e.xy);
                    $('#myMultigraph').remove();
                    if (lastPopup) 
                    {
                        map.removePopup(lastPopup);
                    }
                    map.addPopup(lastPopup = new OpenLayers.Popup.FramedCloud(
                              "Feature Info:", 
                              lonlat,
                              null,
                              '<div id="myMultigraphMessage">Loading...</div><div id="myMultigraph" style="width: 600px; height: 300px;"></div>',
                              null,
                              true));
                    var multiDriver;
                    if ($.browser.msie) {
                        multiDriver = "raphael";
                    }
                    else {
                        multiDriver = "canvas";
                    }
                    
                    window.multigraph.core.Multigraph.createGraph({
                        'div'    : 'myMultigraph',
                        'mugl'   : "http://rain.nemac.org/timeseries/tsmugl_product.cgi?args=CONUS_NDVI,"+lonlat.lon+","+lonlat.lat,
                        'driver' : multiDriver // change 'canvas' to 'raphael' to test in IE
                    }).done(function() {
                            $('#myMultigraphMessage').remove();
                        });
                }
            });
var clickTool = new OpenLayers.Control.Click();

            
function identify()
{
    deactivateActiveUserControls();
    //get feature info-----------------------------------------------------
    //reference: http://openlayers.org/dev/examples/getfeatureinfo-popup.html
    //           http://stackoverflow.com/questions/7456205/how-to-add-a-popup-box-to-a-vector-in-openlayers
    var layers4Identify = [];
    for (var i = 0; i < map.layers.length; i++) {
        if (i>0){
            layers4Identify.push(map.layers[i]);
        }
    }
    
    switch(layers4Identify.length){
        case 1:
            info = new OpenLayers.Control.WMSGetFeatureInfo({
                        drillDown : true, 
                        title: 'Identify features by clicking',
                        layers: [layers4Identify[0]],
                        queryVisible: true
                    });
            break;
        case 2:
            info = new OpenLayers.Control.WMSGetFeatureInfo({
                        drillDown : true, 
                        title: 'Identify features by clicking',
                        layers: [layers4Identify[0],layers4Identify[1]],
                        queryVisible: true
                    });
            break;
        default:
            info = new OpenLayers.Control.WMSGetFeatureInfo({
                        drillDown : true, 
                        title: 'Identify features by clicking',
                        layers: [layers4Identify[0],layers4Identify[1],layers4Identify[2]],
                        queryVisible: true
                    });

    }
    
    info.events.register("getfeatureinfo", this, pickInfo);
    info.infoFormat = 'application/vnd.ogc.gml';
    map.addControl(info);
    info.activate();
}

function pickInfo(e)
{
    var strInfo;
    strInfo = e.text;
    var gmlData = processGML(strInfo);
    map.addPopup(new OpenLayers.Popup.FramedCloud(
			  "Feature Info:", 
			  map.getLonLatFromPixel(e.xy),
			  null,
			  gmlData,
			  null,
			  true
			  ));
}

function deactivateActiveUserControls()
{
    for (var i = 0; i < map.controls.length; i++) {
		if ((map.controls[i].active==true) && (map.controls[i].displayClass=="olControlZoomBox")){
            map.controls[i].deactivate();
        }
		if ((map.controls[i].active==true) && (map.controls[i].displayClass=="olControlWMSGetFeatureInfo")){
            map.controls[i].deactivate();
        }        
    }
}

//This is a generic function to look up items in object arrays
//It is used extensively throughout this application.
function filterObjectArrayByVal(arrayOfObjs, searchVal, searchProperty)
{
    var test = String(searchVal);
    var filteredArrayObject = [],
        i;
    for (i = 0; i < arrayOfObjs.length; i++) {
        if (arrayOfObjs[i][test] === searchProperty) {
            filteredArrayObject.push(arrayOfObjs[i]);
        }
    }
    return filteredArrayObject;
}    

//End Controls Toolbox-------------------------------------------------------------------------------------


//JQUERY INIT--------------------------------------------------------------
$(document).ready(function(){

    if (shareMapURL.indexOf("alphas")!= -1)
    {
        sharedMapURL = true;
    }
    //BEGIN READ MENU XML
    //because this is asynchronous it is only function here
    //note: any ampersands, &, in the xml need to be replaced w/ &amp;
    $.ajax({
        url: './config/ews_config.xml', // name of file you want to parse
        dataType: "xml", // type of file you are trying to read
        success: parseMenu, // name of the function to call upon success
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus);
            console.log(errorThrown);
        }
    });
    
    $("#btnTglLyrPick").click(function() {
        if (layerBool){
			$( "#layer_accordion" ).hide("puff");
            layerBool = false;
        }
        else{
            $( "#layer_accordion" ).show("puff");
            layerBool = true;
        }
    });
    $('#btnTglLyrPick').hover(
        function(){
            document.getElementById("tglLyrPickPic").src = 'icons/layers_over.png';
            $("#btnTglLyrPick").attr('title', 'Show/hide Layer Picker');
        },
        function(){
            document.getElementById("tglLyrPickPic").src = 'icons/layers.png';
        }
    ); 	
    $("#btnTglLegend").click(function() {
        if (legendBool){
			$( "#mapTools_accordion" ).hide("puff");
            legendBool = false;
        }
        else{
            $( "#mapTools_accordion" ).show("puff");
            legendBool = true;
        }
    });
    $('#btnTglLegend').hover(
        function(){
            document.getElementById("tglLegendPic").src = 'icons/legend_over.png';
            $("#btnTglLegend").attr('title', 'Show/hide Legend');
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
}); //END JQUERY INIT--------------------------------------------------------------

var i=0;
function parseMenu(document){
    //populate array of mapView's
    
    $(document).find("view").each(function(){
        mapViews[i] = new mapView($(this).attr("label"),$(this).attr("name"),this.childNodes);
        i++;
    });
    i=0;
    //populate array of wmsGroup's
    $(document).find("wmsGroup").each(function(){
        //test = this;
        wmsGroups[i] = new wmsGroup($(this).attr("gid"),$(this).attr("label"),$(this).attr("name"),this.childNodes);
        i++;
    });  
	
	//how to query a xml object by property val:
    //var wanted = wmsGroups.filter(function(wmsGroup){return (wmsGroup.gid=="G02");});
    
    if (!sharedMapURL)
    {
        themePicker(mapViews[1].name);
        //Add the default layers to activeWMSLayers
        //AAB,AA
        activeMapLayers.push(new activeMapLayer("AAB", 1));
        activeMapLayers.push(new activeMapLayer("AA", 1));
        layerPicker(mapViews[1], 4);  //pass the default theme as the current theme
    }
    else //this is a shared url handle accordingly
    {
        processSharedMapURL(); //this updates shareMapTheme
        themePicker(shareMapTheme);
        for (var j = 0; j < mapViews.length; j++) 
        {
            if (mapViews[j].name==shareMapTheme)
            {
                
                for (k = 0; k < wmsGroups.length; k++) {
                    if (wmsGroups[k].gid === shareMapAccordionGrp) {
                        var accordGrpToOpen = k;
                    }
                }                
                layerPicker(mapViews[j], accordGrpToOpen);
            }
        }
        // Check on any layers that were shared
        for (var k = 0; k < activeMapLayers.length; k++) 
        {
           activeSharedLID = activeMapLayers[k].lid;
           //ok so turn on the appropriate checkbox and legend then
           $('#chk'+activeSharedLID+'').prop('checked', true);
        }          
    }// end share map url
    initOpenLayers();
}

function themePicker(themeName){    //BEGIN THEME COMBO
    //var defaultOption = mapViews[1].name;
    var select = $('#themeCombo');
    if(select.prop) {
  	  var options = select.prop('options');
    }
    else {
	  var options = select.attr('options');
    }
    $('option', select).remove();
    //loop through and get items out of mapViews array of mapView objects
    for (var i = 0; i < mapViews.length; i++) {
		//console.log(mapViews[i].label);
		options[options.length] = new Option(mapViews[i].label, mapViews[i].name);
    }
    
    //This is the starting theme
    select.val(themeName);
    shareMapTheme = themeName;
    
    //handler for themeCombo
    $('#themeCombo').change(function() {
          //alert($("#themeCombo").val());
          //call layerPicker passing it the selected view (theme)
          updatedMapView = filterObjectArrayByVal(mapViews,"name",$("#themeCombo").val());
          $('#layer_accordion').empty();
          $("#layer_accordion").accordion('destroy').accordion;
          $('#mapTools_accordion').empty();
          $("#mapTools_accordion").accordion('destroy').accordion;
          layerPicker(updatedMapView[0], 4);
          map.destroy();
          initOpenLayers();
          //update shareMapURL
          shareMapTheme = updatedMapView[0].name;
          currentExtent = getCurrentExtent();
          buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
    });    	
    
}//END THEME COMBO

function layerPicker(activeMapView, openToAccordGrp){
    var accordianNum = 2;
	//console.log(activeMapView);
    //Start of legend accordion
    // $("#mapTools_accordion").append('<h3><b><a href="#mapToolsAccordion">Map Tools:</a></b></h3>');
    // $("#mapTools_accordion").append('<div class="mapTools-header">Handle here to drag!</div>');
    $('#mapTools_accordion').layerPicker();
    g = $('#mapTools_accordion').layerPicker('addAccordionGroup', '<a href="#mapToolsAccordion">Layer Picker:</a>');
    s = $('#mapTools_accordion').layerPicker('addAccordionGroupSubHeading', g, '<div class="layers-header">Handle here to drag!</div>');
	//Build out the layer picker
    //Loop through the viewGroups accordingly
    //For each viewGroup get the name and then find the matching wmsGroup
    //Note: Specific to this loop, there must be a wmsSubgroup under every wmsGroup the way it is
    //current written.  The ews_config.xml/flex app doesn't have this dependency.
    //BEGIN LAYER PICKER
    activeMapViewViewGroups = activeMapView.viewGroups; 
    i = 0;
    j = 0;
    var s, g;
    finishAtJ = activeMapView.viewGroups.length;
    // $("#layer_accordion").append('<h3><b><a href="#layersAccordion">Layer Picker:</a></b></h3>');
    // $("#layer_accordion").append('<div class="layers-header">Handle here to drag!</div>');
    $('#layer_accordion').layerPicker();
    g = $('#layer_accordion').layerPicker('addAccordionGroup', '<a href="#mapToolsAccordion">Layer Picker:</a>');
    s = $('#layer_accordion').layerPicker('addAccordionGroupSubHeading', g, '<div class="layers-header">Handle here to drag!</div>');
    $(activeMapViewViewGroups).each(function(index) {
        var accordString="";
        if (activeMapViewViewGroups[index].nodeType==1) {
            viewGroupName = this.attributes[0].nodeValue; //this is the viewGroupName
			activeWMSGroup = filterObjectArrayByVal(wmsGroups,"name",viewGroupName);
            //New accordion group
            //$("#layer_accordion").append('<h3><a href=#Accordion'+accordianNum+' gid='+activeWMSGroup[0].gid+'>'+activeWMSGroup[0].label+'</a></h3>');                            
            g = $('#layer_accordion').layerPicker('addAccordionGroup', '<a href=#Accordion'+accordianNum+' gid='+activeWMSGroup[0].gid+'>'+activeWMSGroup[0].label+'</a>');
            //build the string for the WMS layers of this WMS group
            var wmsSubGroups = activeWMSGroup[0].wmsSubGroups;
            k = 0;
            finishAtK = wmsSubGroups.length;
            $(wmsSubGroups).each(function(index) {
                if (wmsSubGroups[index].nodeType==1) {
                    wmsSubGroupName = this.attributes[0].nodeValue; 
                    //accordString = accordString + '<p><i>'+wmsSubGroupName+':</i></p>';
                    s = $('#layer_accordion').layerPicker('addAccordionGroupSubHeading', g, wmsSubGroupName);
                    var wmsLayers = $(this).children();//ahhh .children is how to get just the elements
                    l = 0;
                    finishAtL = wmsLayers.length;                    
                    $(wmsLayers).each(function(index) {
                        lid=$(this).attr("lid");
                        name=$(this).attr("name");
                        layers=$(this).attr("layers"); 
                        url=$(this).attr("url");
                        legend=$(this).attr("legend");
                        anyMore=$(this).next();
                        if (anyMore.length>0){
                            //if ((layers=="states" || layers=="EFETAC-NASA_current" ) && (!sharedMapURL)){ //this is a tacky way to check for default layers
                            if (checkForActiveLID(lid))
                            {
                                //accordString = accordString + '<input type="checkbox" id="chk'+lid+'" checked="checked"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>'
                                $('#layer_accordion').layerPicker('addAccordionGroupSubHeadingLayer', s, '<input type="checkbox" id="chk'+lid+'" checked="checked"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>')
                            }
                            else {
                                //accordString = accordString + '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>'
                                $('#layer_accordion').layerPicker('addAccordionGroupSubHeadingLayer', s, '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>')
                            }
                        }
                        else{
                            //accordString = accordString + '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/>'
                            $('#layer_accordion').layerPicker('addAccordionGroupSubHeadingLayer', s, '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/>')
                        }
                        activeWMSLayers[i] = new activeWMSLayer(lid,name,layers,url,legend);
                        i++;
                        l++;
                        if (l==finishAtL)
                        {
                            return false;
                        }                          
                    });
                }
                k++;
                if (k==finishAtK)
                {
                    return false;
                }                
            }); 
            //$("#layer_accordion").append('<div>'+accordString+'</div>');
            accordianNum = accordianNum + 1;
        }
        j++;
        if (j==finishAtJ)
        {
            return false;
        }
    });  
    // now initiate layer accordion:
    
    $("#layer_accordion").draggable({handle: '.layers-header'}); 
    $("#layer_accordion").accordion({ clearStyle: true, autoHeight: false });
    $('#layer_accordion').accordion('activate', openToAccordGrp);
    shareMapAccordionGrp = "G04";  //hardcoded starting accordion per the previous line
    $('#layer_accordion').resizable();

    //Handler from accordion change on the layerPicker
    //specifically used to change up the shareMapURL
    $('.layerAccordionClass').bind('accordionchange', function(event, ui) {
        //ui.newContent.context.innerHTML
        //<span class="ui-icon ui-icon-triangle-1-s"></span><a tabindex="-1" href="#Accordion3" gid="G02">Fires</a>
        var html = ui.newContent.context.innerHTML;
        var code = $(html);
        //shareMapAccordionGrp = code[1].attributes[1].value;
        shareMapAccordionGrp = code[1].getAttribute("gid")
        //update shareMapURL
        currentExtent = getCurrentExtent();
        buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
    });

    
    //Share map part of mapTools
    // $("#mapTools_accordion").append('<h3><a href="#shareMapAccordion">Share this Map</a></h3>');
    // //Update the shareMapURL
    // $("#mapTools_accordion").append('<div id="test" class="shrMapURLClass"><p>'+shareMapURL+'</p></div>');    
    g = $('#mapTools_accordion').layerPicker('addAccordionGroup', '<a href="#shareMapAccordion">Share this Map</a>');
    s = $('#mapTools_accordion').layerPicker('addAccordionGroupSubHeading', g, '<div id="test" class="shrMapURLClass"><p>'+shareMapURL+'</p></div>');
    
	
    //Loop through all activeWMSLayers and create a check event in layerPicker and legend accordingly
	//problem: activeWMSLayers is updated w/ theme change but not activeOLWMSLayers
	//soln: just needed to destroy the map on refresh of theme
    //$("#mapTools_accordion").append('<h3><a href="#legendAccordion">Legends</a></h3>');
    g = $('#mapTools_accordion').layerPicker('addAccordionGroup', '<a href="#legendAccordion">Legends</a>');
	for (var i = 0; i < activeWMSLayers.length; i++) {
        $("#chk"+activeWMSLayers[i].lid+"").click( function(){
            if($(this).is(':checked')){ //layerPicker checked
                wmslid = this.id.replace("chk","")
                filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",wmslid);
				map.addLayer(filteredOLWMSLayer[0].OLWMSLayer);
                //begin add legend graphic part
                //$("#mapTools_accordion").append('<div id="lgd'+filteredOLWMSLayer[0].lid+'" class="lgd'+filteredOLWMSLayer[0].lid+'"><img src="'+filteredOLWMSLayer[0].legend+'"/></div>');
                s = $('#mapTools_accordion').layerPicker('addAccordionGroupSubHeading', g, '<div id="lgd'+filteredOLWMSLayer[0].lid+'" class="lgd'+filteredOLWMSLayer[0].lid+'"><img src="'+filteredOLWMSLayer[0].legend+'"/></div>');
				var lidForLegend = filteredOLWMSLayer[0].lid
                if (!checkForActiveLID(filteredOLWMSLayer[0].lid))
                {
                    activeMapLayers.push(new activeMapLayer(filteredOLWMSLayer[0].lid, 1));
                }
                //update shareMapURL
                currentExtent = getCurrentExtent();
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
                $("#lgd"+lidForLegend+"").click(function() { //remove by legend click
                    //remove legend graphic, layerpicker checkedbox and map layer
                    $('div').remove('.lgd'+lidForLegend+''); //remove legend graphic
                    filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",lidForLegend);
					map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
                    $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
                    //remove lid from activeMapLayers, update shareMapURL with legend click
                    for (var i = 0; i < activeMapLayers.length; i++) {
                        if (activeMapLayers[i].lid==filteredOLWMSLayer[0].lid)
                        {    
                            activeMapLayers.splice(i, 1);
                        }
                    }
                    //update shareMapURL
                    currentExtent = getCurrentExtent();
                    buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
                }); //end add legend graphic part    
            }
            else { //layerPicker unchecked
                wmslid = this.id.replace("chk","")
                filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",wmslid);
				map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer);
                $('div').remove('.lgd'+filteredOLWMSLayer[0].lid+'');
                //remove lid from activeMapLayers, update shareMapURL with layerPicker click
                for (var i = 0; i < activeMapLayers.length; i++) {
                    if (activeMapLayers[i].lid==filteredOLWMSLayer[0].lid)
                    {    
                        activeMapLayers.splice(i, 1);
                    }
                }
                //update shareMapURL
                currentExtent = getCurrentExtent();
                buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
            }
        });  
    }
    
    //Add shared layer legend items
    var activeLID;
    if (sharedMapURL)
    {
        for (var k = 0; k < activeMapLayers.length; k++) 
        {
           activeLID = activeMapLayers[k].lid;
           filteredWMSLayer = filterObjectArrayByVal(activeWMSLayers,"lid",activeLID);
           s = $('#mapTools_accordion').layerPicker('addAccordionGroupSubHeading', g, '<div id="lgd'+activeLID+'" class="lgd'+activeLID+'"><img src="'+filteredWMSLayer[0].legend+'"/></div>');
           $("#lgd"+activeLID+"").click(function() { //remove by legend click
               $('div').remove('.'+this.id+''); //remove legend graphic
               filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",this.id.replace("lgd",""));
               map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
               $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
               //remove lid from activeMapLayers, update shareMapURL with legend click
               for (var i = 0; i < activeMapLayers.length; i++) {
                   if (activeMapLayers[i].lid==filteredOLWMSLayer[0].lid)
                   {    
                       activeMapLayers.splice(i, 1);
                   }
               }
           }); //end add legend graphic part               
        }
    }    
    
    // now initiate layer accordion
    $("#mapTools_accordion").draggable({handle: '.mapTools-header'});
    $("#mapTools_accordion").accordion({ clearStyle: true, autoHeight: false });
    $('#mapTools_accordion').accordion('activate', 2);
    $('#mapTools_accordion').resizable();  
    
    //make header draggable
    $("#header").draggable();
}//end layerPicker

function processGML(gmlString){
     var string2Return = "";
    //jon frimmels xml code read
    //var xmlString = '<?xml version="1.0" encoding="ISO-8859-1"?> <msGMLOutput xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> <mtbs_2006_layer> <gml:name>mtbs_2006</gml:name> <mtbs_2006_feature> <gml:boundedBy> <gml:Box srsName="EPSG:900913"> <gml:coordinates>-10717098.258254,4694701.301680 -10705155.113247,4707770.284342</gml:coordinates> </gml:Box> </gml:boundedBy> <perimeter>46182.90653</perimeter> <acres>10595.09343300730</acres> <fire_id>UNK-38850-096213-19960410</fire_id> <year>1996</year> <startmonth>4</startmonth> </mtbs_2006_feature> <mtbs_2006_feature> <gml:boundedBy> <gml:Box srsName="EPSG:900913"> <gml:coordinates>-10728004.339530,4660867.882051 -10687826.859821,4714469.634610</gml:coordinates> </gml:Box> </gml:boundedBy> <perimeter>791308.20746</perimeter> <acres>111758.62384904400</acres> <fire_id>UNK-38563-096445-20060422</fire_id> <year>2006</year> <startmonth>4</startmonth> </mtbs_2006_feature> </mtbs_2006_layer> <states_layer> <gml:name>states</gml:name> <states_feature> <gml:boundedBy> <gml:Box srsName="EPSG:900913"> <gml:coordinates>-11360350.961200,4438142.693264 -10529497.012200,4866419.220769</gml:coordinates> </gml:Box> </gml:boundedBy> <state_name>Kansas</state_name> </states_feature> </states_layer> </msGMLOutput>';
    //console.log(gmlString);
    gmlString = gmlString.replace(/\n+/g,""); //remove all new lines 
	gmlString = gmlString.replace(/\t+/g,""); //remove all tabs 
    //alert(gmlString);
	//console.log(gmlString);
    var gmlData = {};
    var gml = $.parseXML(gmlString);
    gml = $(gml).children()[0];
    j = 0;
    finishAtJ = $(gml).children().length;	
    $(gml).children().each(function (i, e) {    
		//var key = $(e).children("gml\\:name").text();
        var key = $(e).children().filter(function () {
            return this.nodeName.toLowerCase() === "gml:name";
        }).text();
		gmlData[key] = [];
		k = 0;
		finishAtK =$(e).children().length;			
		$(e).children().each(function (i, e) {
			var properties = [];
			if ($(e).prop("tagName").toLowerCase() !== "gml:name") {
				l = 0;
				finishAtL =$(e).children().length;				
				$(e).children().each(function (i, e) {
					if ($(e).prop("tagName").toLowerCase() !== "gml:boundedby") {
						properties.push($(e).prop("tagName").toLowerCase() + ": " + $(e).text());
					}
					if (l==finishAtL)
					{
						return false;
					}					
				});
				gmlData[key].push(properties);
			}
			if (k==finishAtK)
			{
				return false;
			}			
		});
        if (j==finishAtJ)
        {
            return false;
        }	        
	});
    //format gmlData into string w/ newlines and such...
    for (key in gmlData) {
        string2Return = string2Return + key.toUpperCase() +"<br>";
        var obj = gmlData[key];
        for (var prop in obj) {
            string2Return = string2Return + obj[prop]+"<br>";
        }
    }    
    return string2Return;
}


//This was trick see soln at:
//http://stackoverflow.com/questions/6560142/jquery-calling-click-on-an-autogenerated-img-inside
var isDialogInitialized  = false;
var lastOpacityLID = "test";
$(".imgDialog").live("click",function(e){
    $("#opacityDialog").dialog({ zIndex:10050, 
        position:"left",
        autoOpen: false,
        hide:"explode",
        beforeClose: function(event, ui) {isDialogInitialized==false;}
    });
    $('#opacityDialog').dialog('open');
    var opacityLID = $(this).attr("id");
    filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",opacityLID);

    $("#opacitySlider" ).slider({
		change: function(event, ui) { 
			var newOpacity = 1-ui.value/100;
			//OpenLayers.Layer.setOpacity(float);
			filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",opacityLID);
            filteredOLWMSLayer[0].OLWMSLayer.setOpacity(newOpacity);
            $( "#opacityValue" ).val( ui.value + "%" );
            //update shareMapURL
            //Using opacityLID adjust activeMapLayers accordingly;
            for (var i = 0; i < activeMapLayers.length; i++) 
            {
                if (activeMapLayers[i].lid==opacityLID)
                {
                    if (ui.value=="100")
                    {
                        activeMapLayers[i].opacity = "1";
                    }
                    else
                    {
                        activeMapLayers[i].opacity = newOpacity;
                    }
                }
            }
            currentExtent = getCurrentExtent();
            buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
		},
        value:0
	});

    if (isDialogInitialized==false)
    {
        lastOpacityLID = opacityLID;
        $("#opacityDialog").prepend('<div style="white-space:nowrap"><label class="opacityLabel">'+filteredOLWMSLayer[0].OLWMSLayer.name+':</label><input style="border-color:transparent;" type="text" size="3" id="opacityValue" /></div></br>');
        //$("#opacitySlider").append('<div class="opacitySteps"><span style="display:inline-block;width: 1&#37;text-align:left;margin-right: 8&#37;"><br>0&#37</span><span style="display:inline-block;width: 20&#37;text-align:right;margin-left: 62&#37;">100&#37</span></div>');
        //$("#opacityDialog").append('<input type="text" size="3" id="opacityValue" />');
        $("#opacityValue" ).val($( "#opacitySlider" ).slider( "value" ) + "%" );
        isDialogInitialized = true;
    }
    else if (lastOpacityLID!=opacityLID) //this is new one
    {
        $('.opacityLabel').remove();
        $('.maskLabel').remove();
        $('.opacitySteps').remove();
        $('#opacityValue').remove();
        lastOpacityLID = opacityLID;
        
        $("#opacityDialog").prepend('<div style="white-space:nowrap"><label class="opacityLabel">'+filteredOLWMSLayer[0].OLWMSLayer.name+':</label><input style="border-color:transparent;" type="text" size="3" id="opacityValue" /></div></br>');
        //$("#opacitySlider").append('<div class="opacitySteps"><span style="display:inline-block;width: 1&#37;text-align:left;margin-right: 8&#37;"><br>0&#37</span><span style="display:inline-block;width: 20&#37;text-align:right;margin-left: 62&#37;">100&#37</span></div>');        
        //$("#opacityDialog").append('<input type="text" size="3" id="opacityValue" />');
        $("#opacityValue" ).val($( "#opacitySlider" ).slider( "value" ) + "%" );
        isDialogInitialized = true;    
    }

    //A prototype of mask functionality
    //currently only on MODIS phenology derived fall bown down layer
    if (opacityLID=="AIT") {
        $("#opacityDialog .maskStuff").remove();
            $("#opacityDialog").append('<span class="maskStuff"><p class="maskLabel">Layer Masking Options:</p><input type="radio" class="maskLabel" name="maskNLCD" id="forestNLCD" value="forestNLCD">Forest<br><input type="radio" class="maskLabel" name="maskNLCD" id="urbanNLCD" value="urbanNLCD">Urban<br></span>');
        /*
        $("#opacityDialog .maskLabel").remove();
            $("#opacityDialog").append('<p class="maskLabel">Layer Masking Options:</p>');
            $("#opacityDialog").append('<input type="radio" class="maskLabel" name="maskNLCD" id="forestNLCD" value="forestNLCD">Forest<br>');
            $("#opacityDialog").append('<input type="radio" class="maskLabel" name="maskNLCD" id="urbanNLCD" value="urbanNLCD">Urban<br>');
        */
        $("#urbanNLCD").click(function() { 
            //remove all layers except base
            var layersRemovedCount = 0;
            for (var i = 0; i <= map.layers.length; i++) 
            {
                if (!map.layers[i-layersRemovedCount].isBaseLayer)
                {
                    map.removeLayer(map.layers[i-layersRemovedCount]);
                    layersRemovedCount = layersRemovedCount + 1;
                };
            }
            //remove other possible mask to allow toggle
            var urbanMask = new OpenLayers.Layer.WMS(
                'FallBrownDownUrbanMask09', 
                'http://rain.nemac.org/~derek/fswms/html/derivatives', 
                {layers: 'FallBrownDownUrbanMask09', transparent: true},
                {
                    isBaseLayer: false, 
                    transitionEffect: 'resize',
                    //singleTile: true
                    tileSize: new OpenLayers.Size(200,200),
                    ratio: 1,            
                    buffer: 2                    
                }
            ); 
            map.addLayer(urbanMask);        
         }); 
        $("#forestNLCD").click(function() { //remove
            var layers = 0;
            var layersRemovedCount = 0;
            //remove all layers except base
            for (var j = 0; j <= map.layers.length; j++) 
            {
                if (!map.layers[j-layersRemovedCount].isBaseLayer)
                {
                    map.removeLayer(map.layers[j-layersRemovedCount])
                    layersRemovedCount = layersRemovedCount + 1;
                };
            }         
            var forestMask = new OpenLayers.Layer.WMS(
                'FallBrownDownForestMask09', 
                'http://rain.nemac.org/~derek/fswms/html/derivatives', 
                {layers: 'FallBrownDownForestMask09', transparent: true},
                {
                    isBaseLayer: false, 
                    transitionEffect: 'resize',
                    //singleTile: true             
                    tileSize: new OpenLayers.Size(200,200),
                    ratio: 1,            
                    buffer: 2                    
                }
            ); 
            map.addLayer(forestMask);        
         }); 
        
    }
    return false;
});


//BEGIN initOpenLayers--------------------------------------------------------------
function initOpenLayers() {
    //Start position for the map (hardcoded here for simplicity,
    //but maybe you want to get this from the URL params)
    //example of custom zoom control: http://openlayers.org/dev/examples/zoom.html
    var lat=39.095962936305476
    var lon=-96.0859375
    var zoom=5


    map = new OpenLayers.Map('map', {
	    controls: [
		       new OpenLayers.Control.Navigation({
			       dragPanOptions: {
				   enableKinetic: true
			           }
			       }),
		       new OpenLayers.Control.Attribution(),
               zoomInTool,
               zoomOutTool
		       ],
        eventListeners: 
            {
                "moveend": mapEvent,
                "zoomend": mapEvent
            },               
		maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
		maxResolution: 156543.0399,
	        zoom: 1,
		units: 'm',
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326")
    });    
    
    var leftBottom = new OpenLayers.LonLat("-123.486328125", "32.76880048488168").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    var rightTop = new OpenLayers.LonLat("-68.02734375", "45.460130637921004").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    var bounds = new OpenLayers.Bounds(leftBottom.lon,leftBottom.lat,rightTop.lon,rightTop.lat);	    
    
    //Define custom map event listeners
    //Occurs on zoom in/out
    function mapEvent(event) {
        //update shareMapURL
        currentExtent = getCurrentExtent();
        shareMapURL = "";
        buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
    }    
    
    //Begin Populate base maps
    //This could be moved to the config xml alternatively
    var baseMapLayers = new Array();
    function baseMapLayer(name,OLBaseMapLayer)
    {
        this.name=name; 
        this.OLBaseMapLayer=OLBaseMapLayer
    }  

    //street map
    //tileSize: new OpenLayers.Size(600,600)
    //singleTile: true
    var baseMap = new OpenLayers.Layer.ArcGIS93Rest(
        'Streets',
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?f=image', 
        {layers: 'show:0'},
        {
            isBaseLayer: true, 
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(600,600),
            ratio: 1,            
            buffer: 2
        }
    );
    baseMapLayers[0] = new baseMapLayer("Streets",baseMap);  
    
    //satellite map
    var baseMap = new OpenLayers.Layer.ArcGIS93Rest(
        'Basic',
        'http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/export?f=image', 
        {layers: 'show:0'},
        {
            isBaseLayer: true, 
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(600,600),
            ratio: 1,            
            buffer: 2
        }                
    );
    baseMapLayers[1] = new baseMapLayer("Basic",baseMap);
    
    //imagery map
    var baseMap = new OpenLayers.Layer.ArcGIS93Rest(
        'Imagery',
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?f=image', 
        {layers: 'show:0'},
        {
            isBaseLayer: true, 
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(600,600),
            ratio: 1,            
            buffer: 2
        }                
    );
    baseMapLayers[2] = new baseMapLayer("Imagery",baseMap);    
    
    var baseMap = new OpenLayers.Layer.ArcGIS93Rest(
        'Topo_Map', 
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/export?f=image', 
        {layers: 'show:0'},
        {
            isBaseLayer: true, 
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(600,600),
            ratio: 1,            
            buffer: 2       
        }
    );         
    baseMapLayers[3] = new baseMapLayer("Topo_Map",baseMap);    

    var baseMap = new OpenLayers.Layer.ArcGIS93Rest(
        'Relief', 
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/export?f=image', 
        {layers: 'show:0'},
        {
            isBaseLayer: true, 
            transitionEffect: 'resize',
            tileSize: new OpenLayers.Size(600,600),
            ratio: 1,            
            buffer: 2      
        }
    );         
    baseMapLayers[4] = new baseMapLayer("Relief",baseMap);    

    
    $('#baseCombo').change(function() {
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
    });
    
    
    //populate dropdown for base maps
    //var defaultOption = baseMapLayers[0].name;
    //Actually, first check if shared or not
    if (!sharedMapURL)
    {
        var defaultOption = baseMapLayers[0].name;
    }
    else //is sharedMapURL
    {
        var filteredBaseLayer = filterObjectArrayByVal(baseMapLayers,"name",shareMapBaseMap);
        var defaultOption = filteredBaseLayer[0].name;
    }
    
    
    var select = $('#baseCombo');
    if(select.prop) {
  	  var options = select.prop('options');
    }
    else {
	  var options = select.attr('options');
    }
    $('option', select).remove();
    
    //loop through and get items out of mapViews array of mapView objects
    for (var i = 0; i < baseMapLayers.length; i++) {
		options[options.length] = new Option(baseMapLayers[i].name);
    }
    select.val(defaultOption);    
    //End Populate base maps

    //Loop through the activeWMSLayers and create the cooresponding 
    //OpenLayers layer...
    //Note get the pink tiles on singleTile option unless increasing the 
    //MAXSIZE in the .map file see http://trac.osgeo.org/mapserver/ticket/3055
    for (var i = 0; i < activeWMSLayers.length; i++) {
        //console.log(activeWMSLayers[i].lid);
        lid=activeWMSLayers[i].lid;
        legend=activeWMSLayers[i].legend;
        mapVar = lid+"Map";
        name=activeWMSLayers[i].name;
        layers=activeWMSLayers[i].layers;
        url=activeWMSLayers[i].url;
        //We are going to go singleTile on some and not on others
        //wlayers has wms layers which actually pass through to other map servers
        //therefore we will not attempt to single tile these
        if (url.indexOf('wlayers') == -1)
        {
            var mapLayer = new OpenLayers.Layer.WMS(
                name,
                url,
                {
                    projection: new OpenLayers.Projection("EPSG:900913"), 
                    units: "m", 
                    layers: layers, 
                    maxExtent: new OpenLayers.Bounds(bounds),                
                    transparent: true},
                {
                    isBaseLayer: false, 
                    transitionEffect: 'resize',
                    singleTile: true, 
                    ratio: 1
                }
            );
        }
        else
        {
            var mapLayer = new OpenLayers.Layer.WMS(
                name,
                url,
                {
                    projection: new OpenLayers.Projection("EPSG:900913"), 
                    units: "m", 
                    layers: layers, 
                    maxExtent: new OpenLayers.Bounds(bounds),                
                    transparent: true},
                {
                    isBaseLayer: false, 
                    transitionEffect: 'resize',
                    tileSize: new OpenLayers.Size(500,500), 
                    ratio: 1, 
                    buffer: 2
                }
            );        
        }
        activeOLWMSLayers[i] = new activeOLWMSLayer(lid, legend, mapLayer);
    }  

    if (!sharedMapURL) { //Begin default layers prep------------>
        //This is probably bad design: I have hard-coded the starting layers
        //States
        $("#mapTools_accordion").append('<div id="lgd'+activeOLWMSLayers[1].lid+'" class="lgd'+activeOLWMSLayers[1].lid+'"><img src="'+activeOLWMSLayers[1].legend+'"/></div>'); 
        if (!checkForActiveLID(activeOLWMSLayers[1].lid))
        {
            activeMapLayers.push(new activeMapLayer(activeOLWMSLayers[1].lid, 1));
        }
        $("#lgd"+activeOLWMSLayers[1].lid+"").click(function() {
            //remove legend graphic, layerpicker checkedbox and map layer
            $('div').remove('.lgd'+activeOLWMSLayers[1].lid+''); //remove legend graphic
            //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==activeOLWMSLayers[1].lid);});
            filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",activeOLWMSLayers[1].lid);
            map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
            $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
            //remove lid from activeMapLayers, update shareMapURL with legend click
            for (var i = 0; i < activeMapLayers.length; i++) {
                if (activeMapLayers[i].lid==filteredOLWMSLayer[0].lid)
                {    
                    activeMapLayers.splice(i, 1);
                }
            }
            //update shareMapURL
            currentExtent = getCurrentExtent();
            buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
        });
        //Current NRT product
        $("#mapTools_accordion").append('<div id="lgd'+activeOLWMSLayers[33].lid+'" class="lgd'+activeOLWMSLayers[33].lid+'"><img src="'+activeOLWMSLayers[33].legend+'"/></div>');     
        if (!checkForActiveLID(activeOLWMSLayers[33].lid))
        {
            activeMapLayers.push(new activeMapLayer(activeOLWMSLayers[33].lid, 1));
        }
        $("#lgd"+activeOLWMSLayers[33].lid+"").click(function() {
            //remove legend graphic, layerpicker checkedbox and map layer
            $('div').remove('.lgd'+activeOLWMSLayers[33].lid+''); //remove legend graphic
            //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==activeOLWMSLayers[1].lid);});
            filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",activeOLWMSLayers[33].lid);
            map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
            $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
            //remove lid from activeMapLayers, update shareMapURL with legend click
            for (var i = 0; i < activeMapLayers.length; i++) {
                if (activeMapLayers[i].lid==filteredOLWMSLayer[0].lid)
                {    
                    activeMapLayers.splice(i,1);
                }
            }
            //update shareMapURL
            currentExtent = getCurrentExtent();
            buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
        }); 

        //update shareMapURL
        currentExtent = getCurrentExtent();
        buildShareMapURL(shareMapTheme, activeMapLayers, shareMapAccordionGrp, shareMapBaseMap, currentExtent);
        map.addLayers([baseMapLayers[0].OLBaseMapLayer,activeOLWMSLayers[1].OLWMSLayer,activeOLWMSLayers[33].OLWMSLayer]);
        var lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
        map.setCenter(lonLat, zoom); //map object not active until here
    }//End default layers prep meeting if (!sharedMapURL)------------
    else //This is a shared URL
    {

        for (var i = 0; i < activeMapLayers.length; i++) 
        {
            filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",activeMapLayers[i].lid);
            map.addLayer(filteredOLWMSLayer[0].OLWMSLayer);
        }        

        var filteredBaseLayer = filterObjectArrayByVal(baseMapLayers,"name",shareMapBaseMap);
        map.addLayer(filteredBaseLayer[0].OLBaseMapLayer);
        //put the new base back in the 0 spot
        var baseLyr = map.getLayersByName(filteredBaseLayer[0].OLBaseMapLayer.name)[0];
        map.setLayerIndex(baseLyr, 0);
        
        extentArray = shareMapExtent.split(",");
        bounds = new OpenLayers.Bounds(extentArray[0], extentArray[1],extentArray[2], extentArray[3]);	
        map.zoomToExtent(bounds);
    }
       

}//END initOpenLayers--------------------------------------------------------------


function buildShareMapURL(theme,layers,accgp,basemap,extent)
{
    shareMapURL = "";
    //only get the root of a URL, hence the init one
    shareMapURL = initShareMapURL+"theme="+theme;
    //loop through layers array
    var layersArray = [];
    var alphasArray = [];
    for (var i = 0; i < layers.length; i++) 
    {
        layersArray.push(layers[i].lid);
        alphasArray.push(layers[i].opacity);
    }
    shareMapURL = shareMapURL+"&layers="+layersArray.join()+"&alphas="+alphasArray.join()+"&accgp="+accgp+"&basemap="+basemap+"&extent="+extent;
    $('.shrMapURLClass').html("<textarea rows=\"6\" cols=\"60\">"+shareMapURL+"</textarea>");
    //return shareMapURL;
}

function checkForActiveLID(lid)
{
    alreadyThere = false;
    for (var i = 0; i < activeMapLayers.length; i++) 
    {
        if (activeMapLayers[i].lid==lid)
        {
            alreadyThere = true;
        }
    }
    return alreadyThere;
}

function processSharedMapURL()
//Process the shareMapURL and make active the appropriate 
//layers and such
{
    var vars = [], hash;
        var q = document.URL.split('?')[1];
        if(q != undefined){
            q = q.split('&');
            for(var i = 0; i < q.length; i++){
                hash = q[i].split('=');
                vars.push(hash[1]);
                vars[hash[0]] = hash[1];
            }
        }
    shareMapTheme = vars.theme;
    shareMapAccordionGrp = vars.accgp;
    shareMapBaseMap = vars.basemap;
    shareMapExtent = vars.extent;
    layersArray = vars.layers.split(",");
    alphasArray = vars.alphas.split(",");
    //put the layers shared onto the activeMapLayers so that
	//then can later be utilized to turn things on e.g. legend
	for (var i = 0; i < layersArray.length; i++) 
    {
        if (layersArray[i] != "")
        {    
            activeMapLayers.push(new activeMapLayer(layersArray[i],alphasArray[i]));
        }
    }    
}

function getCurrentExtent()
//Used to get the extent into FCAV format
{
    extent = map.getExtent();
    if (extent != null)
    {
        return extent.left+","+extent.bottom+","+extent.right+","+extent.top;
    }
    {
        return "-14604362.670799732,2538210.8616583524,-6395637.329200267,6515382.3173915865";
    }
}

