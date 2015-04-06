module.exports = function ($, app) {
    var generalRadioHandler = require("./layer_radio_handler.js")($, app);

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
        $checkbox = $(checkbox);

        $checkbox.change(radioHandler);

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
        generalRadioHandler(app);
    }

    return createLayerToggleRadioButton;
}
