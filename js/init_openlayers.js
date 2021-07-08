function initOpenLayers (baseLayerInfo, baseLayer, theme, themeOptions, initialExtent) {
    var app = this;
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
            sphericalMercator: true,
            resolutions: resolutions
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
        maxExtent:         maxExtentBounds,
        units:             'm',
        resolutions:       layer.resolutions,
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

    var defaultZoom = 4
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
