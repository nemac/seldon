module.exports = function ($) {
    function setMaskByLayer (toggle, parentLayer) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        if (toggle) {
            app.maskParentLayers.push(parentLayer);
            for (var m = 0; m < app.masks.length; m++) {
                var maskLayer = new Layer({
                    lid              : parentLayer.lid+app.masks[m].maskName.replace("/",""),
                    visible          : 'true',
                    url              : parentLayer.url,
                    srs              : parentLayer.srs,
                    layers           : parentLayer.layers+app.masks[m].maskName.replace("/",""),
                    identify         : parentLayer.identify,
                    name             : parentLayer.lid+app.masks[m].maskName.replace("/",""),
                    mask             : 'false',
                    legend           : parentLayer.legend,
                    index            : parentLayer.index
                });
                maskLayer.parentLayer = parentLayer;
                maskLayer.activate();
                app.masks[m].maskLayers.push(maskLayer);
                if (parentLayer.visible=="true") {
                    parentLayer.deactivate();
                    parentLayer.visible="false";
                }
                $("#"+app.masks[m].maskName.replace("MaskFor","")).get(0).checked = true;
                $('#mask-status'+ parentLayer.lid).text("(m)");
                $("#chk"+parentLayer.lid).prop('checked', true);
            }
        } else {
            //deactivate and remove from mask.maskLayers[]
            for (var m = 0; m < app.masks.length; m++) {
                var currentMask = app.masks[m];
                var maskLayersToDelete = [];
                for (var ml = 0; ml < app.masks[m].maskLayers.length; ml++) {
                    var currentMaskLayer = app.masks[m].maskLayers[ml];
                    if (currentMaskLayer.parentLayer.lid == parentLayer.lid) {
                        currentMaskLayer.deactivate();
                        $('#mask-status'+ currentMaskLayer.parentLayer.lid).text("")
                        maskLayersToDelete.push(currentMaskLayer);
                    }
                }
                for (var mld = 0; mld < maskLayersToDelete.length; mld++) {
                    currentMask.maskLayers.remove(maskLayersToDelete[mld]);
                }
            }
            //remove from maskParentLayers and activate parentLayer
            app.maskParentLayers.remove(parentLayer);
            if (parentLayer.visible == "false") {
                parentLayer.visible = "true";
            } else {
                parentLayer.visible == "true";
                parentLayer.deactivate();
            }
            $('#mask-status'+ parentLayer.lid).text("");
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByLayer()

    return setMaskByLayer;
}
