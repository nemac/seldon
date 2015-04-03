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
                option = document.createElement("option");
                option.value = x;
                option.appendChild(document.createTextNode(options[x]));
                selectBox.appendChild(option);
            }
        }

        // add one blank one at the top
        option = document.createElement("option");
        option.value = options.length;
        option.appendChild(document.createTextNode("select..."));
        selectBox.appendChild(option);
        selectBox.selectedIndex = options.length;

        // Change event listener
        $selectBox = $(selectBox);
        $selectBox.change(function () {
            var wanted_layer = undefined;
            var wanted_lid = undefined;
            var selectLayer = undefined;
            var i, j, k;

            for (i = 0; i < app.dropdownBoxList[0].length; i++) {
                if (app.dropdownBoxList[0][i].selected) {
                    if (app.dropdownBoxList[0][i].innerHTML === "select...") {
                        alert("Please make a selection from the appropriate dropdown list");
                        break;
                    }
                    selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
                    wanted_lid = selectLayer.lid;
                }
            }

            for (i = 0; i < app.radioButtonList.length; i++) {
                if (app.radioButtonList[i].checked) {
                    wanted_layer = parseInt(selectLayer.layers) + parseInt(app.radioButtonLayers[i].layers, 10);
                    wanted_lid = app.radioButtonLayers[i].lid + wanted_lid;
                }
            }

            if (selectLayer != undefined) {
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

            //Clear out any previously active layers, not needed any more
            var currLayer, testLid;
            for (i = app.map.getNumLayers()-1; i > 0; i--) {
                currLayer = app.map.layers[i];
                //Outer loop radio buttons
                for (j = 0; j < app.radioButtonLayers.length; j++) {
                    //Inner loop drop-down list
                    for (k = 0; k < app.dropdownBoxLayers.length; k++) {
                        testLid = app.radioButtonLayers[j].lid + app.dropdownBoxLayers[k].lid;
                        if (currLayer.seldonLayer.lid === testLid && getActiveDropdownBoxRadioLID(app) !== testLid)
                            currLayer.seldonLayer.deactivate();
                    }
                }
            }
        });
        return selectBox;
    }

    return createLayerToggleDropdownBox;
}
