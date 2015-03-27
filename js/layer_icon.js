module.exports = function ($) {
    var createLayerPropertiesDialog = require("./layer_dialog.js")($);

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

    return createLayerPropertiesIcon;
}
