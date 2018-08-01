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

        $(maskId).get(0).checked = toggle;
        $("[data-mask-parent='" + maskName + "']").attr('disabled', toggle);

        if (toggle) {
            var seldonLayer;

            var mask = new Mask(maskName);
            app.masks.push(mask);
            var cleanMaskName = maskName.replace("/","");

            for (i = 0; i < maskParentLayers.length; i++) {
                maskParentLayer = maskParentLayers[i];
                maskLayer = new Layer({
                    parentLayer : maskParentLayer,
                    lid         : maskParentLayer.lid + cleanMaskName,
                    visible     : "true",
                    url         : maskParentLayer.url,
                    srs         : maskParentLayer.srs,
                    layers      : maskParentLayer.layers + cleanMaskName,
                    identify    : maskParentLayer.identify,
                    name        : maskParentLayer.lid + cleanMaskName,
                    mask        : "false",
                    legend      : maskParentLayer.legend,
                    index       : maskParentLayer.index,
                    parentLayer : maskParentLayer,
                    description : (maskParentLayer.description ? maskParentLayer.description : undefined)
                });


                if (maskParentLayer.visible === "true") {
                    maskParentLayer.deactivate();
                    maskParentLayer.visible = "false";
                }
                
                maskLayer.activate();
                maskLayer.setTransparency(maskParentLayer.transparency);
                mask.maskLayers.push(maskLayer);

                $('#mask-status' + maskParentLayer.lid).text("(m)");
                $("#chk" + maskParentLayer.lid).prop('checked', true);
            }
        } //end if (toggle)
        else { //we have just turned off a mask
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
                }
            }
            // If it was the only mask in app.Mask (e.g. app.masks.length ==0) to begin with
            // Then loop through app.maskParentLayers and activate those layer
            // Remove those layers from app.maskParentLayers that you just activated
            if (app.masks.length === 0) {
                for (var mp = 0; mp < app.maskParentLayers.length; mp++) {
                    app.maskParentLayers[mp].activate();
                }

            }
        }
        app.updateShareMapUrl();
    }; //end app.setMaskByMask()

    return setMaskByMask;
}
