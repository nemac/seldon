module.exports = function ($) {
    var RepeatingOperation = require("./repeating_operation.js");
    var ShareUrlInfo = require("./share.js");
    var createLayerToggleCheckbox = require("./layer_checkbox.js")($);
    var createLayerPropertiesIcon = require("./layer_icon.js")($);
    var arrayContainsElement = require("./array_contains_element.js");

    function setTheme (theme, options) {
        var createLayerToggleDropdownBox = require("./layer_select.js")($, this);
        var createLayerToggleRadioButton = require("./layer_radio.js")($, this);

        var app = this,
            $layerPickerAccordion = $("#layerPickerAccordion"),
            flag,
            accordionGroup,
            labelElem,
            brElem,
            textElem,
            maskLabelElem,
            maskTextElem,
            activeMaskLayers = [];

        //jdm 1/3/14: set the default forest mask
        //TODO: There should be a more eloquent way to handle default mask
        if ($.isEmptyObject(options) && (app.masks.length==0)) {
            for (var dm = 0; dm < app.defaultMasks.length; dm++) {
                //console.log("setMaskByMask at line 247");
                app.setMaskByMask(true, app.defaultMasks[dm]);
            }
        }

        //jdm (11/1/13): fix for changing themes and accounting for active layers
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
                for (var j=0; j<lids.length; j++) {
                    if (lids[j] == currLayer.seldonLayer.lid) {
                        options.layers.push(currLayer.seldonLayer);
                    }
                }
            }
        }

        if ($layerPickerAccordion.length === 0) {
            flag = true;
            $layerPickerAccordion = $(document.createElement("div"))
                .attr("id", "layerPickerAccordion")
                .addClass("layerAccordionClass")
                .css("height", "400px");
        }

        //Clear our previous accordion on theme change
        if ($layerPickerAccordion.data('listAccordion')) {
            // $layerPickerAccordion.listAccordion('clearSections');
            app.clearAccordionSections($layerPickerAccordion);
        }

        //Initialize listAccordion
        $layerPickerAccordion.accordion({
            heightStyle : 'content',
            change      : function (event, ui) {
                var accordionGroupIndex = $layerPickerAccordion.accordion('option', 'active');
                app.setAccordionGroup(theme.accordionGroups[accordionGroupIndex]);
            }
        });
        if ( ! $layerPickerAccordion.data('listAccordion') ) {
            $layerPickerAccordion.data('listAccordion', {
                accordionOptions     : options,
                sections             : []
            });
            $layerPickerAccordion.accordion('option', 'active');
        }

        //jdm: re-wrote loop using traditional for loops (more vintage-IE friendly)
        //vintage-IE does work with jquery each loops, but seems to be slower
        // for (var a = 0, b = theme.accordionGroups.length; a < b; a++) {
        var a = 0;
        var defaultAccordionGroup = undefined;
        var ro1 = new RepeatingOperation(function () {
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
            var g = app.addAccordionSection($layerPickerAccordion, accGp.label);
            var selectBoxLayers = [];
            var sublistItems = [];
            for (var i = 0, j = accGp.sublists.length; i < j; i++) {
                var sublist = accGp.sublists[i];
                var sublistObj = {
                    heading : sublist.label,
                    items : [],
                    contentElement : $('<div><h4>' + sublist.label + '</h4></div>')
                };
                g.sublists.push(sublistObj);
                sublistItems.push(sublistObj.contentElement);
                var sublistLayerItems = [];
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
                    brElem = document.createElement("br");
                    textElem = document.createTextNode(layer.name);
                    labelElem.setAttribute("for", "chk" + layer.lid);
                    labelElem.appendChild(textElem);

                    //jdm 5/28/13: if there is a mask for this layer then we will provide a status
                    //as to when that mask is active
                    var $testForMask = layer.mask;
                    var radioButton;
                    var dropdownBox;
                    if ($testForMask) {
                        maskLabelElem = document.createElement("label");
                        maskTextElem = document.createTextNode(""); //empty until active, if active then put (m)
                        maskLabelElem.setAttribute("id", "mask-status" + layer.lid);
                        maskLabelElem.appendChild(maskTextElem);
                        sublistLayerItems.push([createLayerToggleCheckbox(layer),
                                                labelElem,
                                                createLayerPropertiesIcon(layer),
                                                maskLabelElem,brElem]);
                    } else { //no mask for this layer (most will be of this type outside of FCAV)
                        // add the layer to the accordion group
                        if (sublist.type=="radiobutton") { //radio button type
                            sublistLayerItems.push([radioButton=createLayerToggleRadioButton(layer, sublist.label.replace(/\s+/g, '')),
                                                    labelElem,
                                                    createLayerPropertiesIcon(layer),brElem]);
                            app.radioButtonList.push(radioButton);
                            app.radioButtonLayers.push(layer);
                        } else if (sublist.type=="dropdownbox") { //dropdownbox type
                            // Using sublist.layers.length build up array of layer information to pass to 
                            // the dropdownbox such that only one call to createLayerToggleDropdownBox.
                            // Assumption #1: A dropdownbox is always preceded in the config file by a 
                            // radiobutton and therefore the dropdownbox needs to know about its corresponding radiobutton group
                            if (((selectBoxLayers.length+1)<sublist.layers.length) || (selectBoxLayers.length == undefined)){
                                selectBoxLayers.push(layer);
                                app.dropdownBoxLayers.push(layer);
                            } else {
                                selectBoxLayers.push(layer);
                                sublistLayerItems.push([dropdownBox=createLayerToggleDropdownBox(layer, selectBoxLayers, sublist.label.replace(/\s+/g, ''))]);
                                app.dropdownBoxList.push(dropdownBox);
                                app.dropdownBoxLayers.push(layer);
                            }
                        } else { // assume checkbox type
                            sublistLayerItems.push([createLayerToggleCheckbox(layer),
                                                    labelElem,
                                                    createLayerPropertiesIcon(layer),brElem]);
                        }
                    }

                    // Decide whether to activate the layer.  If we received a layer list in the
                    // options arg, active the layer only if it appears in that list.  If we
                    // received no layer list in the options arg, activate the layer if the layer's
                    // "selected" attribute was true in the config file.
                    if (((options.layers !== undefined) &&
                         (arrayContainsElement(options.layers, layer))) ||
                        ((options.layers === undefined) &&
                         layer.selectedInConfig) && (sublist.type!="radiobutton")) {
                        //console.log("activate at line 449");
                        layer.activate();
                    }
                    //we shouldn't have to re-activate an active layer on theme change
                    //But, rather just verify that it is checked as such
                    if (lids !== undefined) {
                        for (var m = 0; m < lids.length; m++) {
                            if ($("#chk"+lids[m])[0] !== undefined) {
                                $("#chk"+lids[m])[0].checked = true;
                            }
                        }
                    }
                } // end loop for sublist.layers
                app.addAccordionSublistItems(sublistObj, sublistLayerItems);
            } // end loop for accGp.sublists
            app.addAccordionSublists(g, sublistItems);
            if (++a < theme.accordionGroups.length) {
                ro1.step();
            } else {
                //jdm 10/21/14: If the accordionGroup is not currently set,
                //go ahead and assign it to the current accordion group
                if (accordionGroup === undefined) {
                    accordionGroup = accGp.gid
                }
                defaultAccordionGroup = accordionGroup;
                setThemeContinue(app, theme, options, accordionGroup);
            }
        }, 5);
        ro1.step();
        // } //end loop for theme.accordionGroups

        $layerPickerAccordion.accordion("refresh");
        // if page doesn't have layerPickerAccordion, insert it
        if (flag === true) {
            $("#layerPickerDialog").append($layerPickerAccordion);
        }

        return defaultAccordionGroup;
    };


    function setThemeContinue (app, theme, options, accordionGroup) {
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
                //console.log("setMaskByMask at line 239");
                app.setMaskByMask(true, "MaskFor"+options.shareUrlMasks[m]);
            }
        }

        //if zoom parameter on theme to to that extent
        if (theme.zoom) {
            var zoomExtent = {
                left : theme.xmin,
                bottom : theme.ymin,
                right : theme.xmax,
                top : theme.ymax };
            app.zoomToExtent(zoomExtent);
        }

        if (!accordionGroup) {
            // if we get to this point and don't have an accordion group to open,
            // default to the first one
            accordionGroup = theme.accordionGroups[0];
        }

        for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
            $('#mask-status'+ app.maskParentLayers[mp].lid).text("(m)");
            $("#chk"+app.maskParentLayers[mp].lid).prop('checked', true);
        }

    }

    return setTheme;
}
