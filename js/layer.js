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
        this.openLayersLayer = undefined;
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

            if (this.type === "ArcGIS93Rest") {
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
                var layer = this.layers + (("mask" in this) ? app.maskModifiers.join("") : "");

                this.openLayersLayer = new OpenLayers.Layer.WMS(
                    this.name,
                    this.url,
                    {
                        projection  : new OpenLayers.Projection(seldon.projection),
                        units       : "m",
                        layers      : layer,
                        maxExtent   : new OpenLayers.Bounds(app.maxExtent),
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
            app.map.addLayer(this.createOpenLayersLayer());
            // Only add legend for parent layers
            this.addToLegend();

            this.emit("activate");
            this.visible = "true";
            if ((this.mask === "true") && (this.lid.indexOf("MaskFor") === -1)) {
                if (app.masks.length > 0) {
                    app.setMaskByLayer(true, this);
                }
            }

            //View order rules:
            //1. Vector layers (vlayers) always on top
            //2. otherwise things go by seldon layer index.
            if (app.map.getNumLayers() > 1) {
                var lyrJustAdded = app.map.layers[app.map.getNumLayers() - 1];
                if (lyrJustAdded.url && lyrJustAdded.url.indexOf("vlayers") === -1) {
                    for (var i = app.map.getNumLayers() - 2; i > 0; i--) {
                        var nextLayerDown = app.map.layers[i];
                        if (nextLayerDown.url && nextLayerDown.url.indexOf("vlayers") === -1) {
                            if (nextLayerDown.seldonLayer.index < lyrJustAdded.seldonLayer.index) {
                                app.map.setLayerIndex(lyrJustAdded, i);
                            }
                        } else {
                            app.map.setLayerIndex(nextLayerDown, app.map.layers.length-1);
                        }
                    }
                } else {
                    app.map.setLayerIndex(lyrJustAdded, app.map.layers.length-1);
                }
            }
            app.updateShareMapUrl();
            app.map.updateSize();
        };

        this.deactivate = function (options) {
            options = options || {}
            if (this.openLayersLayer) {
                if (this.visible === "true") {
                    app.map.removeLayer(this.openLayersLayer);
                    this.visible = "false";
                } else { //we are dealing with a inactive parent layer to mask
                    app.setMaskByLayer(false, this);
                }

                if (options.removeFromLegend) {
                    this.removeFromLegend()
                }

                if (this.openLayersLayer.loadingimage) {
                    this.openLayersLayer.loadingimage.removeClass("loading");
                }
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
                    if (that.parentLayer) that.parentLayer.deactivate();
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
