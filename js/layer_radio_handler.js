module.exports = function ($, app) {
    var Layer = require('./layer.js')($, app);

    function radioHandler (app) {
        var $selectedOption = $(app.dropdownBoxList[0]).find(":selected");
        if ($selectedOption.text() === "select...") {
            clearRadioLayers(app, null);
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

    function clearRadioLayers (app, wanted_lid) {
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

    function getActiveDropdownBoxRadioLID (app) {
        var selectLayer = app.dropdownBoxLayers[$(app.dropdownBoxList[0]).find(":selected").val()];
        var i;

        if (selectLayer) {
            var wanted_lid = selectLayer.lid;
        } else {
            return null;
        }

        for (i = 0; i < app.radioButtonList.length; i++) {
            if (app.radioButtonList[i].checked) {
                wanted_lid = app.radioButtonLayers[i].lid + wanted_lid;
                break;
            }
        }
        return wanted_lid;
    }

    return radioHandler;
}
