var extentsAreEqual = require("./extents_equal.js");

// save the current extent into the savedExtents array, if it is different from
// the "current" one.  It is important to only save it if it differs from the
// current one, because sometimes OpenLayers fires multiple events when the extent
// changes, causing this function to be called multiple times with the same
// extent
function saveCurrentExtent () {
    var newExtent = formatExtent(this.map.getExtent()),
        newSavedExtents = [],
        currentSavedExtent,
        i;

    if (this.currentSavedExtentIndex >= 0) {
        currentSavedExtent = this.savedExtents[this.currentSavedExtentIndex];
        if (extentsAreEqual(currentSavedExtent, newExtent)) {
            return;
        }
    }

    // chop off the list after the current position
    for (i = 0; i <= this.currentSavedExtentIndex; ++i) {
        newSavedExtents.push(this.savedExtents[i]);
    }
    this.savedExtents = newSavedExtents;

    // append current extent to the list
    this.savedExtents.push(newExtent);
    ++this.currentSavedExtentIndex;
}

function formatExtent (extent) {
    return { left : extent.left, bottom : extent.bottom, right : extent.right, top : extent.top };
}

module.exports = saveCurrentExtent;
