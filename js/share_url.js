module.exports = function ($) {
    var stringContainsChar = require("./stringContainsChar.js");
    var ShareUrlInfo = require("./share.js");

    function shareUrl () {
        if (!this.currentTheme) { return undefined; }
        if (!this.currentAccordionGroup) { return undefined; }
        if (!this.currentBaseLayer) { return undefined; }

        var extent      = this.map.getExtent(),
            layerLids   = [],
            layerAlphas = [],
            layerMask   = [],
            url;

        if (!extent) { return undefined; }

        $.each(this.map.layers, function () {
            var op, lid, test;
            if (! this.isBaseLayer) {
                if (this.opacity === 1) {
                    op = "1";
                } else if (this.opacity === 0) {
                    op = "0";
                } else {
                    op = sprintf("%.2f", this.opacity);
                }
                if (stringContainsChar(this.name, 'MaskFor')) {
                    //if this layer is a mask add to layerMask list
                    lid = this.seldonLayer.lid;
                    test = lid.substring(lid.indexOf("MaskFor"), lid.length).replace("MaskFor","")
                    if (layerMask.indexOf(test) === -1) {
                        layerMask.push(test);
                    }

                    //make sure the parent to the layerMask stays on the share map url
                    test = this.name.substring(0, this.name.indexOf("MaskFor"));
                    if (layerLids.indexOf(test) === -1) {
                        layerLids.push(test);
                        layerAlphas.push(op);
                    }
                } else {
                    //otherwise add to layerLids
                    if (this.seldonLayer) {
                        layerLids.push(this.seldonLayer.lid);
                        layerAlphas.push(op);
                    }
                } //end
            }
        });

        url = window.location.toString();
        url = url.replace(/\?.*$/, '');
        url = url.replace(/\/$/, '');
        url = url.replace("#", '');
        return url + '?' + (new ShareUrlInfo({
            themeName         : this.currentTheme.name,
            layerLids         : layerLids,
            layerMask         : layerMask,
            layerAlphas       : layerAlphas,
            accordionGroupGid : this.currentAccordionGroup.gid,
            baseLayerName     : this.currentBaseLayer.name,
            extent            : extent
        })).urlArgs();
    };

    return shareUrl;
}
