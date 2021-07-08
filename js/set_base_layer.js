module.exports = function ($) {
    function setBaseLayer (baseLayer) {
        // Resolutions for GoogleMapsCompatible Well-Known Scale Set
        // See Table E.4 in Appendix E of WMTS Spec (https://portal.ogc.org/files/?artifact_id=35326)
        var resolutions = [
            156543.03390625,    // 0
            78271.516953125,    // 1
            39135.7584765625,   // 2
            19567.87923828125,  // 3
            9783.939619140625,  // 4
            4891.9698095703125, // 5
            2445.9849047851562, // 6
            1222.9924523925781, // 7
            611.4962261962891,  // 8
            305.74811309814453, // 9
            152.87405654907226, // 10
            76.43702827453613,  // l1
            38.218514137268066, // 12
            19.109257068634033, // 13
            9.554628534317017,  // 14
            4.777314267158508,  // 15
            2.388657133579254,  // 16
            1.194328566789627,  // 17
            0.5971642833948135  // 18
        ]
        var app = this;
        if (baseLayer.type == 'Google') {
            var layer = new OpenLayers.Layer.Google("Google Streets");
            handleBaseLayer(app, layer, baseLayer);
        }
        else if (baseLayer.type == 'ArcGISCache') { //assuming esri base layer at this point
            $.ajax({
                url: baseLayer.url + '?f=json&pretty=true',
                dataType: "jsonp",
                success:  function (layerInfo) {
                    var options = { layerInfo: layerInfo }
                    if (baseLayer.numZoomLevels) {
                        options.numZoomLevels = baseLayer.numZoomLevels
                        if (baseLayer.numZoomLevels) {
                            var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
                            options.serverResolutions = serverResolutions
                            options.resolutions = resolutions
                        }

                    }
                    var layer = new OpenLayers.Layer.ArcGISCache(baseLayer.name, baseLayer.url, options)
                    handleBaseLayer(app, layer, baseLayer);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
        }
        else if (baseLayer.type == 'WMTS') {
            var settings = {
                isBaseLayer: true,
                name: baseLayer.name,
                style: baseLayer.style,
                url: baseLayer.url,
                layer: baseLayer.name,
                matrixSet: baseLayer.tileMatrixSet,
                sphericalMercator: true
            }
            if (baseLayer.numZoomLevels) {
                var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
                settings.resolutions = resolutions
                settings.serverResolutions = serverResolutions
            }
            var layer = new OpenLayers.Layer.WMTS(settings)
            handleBaseLayer(app, layer, baseLayer)
        }
    }

    function handleBaseLayer (app, layer, baseLayer) {
        app.map.removeLayer(app.map.layers[0]);
        app.currentBaseLayer = baseLayer;
        app.map.addLayers([layer]);
        app.map.setLayerIndex(layer, 0);
        app.emit("baselayerchange");
    }

    return setBaseLayer;
}

