/**
 * Description: 提示框
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var ConfirmBox = require('../../../lib/cmp/dialog/confirm-box');

    var FancyConfirmBox = ConfirmBox.extend({
        className: 'widget-confirm-box'
    });


    return FancyConfirmBox;
});