function zoomToExtent (extent, save) {
    if (save === undefined) {
        save = true;
    }
    var bounds = new OpenLayers.Bounds(extent.left, extent.bottom, extent.right, extent.top);
    this.map.zoomToExtent(bounds, true);
    if (save) {
        this.saveCurrentExtent();
    }
}

module.exports = zoomToExtent;
