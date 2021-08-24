module.exports = function ($) {
    var createArcGIS93RestParams = require("./create_arcgis_rest_params.js")($);
    var AccordionGroup           = require("./accordion_group.js");
    var AccordionGroupSublist    = require("./accordion_group_sublist.js");
    var BaseLayer                = require("./baselayer.js");
    var Theme                    = require("./theme.js");

    function parseConfig (configXML, shareUrlInfo) {
        var Layer = require("./layer.js")($, this);
        var createIdentifyTool = require("./identify.js")($, this);
        var createMultigraphTool = require("./multigraph.js")($, this);
        var marker = require("./marker.js")($, this);

        var app = this,
            $configXML = $(configXML),
            initialBaseLayer,
            initialTheme,
            shareUrlLayerAlpha = {},
            themeOptions = {},
            i, j, k,
            l, ll, lll;

        if (shareUrlInfo !== undefined) {
            for (i = 0, l = shareUrlInfo.layerLids.length; i < l; i++) {
                shareUrlLayerAlpha[shareUrlInfo.layerLids[i]] = shareUrlInfo.layerAlphas[i];
            }
        }

        // parse and store max map extent from config file
        var $extent = $configXML.find("extent");
        if ($extent && $extent.length > 0) {
            app.maxExtent = {
                left   : parseFloat($extent.attr('xmin')),
                bottom : parseFloat($extent.attr('ymin')),
                right  : parseFloat($extent.attr('xmax')),
                top    : parseFloat($extent.attr('ymax'))
            };
        }

        // parse base layers and populate combo box
        var $baseCombo = $("#baseCombo"),
            $images = $configXML.find("images image"),
            $image,
            selected,
            baseLayer;

        for (i = 0, l = $images.length; i < l; i++) {
            $image = $($images[i]);
            selected  = $image.attr('selected');
            baseLayer = new BaseLayer({
                name     : $image.attr('name'),
                label    : $image.attr('label'),
                url      : $image.attr('url'),
                index    : i,
                layer: $image.attr('layers'),
                type: $image.attr('type'),
                style: $image.attr('style'),
                tileMatrixSet: $image.attr('tileMatrixSet'),
                numZoomLevels: $image.attr('numZoomLevels')
            });
            app.baseLayers.push(baseLayer);
            $baseCombo.append($(document.createElement("option")).attr("value", i).text(baseLayer.label));
            if ((shareUrlInfo && shareUrlInfo.baseLayerName === baseLayer.name) ||
                (!shareUrlInfo  && selected)) {
                initialBaseLayer = baseLayer;
            }
        }

        if (initialBaseLayer === undefined) {
            initialBaseLayer = app.baseLayers[0];
        }

        // parse layer groups and layers
        var $wmsGroups = $configXML.find("wmsGroup"),
            $wmsGroup,
            $wmsSubgroups,
            $wmsSubgroup,
            $wmsLayers,
            $wmsLayer,
            accordionGroupsByName = {},
            accordionGroup,
            sublist,
            layer,
            index = 0;

        for (i = 0, l = $wmsGroups.length; i < l; i++) {
            $wmsGroup = $($wmsGroups[i]); // each <wmsGroup> corresponds to a (potential) layerPicker accordion group
            accordionGroup = new AccordionGroup({
                gid              : $wmsGroup.attr('gid'),
                name             : $wmsGroup.attr('name'),
                label            : $wmsGroup.attr('label'),
                //selectedInConfig : ($wmsGroup.attr('selected') === "true")
            });
            app.accordionGroups.push(accordionGroup);
            accordionGroupsByName[accordionGroup.name] = accordionGroup;
            if (shareUrlInfo && (shareUrlInfo.accordionGroupGid === accordionGroup.gid)) {
                themeOptions.accordionGroup = accordionGroup;
            }
            $wmsSubgroups = $wmsGroup.find("wmsSubgroup");
            for (j = 0, ll = $wmsSubgroups.length; j < ll; j++) {
                $wmsSubgroup = $($wmsSubgroups[j]); // each <wmsSubgroup> corresponds to one 'sublist' in the accordion group
                sublist = new AccordionGroupSublist(
                    $.extend({}, {
                        sid   : $wmsSubgroup.attr('sid'),
                        label : $wmsSubgroup.attr('label'),
                        type  : $wmsSubgroup.attr('type'),
                        info : ($wmsSubgroup.attr('info') ? $wmsSubgroup.attr('info') : undefined),
                        collapsible : ($wmsSubgroup.attr('collapsible') === "true"),
                        break : ($wmsSubgroup.attr('break') === "true")
                    })
                );

                accordionGroup.sublists.push(sublist);
                $wmsLayers = $wmsSubgroup.find("wmsLayer,restLayer,wmtsLayer,xyzLayer");
                for (k = 0, lll = $wmsLayers.length; k < lll; k++) {
                    $wmsLayer = $($wmsLayers[k]);
                    if ($wmsLayer[0].tagName === "wmtsLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "WMTS",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                srs              : $wmsLayer.attr('srs'),
                                layers           : $wmsLayer.attr('layers'),
                                styles           : $wmsLayer.attr('styles'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                attribution      : $wmsLayer.attr('attribution'),
                                format           : $wmsLayer.attr('format'),
                                numZoomLevels    : $wmsLayer.attr('numZoomLevels'),
                                info      : ($wmsLayer.attr('info') ? $wmsLayer.attr('info') : undefined),                               
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined)
                            })
                        )
                    }
                    else if ($wmsLayer[0].tagName === "wmsLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "WMS",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                srs              : $wmsLayer.attr('srs'),
                                layers           : $wmsLayer.attr('layers'),
                                styles           : $wmsLayer.attr('styles'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                proxyServerType  : ($wmsLayer.attr('proxyServerType')) ? $wmsLayer.attr('proxyServerType') : undefined,
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                info      : ($wmsLayer.attr('info') ? $wmsLayer.attr('info') : undefined),
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined),
                                maxResolution    : $wmsLayer.attr('maxResolution') ? $wmsLayer.attr('maxResolution') : undefined
                            })
                        );
                    }
                    else if ($wmsLayer[0].tagName === "xyzLayer") {
                        layer = new Layer(
                            $.extend({}, {
                                type             : "XYZ",
                                name             : $wmsLayer.attr('name'),
                                lid              : $wmsLayer.attr('lid'),
                                visible          : $wmsLayer.attr('visible'),
                                url              : $wmsLayer.attr('url'),
                                identify         : $wmsLayer.attr('identify'),
                                legend           : $wmsLayer.attr('legend'),
                                mask             : $wmsLayer.attr('mask'),
                                selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                                info      : ($wmsLayer.attr('info') ? $wmsLayer.attr('info') : undefined),
                                break            : ($wmsLayer.attr('break') == "true" ? true : undefined),
                            })
                        );

                    } else {
                        layer = new Layer({
                            type             : "ArcGIS93Rest",
                            name             : $wmsLayer.attr('name'),
                            lid              : $wmsLayer.attr('lid'),
                            visible          : $wmsLayer.attr('visible'),
                            url              : $wmsLayer.attr('url'),
                            identify         : $wmsLayer.attr('identify'),
                            legend           : $wmsLayer.attr('legend'),
                            selectedInConfig : ($wmsLayer.attr('selected') === "true"),
                            params           : createArcGIS93RestParams($wmsLayer),
                            info      : ($wmsLayer.attr('info') ? $wmsLayer.attr('info') : undefined),
                            break            : ($wmsLayer.attr('break') == "true" ? true : undefined)
                        })
                    }
                    layer.index = index;
                    sublist.layers.push(layer);
                    if (shareUrlInfo && (shareUrlLayerAlpha[layer.lid] !== undefined)) {
                        if (themeOptions.layers === undefined) {
                            themeOptions.layers = [];
                        }
                        layerInThemeOptionsLayers = themeOptions.layers.filter(function (optionLayer) {
                            return layer.lid === optionLayer.lid
                        }).length
                        if (!layerInThemeOptionsLayers) {
                            layer.selectedInConfig = true
                            themeOptions.layers.push(layer);
                            layer.setTransparency(100 * (1-shareUrlLayerAlpha[layer.lid]));
                        }
                    }
                    index = index + 1;
                }
            }
        }

        //jdm: add to list of mask for checking later in this function
        //put the mask from the share url onto the themeOptions for later processing
        //within the setTheme() function
        if (shareUrlInfo !== undefined) {
            if (themeOptions.shareUrlMasks === undefined) {
                themeOptions.shareUrlMasks = [];
            }
            for (i = 0, l = shareUrlInfo.layerMask.length; i < l; i++) {
                themeOptions.shareUrlMasks[i]=shareUrlInfo.layerMask[i];
            }
            if (themeOptions.maskModifiers === undefined) {
                themeOptions.maskModifiers = [];
            }
            for (i = 0, l = shareUrlInfo.maskModifiers.length; i < l; i++) {
                themeOptions.maskModifiers.push(shareUrlInfo.maskModifiers[i]);
            }
        }

        // parse themes
        var $themeCombo = $("#themeCombo"),
            $views      = $configXML.find("mapviews view"),
            $view,
            $viewGroups,
            $viewGroup,
            theme,
            name;
        for (i = 0, l = $views.length; i < l; i++) {
            $view = $($views[i]);
            theme = new Theme({
                name  : $view.attr('name'),
                label : $view.attr('label'),
                zoom  : $view.attr('zoom'),
                xmin  : $view.attr('xmin'),
                ymin  : $view.attr('ymin'),
                xmax  : $view.attr('xmax'),
                ymax  : $view.attr('ymax'),
                index : i
            });
            app.themes.push(theme);
            $themeCombo.append($(document.createElement("option")).attr("value", i).text(theme.label));
            $viewGroups = $view.find("viewGroup");
            for (j = 0, ll = $viewGroups.length; j < ll; j++) {
                $viewGroup     = $($viewGroups[j]);
                name           = $viewGroup.attr('name');
                accordionGroup = accordionGroupsByName[name];
                if (accordionGroup) {
                    accordionGroup.selectedInConfig = $viewGroup.attr('selected') === 'true';
                    theme.accordionGroups.push(accordionGroup);
                } else {
                    displayError("Unknown accordion group name '" + name + "' found in theme '" + theme.name + "'");
                }
            }
            if ((  shareUrlInfo  &&   (shareUrlInfo.themeName === theme.name)) ||
                ( !shareUrlInfo  &&   ($view.attr('selected')                    ))) {
                initialTheme = theme;
            }
        }

        if (initialTheme === undefined) {
            initialTheme = app.themes[0];
        }

        // also need to address from share url:
        //    layers, alphas
        //    extent
        //    accgp

        app.zoomInTool     = new OpenLayers.Control.ZoomBox();
        app.zoomOutTool    = new OpenLayers.Control.ZoomBox({out:true});
        app.dragPanTool    = new OpenLayers.Control.DragPan();
        app.identifyTool   = createIdentifyTool();
        app.multigraphTool = createMultigraphTool($configXML);
        app.markerTool = marker();

        var initialExtent;

        if (shareUrlInfo) {
            initialExtent = shareUrlInfo.extent;
        }

        // Hardcoded service information here for faster loading
        // Now assuming street maps is always init base layer
        // comes from: initialBaseLayer.url + '?f=json&pretty=true'
        var baseLayerInfo = {"currentVersion":10.01,"serviceDescription":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including our terms of use, visit us \u003ca href=\"http://goto.arcgisonline.com/maps/World_Street_Map \" target=\"_new\"\u003eonline\u003c/a\u003e.","mapName":"Layers","info":"This worldwide street map presents highway-level data for the world. Street-level data includes the United States; much of Canada; Japan; most countries in Europe; Australia and New Zealand; India; parts of South America including Argentina, Brazil, Chile, Colombia, and Venezuela; and parts of southern Africa including Botswana, Lesotho, Namibia, South Africa, and Swaziland.\nThis comprehensive street map includes highways, major roads, minor roads, one-way arrow indicators, railways, water features, administrative boundaries, cities, parks, and landmarks, overlaid on shaded relief imagery for added context. The map also includes building footprints for selected areas in the United States and Europe. Coverage is provided down to ~1:4k with ~1:1k and ~1:2k data available in select urban areas.\nThe street map was developed by Esri using Esri basemap data, DeLorme basemap layers, U.S. Geological Survey (USGS) elevation data, Intact Forest Landscape (IFL) data for the world; NAVTEQ data for Europe, Australia and New Zealand, India, North America, South America (Argentina, Brazil, Chile, Colombia, and Venezuela), and parts of southern Africa (Botswana, Lesotho, Namibia, South Africa, and Swaziland).\n\nFor more information on this map, including the terms of use, visit us online at http://goto.arcgisonline.com/maps/World_Street_Map","copyrightText":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012","layers":[{"id":0,"name":"World Street Map","parentLayerId":-1,"defaultVisibility":true,"subLayerIds":null,"minScale":0,"maxScale":0}],"tables":[],"spatialReference":{"wkid":102100},"singleFusedMapCache":true,"tileInfo":{"rows":256,"cols":256,"dpi":96,"format":"JPEG","compressionQuality":90,"origin":{"x":-20037508.342787,"y":20037508.342787},"spatialReference":{"wkid":102100},"lods":[{"level":0,"resolution":156543.033928,"scale":591657527.591555},{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},{"level":3,"resolution":19567.8792409999,"scale":73957190.948944},{"level":4,"resolution":9783.93962049996,"scale":36978595.474472},{"level":5,"resolution":4891.96981024998,"scale":18489297.737236},{"level":6,"resolution":2445.98490512499,"scale":9244648.868618},{"level":7,"resolution":1222.99245256249,"scale":4622324.434309},{"level":8,"resolution":611.49622628138,"scale":2311162.217155},{"level":9,"resolution":305.748113140558,"scale":1155581.108577},{"level":10,"resolution":152.874056570411,"scale":577790.554289},{"level":11,"resolution":76.4370282850732,"scale":288895.277144},{"level":12,"resolution":38.2185141425366,"scale":144447.638572},{"level":13,"resolution":19.1092570712683,"scale":72223.819286},{"level":14,"resolution":9.55462853563415,"scale":36111.909643},{"level":15,"resolution":4.77731426794937,"scale":18055.954822},{"level":16,"resolution":2.38865713397468,"scale":9027.977411},{"level":17,"resolution":1.19432856685505,"scale":4513.988705},{"level":18,"resolution":0.597164283559817,"scale":2256.994353},{"level":19,"resolution":0.298582141647617,"scale":1128.497176}]},"initialExtent":{"xmin":-28872328.0888923,"ymin":-11237732.4896886,"xmax":28872328.0888923,"ymax":11237732.4896886,"spatialReference":{"wkid":102100}},"fullExtent":{"xmin":-20037507.0671618,"ymin":-19971868.8804086,"xmax":20037507.0671618,"ymax":19971868.8804086,"spatialReference":{"wkid":102100}},"units":"esriMeters","supportedImageFormatTypes":"PNG24,PNG,JPG,DIB,TIFF,EMF,PS,PDF,GIF,SVG,SVGZ,AI,BMP","documentInfo":{"Title":"World Street Map","Author":"Esri","Comments":"","Subject":"streets, highways, major roads, railways, water features, administrative boundaries, cities, parks, protected areas, landmarks ","Category":"transportation(Transportation Networks) ","Keywords":"World, Global, Europe, Japan, Hong Kong, North America, United States, Canada, Mexico, Southern Africa, Asia, South America, Australia, New Zealand, India, Argentina, Brazil, Chile, Venezuela, Andorra, Austria, Belgium, Czech Republic, Denmark, France, Germany, Great Britain, Greece, Hungary, Ireland, Italy, Luxembourg, Netherlands, Norway, Poland, Portugal, San Marino, Slovakia, Spain, Sweden, Switzerland, Russia, Thailand, Turkey, 2012","Credits":"Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"},"capabilities":"Map"};
        app.initOpenLayers(baseLayerInfo, initialBaseLayer, initialTheme, themeOptions, initialExtent);

        return $configXML;
    }

    function displayError (message) {
        //console.log(message);
    }

    return parseConfig;
}
