function handleMaskModifier(name, index) {
    var app = this;
    var seldonLayer;
    var i;

    app.maskModifiers[index] = name;

    for (i = 0; i < app.map.layers.length; i++) {
        seldonLayer = app.map.layers[i].seldonLayer;
        if (seldonLayer && ("mask" in seldonLayer)) {
            seldonLayer.openLayersLayer.params.LAYERS = seldonLayer.layers + app.maskModifiers.join('');
            seldonLayer.openLayersLayer.redraw(true);
        }
    }

    for (i = 0; i < app.maskParentLayers.length; i++) {
        seldonLayer = app.maskParentLayers[i];
        if (seldonLayer && ("mask" in seldonLayer)) {
            seldonLayer.openLayersLayer.params.LAYERS = seldonLayer.layers + app.maskModifiers.join('');
            seldonLayer.openLayersLayer.redraw(true);
        }
    }
}

module.exports = handleMaskModifier;
