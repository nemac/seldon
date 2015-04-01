module.exports = function ($) {
    function addMaskToLegend (layer) {
        var app = this;

        var maskName = layer.lid.substring(layer.lid.indexOf("MaskFor"), layer.lid.length);
        //clear out old legend graphic if necessary
        $("#lgd" + maskName).remove();
        layer.$legendItem = $(document.createElement("div")).attr("id", "lgd" + maskName)
            .prepend($(document.createElement("img")).attr("src", layer.legend))
            .prependTo($('#legend'))
            .click(function () {
                app.setMaskByMask(false, maskName);
            });
    }

    return addMaskToLegend
}

