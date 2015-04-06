module.exports = function ($, app) {
    var radioHandler = require("./layer_radio_handler.js")($, app);

    function createLayerToggleDropdownBox (lastLayerInGroup, selectBoxLayers, selectBoxGroupName) {
        var selectBox = document.createElement("select"), $selectBox;
        var i;

        selectBox.setAttribute("id", selectBoxGroupName);

        // Loop through selectBoxLayers adding to options accordingly
        for (i = 0; i < selectBoxLayers.length; i++) {
            selectBox.insertAdjacentHTML("afterbegin", "<option value='" + i + "'>" + selectBoxLayers[i].name + "</option>");
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
