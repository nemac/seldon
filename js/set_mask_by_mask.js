module.exports = function ($) {
    var Mask = require("./mask.js");

    // jdm: 11/27-12/5/14 - re-wrote to use Mask object, doing things in a more
    //      object oriented fashion!
    function setMaskByMask (toggle, maskName) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        var maskParentLayers = app.maskParentLayers;
        var maskParentLayer, maskLayer;
        var i;
        var maskId = "#" + maskName.replace("MaskFor", "");

        if (toggle) {
            if ($(maskId).attr('data-mask-grouper')) {
                $('.mask-toggle[data-mask-parent="'+maskName+'"]').attr('disabled', true);
            }

            var seldonLayer;

            var mask = new Mask(maskName);
            app.masks.push(mask);

            // Loop through app.map.layers making sure that
            // app.maskParentLayers is correct
            for (i = 0; i < app.map.layers.length; i++) {
                seldonLayer = app.map.layers[i].seldonLayer;
                if (seldonLayer && seldonLayer.mask === "true" && app.count(maskParentLayers, seldonLayer) === 0) {
                    app.maskParentLayers.push(seldonLayer);
                    seldonLayer.visible = "true";
                }
            }

            for (i = 0; i < maskParentLayers.length; i++) {
                maskParentLayer = maskParentLayers[i];
                maskLayer = new Layer({
                    lid         : maskParentLayer.lid + maskName.replace("/",""),
                    visible     : "true",
                    url         : maskParentLayer.url,
                    srs         : maskParentLayer.srs,
                    layers      : maskParentLayer.layers + maskName.replace("/",""),
                    identify    : maskParentLayer.identify,
                    name        : maskParentLayer.lid + maskName.replace("/",""),
                    mask        : "false",
                    legend      : maskParentLayer.legend,
                    index       : maskParentLayer.index,
                    parentLayer : maskParentLayer
                });
                maskLayer.activate();
		maskLayer.setTransparency(maskParentLayer.transparency);
                mask.maskLayers.push(maskLayer);
                if (maskParentLayer.visible === "true") {
                    maskParentLayer.deactivate();
                    maskParentLayer.visible = "false";
                }
                $("#" + maskName.replace("MaskFor", "")).get(0).checked = true;
                $('#mask-status' + maskParentLayer.lid).text("(m)");
                $("#chk" + maskParentLayer.lid).prop('checked', true);
            }
        } //end if (toggle)
        else { //we have just turned off a mask
            if ($(maskId).attr('data-mask-grouper')) {
                $('.mask-toggle[data-mask-parent="'+maskName+'"]').attr('disabled', false);
            }

            // Loop through app.masks and find maskName
            // When you find it, deactivate all of its maskLayers
            // Keep track of the number of mask in app.masks
            for (var m = 0; m < app.masks.length; m++) {
                if (app.masks[m].maskName == maskName) {
                    for (var ml = 0; ml < app.masks[m].maskLayers.length; ml++) {
                        app.masks[m].maskLayers[ml].deactivate();
                    }
                    //Remove the mask from app.masks that you just cleared out
                    app.masks.remove(app.masks[m]);
                    $("#"+maskName.replace("MaskFor","")).get(0).checked = false;
                    $(document.getElementById("lgd" + maskName)).remove();
                }
            }
            // If it was the only mask in app.Mask (e.g. app.masks.length ==0) to begin with
            // Then loop through app.maskParentLayers and activate those layer
            // Remove those layers from app.maskParentLayers that you just activated
            if (app.masks.length == 0) {
                var layersToRemove = [];
                for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                    app.maskParentLayers[mp].activate();
                    app.maskParentLayers[mp].visible = "true";
                    layersToRemove.push(app.maskParentLayers[mp]);
                }
                for (var l = 0; l < layersToRemove.length; l++) {
                    app.maskParentLayers.remove(layersToRemove[l]);
                    $('#mask-status'+ layersToRemove[l].lid).text("");
                }
            }
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByMask()

    return setMaskByMask;
}
