module.exports = function ($, app) {
    function printMap ($configXML) {
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

        // Note: in what follows, we use default values for the print configuration so that
        // in viewer installations which do not configure <tool name="Print"> with details,
        // we fall back on the previous seldon print behavior, which was hardcoded to work
        // for FCAV.
        var service_url = $configXML.find("tools tool[name=Print]").attr("service_url");
        if (!service_url) {
            service_url = 'http://'+window.location.hostname+window.location.pathname; // default
        }
        service_url = service_url.replace(/\/$/, "");
        var service_name = $configXML.find("tools tool[name=Print]").attr("service_name");
        if (!service_name) {
            service_name = 'cgi-bin/print.cgi'; // default
        }
        var title = $configXML.find("tools tool[name=Print]").attr("title");
        if (!title) {
            title = "U.S Forest Change Assessment Viewer"; // default
        }
        // NOTE: use $.ajax() here rather than OpenLayers.Request.POST(), because OpenLayers.Request.POST()
        // seems to act poorly when dealing with cross-domain requests (specifically, it omits passing
        // the `data` object in that case!).  mbp Tue May 26 17:38:32 2015
        $.ajax({
            url: service_url + "/" + service_name,
            type: "POST",
            data: OpenLayers.Util.getParameterString({width:size.w,height:size.h,tiles:tiles_json,legends:legends_json,title:title}),
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            success: function(data,status,jqxhr) {
                data = data.replace(/\s+/, ""); // remove all whitespace from data string; what's left is the rel URL of the image
                var href = service_url + "/cgi-bin/printed_map.jpg";
                if (data) {
                    href = service_url + "/" + data; // default
                }
                $("#printMapLoader").html('<center><a href="' + href + '" style="color:blue" target="_new">print image result</a></center>');
                printPopup.dialog('option', 'title', 'Print Image Created!');
            },
            error:  function(jqxhr,status,err) {
                $("#printMapLoader").html('<center>An error happended.</center>');
                printPopup.dialog('option', 'title', 'NO Print Image Created!');
            }
        });

    }

    return printMap;
};
