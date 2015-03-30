module.exports = function ($, app) {
    var Layer = require('./layer.js')($, app);

    function createLayerToggleRadioButton (layer, radioGroupName) {
        // create the radio buttons
        var checkbox = document.createElement("input"),
            $checkbox;
        checkbox.type = "radio";
        checkbox.name = radioGroupName;
        checkbox.id = layer.lid;
        if (layer.selectedInConfig) {
            checkbox.checked = true;
        }
        checkbox.onchange = function () {
            //Loop through other radio buttons and deactivate those layers accordingly.
            $('input:radio').each(function() {
                if($(this).is(':checked')) {
                    var wanted_layer = undefined;
                    var wanted_lid = undefined;
                    var selectLayer = undefined;
                    for (var i = 0; i < app.dropdownBoxList[0].length; i++) {
                        if (app.dropdownBoxList[0][i].selected) {
                            if (app.dropdownBoxList[0][i].innerHTML=="select...") {
                                alert("Please make a selection from the appropriate dropdown list");
                                break;
                            }
                            selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
                            wanted_lid = selectLayer.lid;
                        }
                    }
                    for (var i = 0; i < app.radioButtonList.length; i++) {
                        if (app.radioButtonList[i].checked) {
                            wanted_layer = parseInt(selectLayer.layers)+parseInt(app.radioButtonLayers[i].layers);
                            wanted_lid = app.radioButtonLayers[i].lid+wanted_lid;
                        }
                    }
                    if (selectLayer!=undefined) {
                        var checkBoxLayer = new Layer({
                            lid              : wanted_lid,
                            visible          : selectLayer.visible,
                            url              : selectLayer.url,
                            srs              : selectLayer.srs,
                            layers           : wanted_layer,
                            identify         : selectLayer.identify,
                            name             : wanted_lid,
                            mask             : selectLayer.mask,
                            legend           : selectLayer.legend,
                            index            : selectLayer.index
                        });
                        checkBoxLayer.activate();
                    }
                } else {
                    for (var i = app.map.getNumLayers()-1; i > 0; i--) {
                        var currLayer = app.map.layers[i];
                        //Outer loop radio buttons
                        for (var j = 0; j < app.radioButtonLayers.length; j++) {
                            //Inner loop drop-down list
                            for (var k = 0; k < app.dropdownBoxLayers.length; k++) {
                                //console.log(app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid);
                                if ((currLayer.seldonLayer.lid==app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid) &&
                                    (app.radioButtonLayers[j].lid+app.dropdownBoxLayers[k].lid!==getActiveDropdownBoxRadioLID()))
                                    currLayer.seldonLayer.deactivate();
                            }
                        }
                    }
                }
            });
        }; //End checkbox.onchange
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

    return createLayerToggleRadioButton;
}
