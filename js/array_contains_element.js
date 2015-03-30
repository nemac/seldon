function arrayContainsElement (array, element) {
    var i;
    if (array === undefined) {
        return false;
    }
    for (i = 0; i < array.length; ++i) {
        if (array[i] === element) {
            return true;
        }
    }
    return false;
}

module.exports = arrayContainsElement;
