(function ($) {
    "use strict";

    require("./js/overrides.js")($);

    var seldon = {
        App: require("./js/app.js")($)
    }

    var app = new seldon.App();
    seldon.init = require("./js/init.js")(app);
    window.seldon = seldon;
}(jQuery));
