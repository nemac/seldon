module.exports = function ($, app) {
    var Layer = require('./layer.js')($, app);
    var getActiveDropdownBoxRadioLID = require("./layer_get_dropdown_lid.js");

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
        checkbox.onchange = radioHandler;
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

    function radioHandler () {
        // Loop through other radio buttons and deactivate those layers accordingly.
        $('input:radio').each(function () {
            if ($(this).is(':checked')) {
                var $selectedOption = $(app.dropdownBoxList[0]).find(":selected");
                if ($selectedOption.text() === "select...") {
                    clearRadioLayers(app, null);
                    return;
                }

                var selectLayer = app.dropdownBoxLayers[$selectedOption.val()];
                var wanted_lid = getActiveDropdownBoxRadioLID(app);
                var i;

               for (i = 0; i < app.radioButtonList.length; i++) {
                    if (app.radioButtonList[i].checked) {
                        wanted_layer = parseInt(selectLayer.layers, 10) + parseInt(app.radioButtonLayers[i].layers, 10);
                    }
                }

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
            } else {
                clearRadioLayers(app, getActiveDropdownBoxRadioLID(app));
            }
        });
    }

    function clearRadioLayers(app, wanted_lid) {
        var currLayer, testLid;
        var i, j, k;
        for (i = app.map.getNumLayers() - 1; i > 0; i--) {
            currLayer = app.map.layers[i].seldonLayer;
            // Outer loop radio buttons
            for (j = 0; j < app.radioButtonLayers.length; j++) {
                // Inner loop drop-down list
                for (k = 0; k < app.dropdownBoxLayers.length; k++) {
                    testLid = app.radioButtonLayers[j].lid + app.dropdownBoxLayers[k].lid;
                    if (currLayer.lid === testLid && wanted_lid !== testLid)
                        currLayer.deactivate();
                }
            }
        }
    }

    return createLayerToggleRadioButton;
}
