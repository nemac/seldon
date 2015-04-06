module.exports = function ($) {
    function setBaseLayer (baseLayer) {
        var app = this;
        if (baseLayer.name.indexOf("Google") > -1) {
            var layer = new OpenLayers.Layer.Google("Google Streets");
            handleBaseLayer(app, layer, baseLayer);
        } else { //assuming esri base layer at this point
            $.ajax({
                url: baseLayer.url + '?f=json&pretty=true',
                dataType: "jsonp",
                success:  function (layerInfo) {
                    var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                        layerInfo: layerInfo
                    });
                    handleBaseLayer(app, layer, baseLayer);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
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

