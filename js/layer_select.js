module.exports = function ($, app) {
    var Layer = require("./layer.js")($, app);
    var getActiveDropdownBoxRadioLID = require("./layer_get_dropdown_lid.js");

    function createLayerToggleDropdownBox (lastLayerInGroup, selectBoxLayers, selectBoxGroupName) {
        var selectBox = document.createElement("select"), $selectBox;
        var options = [];
        var i, x, option;

        selectBox.setAttribute("id", selectBoxGroupName);

        // Loop through selectBoxLayers adding to options accordingly
        for (i = 0; i < selectBoxLayers.length; i++) {
            options.push(selectBoxLayers[i].name);
        }

        // Loop through options adding to the selectBox
        for (x in options) {
            if (options.hasOwnProperty(x)) {
                selectBox.insertAdjacentHTML("afterbegin", "<option value='" + x + "'>" + options[x] + "</option>");
            }
        }

        // add one blank one at the top
        selectBox.insertAdjacentHTML("afterbegin", "<option value='-1' selected>select...</option>");

        // Change event listener
        $(selectBox).change(selectHandler);

        return selectBox;
    }

    function selectHandler () {
        var $selectedOption = $(app.dropdownBoxList[0]).find(":selected");
        if ($selectedOption.text() === "select...") {
            clearRadioLayers(app, wanted_lid);
            return;
        }

        var selectLayer = app.dropdownBoxLayers[$selectedOption.val()];
        var wanted_lid = getActiveDropdownBoxRadioLID(app);
        var wanted_layer = undefined;
        var i;

        for (i = 0; i < app.radioButtonList.length; i++) {
            if (app.radioButtonList[i].checked) {
                wanted_layer = parseInt(selectLayer.layers, 10) + parseInt(app.radioButtonLayers[i].layers, 10);
            }
        }

        var checkBoxLayer = new Layer({
            lid      : wanted_lid,
            visible  : selectLayer.visible,
            url      : selectLayer.url,
            srs      : selectLayer.srs,
            layers   : wanted_layer,
            identify : selectLayer.identify,
            name     : wanted_lid,
            mask     : selectLayer.mask,
            legend   : selectLayer.legend,
            index    : selectLayer.index
        });
        checkBoxLayer.activate();

        // Clear out any previously active layers, not needed any more
        clearRadioLayers(app, wanted_lid);
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

    return createLayerToggleDropdownBox;
}
