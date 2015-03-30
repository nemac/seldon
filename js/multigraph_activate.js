module.exports = function (app, activeBtn) {
    var deactivateActiveOpenLayersControls = require('./deactivate_controls.js')(app, activeBtn);

    function activateMultigraphTool () {
        deactivateActiveOpenLayersControls();
        app.multigraphTool.activate();
    }

    return activateMultigraphTool;
}
