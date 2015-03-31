(function ($) {
    "use strict";

    require("./overrides.js")($);

    var seldon = {
        App: require("./app.js")($)
    }

    var app = new seldon.App();
    seldon.init = require("./init.js")(app);
    window.seldon = seldon;
}(jQuery));
