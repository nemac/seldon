module.exports = function ($, app) {
    function printMap () {
        // go through all layers, and collect a list of objects
        // each object is a tile's URL and the tile's pixel location relative to the viewport
        var offsetX = parseInt(app.map.layerContainerDiv.style.left, 10);
        var offsetY = parseInt(app.map.layerContainerDiv.style.top, 10);
        var size  = app.map.getSize();
        var tiles = [];
        var layer, tile, position;
        var i, j, k;

        for (i = 0; i < app.map.layers.length; ++i) {
            // if the layer isn't visible at this range, or is turned off, skip it
            try {
                layer = app.map.layers[i];
                if (!layer.getVisibility()) continue;
                if (!layer.calculateInRange()) continue;
                // iterate through their grid's tiles, collecting each tile's extent and pixel location at this moment
                // for (var tilerow in layer.grid) {
                for (j = 0; j < layer.grid.length; ++j) {
                    for (k = 0; k < layer.grid[j].length; ++k) {
                        tile     = layer.grid[j][k];
                        position = tile.position;
                        tiles.push({
                            url     : layer.getURL(tile.bounds),
                            x       : position.x + offsetX,
                            y       : position.y + offsetY,
                            opacity : layer.opacity ? parseInt(100*layer.opacity, 10) : 100
                        });
                    }
                }
            } //end try
            catch(err) {
                alert(err.message);
            }
        }

        //the legend url's to pass along
        var layerLegendsURLs = [];
        $('#legend').find('div').each(function () {
            var innerDivImgSrc = $(this).children('img').attr('src');
            layerLegendsURLs.push({ url: innerDivImgSrc });
        });

        // hand off the list to our server-side script, which will do the heavy lifting
        var tiles_json = JSON.stringify(tiles);
        var legends_json = JSON.stringify(layerLegendsURLs);
        var printPopup = $(document.createElement('div'));
        printPopup.id = "printPopupDiv";
        printPopup.html('<div id="printMapLoader"><center><img class="ajax-loader-image" src="icons/ajax-loader.gif"/></center></div>');
        printPopup.dialog({
            resizable : false,
            height    : 75,
            title     : 'Creating Image for Print...',
            close     : function (event, ui) {
                $(this).remove();
            }
        });

        OpenLayers.Request.POST({
            url: 'http://'+window.location.hostname+window.location.pathname+'cgi-bin/print.cgi',
            data: OpenLayers.Util.getParameterString({width:size.w,height:size.h,tiles:tiles_json,legends:legends_json}),
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            callback: function(request) {
                $("#printMapLoader").html('<center><a href="http://'+window.location.hostname+window.location.pathname+'cgi-bin/printed_map.jpg" style="color:blue" target="_new">print image result</a></center>');
                printPopup.dialog('option', 'title', 'Print Image Created!');
            }
        });
    }

    return printMap;
};
