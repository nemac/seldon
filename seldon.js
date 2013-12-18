(function ($) {
    "use strict";

    var EventEmitter = window.EventEmitter,
        seldon = {},
        activeBtn = [],
        areasList = [],
        app;

    seldon.App = function () {
        EventEmitter.call(this);
        this.map         = undefined; // OpenLayers map object
        this.projection  = undefined; // OpenLayers map projection
        this.gisServerType = undefined; //The type of server that the wms layers will be served from
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
        this.baseLayers            = []; // list of BaseLayer instances holding info about base layers from config file
        this.accordionGroups       = []; // list of AccordionGroup instances holding info about accordion groups from config file
        this.themes                = []; // list of Theme instances holding info about themes from config file
        this.activeMask            = []; // list of currently active global mask
        this.activeMaskParents     = []; // list of currently active global mask parent layers
        this.currentBaseLayer      = undefined;
        this.currentAccordionGroup = undefined;
        this.currentTheme          = undefined;
        this.identifyTool          = undefined;
        this.multigraphTool        = undefined;

        // array of saved extent objects; each entry is a JavaScript object of the form
        //     { left : VALUE, bottom : VALUE, right : VALUE, top : VALUE }
        this.savedExtents = [];

        // index of the "current" extent in the above array:
        this.currentSavedExtentIndex = -1;

        // save the current extent into the savedExtents array, if it is different from
        // the "current" one.  It is important to only save it if it differs from the
        // current one, because sometimes OpenLayers fires multiple events when the extent
        // changes, causing this function to be called multiple times with the same
        // extent
        this.saveCurrentExtent = function () {
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
            for (i = 0; i <= this.currentSavedExtentIndex; ++i) {
                newSavedExtents.push(this.savedExtents[i]);
            }
            this.savedExtents = newSavedExtents;

            // append current extent to the list
            this.savedExtents.push(newExtent);
            ++this.currentSavedExtentIndex;
        };

        this.zoomToExtent = function (extent, save) {
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

        this.zoomToPreviousExtent = function () {
            if (this.currentSavedExtentIndex > 0) {
                --this.currentSavedExtentIndex;
                this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
            }
        };

        this.zoomToNextExtent = function () {
            if (this.currentSavedExtentIndex < this.savedExtents.length-1) {
                ++this.currentSavedExtentIndex;
                this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
            }
        };

        this.printSavedExtents = function () {
            // This function is for debugging only and is not normally used.  It returns an HTML
            // table showing the current savedExtents list, and the current position within the list.
            var html = "<table>";
            var len = this.savedExtents.length;
            var i, e;
            for (i = len-1; i >= 0; --i) {
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

        this.setBaseLayer = function (baseLayer) {
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


        this.setAccordionGroup = function (accordionGroup) {
            this.currentAccordionGroup = accordionGroup;
            this.emit("accordiongroupchange");
        };

        this.setTheme = function (theme, options) {
			
            var app = this,
                $layerPickerAccordion = $("#layerPickerAccordion"),
                flag,
                accordionGroup,
                labelElem,
                textElem,
                maskLabelElem,
                maskTextElem,
                activeMaskLayers = [];

			//JDM (11/1/13): fix for changing themes and accounting for active layers
			//we have changed a theme here, but we need to account for active layers.
			//This accounts for active mask on theme change also.
			if (options === undefined) {
				options = {};
				options.layers = [];
				options.shareUrlMasks = [];
                var shareUrlInfo = ShareUrlInfo.parseUrl(app.shareUrl());
				//get previously active accordion group e.g. accgp=G04
				var gid = shareUrlInfo.accordionGroupGid;
				//get previously active layers e.g. layers=AD,AAB
				var lids = shareUrlInfo.layerLids;
				//loop through the accordion groups the active one accordingly
				for (var a = 0, b = this.accordionGroups.length; a < b; a++) {
					if (this.accordionGroups[a].gid==gid) {
							options.accordionGroup = this.accordionGroups[a];
					}
				}
				//options.layers = lids;
				//loop through the layers active one accordingly
				for (var i = app.map.getNumLayers()-1; i > 0; i--) {
					var currLayer = app.map.layers[i];
					if (lids.indexOf(currLayer.seldonLayer.lid) > -1) {
						//alert(currLayer.lid);
						options.layers.push(currLayer.seldonLayer);
					}
				}
                for (var i = 0; i < app.activeMask.length; i++) {
                    //this.activateMask("MaskFor"+app.activeMask[i],this.index);
					options.shareUrlMasks.push(app.activeMask[i]);
                }			
				
            }
			

			if ($layerPickerAccordion.length === 0) {
                flag = true;
                $layerPickerAccordion = $(document.createElement("div"))
                    .attr("id", "layerPickerAccordion")
                    .addClass("layerAccordionClass")
                    .css("height", "400px");
            }

            if ($layerPickerAccordion.data('listAccordion')) {
                $layerPickerAccordion.listAccordion('clearSections');
            }

            $layerPickerAccordion.listAccordion({
                heightStyle : 'content',
                change      : function (event, ui) {
                    var accordionGroupIndex = $layerPickerAccordion.accordion('option', 'active');
                    app.setAccordionGroup(theme.accordionGroups[accordionGroupIndex]);
                }
            });

            $('#legend').empty();

            //jdm: re-wrote loop using traditional for loops (more vintage-IE friendly)
            //vintage-IE does work with jquery each loops, but seems to be slower
            for (var a = 0, b = theme.accordionGroups.length; a < b; a++) {
                var accGp = theme.accordionGroups[a],
                    accordionGroupOption = options.accordionGroup;
                // Decide whether to open this accordion group.  If we received an
                // `accordionGroup` setting in the options are, activate this accordion
                // group only if it equals that setting.  If we did not receive an
                // `accordionGroup` setting in the options are, activate this accordion
                // group if its "selected" attribute was true in the config file.
                if ((accordionGroupOption && (accGp === accordionGroupOption)) ||
                    (!accordionGroupOption && accGp.selectedInConfig)) {
                    accordionGroup = accGp;
                }
                var g = $layerPickerAccordion.listAccordion('addSection', '<a>'+accGp.label+'</a>');
                for (var i = 0, j = accGp.sublists.length; i < j; i++) {
                    var sublist = accGp.sublists[i],
                        s = $layerPickerAccordion.listAccordion('addSublist', g, sublist.label);
                    for (var k = 0, l = sublist.layers.length; k < l; k++) {
                        var layer = sublist.layers[k];
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

                        labelElem = document.createElement("label");
                        textElem = document.createTextNode(layer.name);
                        labelElem.setAttribute("for", "chk" + layer.lid);
                        labelElem.appendChild(textElem);


                        //jdm 5/28/13: if there is a mask for this layer then we will provide a status
                        //as to when that mask is active
                        var $testForMask = layer.mask;
                        if ($testForMask) {
                            maskLabelElem = document.createElement("label");
                            maskTextElem = document.createTextNode(""); //empty until active, if active then put (m)
                            maskLabelElem.setAttribute("id", "mask-status" + layer.lid);
                            maskLabelElem.appendChild(maskTextElem);
                            // add the layer to the accordion group
                            $layerPickerAccordion.listAccordion('addSublistItem', s,
                                                                [createLayerToggleCheckbox(layer),
                                                                 labelElem,
                                                                 createLayerPropertiesIcon(layer),
                                                                 maskLabelElem]);
                        } else { //no mask for this layer
                            // add the layer to the accordion group
                            $layerPickerAccordion.listAccordion('addSublistItem', s,
                                                                [createLayerToggleCheckbox(layer),
                                                                 labelElem,
                                                                 createLayerPropertiesIcon(layer)]);
                        }


                        // Decide whether to activate the layer.  If we received a layer list in the
                        // options arg, active the layer only if it appears in that list.  If we
                        // received no layer list in the options arg, activate the layer if the layer's
                        // "selected" attribute was true in the config file.
                        if (((options.layers !== undefined) && (arrayContainsElement(options.layers, layer))) ||
                            ((options.layers === undefined) && layer.selectedInConfig)) {
                            layer.activate();
                        }
                    }
                }
            }

            $layerPickerAccordion.accordion("refresh");

            // if page doesn't have layerPickerAccordion, insert it
            if (flag === true) {
                $("#layerPickerDialog").append($layerPickerAccordion);
            }

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

            //jdm 6/28/13: do a check to see if there is a corresponding active mask in options.shareUrlMasks
            //can be multiple mask per a parent layer
            if (options.shareUrlMasks !== undefined) {
                for (var m = 0; m < options.shareUrlMasks.length; m++) {
                    //we have already activated the respective parent layers
                    //so so we have to go through the masking process
                    this.setMask(true, "MaskFor"+options.shareUrlMasks[m]);
                }
            }
        };

        this.shareUrl = function () {
            if (!this.currentTheme) { return undefined; }
            if (!this.currentAccordionGroup) { return undefined; }
            if (!this.currentBaseLayer) { return undefined; }

            var extent      = this.map.getExtent(),
                layerLids   = [],
                layerAlphas = [],
                layerMask   = [],
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
                    if (stringContainsChar(this.name, 'MaskFor')) {
                        //if this layer is a mask add to layerMask list
                        if (layerMask.indexOf(this.seldonLayer.lid.substring(this.seldonLayer.lid.indexOf("MaskFor"),this.seldonLayer.lid.length).replace("MaskFor","")) == -1) {
                            layerMask.push(this.seldonLayer.lid.substring(this.seldonLayer.lid.indexOf("MaskFor"),this.seldonLayer.lid.length).replace("MaskFor",""));
                        }
                        //make sure the parent to the layerMask stays on the share map url
                        if (layerLids.indexOf(this.name.substring(0, this.name.indexOf("MaskFor"))) == -1) {
                            layerLids.push(this.name.substring(0, this.name.indexOf("MaskFor")));
                            layerAlphas.push(op);
                        }
                    } else { 
                        //otherwise add to layerLids
                        layerLids.push(this.seldonLayer.lid);
                        layerAlphas.push(op);
                    } //end

                }
            });

            url = window.location.toString();
            url = url.replace(/\?.*$/, '');
            url = url.replace(/\/$/, '');
            url = url.replace("#", '');
            return url + '?' + (new ShareUrlInfo({
                themeName         : this.currentTheme.name,
                layerLids         : layerLids,
                layerMask         : layerMask,
                layerAlphas       : layerAlphas,
                accordionGroupGid : this.currentAccordionGroup.gid,
                baseLayerName     : this.currentBaseLayer.name,
                extent            : extent
            })).urlArgs();
        };

        this.updateShareMapUrl = function () {
            if (this.currentTheme) {
                var url = this.shareUrl();
                if (url) {
                    $('#mapToolsDialog textarea.shareMapUrl').val(url);
                }
            }
        };

        this.launch = function (configFile, shareUrlInfo) {
            var app = this;

            $.ajax({
                url: configFile,
                dataType: "xml",
                success: function (configXML) {
                    app.parseConfig(configXML, shareUrlInfo);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });

            //
            // layerPicker button:
            //
            $("#btnTglLyrPick").click(function () {
                var $layerPickerDialog = $("#layerPickerDialog");
                if ($layerPickerDialog.dialog('isOpen')) {
                    $layerPickerDialog.dialog('close');
                } else {
                    $layerPickerDialog.dialog('open');
                }
            });

            //
            // turn layerPickerDialog div into a jQuery UI dialog:
            //
            $("#layerPickerDialog").dialog({ zIndex   : 10050,
                                             position : { my : "left top", at: "left+5 top+100"},
                                             autoOpen : true,
                                             hide     : "fade",
                                             open     : function () {
                                                 $("a").focus().blur();
                                             }
                                           });
            app.addListener("accordiongroupchange", function () {
                if (app.currentTheme) {
                    $('#layerPickerAccordion').accordion({
                            active      : app.currentTheme.getAccordionGroupIndex(app.currentAccordionGroup),
                            collapsible : true
                    });
                }
            });

            //
            // mapTools button:
            //
            $("#btnTglMapTools").click(function () {
                var $mapToolsDialog = $("#mapToolsDialog");
                if ($mapToolsDialog.dialog('isOpen')) {
                    $mapToolsDialog.dialog('close');
                } else {
                    $mapToolsDialog.dialog('open');
                }
            });

            //
            // turn mapToolsDialog div into a jQuery UI dialog:
            //
            $("#mapToolsDialog").dialog({ zIndex   : 10050,
                                          position : { my : "right top", at: "right-5 top+100"},
                                          autoOpen : true,
                                          hide     : "fade",
                                          open     : function () {
                                              $("a").focus().blur();
                                          }
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
                app.updateShareMapUrl();
            });

            //
            // mapTools accordion
            //
            var $mapToolsAccordion = $("#mapToolsAccordion"),
                accordionGroupIndexToOpen = 0;

            //    initialize
            $mapToolsAccordion.accordion({
                heightStyle : 'content',
                collapsible : true
            });

            //    find the 'legend' layer in the mapTools accordion, and make sure it is initially turned on
            $mapToolsAccordion.find('div').each(function (i) {
                if (this.id === "legend") {
                    accordionGroupIndexToOpen = i;
                    return false;
                }
                return true;
            });
            $mapToolsAccordion.accordion('option', 'active', accordionGroupIndexToOpen);

            //
            // base layer combo change handler
            //
            $('#baseCombo').change(function () {
                var i = parseInt($(this).val(), 10);
                app.setBaseLayer(app.baseLayers[i]);
            });
            app.addListener("baselayerchange", function () {
                $('#baseCombo').val(app.currentBaseLayer.index);
            });

            //
            // theme layer combo change handler
            //
            $('#themeCombo').change(function () {
                var i = parseInt($(this).val(), 10);
                app.setTheme(app.themes[i]);
            });
            app.addListener("themechange", function () {
                $('#themeCombo').val(app.currentTheme.index);
            });

            //
            // pan button
            //
            $("#btnPan").click(function () {
                deactivateActiveOpenLayersControls();
                app.dragPanTool.activate();
            });

            //
            // zoom in button
            //
            $("#btnZoomIn").click(function () {
                deactivateActiveOpenLayersControls();
                app.zoomInTool.activate();
                activeBtn = $(this);
                activeBtn.children().addClass('icon-active');
            });

            //
            // zoom out button
            //
            $("#btnZoomOut").click(function () {
                deactivateActiveOpenLayersControls();
                app.zoomOutTool.activate();
                activeBtn = $(this);
                activeBtn.children().addClass('icon-active');
            });

            //
            // zoom to full extent button
            //
            $("#btnZoomExtent").click(function () {
                app.zoomToExtent(app.maxExtent);
            });

            //
            // identify button
            //
            $("#btnID").click(function () {
                activateIdentifyTool();
                activeBtn = $(this);
                activeBtn.children().addClass('icon-active');
            });

            //
            // about button
            //
            $("#btnAbout").click(function () {
                // I don't think the following line is needed. but am leaving it in
                // just in case - jrf
                //                deactivateActiveOpenLayersControls();
                var splashScreen = $("#splashScreenContainer");
                if (splashScreen.dialog("isOpen")) {
                    splashScreen.dialog("close");
                } else {
                    splashScreen.dialog("open");
                }
            });

            //
            // previous extent button
            //
            $("#btnPrev").click(function () {
                app.zoomToPreviousExtent();
            });

            //
            // next extent button
            //
            $("#btnNext").click(function () {
                app.zoomToNextExtent();
            });

            //
            // multigraph button
            //
            $("#btnMultiGraph").click(function () {
                activateMultigraphTool();
                activeBtn = $(this);
                activeBtn.children().addClass('icon-active');
            });

	    //
	    // splash screen
	    //
	    createSplashScreen();

            //Find Area
            var $findArea = $('#findArea');
            $findArea.findArea();
            areasList = $findArea.findArea('getAreasList');
            $findArea.autocomplete({
                source: areasList
            });
            $findArea.keypress(function (e) {
                if (e.which == 13) {
                    var areaExtent = $findArea.findArea('getAreaExtent', $findArea.val(), areasList);
                    app.zoomToExtent(areaExtent);
                }
            });

            //jdm: 7/9/12 - for global mask functionality
            $(function () {
                $('.mask-toggle').on('click', function () {
                    if ($(this).is(':checked')) {
                        app.setMask(true, this.value);
                    } else {
                        app.setMask(false, this.value);
                    }
                });
            });

            $('textarea').focus(function () {
                var $this = $(this);

                $this.select();

                // webkit issue
                window.setTimeout(function () {
                    $this.select();
                }, 1);

                function mouseUpHandler () {
                    // Prevent further mouseup intervention
                    $this.off("mouseup", mouseUpHandler);
                    return false;
                }

                $this.mouseup(mouseUpHandler);
            });

            // closes accordion tools by default on small browsers
            if ($(window).width() < 650) {
                $('#mapToolsDialog').dialog('close');
                $('#layerPickerDialog').dialog('close');
            }

            // closes and reopens accordion tools on mobile devices. They tend to lose their proper
            // position otherwise.
            if (window.addEventListener) {
                window.addEventListener("orientationchange", function () {
                    var $mapToolsDialog    = $('#mapToolsDialog'),
                        $layerPickerDialog = $('#layerPickerDialog');

                    window.scroll(0, 0);
                    if ($mapToolsDialog.dialog('isOpen')) {
                        $mapToolsDialog.dialog('close').dialog('open');
                    }

                    if ($layerPickerDialog.dialog('isOpen')) {
                        $layerPickerDialog.dialog('close').dialog('open');
                    }
                }, false);
            }

        }; //end app.launch()

        //jdm: 7/9/12 - for global mask functionality at app level
        this.setMask = function (toggle, maskName) {
            if (toggle) {
                //Add the mask to the activeMask list so that we can keep track
                //at the app level by loop through each currently active layer
                for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                    var currLayer = app.map.layers[i];
                    if (currLayer.seldonLayer.mask) {
                        //need to only add one lid to activeMaskParents but be able to
                        //handle the case in deactivateMask where there are multiple mask on
                        //and how to wait until the last mask is off to re-activate the parent.
                        //if not already in the active mask parent list add to keep track
						if (this.activeMaskParents.indexOf(currLayer.seldonLayer.lid) == -1) {
                            if (currLayer.seldonLayer.lid.indexOf("MaskFor") > -1) {
								if ((this.activeMaskParents.indexOf(currLayer.seldonLayer.lid.substring(0,currLayer.seldonLayer.lid.indexOf("MaskFor"))) > -1) 
									&& (app.activeMask.indexOf(maskName.replace("MaskFor",""))==-1)) {  //condition: Already in activeMaskParents but a new mask
									this.activeMaskParents.push(currLayer.seldonLayer.lid.substring(0,currLayer.seldonLayer.lid.indexOf("MaskFor")));
									this.activeMask.push(maskName.replace("MaskFor",""));
			                        currLayer.seldonLayer.activateMask(maskName, currLayer.seldonLayer.index);  //activate mask at the layer level
									if ($("#"+maskName.replace("MaskFor","")).get(0)) {
										$("#"+maskName.replace("MaskFor","")).get(0).checked = true;
									}									
								}
								else { 
									//if the parent layer checkbox and mask-toggle are not active make it so
									if ($("#chk"+currLayer.seldonLayer.lid.replace(maskName,"")).get(0)) {
										$("#chk"+currLayer.seldonLayer.lid.replace(maskName,"")).get(0).checked = true;
                                        $('#mask-status'+ currLayer.seldonLayer.lid.substring(0,currLayer.seldonLayer.lid.indexOf("MaskFor"))).text("(m)");
									}
									if ($("#"+maskName.replace("MaskFor","")).get(0)) {
										$("#"+maskName.replace("MaskFor","")).get(0).checked = true;
									}									
								}
							} else { //condition: First of a mask for parent layer
                                this.activeMaskParents.push(currLayer.seldonLayer.lid);
								this.activeMask.push(maskName.replace("MaskFor",""));
		                        currLayer.seldonLayer.activateMask(maskName, currLayer.seldonLayer.index);  //activate mask at the layer level
								if ($("#"+maskName.replace("MaskFor","")).get(0)) {
									$("#"+maskName.replace("MaskFor","")).get(0).checked = true;
								}									
                            }
                        }
                    } 
                }
            }
            else { //we have just turned off a mask
                //alert("turned off a mask "+ maskName);
                app.deactivateMask(maskName); //deactivate mask at the app level
            }
        }; //end app.setMask()

        this.deactivateMask = function (maskLayerName) {
            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                var currLayer = app.map.layers[i];
                if (currLayer.seldonLayer.mask) {
                    //roll back to parent layer only if there are no other mask
                    //currently active for the parent layer
                    if (maskLayerName == currLayer.name.substring(currLayer.name.indexOf("MaskFor"),currLayer.name.length)) {
                        if (getCount(currLayer.name.substring(0,currLayer.name.indexOf("MaskFor")), app.activeMaskParents) == 1) {
                            var parentLayer = new Layer({
                                    lid              : currLayer.name.substring(0,currLayer.name.indexOf("MaskFor")),
                                    visible          : currLayer.seldonLayer.visible,
                                    url              : currLayer.seldonLayer.url,
                                    srs              : currLayer.seldonLayer.srs,
                                    layers           : currLayer.seldonLayer.layers.substring(0,currLayer.seldonLayer.layers.indexOf("MaskFor")),
                                    identify         : currLayer.seldonLayer.identify,
                                    name             : currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))+"MaskParent",
                                    mask             : 'true',
                                    legend           : currLayer.seldonLayer.legend
                            });
                            app.map.layers[i].seldonLayer.removeFromLegend();
                            app.map.removeLayer(app.map.layers[i]);
                            app.activeMask.splice(app.activeMask.indexOf(maskLayerName.replace("MaskFor","")), 1);
                            app.activeMaskParents.splice(app.activeMaskParents.indexOf(currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))), 1);
                            $('#mask-status'+ currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))).text("");
                            parentLayer.activate();
                            app.updateShareMapUrl();
                        } else { //there are still active mask for the parent layer in question
                            //just removing a single mask currently
                            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                                var currLayer = app.map.layers[i];
                                if (currLayer.name.indexOf(maskLayerName) > -1) {
                                    app.map.removeLayer(currLayer.seldonLayer.openLayersLayer);
                                }
                            }
                            app.activeMask.splice(app.activeMask.indexOf(maskLayerName.replace("MaskFor","")), 1);
                            app.activeMaskParents.splice(app.activeMaskParents.indexOf(currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))), 1);
                        }
                    }
                }
                //be sure to remove from active mask
                //app.activeMask.splice(app.activeMask.indexOf(maskLayerName.replace("MaskFor","")),1);
            }
            //turn off mask
            //this needs to be more robust accounting for all mask possible being
            //off, but for now i am going to leave it like this.
            app.updateShareMapUrl();
            $('#mask-status'+ this.lid).text("");
        };

        this.deactivateMaskParent = function (lid) {
            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                var currLayer = app.map.layers[i];
                if (currLayer.seldonLayer.mask) {
                    if (lid == currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))) {
                        this.map.layers[i].seldonLayer.removeFromLegend();
                        this.map.removeLayer(app.map.layers[i]);
                        this.updateShareMapUrl();
                        //this.deactivateMask(currLayer.name.substring(lid.length,currLayer.name.length));
                        $('#mask-status'+ currLayer.name.substring(0,currLayer.name.indexOf("MaskFor"))).text("");
                    }
                }
            }
            //turn off mask
            //this needs to be more robust accounting for all mask possible being
            //off, but for now i am going to leave it like this.
            app.updateShareMapUrl();
            $('#mask-status'+ this.lid).text(""); 
        };

        this.parseConfig = function (configXML, shareUrlInfo) {
            var app = this,
                $configXML = $(configXML),
                initialBaseLayer,
                initialTheme,
                shareUrlLayerAlpha,
                themeOptions = {},
                i, j, k,
                l, ll, lll;

            if (shareUrlInfo !== undefined) {
                shareUrlLayerAlpha = {};
                for (i = 0, l = shareUrlInfo.layerLids.length; i < l; i++) {
                    shareUrlLayerAlpha[shareUrlInfo.layerLids[i]] = shareUrlInfo.layerAlphas[i];
                }
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
            var $baseCombo = $("#baseCombo"),
                $images = $configXML.find("images image"),
                $image,
                selected,
                baseLayer;

            for (i = 0, l = $images.length; i < l; i++) {
                $image = $($images[i]);
                selected  = $image.attr('selected');
                baseLayer = new BaseLayer({
                    name     : $image.attr('name'),
                    label    : $image.attr('label'),
                    url      : $image.attr('url'),
                    index    : i
                });
                app.baseLayers.push(baseLayer);
                $baseCombo.append($(document.createElement("option")).attr("value", i).text(baseLayer.label));
                if ((  shareUrlInfo  &&   (shareUrlInfo.baseLayerName === baseLayer.name)) ||
                    ( !shareUrlInfo  &&   selected                                    )) {
                    initialBaseLayer = baseLayer;
                }
            }

            if (initialBaseLayer === undefined) {
                initialBaseLayer = app.baseLayers[0];
            }

            // parse layer groups and layers
            var $wmsGroups = $configXML.find("wmsGroup"),
                $wmsGroup,
                $wmsSubgroups,
                $wmsSubgroup,
                $wmsLayers,
                $wmsLayer,
                accordionGroupsByName = {},
                accordionGroup,
                sublist,
                layer,
                index = 0;
            for (i = 0, l = $wmsGroups.length; i < l; i++) {
                $wmsGroup = $($wmsGroups[i]); // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
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
                $wmsSubgroups = $wmsGroup.find("wmsSubgroup");
                for (j = 0, ll = $wmsSubgroups.length; j < ll; j++) {
                    $wmsSubgroup = $($wmsSubgroups[j]); // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                    sublist      = new AccordionGroupSublist({
                        label : $wmsSubgroup.attr('label')
                    });
                    accordionGroup.sublists.push(sublist);
                    $wmsLayers = $wmsSubgroup.find("wmsLayer");
                    for (k = 0, lll = $wmsLayers.length; k < lll; k++) {
                        $wmsLayer = $($wmsLayers[k]);
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
                            mask             : $wmsLayer.attr('mask'),
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
                        index = index + 1;
                    }
                }
            }

            //jdm: add to list of mask for checking later in this function
            //put the mask from the share url onto the themeOptions for later processing
            //within the setTheme() function
            if (shareUrlInfo !== undefined) {
                if (themeOptions.shareUrlMasks === undefined) {
                    themeOptions.shareUrlMasks = [];
                }
                for (i = 0, l = shareUrlInfo.layerMask.length; i < l; i++) {
                    themeOptions.shareUrlMasks[i]=shareUrlInfo.layerMask[i];
                }
            }

            // parse themes
            var $themeCombo = $("#themeCombo"),
                $views      = $configXML.find("mapviews view"),
                $view,
                $viewGroups,
                $viewGroup,
                theme,
                name;
            for (i = 0, l = $views.length; i < l; i++) {
                $view = $($views[i]);
                theme = new Theme({
                    name  : $view.attr('name'),
                    label : $view.attr('label'),
                    index : i
                });
                app.themes.push(theme);
                $themeCombo.append($(document.createElement("option")).attr("value", i).text(theme.label));
                $viewGroups = $view.find("viewGroup");
                for (j = 0, ll = $viewGroups.length; j < ll; j++) {
                    $viewGroup     = $($viewGroups[j]);
                    name           = $viewGroup.attr('name');
                    accordionGroup = accordionGroupsByName[name];
                    if (accordionGroup) {
                        theme.accordionGroups.push(accordionGroup);
                    } else {
                        displayError("Unknown accordion group name '" + name + "' found in theme '" + theme.name + "'");
                    }
                }
                if ((  shareUrlInfo  &&   (shareUrlInfo.themeName === theme.name)) ||
                    ( !shareUrlInfo  &&   ($view.attr('selected')                    ))) {
                    initialTheme = theme;
                }
            }

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

            var initialExtent;

            if (shareUrlInfo) {
                initialExtent = shareUrlInfo.extent;
            }

            // Hardcoded service information here for faster loading
            // Now assuming street maps is always init base layer
            // comes from: initialBaseLayer.url + '?f=json&pretty=true'
            var baseLayerInfo = {"currentVersion":10.01,"serviceDescription":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including our terms of use, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.","mapName":"Layers","description":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including the terms of use, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map","copyrightText":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012","layers":[{"id":0,"name":"World Street Map","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"tables":[],"spatialReference":{"wkid":102100},"singleFusedMapCache":true,"tileInfo":{"rows":256,"cols":256,"dpi":96,"format":"JPEG","compressionQuality":90,"origin":{"x":-20037508.342787,"y":20037508.342787},"spatialReference":{"wkid":102100},"lods":[{"level":0,"resolution":156543.033928,"scale":591657527.591555},{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},{"level":3,"resolution":19567.8792409999,"scale":73957190.948944},{"level":4,"resolution":9783.93962049996,"scale":36978595.474472},{"level":5,"resolution":4891.96981024998,"scale":18489297.737236},{"level":6,"resolution":2445.98490512499,"scale":9244648.868618},{"level":7,"resolution":1222.99245256249,"scale":4622324.434309},{"level":8,"resolution":611.49622628138,"scale":2311162.217155},{"level":9,"resolution":305.748113140558,"scale":1155581.108577},{"level":10,"resolution":152.874056570411,"scale":577790.554289},{"level":11,"resolution":76.4370282850732,"scale":288895.277144},{"level":12,"resolution":38.2185141425366,"scale":144447.638572},{"level":13,"resolution":19.1092570712683,"scale":72223.819286},{"level":14,"resolution":9.55462853563415,"scale":36111.909643},{"level":15,"resolution":4.77731426794937,"scale":18055.954822},{"level":16,"resolution":2.38865713397468,"scale":9027.977411},{"level":17,"resolution":1.19432856685505,"scale":4513.988705},{"level":18,"resolution":0.597164283559817,"scale":2256.994353},{"level":19,"resolution":0.298582141647617,"scale":1128.497176}]},"initialExtent":{"xmin":-28872328.0888923,"ymin":-11237732.4896886,"xmax":28872328.0888923,"ymax":11237732.4896886,"spatialReference":{"wkid":102100}},"fullExtent":{"xmin":-20037507.0671618,"ymin":-19971868.8804086,"xmax":20037507.0671618,"ymax":19971868.8804086,"spatialReference":{"wkid":102100}},"units":"esriMeters","supportedImageFormatTypes":"PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP","documentInfo":{"Title":"World Street Map","Author":"Esri","Comments":"","Subject":"streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ","Category":"transportation(Transportation Networks) ","Keywords":"World, Global, Europe, Japan, Hong Kong, North America, United States, Canada, Mexico, Southern Africa, Asia, South America, Australia, New Zealand, India, Argentina, Brazil, Chile, Venezuela, Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, Switzerland, Russia, Thailand, Turkey, 2012","Credits":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"},"capabilities":"Map"};
            app.initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);
        };

        this.initOpenLayers = function (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
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
                projection: new OpenLayers.Projection(seldon.projection)
            });

            // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
            // to fetch the layerInfo, which in this case we already have
            this.currentBaseLayer = baseLayer;
            this.emit("baselayerchange");
            this.scalebar = new OpenLayers.Control.ScaleBar({
                    displaySystem: "english"
                });
            this.scalebar.divisions = 3;
            this.map.addControl(this.scalebar);
            this.map.addLayers([layer]);
            this.map.setLayerIndex(layer, 0);
            this.setTheme(theme, themeOptions);
            this.zoomToExtent(initialExtent);
            this.map.events.register("mousemove", app.map, function (e) {
                var pixel = app.map.events.getMousePosition(e);
                var lonlat = app.map.getLonLatFromPixel(pixel);
                lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
                OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
            });
            app.map.addControl(new OpenLayers.Control.PanZoomBar());
        };

    };
    EventEmitter.declare(seldon.App);

    function BaseLayer (settings) {
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.url   = settings.url;
        this.index = settings.index;
    }

    function AccordionGroup (settings) {
        this.sublists = [];
        if (!settings) { return; }
        this.gid              = settings.gid;
        this.name             = settings.name;
        this.label            = settings.label;
        this.selectedInConfig = settings.selectedInConfig;
    }

    function AccordionGroupSublist (settings) {
        this.layers = [];
        if (!settings) { return; }
        this.label  = settings.label;
    }

    function Layer (settings) {
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
        this.mask               = settings.mask;
        this.transparency       = 0;
        this.index              = 0;
        this.selectedInConfig   = settings.selectedInConfig;
        this.openLayersLayer    = undefined;
        this.createOpenLayersLayer = function () {
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
            this.openLayersLayer.seldonLayer = this;
            return this.openLayersLayer;
        };
        this.activate = function (isMask) {
            app.map.addLayer(this.createOpenLayersLayer());
            this.addToLegend();
            this.emit("activate");
            //If there is currently any active mask
            //then activate mask on this layer if it hasn't already been activated
            //Because we will fly through here again we need to use both activeMask
            //and activeMaskParents to verify that we don't get into a recursive loop
            if ((app.activeMask.length > 0) &&
                (this.mask) &&
                (this.lid.indexOf("MaskFor") == -1)) {
                //Here we have a parent layer that has been activated
                //after mask have already been turned on.
                //So we need to loop through the activeMask and turn on
                //the mask accordingly.
                for (var i = 0; i < app.activeMask.length; i++) {
                    this.activateMask("MaskFor"+app.activeMask[i],this.index);
                }
            }
            //reorder maps layers based on the current layer index
			//jdm 9/23: this needs to be revisited to deal with masking
            if (app.map.getNumLayers()>1) {
			var lyrJustAdded = app.map.layers[app.map.getNumLayers()-1];
				for (var i = app.map.getNumLayers()-2; i > 0; i--) {
					var nextLayerDown = app.map.layers[i];
					if (nextLayerDown.seldonLayer.index < lyrJustAdded.seldonLayer.index) {
						//move lyrJustAdded up one in the OL stack
						app.map.setLayerIndex(lyrJustAdded, i);
					}
				}
			}
            app.map.updateSize();
        };

        this.checkForExistingLayer = function (layerName) {
            var isLayerActive = false;
            for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                var currLayer = app.map.layers[i];
                if (layerName == currLayer.name) {
                    isLayerActive = true;
                }
            }
            return isLayerActive;
        };

        this.deactivate = function (isMask) {
            if (this.openLayersLayer) {
                try {
                    if (app.activeMaskParents.indexOf(this.lid) > -1) {
                        //this layer is the parent to a currently active mask
                        //therefore it technically has already been deactivated
                        //but we really need to turn off the relevant mask
                        app.deactivateMaskParent(this.lid);
                        //Need to remove from activeMaskParents??
                        //Or, once a parent always a parent 
                        //app.activeMaskParents.splice(app.activeMaskParents.indexOf(this.lid), 1);
                        //need to remove mask-status too...
                        $('#mask-status'+ this.lid).text("");
                    } else {
                        $('#mask-status'+ this.lid).text("");
                        app.map.removeLayer(this.openLayersLayer);
                    }
                }
                catch(err) {
                    //we tried to remove a layer that was previously used as a mask parent
                    for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                        var currLayer = app.map.layers[i];
                        if (currLayer.name.substring(0,this.lid.length) == this.lid) {
                            app.map.removeLayer(currLayer.seldonLayer.openLayersLayer);
                        }
                    }
                }
                this.removeFromLegend();
            }
            this.emit("deactivate");
        };

        this.addToLegend = function () {
            var that = this;
            this.$legendItem = $(document.createElement("div")).attr("id", "lgd" + this.lid)
                .append($(document.createElement("img")).attr("src", this.legend))
                .appendTo($('#legend'))
                .click(function () {
                    that.deactivate();
                });
        };

        this.removeFromLegend = function () {
            if (this.$legendItem) {
                this.$legendItem.remove();
            }
        };

        this.setTransparency = function (transparency) {
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(1-parseFloat(transparency)/100.0);
            }
            this.transparency = transparency;
            this.emit({type : 'transparency', value : this.transparency});
        };   
        
        this.activateMask = function (maskLayerName, seldonIndex) {
            //Need to do a check for existing mask
			var checkForMaskLayerActive = this.checkForExistingLayer(this.lid);
			if (this.lid.indexOf("MaskFor") == -1) { //no mask applied yet
                var maskLayer = new Layer({
                        lid              : this.lid+maskLayerName.replace("/",""),
                        visible          : this.visible,
                        url              : this.url,
                        srs              : this.srs,
                        layers           : this.layers+maskLayerName.replace("/","").replace(this.lid,""),
                        identify         : this.identify,
                        name             : this.lid+maskLayerName.replace("/",""),
                        mask             : 'true',
                        legend           : this.legend
                });
                //add to activeMaskParents
                //app.activeMaskParents.push(this.lid);
            } else { //applying additional mask
                 var maskLayer = new Layer({
                        lid              : this.lid.replace(this.lid.substring(this.lid.indexOf("MaskFor"),this.lid.length), maskLayerName),
                        visible          : this.visible,
                        url              : this.url,
                        srs              : this.srs,
                        layers           : this.layers.replace(this.lid.substring(this.lid.indexOf("MaskFor"),this.lid.length), maskLayerName),
                        identify         : this.identify,
                        name             : this.lid.replace(this.lid.substring(this.lid.indexOf("MaskFor"),this.lid.length), maskLayerName),
                        mask             : 'true',
                        legend           : this.legend
                });
            }
            if (maskLayer != undefined) {
				maskLayer.index = seldonIndex;
				maskLayer.activate();
			}
            if (this.openLayersLayer && (this.lid.indexOf("MaskFor") == -1)) {
                app.map.removeLayer(this.openLayersLayer);
                this.removeFromLegend();
            }
            app.updateShareMapUrl();
			checkForMaskLayerActive = this.checkForExistingLayer(this.lid);
            if (checkForMaskLayerActive) {
				$('#mask-status'+ this.lid.substring(0,this.lid.indexOf("MaskFor"))).text("(m)");
			}
			else {
				$('#mask-status'+ this.lid).text("(m)");
			}
        };
    }
    EventEmitter.declare(Layer);

    function Theme (settings) {
        this.accordionGroups = [];
        if (!settings) { return; }
        this.name  = settings.name;
        this.label = settings.label;
        this.index = settings.index;
        this.getAccordionGroupIndex = function (accordionGroup) {
            // return the index of a given AccordionGroup in this theme's list,
            // or -1 if it is not in the list
            var i;
            for (i = 0; i < this.accordionGroups.length; ++i) {
                if (this.accordionGroups[i] === accordionGroup) {
                    return i;
                }
            }
            return -1;
        };
    }

    function displayError (message) {
        //console.log(message);
    }

    seldon.init = function (config, projection, gisServerType) {
        // jrf: Overrides OpenLayers.Map.getCurrentSize since by default it does not
        //      account for padding, and seldon requires padding on the top and bottom
        //      for its layout.
        OpenLayers.Map.prototype.getCurrentSize = function () {
            var size = new OpenLayers.Size(this.div.clientWidth, 
                                           this.div.clientHeight);

            if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
                size.w = this.div.offsetWidth;
                size.h = this.div.offsetHeight;
            }
            if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
                size.w = parseInt(this.div.style.width, 10);
                size.h = parseInt(this.div.style.height, 10);
            }

            // getCurrentSize now accounts for padding
            size.h = size.h - parseInt($(this.div).css("padding-top"), 10) - parseInt($(this.div).css("padding-bottom"), 10);

            return size;
        };

        app = new seldon.App();
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.launch(config, shareUrlInfo);
        seldon.app = app;
        seldon.projection = projection;
        seldon.gisServerType = gisServerType;
    };

    function deactivateActiveOpenLayersControls () {
        var controls,
            i;
        for (i = 0; i < app.map.controls.length; i++) {
            controls = app.map.controls[i];
            if ((controls.active === true) &&
                (
                 (controls.displayClass === "olControlZoomBox")           ||
                 (controls.displayClass === "olControlWMSGetFeatureInfo") ||
                 (controls.displayClass === "ClickTool")
                )) {

                controls.deactivate();
                if (activeBtn.length > 0){ //weve already activated a three-state button
                    activeBtn.children().removeClass('icon-active');
                    activeBtn = [];
                }
            }
        }
    }

    function ShareUrlInfo (settings) {
        if (settings === undefined) {
            settings = {};
        }
        this.themeName         = settings.themeName;
        this.accordionGroupGid = settings.accordionGroupGid;
        this.baseLayerName     = settings.baseLayerName;
        this.extent            = settings.extent;
        this.layerLids         = settings.layerLids;
        this.layerMask         = settings.layerMask;
        this.layerAlphas       = settings.layerAlphas;
        if (this.extent === undefined) {
            this.extent = {};
        }
        if (this.layerLids === undefined) {
            this.layerLids = [];
        }
        if (this.layerMask === undefined) {
            this.layerMask = [];
        }
        if (this.layerAlphas === undefined) {
            this.layerAlphas = [];
        }
    }

    ShareUrlInfo.parseUrl = function (url) {
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
        if (vars.mask) {
            $.each(vars.mask.split(','), function () {
                info.layerMask.push(this);
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

    ShareUrlInfo.prototype.urlArgs = function () {
        return Mustache.render(
            (''
             + 'theme={{{theme}}}'
             + '&layers={{{layers}}}'
             + '&mask={{{mask}}}'
             + '&alphas={{{alphas}}}'
             + '&accgp={{{accgp}}}'
             + '&basemap={{{basemap}}}'
             + '&extent={{{extent.left}}},{{{extent.bottom}}},{{{extent.right}}},{{{extent.top}}}'
            ),
            {
                theme   : this.themeName,
                layers  : this.layerLids.join(','),
                mask    : this.layerMask.join(','),
                alphas  : this.layerAlphas.join(','),
                accgp   : this.accordionGroupGid,
                basemap : this.baseLayerName,
                extent  : this.extent
            });
    };

    function createLayerToggleCheckbox (layer) {
        // create the checkbox
        var checkbox = document.createElement("input"),
            $checkbox;
        checkbox.type = "checkbox";
        checkbox.id = "chk" + layer.lid;
        checkbox.onclick = function () {
            if ($(this).is(':checked')) {
                layer.activate(true);
            } else {
                layer.deactivate(true);
            }
        };
        $checkbox = $(checkbox);
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $checkbox.attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $checkbox.attr('checked', false);
        });
        // return the new checkbox DOM element
        return checkbox;
    }

    function createLayerPropertiesIcon (layer) {
        var img = document.createElement("img");
        img.id = layer.lid;
        img.src = "icons/settings.png";
        img.className = "layerPropertiesIcon";
        img.onclick = function () {
            createLayerPropertiesDialog(layer);
        };
        return img;
    }

    function createSplashScreen () {
        var $splashScreenContainer = $("#splashScreenContainer"),
            $document    = $(document),
            windowWidth  = Math.round($document.width()/2);
	$('#splashScreenContent').load('splashScreen.html');
        $splashScreenContainer.dialog({
            zIndex      : 10051,
            maxHeight   : $document.height(),
            width       : windowWidth,
            minWidth    : 300,
            dialogClass : 'splashScreenStyle',
            hide        : "explode",
            open        : function () {
                $("a").focus().blur();
            }
        });
        $splashScreenContainer.dialog("close");
    }

    //This function gets called every time the layer properties icon gets clicked
    function createLayerPropertiesDialog (layer) {
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

                //jdm:5/13/13 need to check for mask on this layer, and if so
                //adjust the htm accordingly to have the toggles for those mask.

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
        $html.find('input.transparency-text').change(function () {
            var $this = $(this),
                newValueFloat = parseFloat($this.val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $this.val(layer.transparency);
                return;
            }
            layer.setTransparency($this.val());
        });

        layer.addListener("transparency", function (e) {
            $html.find('input.transparency-text').val(e.value);
        });

        //jdm 5/14/13: add listener for mask functionality
        //for every mask checkbox we check we getting a click event

        $html.dialog({
            zIndex    : 10050,
            position  : "left",
            autoOpen  : true,
            hide      : "explode",
            title     : layer.name,
            width     : 'auto',
            close     : function () {
                $(this).dialog('destroy');
                $html.remove();
                createLayerPropertiesDialog.$html[layer.lid] = undefined;
            }
        });
        createLayerPropertiesDialog.$html[layer.lid] = $html;
    } //end function createLayerPropertiesDialog (layer)

    // Object to be used as hash for tracking the $html objects created by createLayerPropertiesDialog;
    // keys are layer lids:
    createLayerPropertiesDialog.$html = {};

    function activateIdentifyTool () {
        deactivateActiveOpenLayersControls();
        app.identifyTool.activate();
    }

    function activateMultigraphTool () {
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

        initialize: function (clickHandler) {
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
    function createWMSGetFeatureInfoRequestURL (serviceUrl, layers, srs, x, y) {
        var extent = app.map.getExtent();
        if (seldon.gisServerType === "ArcGIS") {
            extent = extent.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
        }
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

    function createIdentifyTool () {
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
                var html = '<table id="identify_results" height="100">';
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
                                label : this.seldonLayer.name
                            }
                        );
                    }
                });
                html = html + "</table>";

                // Display the popup window; we'll populate the results later, asynchronously,
                // as they arrive.
                app.map.addPopup(new OpenLayers.Popup.FramedCloud(
                    "identify_popup",                   // id
                    app.map.getLonLatFromPixel(e.xy),   // lonlat
                    null,                               // contentSize
                    html,                               // contentHTML
                    null,                               // anchor
                    true,                               // closeBox
                    null                                // closeBoxCallback
                ));

                // Now loop over each item in the `services` object, generating the GetFeatureInfo request for it
                for (urlsrs in services) {
                    var firstResultsYet = 0;
                    (function () {
                        var service = services[urlsrs],
                            //NOTE: the correct coords to use in the request are (e.xy.y,e.xy.y), which are NOT the same as (e.x,e.y).
                            //      I'm not sure what the difference is, but (e.xy.y,e.xy.y) seems to be what GetFeatureInfo needs.
                            requestUrl = createWMSGetFeatureInfoRequestURL(service.url, service.layers, service.srs, e.xy.x, e.xy.y);
                        $.ajax({
                            url: requestUrl,
                            dataType: "text",
                            success: function (response) {
                                var $gml = $($.parseXML(response)),
                                    $identify_results = $("#identify_results");
                                // For each layer that this request was for, parse the GML for the results
                                // for that layer, and populate the corresponding result in the popup
                                // created above.
                                if (firstResultsYet < 1) {
                                    $identify_results.empty(); //first clear out orginal
                                    firstResultsYet = firstResultsYet + 1;
                                }
                                var layerIDCount     = 0,
                                    newTableContents = '',
                                    lastURL          = '';
                                $.each(service.layers, function () {
                                    // jdm: Check to see if we are using ArcGIS
                                    // if so handle the xml that comes back differently
                                    // on a related note ArcGIS WMS Raster layers do not support
                                    // GetFeatureInfo
                                    if (seldon.gisServerType == "ArcGIS") {
                                        var result = getLayerResultsFromArcXML($gml, this);
                                    } else { //assuming MapServer at this point
                                        var result = getLayerResultsFromGML($gml, this);
                                    }
                                    //jdm: with this list back from getLayerResultsFromGML
                                    //loop through and build up new table structure
                                    newTableContents = (''
                                                        + '<tr>'
                                                        +       '<td><b>'+service.layers[layerIDCount]+'</b></td>'
                                                        +   '<td>&nbsp</td>'
                                                        + '</tr>'
                                                        );
                                    $identify_results.append(newTableContents);
                                    var i;
                                    for (i = 1; i < result.length; ++i) {
                                        newTableContents = (''
                                                            + '<tr>'
                                                            +   '<td align="right">'+String(result[i][0]).replace("_0","")+':&nbsp&nbsp</td>'
                                                            +   '<td>'+result[i][1]+'</td>'
                                                            + '</tr>'
                                                            );
                                        $identify_results.append(newTableContents);
                                    }
                                    layerIDCount++;
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                alert(textStatus);
                            }
                        });
                    }());
                }
                //jdm: last thing make the popup bigger
                //this doesn't work for some reason
                //app.map.popups[0].updateSize(new OpenLayers.Size(500, 500));
            }
        );
    }

    function stringStartsWith (string, prefix) {
        return (string.substring(0, prefix.length) === prefix);
    }

    function getLayerResultsFromArcXML ($xml, layerName) {
        var returnVals = [];
        try {
            var fields     = $xml.find( "FIELDS" ),
                attributes = fields[0].attributes,
                i;
            for (i = 0; i < attributes.length; ++i) {
                returnVals[i] = [attributes[i].name, attributes[i].value];
            }
        } catch(err){
            returnVals[0] = ["Error description:", err.message];
        }
        return returnVals;
    }

    function getLayerResultsFromGML ($gml, layerName) {
        var children = $gml.find(layerName + '_feature').first().children(),
            returnVals = [],
            i;

        // Scan the children of the first <layerName_feature> element, looking for the first
        // child which is an element whose name is something other than `gml:boundedBy`; take
        // the text content of that child as the result for this layer.
        for (i = 0; i < children.length; ++i) {
            if (children[i].nodeName !== 'gml:boundedBy') {
                // jdm: IE doesn't have textContent on children[i], but Chrome and FireFox do
                var value = (children[i].textContent) ? children[i].textContent : children[i].text;
                if ((stringStartsWith(layerName,"EFETAC-NASA") || stringStartsWith(layerName,"RSAC-FHTET")) &&
                    (children[i].nodeName === "value_0")) {
                    value = value + sprintf(" (%.2f %%)", parseFloat(value,10) * 200.0 / 255.0 - 100);
                }
                returnVals[i] = [children[i].nodeName, value];
            }
        }
        return returnVals;
        //return undefined;
    }

    var lastPopup;
	var popCount=0;

    function createMultigraphTool () {
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

                popCount=popCount+1;

                var popup = $(document.createElement('div'));
                popup.id = "#seldonMultigraphMessageDiv"+popCount+"";
                popup.html('<div id="seldonMultigraphMessage'+popCount+'"><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></div><div id="seldonMultigraph'+popCount+'" style="width: 600px; height: 300px;"></div>');
                popup.dialog({
                    width     : 600,
                    resizable : false,
                    title     : Mustache.render('MODIS NDVI for Lat: {{{lat}}} Lon: {{{lon}}}',
                                                {
                                                    lat : sprintf("%.4f", lonlat.lat),
                                                    lon : sprintf("%.4f", lonlat.lon)
                                                }
                    )
                });

                var seldonMultigraph = window.multigraph.jQuery('#seldonMultigraph'+popCount+''),
                    promise = seldonMultigraph.multigraph({
                        //NOTE: coords.lon and coords.lat on the next line are really x,y coords in EPSG:900913, not lon/lat:
                        'mugl'   : "http://rain.nemac.org/timeseries/tsmugl_product.cgi?args=CONUS_NDVI,"+coords.lon+","+coords.lat,
                        'swf'    :  "libs/seldon/libs/Multigraph.swf"
                    });
                seldonMultigraph.multigraph('done', function () {
                    var multigraphMessage = $('#seldonMultigraphMessage'+popCount+'');
                    multigraphMessage.empty();
                    multigraphMessage.text();
                });
            });
    }

    function stringContainsChar (string, c) {
        return (string.indexOf(c) >= 0);
    }

    function arrayContainsElement (array, element) {
        var i;
        if (array === undefined) {
            return false;
        }
        for (i = 0; i < array.length; ++i) {
            if (array[i] === element) {
                return true;
            }
        }
        return false;
    }


    // Accepts an array of strings, and returns a JavaScript object containing a property corresponding
    // to each element in the array; the value of each property is 'true'.
    function arrayToBooleanHash (a) {
        var h = {}, i;
        for (i = 0; i < a.length; ++i) {
            h[a[i]] = true;
        }
        return h;
    }

    function parseExtent (extent) {
        var vals   = extent.split(','),
            bounds = new OpenLayers.Bounds(parseFloat(vals[0]), parseFloat(vals[1]), parseFloat(vals[2]), parseFloat(vals[3]));
        return bounds;
    }

    function extentsAreEqual (e1, e2) {
        var tolerance = 0.001;
        return ((Math.abs(e1.left - e2.left)        <= tolerance)
                && (Math.abs(e1.bottom - e2.bottom) <= tolerance)
                && (Math.abs(e1.right  - e2.right)  <= tolerance)
                && (Math.abs(e1.top    - e2.top)    <= tolerance));
    }
    
    // count everything
    function getCounts (arr) {
        var i = arr.length, // var to loop over
            obj = {}; // obj to store results
        while (i) {
            obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
        }
        return obj;
    }

    // get specific from everything
    function getCount (word, arr) {
        return getCounts(arr)[word] || 0;
    }

    //
    // exports, for testing:
    //
    seldon.BaseLayer                         = BaseLayer;
    seldon.AccordionGroup                    = AccordionGroup;
    seldon.AccordionGroupSublist             = AccordionGroupSublist;
    seldon.Layer                             = Layer;
    seldon.Theme                             = Theme;
    seldon.createWMSGetFeatureInfoRequestURL = createWMSGetFeatureInfoRequestURL;
    seldon.stringContainsChar                = stringContainsChar;
    seldon.ShareUrlInfo                      = ShareUrlInfo;
    window.seldon                            = seldon;
	
}(jQuery));
