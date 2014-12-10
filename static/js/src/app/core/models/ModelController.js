/**
 * Description: 群组
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../../lib/util/base');

    var ModelController = Base.extend({
        initialize: function (config) {
            ModelController.superclass.initialize.call(this, config);
            this.visualize(config);
        }
    });


    return ModelController;
});
