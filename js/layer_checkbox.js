module.exports = function ($) {
    function createLayerToggleCheckbox (layer) {
        // create the checkbox
        var checkbox = document.createElement("input"),
            $checkbox;
        checkbox.type = "checkbox";
        checkbox.id = "chk" + layer.lid;
        checkbox.onclick = function () {
            if ($(this).is(':checked')) {
                layer.activate();
            } else {
                layer.deactivate({ removeFromLegend: true, removeFromParentMaskLayers: true });
            }
        };
        $checkbox = $(checkbox);
        $checkbox.addClass(layer.lid)
        // listen for activate/deactivate events from the layer, and update the checkbox accordingly
        layer.addListener("activate", function () {
            $('input.'+this.lid).attr('checked', true);
        });
        layer.addListener("deactivate", function () {
            $('input.'+this.lid).attr('checked', false);
        });
        // return the new checkbox DOM element
        return checkbox;
    }

    return createLayerToggleCheckbox;
}
