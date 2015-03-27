module.exports = function ($) {
    function createSplashScreen () {
        var $splashScreenContainer = $("#splashScreenContainer"),
            $document    = $(document),
            windowWidth  = Math.round($document.width()/2);
        $('#splashScreenContent').load('splashScreen.html');
        $splashScreenContainer.dialog({
            zIndex      : 10051,
            maxHeight   : $document.height(),
            width       : windowWidth,
            minWidth    : 300,
            dialogClass : 'splashScreenStyle',
            hide        : "explode"
        });
        $splashScreenContainer.dialog("close");
    }

    return createSplashScreen;
}
