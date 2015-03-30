function Mask (maskName) {
    window.EventEmitter.call(this);
    this.maskName = maskName;
    this.maskLayers = [];
}

module.exports = Mask;
