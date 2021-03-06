define(function (require, exports, module) {

    var UI = require("ui/disk/disk");
    var Mod = require("wn/walnut.client");

    function init() {
        new UI({
            $pel: $(document.body),
            model: new Mod(window._app),
            fitself: true
        }).render();
    }

    exports.init = init;
});