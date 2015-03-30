function printSavedExtents () {
    // This function is for debugging only and is not normally used.  It returns an HTML
    // table showing the current savedExtents list, and the current position within the list.
    var html = "<table>";
    var len = this.savedExtents.length;
    var i, e;
    for (i = len-1; i >= 0; --i) {
        e = this.savedExtents[i];
        html += Mustache.render('<tr><td>{{{marker}}}</td><td>{{{number}}}</td>'
                                + '<td>left:{{{left}}}, bottom:{{{bottom}}}, right:{{{right}}}, top:{{{top}}}</td></tr>',
                                {
                                    marker : (i === this.currentSavedExtentIndex) ? "==&gt;" : "",
                                    number : i,
                                    left : e.left,
                                    bottom : e.bottom,
                                    right : e.right,
                                    top : e.top
                                });
    }
    html += "</table>";
    return html;
}

module.exports = printSavedExtents;
