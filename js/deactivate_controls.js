module.exports = function (app, activeBtn) {
    function deactivateActiveOpenLayersControls () {
        var controls,
            i;
        for (i = 0; i < app.map.controls.length; i++) {
            controls = app.map.controls[i];
            if ((controls.active === true) &&
                (
                 (controls.displayClass === "olControlZoomBox")           ||
                 (controls.displayClass === "olControlWMSGetFeatureInfo") ||
                 (controls.displayClass === "ClickTool")
                )) {

                controls.deactivate();
                $('.icon-active').removeClass('icon-active');
            }
        }
    }

    return deactivateActiveOpenLayersControls;
}
