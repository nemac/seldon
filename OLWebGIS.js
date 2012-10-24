//On 9/30/12 discovered via http://stackoverflow.com/questions/6889376/a-javascript-script-only-works-on-internet-explorer-when-the-internet-explorer
//that console.log is not liked per say by IE 9 so comment those out for production
//begin global declarations-----------------------------------
var map, info, mapLayers;
var currThemeIndex = 0;  //Initialize our user agent string to lower case.
var layerBool = true;
var legendBool = true;

//Begin Controls Toolbox-------------------------------------------------------------------------------------
//Panel control is a container for other controls
var zoomInBox = new OpenLayers.Control.ZoomBox();
var zoomOutBox = new OpenLayers.Control.ZoomBox({out:true});
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

//Begin Layer/Theme Objects------------------------------------------
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

//need to keep track of all of the active wms layers that 
//have been put into the layer picker so that we can 
//turn them on/off accordingly...
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
//Begin Layer/Theme Objects------------------------------------------

function loadXMLDoc(dname)
{
    if (window.XMLHttpRequest)
      {
        xhttp=new XMLHttpRequest();
      }
    else
      {
        xhttp=new ActiveXObject("Microsoft.XMLHTTP");
      }
    xhttp.open("GET",dname,false);
    xhttp.send();
    return xhttp.responseXML;
}  

//JQUERY INIT--------------------------------------------------------------
$(document).ready(function(){
    //BEGIN READ MENU XML
    //because this is asynchronous it is only function here
    //note: any ampersands, &, in the xml need to be replaced w/ &amp;
   if ($.browser.msie) //this may not be necessary 
   {
        xmlDoc=loadXMLDoc("../config/ews_config.xml");
        x=xmlDoc.getElementsByTagName('view');
        for (i=0;i<x.length;i++)
        {
            name = x[i].getAttribute('name');
            label = x[i].getAttribute('label');
            childrens = x[i].childNodes;
            mapViews[i] = new mapView(label,name,childrens);
        }   
        x=xmlDoc.getElementsByTagName('wmsGroup');
        for (i=0;i<x.length;i++)
        {
            gid = x[i].getAttribute('gid');
            name = x[i].getAttribute('name');
            label = x[i].getAttribute('label');
            childrens = x[i].childNodes;
            wmsGroups[i] = new wmsGroup(gid,label,name,childrens);
        }
        themePicker();
        layerPicker(mapViews[1]);  //pass the default theme as the current theme
        initOpenLayers();
   }
   else
   {
        $.ajax({
            url: '../config/ews_config.xml', // name of file you want to parse
            dataType: "xml", // type of file you are trying to read
            success: parseMenu, // name of the function to call upon success
            error: function(){alert("Error: Something went wrong reading the ews_config file");}
        });
   }
   //END READ XML

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
			$( "#legend_accordion" ).hide("puff");
            legendBool = false;
        }
        else{
            $( "#legend_accordion" ).show("puff");
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
        alert("Handler for pand called.");
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
        alert("multigraph");
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
        zoomInBox.activate();
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
        zoomOutBox.activate();
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
        alert("Handler for help called.");
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
    //console.log("wmsGroupByGID "+ wanted[0].label);
    
    themePicker();
    layerPicker(mapViews[1]);  //pass the default theme as the current theme
    initOpenLayers();
}


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

function themePicker(){    //BEGIN THEME COMBO
    var defaultOption = mapViews[1].name;
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
    select.val(defaultOption);
    //handler for themeCombo
    $('#themeCombo').change(function() {
	  //alert($("#themeCombo").val());
	  //call layerPicker passing it the selected view (theme)

      //updatedMapView = mapViews.filter(function(updatedMapView){return (updatedMapView.name==$("#themeCombo").val());});
      //filterObjectArrayByVal(arrayOfObjs, searchVal, searchProperty)
      updatedMapView = filterObjectArrayByVal(mapViews,"name",$("#themeCombo").val());
      
      $('#layer_accordion').empty();
      $("#layer_accordion").accordion('destroy').accordion;
      $('#legend_accordion').empty();
      $("#legend_accordion").accordion('destroy').accordion;
      layerPicker(updatedMapView[0]);
	  map.destroy();
	  initOpenLayers();
    });    	
    
}//END THEME COMBO

function layerPicker(activeMapView){
    var accordianNum = 2;
	//console.log(activeMapView);
    //Start of legend accordion
    $("#legend_accordion").append('<h3><b><a href="#legendAccordion1">Legends (click to clear layer)</a></b></h3>');
    
    //Using currentMapView, build out the layer picker
    //Loop through the viewGroups accordingly
    //For each viewGroup get the name and then find the matching wmsGroup
    //note: there must be a wmsSubgroup under every wmsGroup the way it is
    //current written.  The ews_config.xml/flex app doesn't have this dependency.
    //BEGIN LAYER PICKER
    activeMapViewViewGroups = activeMapView.viewGroups; 
    i = 0;
    j = 0;
    finishAtJ = activeMapView.viewGroups.length;
    $(activeMapViewViewGroups).each(function(index) {
        var accordString="";
        if (activeMapViewViewGroups[index].nodeType==1) {
            viewGroupName = this.attributes[0].nodeValue; //this is the viewGroupName
            //activeWMSGroup = wmsGroups.filter(function(wmsGroup){return (wmsGroup.name==viewGroupName);});
			activeWMSGroup = filterObjectArrayByVal(wmsGroups,"name",viewGroupName);
            //console.log(activeWMSGroup);
            $("#layer_accordion").append('<h3><b><a href="#Accordion"'+accordianNum+'>'+activeWMSGroup[0].label+'</a></b></h3>');                
            //build the string for the WMS layers of this WMS group
            var wmsSubGroups = activeWMSGroup[0].wmsSubGroups;
            k = 0;
            finishAtK = wmsSubGroups.length;
            $(wmsSubGroups).each(function(index) {
                if (wmsSubGroups[index].nodeType==1) {
                    wmsSubGroupName = this.attributes[0].nodeValue; 
                    accordString = accordString + '<p><i>'+wmsSubGroupName+':</i></p>';
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
                            if (layers=="states" || layers=="EFETAC-NASA_current" ){ //this is a tacky way to check for default layers
                                accordString = accordString + '<input type="checkbox" id="chk'+lid+'" checked="checked"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>'
                                //accordString = accordString + '<input type="checkbox" id="chk'+lid+'" checked="checked"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img id="gear'+lid+'" src="icons/settings.png"/><br>'
                            }
                            else {
                                accordString = accordString + '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/><br>'
                            }
                        }
                        else{
                            accordString = accordString + '<input type="checkbox" id="chk'+lid+'"/><label for="chk'+lid+'">'+name+'</label>&nbsp;<img class="imgDialog" id="'+lid+'" src="icons/settings.png"/>'
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
            //console.log('"'+accordString+'"');
            //The draggable causes script issues in IE8 if it is set for more than one accordiog
            //group.  So limit to top one for now.
            if (accordianNum==2){
                $("#layer_accordion").append('<div class="dialog-header">'+accordString+'</div>');
            }
            else {
                $("#layer_accordion").append('<div>'+accordString+'</div>');
            }
            accordianNum = accordianNum + 1;
        }
        j++;
        if (j==finishAtJ)
        {
            return false;
        }
    });  
    // now initiate layer accordion:
    
    $("#layer_accordion").draggable({handle: '.dialog-header'}); 
    $("#layer_accordion").accordion({ clearStyle: true, autoHeight: false });
    $('#layer_accordion').accordion('activate', 3);
    $('#layer_accordion').resizable();
    
    //loop through activeWMSLayers and create a check event and legend accordingly
	//problem: activeWMSLayers is updated w/ theme change but not activeOLWMSLayers
	//soln: just needed to destroy the map on refresh of theme
    for (var i = 0; i < activeWMSLayers.length; i++) {
        $("#chk"+activeWMSLayers[i].lid+"").click( function(){
            if($(this).is(':checked')){ 
                wmslid = this.id.replace("chk","")
                //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==wmslid);});
                filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",wmslid);
				map.addLayer(filteredOLWMSLayer[0].OLWMSLayer);
                //begin add legend graphic part
                $("#legend_accordion").append('<div id="lgd'+filteredOLWMSLayer[0].lid+'" class="lgd'+filteredOLWMSLayer[0].lid+'"><img src="'+filteredOLWMSLayer[0].legend+'"/></div>');
                var lidForLegend = filteredOLWMSLayer[0].lid
                $("#lgd"+lidForLegend+"").click(function() { //remove
                    //remove legend graphic, layerpicker checkedbox and map layer
                    $('div').remove('.lgd'+lidForLegend+''); //remove legend graphic
                    //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==lidForLegend);});
                    filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",lidForLegend);
					map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
                    $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
                });               
                //end add legend graphic part
            }
            else {
                wmslid = this.id.replace("chk","")
                //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==wmslid);});
                filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",wmslid);
				map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer);
                $('div').remove('.lgd'+filteredOLWMSLayer[0].lid+'');
            }
        });  
    }  

    // now initiate layer accordion
    $("#legend_accordion").draggable();
    $("#legend_accordion").accordion({ clearStyle: true, autoHeight: false });
    $('#legend_accordion').accordion('activate', 1);
    $('#legend_accordion').resizable();    
    
    //make header draggable
    $("#header").draggable();
}//end layerPicker


//This was trick see soln at:
//http://stackoverflow.com/questions/6560142/jquery-calling-click-on-an-autogenerated-img-inside
var isDialogInitialized  = false;
var lastOpacityLID = "test";
$(".imgDialog").live("click",function(e){
    $("#opacityDialog").dialog({ zIndex:10050, 
        position:"left",
        autoOpen: false,
        modal: true,
        hide:"explode",
        beforeClose: function(event, ui) {isDialogInitialized==false;}
    });
    $('#opacityDialog').dialog('open');
    var opacityLID = $(this).attr("id");
    filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",opacityLID);
    if (isDialogInitialized==false)
    {
        lastOpacityLID = opacityLID;
        $("#opacityDialog").prepend('<p class="opacityLabel">'+filteredOLWMSLayer[0].OLWMSLayer.name+':</p>');
        isDialogInitialized = true;
    }
    else if (lastOpacityLID!=opacityLID) //this is new one
    {
        $('.opacityLabel').remove();
        $('.maskLabel').remove();
        lastOpacityLID = opacityLID;
        $("#opacityDialog").prepend('<p class="opacityLabel">'+filteredOLWMSLayer[0].OLWMSLayer.name+':</p>');
        isDialogInitialized = true;    
    }
    $("#opacitySlider" ).slider({
		change: function(event, ui) { 
			var newOpacity = ui.value/100;
			//OpenLayers.Layer.setOpacity(float);
			filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",opacityLID);
            filteredOLWMSLayer[0].OLWMSLayer.setOpacity(newOpacity);
		},
		value:100
	});
    //prototype masking
    //currently only on MODIS phenology derived fall bown down layer
    if (opacityLID=="AIT") {
        $("#opacityDialog").append('<p class="maskLabel">Layer Masking Options:</p>');
        $("#opacityDialog").append('<input type="radio" class="maskLabel" name="maskNLCD" id="forestNLCD" value="forestNLCD">Forest<br>');
        $("#opacityDialog").append('<input type="radio" class="maskLabel" name="maskNLCD" id="urbanNLCD" value="urbanNLCD">Urban<br>');
        
        // $("#forestNLCD").click(function() { //remove
        // });         
        
        $("#urbanNLCD").click(function() { //remove
            var urbanMask = new OpenLayers.Layer.WMS(
                'FallBrownDownUrbanMask09', 
                'http://rain.nemac.org/~derek/fswms/html/derivatives', 
                {layers: 'FallBrownDownUrbanMask09', transparent: true},
                {
                    isBaseLayer: false            
                }
            ); 
            map.addLayer(urbanMask);        
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
               zoomInBox,
               zoomOutBox
		       ],
		maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
		maxResolution: 156543.0399,
	        zoom: 1,
		units: 'm',
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326")
    });    
    
    //Begin Populate base maps
    //This could be moved to the config xml alternatively
    var baseMapLayers = new Array();
    function baseMapLayer(name,OLBaseMapLayer)
    {
        this.name=name; 
        this.OLBaseMapLayer=OLBaseMapLayer
    }  

    //street map
    var baseMap = new OpenLayers.Layer.Google(
            "Streets", // the default
            {numZoomLevels: 20}
        );
    baseMapLayers[0] = new baseMapLayer("Streets",baseMap);
    
    //satellite map
    var baseMap = new OpenLayers.Layer.Google(
            "Physical",
            {type: google.maps.MapTypeId.TERRAIN}
            // used to be {type: G_PHYSICAL_MAP}
        );
    baseMapLayers[1] = new baseMapLayer("Physical",baseMap);
    
    //physical map
    var baseMap = new OpenLayers.Layer.Google(
                "Satellite",
                {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
            );
    baseMapLayers[2] = new baseMapLayer("Satellite",baseMap);    
    
    $('#baseCombo').change(function() {
        //alert($("#baseCombo").val());
        //layer is always at index zero so swap that one out accordingly
        map.removeLayer(map.layers[0]);
        
        i=0
        if ($("#baseCombo").val()=="Physical"){
            i=1;
        }
        else if ($("#baseCombo").val()=="Satellite"){
            i=2;
        }
        map.addLayers([baseMapLayers[i].OLBaseMapLayer]);
        //put the new base back in the 0 spot
        var baseLyr = map.getLayersByName(baseMapLayers[i].OLBaseMapLayer.name)[0];
        map.setLayerIndex(baseLyr, 0);
    });
    
    //populate dropdown for base maps
    var defaultOption = baseMapLayers[0].name;
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

    var leftBottom = new OpenLayers.LonLat("-123.486328125", "32.76880048488168").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    var rightTop = new OpenLayers.LonLat("-68.02734375", "45.460130637921004").transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    var bounds = new OpenLayers.Bounds(leftBottom.lon,leftBottom.lat,rightTop.lon,rightTop.lat);	
    
    
    //Loop through the activeWMSLayers and create the cooresponding 
    //OpenLayers layer...
    for (var i = 0; i < activeWMSLayers.length; i++) {
        //console.log(activeWMSLayers[i].lid);
        lid=activeWMSLayers[i].lid;
        legend=activeWMSLayers[i].legend;
        mapVar = lid+"Map";
        name=activeWMSLayers[i].name;
        layers=activeWMSLayers[i].layers;
        url=activeWMSLayers[i].url;
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
                ratio: 1,            
                buffer: 2
            }
        );
        activeOLWMSLayers[i] = new activeOLWMSLayer(lid, legend, mapLayer);
    }  


    
    map.addLayers([baseMapLayers[0].OLBaseMapLayer,activeOLWMSLayers[1].OLWMSLayer,activeOLWMSLayers[33].OLWMSLayer]);
    //begin default layers prep------------
    
    //This is bad: I have hard-coded the starting layers
    $("#legend_accordion").append('<div id="lgd'+activeOLWMSLayers[1].lid+'" class="lgd'+activeOLWMSLayers[1].lid+'"><img src="'+activeOLWMSLayers[1].legend+'"/></div>'); 
    $("#legend_accordion").append('<div id="lgd'+activeOLWMSLayers[33].lid+'" class="lgd'+activeOLWMSLayers[33].lid+'"><img src="'+activeOLWMSLayers[33].legend+'"/></div>');     
    $("#lgd"+activeOLWMSLayers[1].lid+"").click(function() {
        //remove legend graphic, layerpicker checkedbox and map layer
        $('div').remove('.lgd'+activeOLWMSLayers[1].lid+''); //remove legend graphic
        //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==activeOLWMSLayers[1].lid);});
        filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",activeOLWMSLayers[1].lid);
		map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
        $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
    });  
    $("#lgd"+activeOLWMSLayers[33].lid+"").click(function() {
        //remove legend graphic, layerpicker checkedbox and map layer
        $('div').remove('.lgd'+activeOLWMSLayers[33].lid+''); //remove legend graphic
        //filteredOLWMSLayer = activeOLWMSLayers.filter(function(WMSLayer){return (WMSLayer.lid==activeOLWMSLayers[1].lid);});
        filteredOLWMSLayer = filterObjectArrayByVal(activeOLWMSLayers,"lid",activeOLWMSLayers[33].lid);
		map.removeLayer(filteredOLWMSLayer[0].OLWMSLayer); //remove map layer
        $('input:checkbox[id="chk'+filteredOLWMSLayer[0].lid+'"]').attr('checked',false);
    });  
    
    //end default layers prep------------
    
    
    var lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    map.setCenter(lonLat, zoom);

}//END initOpenLayers--------------------------------------------------------------


