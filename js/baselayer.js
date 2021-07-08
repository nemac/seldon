function BaseLayer (settings) {
    if (!settings) { return; }
    this.name  = settings.name;
    this.label = settings.label;
    this.url   = settings.url;
    this.index = settings.index;
    this.type  = settings.type;
    this.style = settings.style;
    this.layer = settings.layer,
    this.tileMatrixSet = settings.tileMatrixSet;
    this.numZoomLevels = settings.numZoomLevels;
}

module.exports = BaseLayer;
