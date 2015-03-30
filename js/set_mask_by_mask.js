module.exports = function ($) {
    var Mask = require("./mask.js");

    // jdm: 11/27-12/5/14 - re-wrote to use Mask object, doing things in a more
    //      object oriented fashion!
    function setMaskByMask (toggle, maskName) {
        var Layer = require("./layer.js")($, this);

        var app = this;

        if (toggle) {
            //if ForestOnly grey out the sub-forest types
            if (maskName == "MaskForForest") {
                $("#ConiferForest").attr("disabled", true);
                $("#DeciduousForest").attr("disabled", true);
                $("#MixedForest").attr("disabled", true);
            }

            var mask = new Mask(maskName);
            app.masks.push(mask);

            // Loop through app.map.layers making sure that
            // app.maskParentLayers is correct
            for (var l = 0; l < app.map.layers.length; l++) {
                if (app.map.layers[l].seldonLayer) {
                    if (app.map.layers[l].seldonLayer.mask=="true") {
                        if (app.count(app.maskParentLayers,app.map.layers[l].seldonLayer)==0) {
                            app.maskParentLayers.push(app.map.layers[l].seldonLayer);
                            app.map.layers[l].seldonLayer.visible="true";
                        }
                    }
                }
            }

            for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                //console.log("creating maskLayer for "+ app.maskParentLayers[mp].name);
                var maskLayer = new Layer({
                    lid              : app.maskParentLayers[mp].lid+maskName.replace("/",""),
                    visible          : 'true',
                    url              : app.maskParentLayers[mp].url,
                    srs              : app.maskParentLayers[mp].srs,
                    layers           : app.maskParentLayers[mp].layers+maskName.replace("/",""),
                    identify         : app.maskParentLayers[mp].identify,
                    name             : app.maskParentLayers[mp].lid+maskName.replace("/",""),
                    mask             : 'false',
                    legend           : app.maskParentLayers[mp].legend,
                    index            : app.maskParentLayers[mp].index
                });
                maskLayer.parentLayer = app.maskParentLayers[mp];
                maskLayer.activate();
                mask.maskLayers.push(maskLayer);
                if (app.maskParentLayers[mp].visible=="true") {
                    app.maskParentLayers[mp].deactivate();
                    app.maskParentLayers[mp].visible=="false";
                }
                $("#"+maskName.replace("MaskFor","")).get(0).checked = true;
                $('#mask-status'+ app.maskParentLayers[mp].lid).text("(m)");
                $("#chk"+app.maskParentLayers[mp].lid).prop('checked', true);
            }
        } //end if (toggle)
        else { //we have just turned off a mask
            //if ForestOnly grey out the sub-forest types
            if (maskName=="MaskForForest") {
                $( "#ConiferForest" ).attr("disabled", false);
                $( "#DeciduousForest" ).attr("disabled", false);
                $( "#MixedForest" ).attr("disabled", false);
            }
            // Loop through app.masks and find maskName
            // When you find it, deactivate all of its maskLayers
            // Keep track of the number of mask in app.masks
            for (var m = 0; m < app.masks.length; m++) {
                if (app.masks[m].maskName==maskName) {
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
            if (app.masks.length==0) {
                var layersToRemove = [];
                for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                    app.maskParentLayers[mp].activate();
                    app.maskParentLayers[mp].visible="true";
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
