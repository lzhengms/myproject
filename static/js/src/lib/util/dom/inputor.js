define(function(require, exports, module) {
    var $ = require('$');
    var Timer = require('../timer');

    var Inputor = function(node, fn, params) {
        node = $(node);
        params = params || {};
        var cache = node.val();
        var flag = false;
        var run = Timer.debounce(function(force) {
            if(flag) {
                var val = node.val();
                if(params.keep === true || force === true || val !== cache) {
                    fn(val, node);
                    cache = val;
                }
                if(flag) {
                    run();
                }
            }
        }, params.timer || 128);
        node.bind('focus.timer', function() {
            flag = true;
            run(true);
        });
        node.bind('blur.timer', function() {
            if (!params.silentBlur) {
                fn(node.val(), node);
            }
            flag = false;
        });
    };

    $.fn.timer = function(fn, params) {
        this.each(function() {
            Inputor(this, fn, params);
        });
    };

    module.exports = Inputor;
});
