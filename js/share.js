function ShareUrlInfo (settings) {
    if (settings === undefined) settings = {};

    this.themeName         = settings.themeName;
    this.accordionGroupGid = settings.accordionGroupGid;
    this.baseLayerName     = settings.baseLayerName;
    this.extent            = settings.extent || {};
    this.layerLids         = settings.layerLids || [];
    this.layerMask         = settings.layerMask || [];
    this.layerAlphas       = settings.layerAlphas || [];
}

ShareUrlInfo.parseUrl = function (url) {
    var info = new ShareUrlInfo(),
        vars = [],
        hash,
        q;

    if (url === undefined) {
        return undefined;
    }
    // Remove everything up to and including the first '?' char.
    url = url.replace(/^[^\?]*\?/, '');

    url = url.replace(/\%2[c|C]/g, ',');

    $.each(url.split('&'), function () {
        var i = this.indexOf('='),
            name, value;
        if (i >= 0) {
            name  = this.substring(0,i);
            value = this.substring(i+1);
        } else {
            name  = this;
            value = undefined;
        }
        vars[name] = value;
    });

    info.themeName         = vars.theme;
    info.accordionGroupGid = vars.accgp;
    info.baseLayerName     = vars.basemap;

    if (vars.extent) {
        var extentCoords = vars.extent.split(',');
        info.extent = {
            left   : extentCoords[0],
            bottom : extentCoords[1],
            right  : extentCoords[2],
            top    : extentCoords[3]
        };
    }

    if (vars.layers) {
        $.each(vars.layers.split(','), function () {
            info.layerLids.push(this);
        });
    }
    if (vars.mask) {
        $.each(vars.mask.split(','), function () {
            info.layerMask.push(this);
        });
    }
    if (vars.alphas) {
        $.each(vars.alphas.split(','), function () {
            info.layerAlphas.push(this);
        });
    }
    if (info.themeName && info.baseLayerName) {
        return info;
    }
    return undefined;
};

ShareUrlInfo.prototype.urlArgs = function () {
    return Mustache.render(
        (''
         + 'theme={{{theme}}}'
         + '&layers={{{layers}}}'
         + '&mask={{{mask}}}'
         + '&alphas={{{alphas}}}'
         + '&accgp={{{accgp}}}'
         + '&basemap={{{basemap}}}'
         + '&extent={{{extent.left}}},{{{extent.bottom}}},{{{extent.right}}},{{{extent.top}}}'
        ),
        {
            theme   : this.themeName,
            layers  : this.layerLids.join(','),
            mask    : this.layerMask.join(','),
            alphas  : this.layerAlphas.join(','),
            accgp   : this.accordionGroupGid,
            basemap : this.baseLayerName,
            extent  : this.extent
        });
};

module.exports = ShareUrlInfo;
