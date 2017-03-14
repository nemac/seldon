module.exports = function (app) {
    var ShareUrlInfo = require('./share.js');

    function init (config, projection, legendLookup, gisServerType, useProxyScript) {
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.projection = projection;
        seldon.projection = projection;
        app.legendLookup = legendLookup
        seldon.gisServerType = gisServerType;
        seldon.useProxyScript = useProxyScript;
        app.launch(config, shareUrlInfo);
        seldon.app = app;
    }

    return init;
}
