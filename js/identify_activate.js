module.exports = function (app, activeBtn) {
    var deactivateActiveOpenLayersControls = require('./deactivate_controls.js')(app, activeBtn);

    function activateIdentifyTool () {
        deactivateActiveOpenLayersControls();
        app.identifyTool.activate();
    }

    return activateIdentifyTool;
}
