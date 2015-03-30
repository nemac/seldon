function extentsAreEqual (e1, e2) {
    var tolerance = 0.001;
    return ((Math.abs(e1.left - e2.left)        <= tolerance)
            && (Math.abs(e1.bottom - e2.bottom) <= tolerance)
            && (Math.abs(e1.right  - e2.right)  <= tolerance)
            && (Math.abs(e1.top    - e2.top)    <= tolerance));
}

module.exports = extentsAreEqual;
