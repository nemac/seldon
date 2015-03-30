// The code contained in this file does not seem to be used anywhere. Should
// be deleted once this is verified with jdm.

// Accepts an array of strings, and returns a JavaScript object containing a property corresponding
// to each element in the array; the value of each property is 'true'.
function arrayToBooleanHash (a) {
    var h = {}, i;
    for (i = 0; i < a.length; ++i) {
        h[a[i]] = true;
    }
    return h;
}

function parseExtent (extent) {
    var vals   = extent.split(','),
        bounds = new OpenLayers.Bounds(parseFloat(vals[0]), parseFloat(vals[1]), parseFloat(vals[2]), parseFloat(vals[3]));
    return bounds;
}

// count everything
function getCounts (arr) {
    var i = arr.length, // var to loop over
        obj = {}; // obj to store results
    while (i) {
        obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
    }
    return obj;
}

// get specific from everything
function getCount (word, arr) {
    return getCounts(arr)[word] || 0;
}

function removeFromArrayByVal(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
