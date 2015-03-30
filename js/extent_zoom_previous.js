function zoomToPreviousExtent () {
    if (this.currentSavedExtentIndex > 0) {
        --this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToPreviousExtent;
