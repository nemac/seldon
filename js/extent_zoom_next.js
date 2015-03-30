function zoomToNextExtent () {
    if (this.currentSavedExtentIndex < this.savedExtents.length-1) {
        ++this.currentSavedExtentIndex;
        this.zoomToExtent(this.savedExtents[this.currentSavedExtentIndex], false);
    }
}

module.exports = zoomToNextExtent;
