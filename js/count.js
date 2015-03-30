function count (array, value) {
    var counter = 0,
        i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === value) counter++;
    }
    return counter;
}

module.exports = count;
