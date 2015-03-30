module.exports = function (app) {
    var ShareUrlInfo = require('./share.js');

    function init (config, projection, gisServerType, useProxyScript) {

        //jdm: override of js remove function
        //This is very useful for removing items from array by value
        //See: http://michalbe.blogspot.com/2010/04/removing-item-with-given-value-from.html
        Array.prototype.remove = function(value) {
            if (this.indexOf(value)!==-1) {
               this.splice(this.indexOf(value), 1);
               return true;
           } else {
              return false;
           };
        }

        // jrf: Overrides OpenLayers.Map.getCurrentSize since by default it does not
        //      account for padding, and seldon requires padding on the top and bottom
        //      for its layout.
        OpenLayers.Map.prototype.getCurrentSize = function () {
            var size = new OpenLayers.Size(this.div.clientWidth,
                                           this.div.clientHeight);

            if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
                size.w = this.div.offsetWidth;
                size.h = this.div.offsetHeight;
            }
            if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
                size.w = parseInt(this.div.style.width, 10);
                size.h = parseInt(this.div.style.height, 10);
            }

            // getCurrentSize now accounts for padding
            size.h = size.h - parseInt($(this.div).css("padding-top"), 10) - parseInt($(this.div).css("padding-bottom"), 10);

            return size;
        };

        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.launch(config, shareUrlInfo);
        seldon.app = app;
        seldon.projection = projection;
        seldon.gisServerType = gisServerType;
        seldon.useProxyScript = useProxyScript;
    }

    return init;
}
