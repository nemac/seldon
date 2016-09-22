function initOpenLayers (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
    var app = this;

    if (baseLayer.name.indexOf("Google") > -1) {
        var layer = new OpenLayers.Layer.Google("Google Streets", {numZoomLevels: 20});
    } else { //assume arcgis
        var layer = new OpenLayers.Layer.ArcGISCache("AGSCache", baseLayer.url, {
            layerInfo: baseLayerInfo
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
        moveDelay: 1000,
        zoomDelay: 1000
    });

    app.map = new OpenLayers.Map('map', {
        maxExtent:         maxExtentBounds,
        units:             'm',
        resolutions:       layer.resolutions,
        numZoomLevels:     layer.numZoomLevels,
        tileSize:          layer.tileSize,
        tileManager:       app.tileManager,
        controls: [
            new OpenLayers.Control.Navigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
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
        zoom: 1,
        projection: new OpenLayers.Projection(seldon.projection)
    });

    // set the base layer, but bypass setBaseLayer() here, because that function initiates an ajax request
    // to fetch the layerInfo, which in this case we already have
    app.currentBaseLayer = baseLayer;
    app.emit("baselayerchange");
    app.map.addControl(new OpenLayers.Control.ScaleLine({bottomOutUnits: 'mi'}));
    app.map.addLayers([layer]);
    app.map.setLayerIndex(layer, 0);
    app.setAccordionGroup(app.setTheme(theme, themeOptions));
    app.zoomToExtent(initialExtent);
    app.map.events.register("mousemove", app.map, function (e) {
        var pixel = app.map.events.getMousePosition(e);
        var lonlat = app.map.getLonLatFromPixel(pixel);
        lonlat = lonlat.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
        OpenLayers.Util.getElement("latLonTracker").innerHTML = "Lat: " + sprintf("%.5f", lonlat.lat) + " Lon: " + sprintf("%.5f", lonlat.lon) + "";
    });
    app.map.addControl(new OpenLayers.Control.PanZoomBar());
}

module.exports = initOpenLayers;
