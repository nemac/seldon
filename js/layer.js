module.exports = function ($, app) {
    var stringContainsChar = require('./stringContainsChar.js');

    function Layer (settings) {
        EventEmitter.call(this);
        if (!settings) { return; }
        $.extend(true, this, settings); // copy all properties from `settings` into `this`
        this.transparency = 0;
        if (this.index == undefined) {
            this.index = 0;
        }
        if (this.type == undefined) {
            this.type = "WMS";
        }
        this.createOpenLayersLayer = function () {
            if (this.openLayersLayer !== undefined) {
                return this.openLayersLayer;
            }

            var options = {
                isBaseLayer      : false,
                transitionEffect : 'resize',
                buffer           : 0,
                singleTile       : true,
                ratio            : 1
            };

            if (this.type === "WMTS") {
                var settings = {
                    name: this.name,
                    url: this.url,
                    layer: this.layers,
                    style: this.style,
                    matrixSet: this.srs,
                    isBaseLayer: false,
                    transitionEffect: "resize",
                    format: "image/jpg",
                    sphericalMercator: true,
                }
                if (this.lid.indexOf("GLAM") > -1) {
                    $.extend(true, settings, {
                        serverResolutions: [
                          156543.033928041,
                          78271.5169640205,
                          39135.7584820102,
                          19567.8792410051,
                          9783.9396205026,
                          4891.9698102513,
                          2445.9849051256,
                          1222.9924525628,
                          611.4962262814,
                          305.7481131407048,
                        ],
                        units: "m",
                        tileOrigin: new OpenLayers.LonLat(-20037508.34, 20037508.34)
                    })
                }
                this.openLayersLayer = new OpenLayers.Layer.WMTS(settings)

            } else if (this.type === "XYZ") {
                this.openLayersLayer = new OpenLayers.Layer.XYZ(
                    this.name,
                    this.url,
                    { isBaseLayer: false,
                      projection  : new OpenLayers.Projection(seldon.projection)
                    }
                )
            } else if (this.type === "ArcGIS93Rest") {
                this.openLayersLayer = new OpenLayers.Layer.ArcGIS93Rest(
                    this.name,
                    this.url,
                    // The following expression returns either this.params, if it has no mosaicRule property, or
                    // a copy of this.params in which the mosaicRule property has been stringified, if this
                    // mosaicRule property is present:
                    ( this.params.mosaicRule ?
                      $.extend(true, {}, this.params, { 'mosaicRule' : JSON.stringify(this.params.mosaicRule) }) :
                      this.params),
                    options
                );
            } else {
                if (this.maxResolution) {
                    options.maxResolution = parseFloat(this.maxResolution);
                }
                var layer = this.layers + (("mask" in this) ? app.maskModifiers.join("") : "");

                this.openLayersLayer = new OpenLayers.Layer.WMS(
                    this.name,
                    this.url,
                    {
                        projection  : new OpenLayers.Projection(seldon.projection),
                        units       : "m",
                        layers      : layer,
                        transparent : true
                    },
                    options
                );
            }

            var loadingimage = $('<img class="layer-loader-image ' + this.name + '" src="icons/loading.gif"/>');
            $("#map").append(loadingimage);
            this.openLayersLayer.loadingimage = loadingimage;

            this.openLayersLayer.events.register("loadstart", this.openLayersLayer, function () {
                this.loadingimage.addClass("loading");
            });
            this.openLayersLayer.events.register("loadend", this.openLayersLayer, function () {
                this.loadingimage.removeClass("loading");
            });
            this.openLayersLayer.setOpacity(1 - parseFloat(this.transparency)/100.0);
            this.openLayersLayer.seldonLayer = this;
            return this.openLayersLayer;
        };

        this.activate = function (options) {
            options = options || {}

            this.addToLegend();

            this.emit("activate");
            // Is "this" a parent layer that supports masking?
            if (this.mask === "true" && this.lid.indexOf("MaskFor") === -1) { 
                // Are any masks currently active? 
                if (app.masks.length > 0) {
                    // There's at least one mask active.
                    // Add mask layers to the map for each active mask.
                    app.setMaskByLayer(true, this);
                } else {
                    // No active masks, so add parent layer to the map.
                    this.visible = "true"
                    app.map.addLayer(this.createOpenLayersLayer());
               }
               // Add parent layer to maskParentLayers array, but only if it's not already there... (this is to avoid an infinite for loop elsewhere)
               var inMaskParentLayers = app.maskParentLayers.filter(function(layer) {
                   return this === layer;
               }, this).length;
               if (!inMaskParentLayers) {
                   app.maskParentLayers.push(this)
               }
 
            } else {
                // "this" is either a mask layer or a layer that does not support landscape masks.
                // Either way, we can just add it to the map.
                this.visible = "true";
                app.map.addLayer(this.createOpenLayersLayer())
            }

            vectorServices = [ 'vlayers', 'fire', 'ads' ]
            boundaryServices = [ 'boundaries' ]
            allVectorServices = vectorServices
            Array.prototype.push.apply(allVectorServices, boundaryServices)

            var isVectorLayer = function (layer, serviceNames) {
                return serviceNames.filter(function (serviceName) {
                    return layer.url && layer.url.indexOf(serviceName + "?") > -1
                }).length
            }

            //View order rules:
            // 1. Baselayer (always stays at index 0, so always skip here)
            // 2. Boundaries (last for loop)
            // 3. Non-boundary vector layers (second loop)
            // 4. Raster layers (ordered by seldon index)
            
            // Note: layers with a higher openlayers index draw on top of layers with a lower index
            // Layers with a lower seldonLayer index draw on top of layers with a higher seldonLayer index

            if (app.map.getNumLayers() > 1) {

                var lyrJustAdded = app.map.layers[app.map.getNumLayers() - 1]

                if (!isVectorLayer(lyrJustAdded, allVectorServices)) {

                    // Order by seldon index first (based on order the layer appears in the may layer picker)
                    for (var i = app.map.getNumLayers() - 2; i > 0; i--) {
                        var nextLayerDown = app.map.layers[i];
                        if (!isVectorLayer(nextLayerDown, allVectorServices)) {
                            if (nextLayerDown.seldonLayer.index < lyrJustAdded.seldonLayer.index) {
                                app.map.setLayerIndex(lyrJustAdded, i)
                            }
                        }

                    }

                }

                for (var i = app.map.getNumLayers() - 1; i > 0; i--) {
                    var nextLayerDown = app.map.layers[i];
                    if (isVectorLayer(nextLayerDown, vectorServices)) {
                        app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1)
                    }
                }

                for (var i = app.map.getNumLayers() - 1; i > 0; i--) {
                    var nextLayerDown = app.map.layers[i];
                    if (isVectorLayer(nextLayerDown, boundaryServices)) {
                        app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1)
                    }
                }
            }

            app.updateShareMapUrl();
            app.map.updateSize();
        };

        this.deactivate = function (options) {
            options = options || {}
            if (this.visible === "true") {
                app.map.removeLayer(this.openLayersLayer);
                this.visible = "false"
            }

            if (!this.parentLayer) {
                app.setMaskByLayer(false, this);
            }

            if (options.removeFromLegend) {
                this.removeFromLegend()

            }

            if (options.removeFromParentMaskLayers) {
                app.maskParentLayers = app.maskParentLayers.filter(function (layer) {
                    return layer.lid !== this.lid
                }, this)
            }

            if (this.openLayersLayer && this.openLayersLayer.loadingimage) {
                this.openLayersLayer.loadingimage.removeClass("loading");
            }

            this.emit("deactivate");
        };

        this.addToLegend = function () {
            var that = this;
            var $legend = $("#legend");
            //clear out old legend graphic if necessary
            var lid = this.parentLayer ? this.parentLayer.lid : this.lid
            $(document.getElementById("lgd" + lid)).remove();

            this.$legendItem = $(document.createElement("div")).attr("id", "lgd" + lid)
                .prepend($(document.createElement("img")).attr("src", this.legend))
                .click(function () {
                    that.deactivate();
                    if (that.parentLayer) {
                        that.parentLayer.deactivate({ removeFromParentMaskLayers: true });
                    }
                    that.removeFromLegend()
                });

            if (this.url.indexOf("vlayers") > -1) {
                this.$legendItem.prependTo($legend);
            } else {
                this.$legendItem.appendTo($legend);
            }
        };

        this.removeFromLegend = function () {
            if (this.$legendItem) this.$legendItem.remove();
        };

        this.setTransparency = function (transparency) {
            if (this.openLayersLayer) {
                this.openLayersLayer.setOpacity(1 - parseFloat(transparency)/100.0);
            }
            this.transparency = transparency;

            //Comment this out for now
            //Essentially emits the following two commands:
            try {
                this.emit({type : 'transparency', value : this.transparency});
            }
            catch (err) {
                var test = this.transparency;
                var errTxt = err.Message;
            }

            // Handle transparency for mask
            // Still need to make this parent-layer specific
            if (app.map !== undefined) {
                var currentLayer, openLayersLayer, lid;
                var i;
                for (i = app.map.getNumLayers()-2; i > 0; i--) {
                    currentLayer = app.map.layers[i];
                    openLayersLayer = currentLayer.seldonLayer.openLayersLayer;
                    lid = currentLayer.seldonLayer.lid;

                    if (stringContainsChar(currentLayer.name, 'Mask')) {
                        if (openLayersLayer && (lid.substring(0, lid.indexOf("MaskFor")) === this.lid)) {
                            openLayersLayer.setOpacity(1 - parseFloat(transparency)/100.0);
                            currentLayer.seldonLayer.transparency = transparency;
                        }
                    }
                }
            }
        };
    }

    window.EventEmitter.declare(Layer);

    return Layer;
}
