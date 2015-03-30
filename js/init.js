module.exports = function (app) {
    var ShareUrlInfo = require('./share.js');

    function init (config, projection, gisServerType, useProxyScript) {
        var shareUrlInfo = ShareUrlInfo.parseUrl(window.location.toString());
        app.launch(config, shareUrlInfo);
        seldon.app = app;
        seldon.projection = projection;
        seldon.gisServerType = gisServerType;
        seldon.useProxyScript = useProxyScript;
    }

    return init;
}
