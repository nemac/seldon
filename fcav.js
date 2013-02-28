(function ($) {
    "use strict";

    var EventEmitter = window.EventEmitter,
        fcav = {},
        activeBtn = [],
        areasList = [],
        app;

    fcav.App = function () {
        EventEmitter.call(this);
        this.map         = undefined; // OpenLayers map object
        this.scalebar    = undefined;
        this.zoomInTool  = undefined; // OpenLayers zoom in tool
        this.zoomOutTool = undefined; // OpenLayers zoom out tool
        this.dragPanTool = undefined; // OpenLayers dragpan tool
        this.maxExtent   = {
            left   : -15000000,  //NOTE: These values get replaced by settings from the config file.
            bottom : 2000000,    //      Don't worry about keeping these in sync if the config fil 
            right  : -6000000,   //      changes; these are just here to prevent a crash if we ever
            top    : 7000000     //      read a config file that is missing the <extent> element.
        };
        this.baseLayers       = []; // list of BaseLayer instances holding info about base layers from config file
        this.accordionGroups  = []; // list of AccordionGroup instances holding info about accordion groups from config file
        this.themes           = []; // list of Theme instances holding info about themes from config file
        this.currentBaseLayer      = undefined;
        this.currentAccordionGroup = undefined;
        this.currentTheme          = undefined;
        this.identifyTool          = undefined;
        this.multigraphTool        = undefined;

        // array of saved extent objects; each entry is a JavaScript object of the form
        //     { left : VALUE, bottom : VALUE, right : VALUE, top : VALUE }
        this.savedExtents            = [];

        // index of the "current" extent in the above array:
        this.currentSavedExtentIndex = -1;

        // save the current extent into the savedExtents array, if it is different from
        // the "current" one.  It is important to only save it if it differs from the
        // current one, because sometimes OpenLayers fires multiple events when the extent
        // changes, causing this function to be called multiple times with the same
        // extent
        this.saveCurrentExtent = function() {
            var newExtent,
                currentSavedExtent,
                newSavedExtents,
                i;

            newExtent = (function (extent) {
                return { left : extent.left, bottom : extent.bottom, right : extent.right, top : extent.top };
            }(this.map.getExtent()));

            if (this.currentSavedExtentIndex >= 0) {
                currentSavedExtent = this.savedExtents[this.currentSavedExtentIndex];
                if (extentsAreEqual(currentSavedExtent, newExtent)) {
                    return;
                }
            }

            // chop off the list after the current position
            newSavedExtents = [];
            for (i=0; i<=this.currentSavedExtentIndex; ++i) {
                newSavedExtents.push(this.savedExtents[i]);
            }
            this.savedExtents = newSavedExtents;

            // append current extent to the list
            this.savedExtents.push(newExtent);
            ++this.currentSavedExtentIndex;
        };

        this.zoomToExtent = function(extent, save) {
            if (save === undefined) {
                save = true;
            }
            var bounds = new OpenLayers.Bounds(extent.left, extent.bottom, extent.right, extent.top);
            this.map.zoomToExtent(bounds, true);
            if (save) {
                this.saveCurrentExtent();
            }
            //$('#extentOutput').empty().append($(this.printSavedExtents()));
        };

        this.zoomToPreviousExtent = function() {
            if (this.currentSavedExtentIndex > 0) {
                --this.currentSavedExtentIndex;
                this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
            }
        };
        this.zoomToNextExtent = function() {
            if (this.currentSavedExtentIndex < this.savedExtents.length-1) {
                ++this.currentSavedExtentIndex;
                this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
            }
        };

        this.printSavedExtents = function() {
            // This function is for debugging only and is not normally used.  It returns an HTML
            // table showing the current savedExtents list, and the current position within the list.
            var html = "<table>";
            var len = this.savedExtents.length;
            var i, e;
            for (i=len-1; i>=0; --i) {
                e = this.savedExtents[i];
                html += Mustache.render('<tr><td>{{{marker}}}</td><td>{{{number}}}</td>'
                                        + '<td>left:{{{left}}}, bottom:{{{bottom}}}, right:{{{right}}}, top:{{{top}}}</td></tr>',
                                        {
                                            marker : (i === this.currentSavedExtentIndex) ? "==&gt;" : "",
                                            number : i,
                                            left : e.left,
                                            bottom : e.bottom,
                                            right : e.right,
                                            top : e.top
                                            });
            }
            html += "</table>";
            return html;
        };

        this.setBaseLayer = function(baseLayer) {
            var app = this;
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
        };


        this.setAccordionGroup = function(accordionGroup) {
            this.currentAccordionGroup = accordionGroup;
            this.emit("accordiongroupchange");
        };

        this.setTheme = function(theme, options) {
            var app = this,
                accordionGroup;

            $('#layerPickerAccordion').empty();
            $("#layerPickerAccordion").accordion('destroy');
            $('#layerPickerAccordion').listAccordion({
                clearStyle : true,
                autoHeight : false,
                change     : function(event, ui) {
                    var accordionGroupIndex = $("#layerPickerAccordion").accordion('option', 'active');
                    app.setAccordionGroup(theme.accordionGroups[accordionGroupIndex]);
                }
            });

            $('#legend').empty();

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
            app.currentTheme = theme;
            app.setAccordionGroup(accordionGroup);
            $('#layerPickerDialog').scrollTop(0);
            $('#mapToolsDialog').scrollTop(0);
            app.emit("themechange");
        };

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

        this.launch = function(configFile, shareUrlInfo) {
            var app = this;

            $.ajax({
                url: configFile,
                dataType: "xml",
                success: function(configXML) {
                    app.parseConfig(configXML, shareUrlInfo);
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
					$('#tglLyrPickPic').css({'background-color':'black'});						
					$('#tglLyrPickPic').css({'opacity':'.4'});
					activeBtn = $("#btnTglLyrPick");						
                } else {
                    $( "#layerPickerDialog" ).dialog('open');
					$('#'+activeBtn[0].children[0].id).css({'background-color':'transparent'});						
					$('#'+activeBtn[0].children[0].id).css({'opacity':'1'});
					activeBtn = [];					
                }
            }).hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#tglLyrPickPic').css({'background-color':'black'});						
						$('#tglLyrPickPic').css({'opacity':'.4'});
                    }
                    else {
						$('#tglLyrPickPic').css({'background-color':'black'});						
						$('#tglLyrPickPic').css({'opacity':'.75'});
                    }				
					$("#btnTglLyrPick").attr('title', 'Show/hide Layer Picker');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#tglLyrPickPic').css({'background-color':'transparent'});						
						$('#tglLyrPickPic').css({'opacity':'1'});
                    }
                    else {
						$('#tglLyrPickPic').css({'background-color':'black'});						
						$('#tglLyrPickPic').css({'opacity':'.4'});						
					}
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
                if (app.currentTheme) {
                    $('#layerPickerAccordion').accordion('activate', app.currentTheme.getAccordionGroupIndex(app.currentAccordionGroup));
                }
            });

            //
            // mapTools button:
            //
            $("#btnTglMapTools").click(function() {
                if ($( "#mapToolsDialog" ).dialog('isOpen')) {
                    $( "#mapToolsDialog" ).dialog('close');
					$('#tglLegendPic').css({'background-color':'black'});						
					$('#tglLegendPic').css({'opacity':'.4'});
					activeBtn = $("#btnTglMapTools");				
				} else {
                    $( "#mapToolsDialog" ).dialog('open');
					$('#'+activeBtn[0].children[0].id).css({'background-color':'transparent'});						
					$('#'+activeBtn[0].children[0].id).css({'opacity':'1'});
					activeBtn = [];
				}
            }).hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#tglLegendPic').css({'background-color':'black'});						
						$('#tglLegendPic').css({'opacity':'.4'});
                    }
                    else {
						$('#tglLegendPic').css({'background-color':'black'});						
						$('#tglLegendPic').css({'opacity':'.75'});
                    }				
					$("#btnTglMapTools").attr('title', 'Show/hide Map Tools');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#tglLegendPic').css({'background-color':'transparent'});						
						$('#tglLegendPic').css({'opacity':'1'});
                    }
                    else {
						$('#tglLegendPic').css({'background-color':'black'});						
						$('#tglLegendPic').css({'opacity':'.4'});						
					}
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
            app.addListener("extentchange", function () {
                app.saveCurrentExtent();
                //$('#extentOutput').empty().append($(this.printSavedExtents()));
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
                app.setBaseLayer(app.baseLayers[i]);
            });
            app.addListener("baselayerchange", function() {
                $('#baseCombo').val(app.currentBaseLayer.index);
            });

            //
            // theme layer combo change handler
            //
            $('#themeCombo').change(function() {
                var i = parseInt($("#themeCombo").val(), 10);
                app.setTheme(app.themes[i]);
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
				$('#zoomInPic').css({'background-color':'black'});						
				$('#zoomInPic').css({'opacity':'.4'});
                activeBtn = $("#btnZoomIn");				
            }).hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#zoomInPic').css({'background-color':'black'});						
						$('#zoomInPic').css({'opacity':'.4'});
                    }
                    else {
						$('#zoomInPic').css({'background-color':'black'});						
						$('#zoomInPic').css({'opacity':'.75'});
                    }				
					$("#btnZoomIn").attr('title', 'Zoom in tool');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#zoomInPic').css({'background-color':'transparent'});						
						$('#zoomInPic').css({'opacity':'1'});
                    }
                    else {
						$('#zoomInPic').css({'background-color':'black'});						
						$('#zoomInPic').css({'opacity':'.4'});						
					}
                }
            );

            // 
            // zoom out button
            // 
            $("#btnZoomOut").click(function() {
                deactivateActiveOpenLayersControls();
                app.zoomOutTool.activate();
				$('#zoomOutPic').css({'background-color':'black'});						
				$('#zoomOutPic').css({'opacity':'.4'});
                activeBtn = $("#btnZoomOut");				
            }).hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#zoomOutPic').css({'background-color':'black'});						
						$('#zoomOutPic').css({'opacity':'.4'});
                    }
                    else {
						$('#zoomOutPic').css({'background-color':'black'});						
						$('#zoomOutPic').css({'opacity':'.75'});
                    }				
					$("#btnZoomOut").attr('title', 'Zoom out tool');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#zoomOutPic').css({'background-color':'transparent'});						
						$('#zoomOutPic').css({'opacity':'1'});
                    }
                    else {
						$('#zoomOutPic').css({'background-color':'black'});						
						$('#zoomOutPic').css({'opacity':'.4'});						
					}
                }
            ); 

            // 
            // zoom to full extent button
            // 
            $("#btnZoomExtent").click(function() {
                app.zoomToExtent(app.maxExtent);
            });
            $('#btnZoomExtent').hover(
                function(){
                    $("#zoomExtentPic").attr('src',  'icons/zoom-extent_over.png');
                    $("#btnZoomExtent").attr('title', 'Full Extent tool');
                },
                function(){
                    $("#zoomExtentPic").attr('src',  'icons/zoom-extent.png');
                }
            ); 
            
            // 
            // identify button
            // 
            
            $("#btnID").click(function() {
                activateIdentifyTool();
				$('#idPic').css({'background-color':'black'});						
				$('#idPic').css({'opacity':'.4'});
                activeBtn = $("#btnID");				
            });
            
            $('#btnID').hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#idPic').css({'background-color':'black'});						
						$('#idPic').css({'opacity':'.4'});
                    }
                    else {
						$('#idPic').css({'background-color':'black'});						
						$('#idPic').css({'opacity':'.75'});
                    }				
					$("#btnID").attr('title', 'Identify tool');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#idPic').css({'background-color':'transparent'});						
						$('#idPic').css({'opacity':'1'});
                    }
                    else {
						$('#idPic').css({'background-color':'black'});						
						$('#idPic').css({'opacity':'.4'});						
					}
                }
            ); 
            
            // 
            // about button
            // 
            $("#btnAbout").click(function() {
                deactivateActiveOpenLayersControls();
				showSplashScreen();
				$('#aboutPic').css({'background-color':'black'});						
				$('#aboutPic').css({'opacity':'.4'});				
                activeBtn = $("#btnAbout");
            });
            $('#btnAbout').hover(
                function(){
                    if (activeBtn[0]!=this) {
						$('#aboutPic').css({'background-color':'black'});						
						$('#aboutPic').css({'opacity':'.4'});
                    }
                    else {
						$('#aboutPic').css({'background-color':'black'});						
						$('#aboutPic').css({'opacity':'.75'});
                    }
                    $("#btnAbout").attr('title', 'About tool');
                },
                function(){
                    if (activeBtn[0]!=this) {
						$('#aboutPic').css({'background-color':'transparent'});						
						$('#aboutPic').css({'opacity':'1'});
                    }
                    else {
						$('#aboutPic').css({'background-color':'black'});						
						$('#aboutPic').css({'opacity':'.4'});						
					}
                }
            ); 

            // 
            // previous extent button
            // 
            $("#btnPrev").click(function() {
                app.zoomToPreviousExtent();
            });
            $('#btnPrev').hover(
                function(){
                    $('#prevPic').css({'background-color':'black'});						
                    $('#prevPic').css({'opacity':'.4'});
                },
                function(){
                    $('#prevPic').css({'background-color':'transparent'});						
                    $('#prevPic').css({'opacity':'1'});
                }
            ); 

            

            // 
            // next extent button
            // 
            $("#btnNext").click(function() {
                app.zoomToNextExtent();
            });
            $('#btnNext').hover(
                function(){
                    $('#nextPic').css({'background-color':'black'});						
                    $('#nextPic').css({'opacity':'.4'});
                },
                function(){
                    $('#nextPic').css({'background-color':'transparent'});						
                    $('#nextPic').css({'opacity':'1'});
                }
            );             


            // 
            // identify button
            // 
            
            $("#btnMultiGraph").click(function() {
                activateMultigraphTool();
            }).hover(
                function(){
                    $("#multiGraphPic").attr('src',  'icons/multigraph_over.png');
                    $("#btnMultiGraph").attr('title', 'Multigraph tool');
                },
                function(){
                    $("#multiGraphPic").attr('src',  'icons/multigraph.png');
                }
            ); 
            
            //Find Area 
            $('#findArea').findArea();
            areasList = $('#findArea').findArea('getAreasList');
            $("#findArea").autocomplete({
                source: areasList
            });  
            $("#findArea").keypress(function(e) {
                if(e.which == 13) {
                    var areaExtent = $('#findArea').findArea('getAreaExtent',$("#findArea").val(),areasList);
                    app.zoomToExtent(areaExtent);
                }
            });            
            
            

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

        this.parseConfig = function(configXML, shareUrlInfo) {
            var app = this;
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
                    left   : parseFloat($extent.attr('xmin')),
                    bottom : parseFloat($extent.attr('ymin')),
                    right  : parseFloat($extent.attr('xmax')),
                    top    : parseFloat($extent.attr('ymax'))
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
            var accordionGroupsByName = {}, index=0;
            $configXML.find("wmsGroup").each(function(i) {
                var $wmsGroup      = $(this), // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
                    accordionGroup = new AccordionGroup({
                        gid              : $wmsGroup.attr('gid'),
                        name             : $wmsGroup.attr('name'),
                        label            : $wmsGroup.attr('label'),
                        selectedInConfig : ($wmsGroup.attr('selected') === "true")
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
                        layer.index = index;
						sublist.layers.push(layer);
                        if (shareUrlInfo && (shareUrlLayerAlpha[layer.lid] !== undefined)) {
                            if (themeOptions.layers === undefined) {
                                themeOptions.layers = [];
                            }
                            themeOptions.layers.push(layer);
                            layer.setTransparency(100*(1-shareUrlLayerAlpha[layer.lid]));
                        }
						index = index+1;
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

            app.zoomInTool     = new OpenLayers.Control.ZoomBox();
            app.zoomOutTool    = new OpenLayers.Control.ZoomBox({out:true});
            app.dragPanTool    = new OpenLayers.Control.DragPan();
            app.identifyTool   = createIdentifyTool();
            app.multigraphTool = createMultigraphTool();

            var initialExtent = undefined;

            if (shareUrlInfo) {
                initialExtent = shareUrlInfo.extent;
            }

            //Hardcoded service information here for faster loading
			//Now assuming street maps is always init base layer
			//comes from: initialBaseLayer.url + '?f=json&pretty=true'
			var baseLayerInfo = new Object({"currentVersion":10.01,"serviceDescription":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including our terms of use, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.","mapName":"Layers","description":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including the terms of use, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map","copyrightText":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012","layers":[{"id":0,"name":"World Street Map","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"tables":[],"spatialReference":{"wkid":102100},"singleFusedMapCache":true,"tileInfo":{"rows":256,"cols":256,"dpi":96,"format":"JPEG","compressionQuality":90,"origin":{"x":-20037508.342787,"y":20037508.342787},"spatialReference":{"wkid":102100},"lods":[{"level":0,"resolution":156543.033928,"scale":591657527.591555},{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},{"level":3,"resolution":19567.8792409999,"scale":73957190.948944},{"level":4,"resolution":9783.93962049996,"scale":36978595.474472},{"level":5,"resolution":4891.96981024998,"scale":18489297.737236},{"level":6,"resolution":2445.98490512499,"scale":9244648.868618},{"level":7,"resolution":1222.99245256249,"scale":4622324.434309},{"level":8,"resolution":611.49622628138,"scale":2311162.217155},{"level":9,"resolution":305.748113140558,"scale":1155581.108577},{"level":10,"resolution":152.874056570411,"scale":577790.554289},{"level":11,"resolution":76.4370282850732,"scale":288895.277144},{"level":12,"resolution":38.2185141425366,"scale":144447.638572},{"level":13,"resolution":19.1092570712683,"scale":72223.819286},{"level":14,"resolution":9.55462853563415,"scale":36111.909643},{"level":15,"resolution":4.77731426794937,"scale":18055.954822},{"level":16,"resolution":2.38865713397468,"scale":9027.977411},{"level":17,"resolution":1.19432856685505,"scale":4513.988705},{"level":18,"resolution":0.597164283559817,"scale":2256.994353},{"level":19,"resolution":0.298582141647617,"scale":1128.497176}]},"initialExtent":{"xmin":-28872328.0888923,"ymin":-11237732.4896886,"xmax":28872328.0888923,"ymax":11237732.4896886,"spatialReference":{"wkid":102100}},"fullExtent":{"xmin":-20037507.0671618,"ymin":-19971868.8804086,"xmax":20037507.0671618,"ymax":19971868.8804086,"spatialReference":{"wkid":102100}},"units":"esriMeters","supportedImageFormatTypes":"PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP","documentInfo":{"Title":"World Street Map","Author":"Esri","Comments":"","Subject":"streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ","Category":"transportation(Transportation Networks) ","Keywords":"World, Global, Europe, Japan, Hong Kong, North America, United States, Canada, Mexico, Southern Africa, Asia, South America, Australia, New Zealand, India, Argentina, Brazil, Chile, Venezuela, Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, Switzerland, Russia, Thailand, Turkey, 2012","Credits":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"},"capabilities":"Map"});
			app.initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);

        };

        this.initOpenLayers = function(baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
            var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                layerInfo: baseLayerInfo
            });
            
            var maxExtentBounds = new OpenLayers.Bounds(app.maxExtent.left, app.maxExtent.bottom,
                                                        app.maxExtent.right, app.maxExtent.top);
            if (initialExtent === undefined) {
                initialExtent = app.maxExtent;
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
                    new OpenLayers.Control.Zoom({
                        zoomInId: "customZoomIn",
                        zoomOutId: "customZoomOut"
                    }),                    
                    app.zoomInTool,
                    app.zoomOutTool,
                    app.identifyTool,
                    app.multigraphTool
                ],
                eventListeners: 
                {
                    "moveend": function() { app.emit("extentchange"); },
                    "zoomend": function() { app.emit("extentchange"); }
                },               
                zoom: 1,
                projection: new OpenLayers.Projection("EPSG:900913")
            });  

            // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
            // to fetch the layerInfo, which in this case we already have
            this.currentBaseLayer = baseLayer;
            this.emit("baselayerchange");
            this.scalebar = new OpenLayers.Control.ScaleBar();
            this.scalebar.divisions = 3;
            this.map.addControl(this.scalebar);
            this.map.addLayers([layer]);
            this.map.setLayerIndex(layer, 0);
            this.setTheme(theme, themeOptions);
            this.zoomToExtent(initialExtent);
            this.map.events.register("mousemove", app.map, function(e) {
                var pixel = app.map.events.getMousePosition(e);
                var lonlat = app.map.getLonLatFromPixel(pixel);
				lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
                OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
            });
        };

    };
    EventEmitter.declare(fcav.App);

    function BaseLayer(settings) {
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.url   = settings.url;
        this.index = settings.index;
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
		this.index       		= 0;
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
			//reorder maps layers based on the current layer index
			var lyrJustAdded = app.map.layers[app.map.getNumLayers()-1];
			for (var i = app.map.getNumLayers(); i > 0; i--) {
				if (this.index>i){
					app.map.setLayerIndex(lyrJustAdded, i);
				}
			}
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
    }
    EventEmitter.declare(Layer);

    function Theme(settings) {
        this.accordionGroups = [];
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.index = settings.index;
        this.getAccordionGroupIndex = function(accordionGroup) {
            // return the index of a given AccordionGroup in this theme's list,
            // or -1 if it is not in the list
            var i;
            for (i=0; i<this.accordionGroups.length; ++i) {
                if (this.accordionGroups[i] === accordionGroup) {
                    return i;
                }
            }
            return -1;
        };
    }

    function displayError(message) {
        console.log(message);
    }

    fcav.init = function() {
        app = new fcav.App();
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.launch('config/ews_config.xml', shareUrlInfo);
        fcav.app = app;
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
					if (activeBtn.length>0){ //weve already activated a three-state button
						$('#'+activeBtn[0].children[0].id).css({'background-color':'transparent'});						
						$('#'+activeBtn[0].children[0].id).css({'opacity':'1'});
						activeBtn = [];
					}
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

    function showSplashScreen() {
        var windowWidth = Math.round($(document).width()/2);
        var windowHeight = Math.round($(document).height()/2);    
        var $html = $(''
                      + '<div class="splash-screen-dialog" align="center">'
                      +   '<table>'
                      +     '<tr>'
                      +       '<td align="center"><img src="icons/logos.png"/></td>'
                      +     '</tr>'
                      +     '<tr>'
                      +       '<td align="center"><p><a href="http://forwarn.forestthreats.org/fcav/assets/FCAV_Users_Guide_4.2.2012.pdf">FCAV Users Guide</a></p></td>'
                      +     '</tr>'
                      +     '<tr>'
                      +       '<td align="center"><p>For information on this viewer, contact support at ews-support@nemac.org</p></td>'
                      +     '</tr>'
                      +   '</table>'
                      + '</div>'
                     );
        $('#splashScreenContainer').dialog({
            zIndex    : 10051, 
            position  : "center",
            height:windowHeight,
            width:windowWidth,
            dialogClass: 'splashScreenStyle',            
            autoOpen  : true,
            hide      : "explode",
            title     : "U.S. Forest Change Assesment Viewer",
            close     : function() {
                $(this).dialog('destroy');
                $html.remove();
				$('#aboutPic').css({'background-color':'transparent'});						
				$('#aboutPic').css({'opacity':'1'});
                activeBtn = [];
            }
        });
        $('#splashScreenContainer').append($($html));
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


    function activateIdentifyTool()
    {
        deactivateActiveOpenLayersControls();
        app.identifyTool.activate();
    }

    function activateMultigraphTool()
    {
        deactivateActiveOpenLayersControls();
        app.multigraphTool.activate();
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
                             +   '<td class="layer-results"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></td>'
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
				if ( $.browser.msie ) { //jdm: IE doesn't have textContent on children[i], but Chrome and FireFox do
					return children[i].text;
				} else {
					return children[i].textContent;
				}			
            }
        }
        return undefined;
    }

    var lastPopup;

    function createMultigraphTool() {
        return new ClickTool(
            function (e) {
                // This function gets called when the user clicks a point in the map while the
                // Multigraph tool is active.  The argument `e` is the click event; the coordinates
                // of the clicked point are (e.x, e.y).

                // This coords object is not really in lon/lat; it's in the display projection of the map,
                // which is EPSG:900913.
                var coords = app.map.getLonLatFromPixel(e.xy); 

                // Here we convert it to actual lon/lat:
                var lonlat = app.map.getLonLatFromPixel(e.xy);
                lonlat.transform(app.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

                $('#myMultigraph').remove();
                if (lastPopup) {
                    app.map.removePopup(lastPopup);
                }
                app.map.addPopup(lastPopup =
                                 new OpenLayers.Popup.FramedCloud(
                                     "fcavMultigraphPopup", 
                                     coords,
                                     null,
                                     '<div id="fcavMultigraphMessage"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></div><div id="fcavMultigraph" style="width: 600px; height: 300px;"></div>',
                                     null,
                                     true));
                var promise = window.multigraph.jQuery('#fcavMultigraph').multigraph({
                    //NOTE: coords.lon and coords.lat on the next line are really x,y coords in EPSG:900913, not lon/lat:
                    'mugl'   : "http://rain.nemac.org/timeseries/tsmugl_product.cgi?args=CONUS_NDVI,"+coords.lon+","+coords.lat
                });
                window.multigraph.jQuery('#fcavMultigraph').multigraph('done', function() {
                    $('#fcavMultigraphMessage').empty();
                    $('#fcavMultigraphMessage').text(Mustache.render('MODIS NDVI for Lat: {{{lat}}} Lon: {{{lon}}}',
                                                                     { lat : sprintf("%.4f", lonlat.lat),
                                                                       lon : sprintf("%.4f", lonlat.lon) }));
                });
            });
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

    function extentsAreEqual(e1, e2) {
        var tolerance = 0.001;
        return ((Math.abs(e1.left - e2.left)        <= tolerance)
                && (Math.abs(e1.bottom - e2.bottom) <= tolerance)
                && (Math.abs(e1.right  - e2.right)  <= tolerance)
                && (Math.abs(e1.top    - e2.top)    <= tolerance));
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
