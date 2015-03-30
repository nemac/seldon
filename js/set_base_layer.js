module.exports = function ($) {
    function setBaseLayer (baseLayer) {
        var app = this;
        if (baseLayer.name.indexOf("Google") > -1) {
            var layer = new OpenLayers.Layer.Google("Google Streets");
            app.map.removeLayer(app.map.layers[0]);
            app.currentBaseLayer = baseLayer;
            app.map.addLayers([layer]);
            app.map.setLayerIndex(layer, 0);
            app.emit("baselayerchange");
        } else { //assuming esri base layer at this point
            $.ajax({
                url: baseLayer.url + '?f=json&pretty=true',
                dataType: "jsonp",
                success:  function (layerInfo) {
                    var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
                        layerInfo: layerInfo
                    });
                    app.map.removeLayer(app.map.layers[0]);
                    app.currentBaseLayer = baseLayer;
                    app.map.addLayers([layer]);
                    app.map.setLayerIndex(layer, 0);
                    app.emit("baselayerchange");
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert(textStatus);
                }
            });
        }
    }

    return setBaseLayer;
}

