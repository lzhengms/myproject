/**
 * Description: 列表基类
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var ModelController = require('./ModelController');

    var List = ModelController.extend({
        attrs: {
            data: null
        }
    });


    module.exports = List;
});