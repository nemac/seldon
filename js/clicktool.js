// The following creates a new OpenLayers tool class called ClickTool
// which calls a function whenever the user clicks in the map.  Each
// instance of ClickTool corresponds to a specific callback function.
// To create an instance of ClickTool:
//
//   tool = new ClickTool(function (e) {
//       // this is the click callback function
//   });
//
var ClickTool = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single'          : true,
        'double'          : false,
        'pixelTolerance'  : 0,
        'stopSingle'      : false,
        'stopDouble'      : false
    },

    initialize: function (clickHandler) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
        );
        this.displayClass = 'ClickTool';
        this.handler = new OpenLayers.Handler.Click(
            this, {
                'click': clickHandler
            }, this.handlerOptions
        );
    }
});

module.exports = ClickTool;
