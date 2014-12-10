/**
 * Description: 错误提示框
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var FancyConfirmBox = require('./fancy-confirm-box');

    var ErrorDialogSingleton = new FancyConfirmBox({
        title: '错误',
        buttons: [{
            text: '确定',
            className: 'confirm-btn',
            action: 'close'
        }]
    });

    ErrorDialogSingleton.render();
    return ErrorDialogSingleton;
});