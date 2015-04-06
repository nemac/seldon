module.exports = function ($, app) {
    var radioHandler = require("./layer_radio_handler.js")($, app);

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
        radioHandler(app);
    }

    return createLayerToggleDropdownBox;
}
