function initOpenLayers (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
    var app = this;
    if (baseLayer.type == 'Google') {
        var layer = new OpenLayers.Layer.Google("Google Streets", {numZoomLevels: 20});
    } else if (baseLayer.type == 'WMTS')  {
        var settings = {
            isBaseLayer: true,
            name: baseLayer.name,
            style: baseLayer.style,
            url: baseLayer.url,
            layer: baseLayer.name,
            matrixSet: baseLayer.tileMatrixSet,
        }
        if (baseLayer.numZoomLevels) {
            var serverResolutions = resolutions.slice(0, baseLayer.numZoomLevels)
            settings.resolutions = resolutions
            settings.serverResolutions = serverResolutions
        }
        var layer = new OpenLayers.Layer.WMTS(settings)
    } else if (baseLayer.type == 'ArcGISCache') {
        var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
            layerInfo: baseLayerInfo,
        });
    }

    var maxExtentBounds;
    if (theme.xmax && theme.xmin && theme.ymax && theme.ymin) {
    maxExtentBounds = new OpenLayers.Bounds(
        theme.xmin,
        theme.ymin,
        theme.xmax,
        theme.ymax
    );
    } else {
    maxExtentBounds = new OpenLayers.Bounds(
            app.maxExtent.left,
            app.maxExtent.bottom,
            app.maxExtent.right,
            app.maxExtent.top
    );
    }

    if (initialExtent === undefined) {
        //take the extent coming from the config file
        initialExtent = app.maxExtent;
    }

    app.tileManager = new OpenLayers.TileManager({
        cacheSize: 12,
        moveDelay: 750,
        zoomDelay: 750
    });

    app.map = new OpenLayers.Map('map', {
        units:             'm',
        tileManager:       app.tileManager,
        center: [-10986902.689297,4856468.480035],
        controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.Attribution(),
            app.zoomInTool,
            app.zoomOutTool,
            app.identifyTool,
            app.multigraphTool,
            app.markerTool
        ],
        eventListeners:
        {
            "moveend": function () { app.emit("extentchange"); },
            "zoomend": function () { app.emit("extentchange"); }
        },
        projection: new OpenLayers.Projection(seldon.projection)
    });

    // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
    // to fetch the layerInfo, which in this case we already have
    app.currentBaseLayer = baseLayer;
    app.emit("baselayerchange");
    app.map.addControl(new OpenLayers.Control.ScaleLine({bottomOutUnits: 'mi'}));
    app.map.addLayers([layer]);
    app.map.setLayerIndex(layer, 0);
    app.setTheme(theme, themeOptions);

    var defaultZoom = 5
    app.map.setCenter(app.map.getCenter(), defaultZoom)

    app.saveCurrentExtent()
    app.map.events.register("mousemove", app.map, function (e) {
        var pixel = app.map.events.getMousePosition(e);
        var lonlat = app.map.getLonLatFromPixel(pixel);
        lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:3857"), new OpenLayers.Projection("EPSG:4326"));
        OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
    });
    app.map.addControl(new OpenLayers.Control.PanZoomBar());
}

module.exports = initOpenLayers;
