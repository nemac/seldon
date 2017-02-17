module.exports = function ($) {
    function setMaskByLayer (toggle, parentLayer) {
        var Layer = require("./layer.js")($, this);

        var app = this;
        var maskLayer, maskName, cleanMaskName;
        var m, ml, mld;

        if (toggle) {
            app.maskParentLayers.push(parentLayer);
            for (m = 0; m < app.masks.length; m++) {
                maskName = app.masks[m].maskName;
                cleanMaskName = maskName.replace("/","");
                maskLayer = new Layer({
                    parentLayer   : parentLayer,
                    lid         : parentLayer.lid + cleanMaskName,
                    visible     : 'true',
                    url         : parentLayer.url,
                    srs         : parentLayer.srs,
                    layers      : parentLayer.layers + cleanMaskName,
                    identify    : parentLayer.identify,
                    name        : parentLayer.lid + cleanMaskName,
                    mask        : 'false',
                    legend      : parentLayer.legend,
                    index       : parentLayer.index,
                    parentLayer : parentLayer,
                    description : (parentLayer.description ? parentLayer.description : undefined)
                });
                maskLayer.activate();

                app.masks[m].maskLayers.push(maskLayer);

                if (parentLayer.visible === "true") {
                    parentLayer.deactivate();
                    parentLayer.visible = "false";
                }

                $("#" + maskName.replace("MaskFor", "")).get(0).checked = true;
                $("#mask-status" + parentLayer.lid).text("(m)");
                $("#chk" + parentLayer.lid).prop('checked', true);
            }
        } else {
            //deactivate and remove from mask.maskLayers[]
            for (m = 0; m < app.masks.length; m++) {
                var currentMask = app.masks[m];
                var maskLayersToDelete = [];
                for (ml = 0; ml < currentMask.maskLayers.length; ml++) {
                    var currentMaskLayer = currentMask.maskLayers[ml];
                    if (currentMaskLayer.parentLayer.lid == parentLayer.lid) {
                        currentMaskLayer.deactivate({removeFromLegend: true});
                        $('#mask-status'+ currentMaskLayer.parentLayer.lid).text("")
                        maskLayersToDelete.push(currentMaskLayer);
                    }
                }
                for (mld = 0; mld < maskLayersToDelete.length; mld++) {
                    currentMask.maskLayers.remove(maskLayersToDelete[mld]);
                }
            }
            //remove from maskParentLayers and activate parentLayer
            app.maskParentLayers.remove(parentLayer);
            if (parentLayer.visible === "false") {
                parentLayer.visible = "true";
            } else {
                parentLayer.deactivate();
            }
            $('#mask-status'+ parentLayer.lid).text("");
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByLayer()

    return setMaskByLayer;
}
