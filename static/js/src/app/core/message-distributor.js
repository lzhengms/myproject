/**
 * Description: IM消息分发器
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    // 所有OA（IM）消息的分发器
    var $ = require('$');
    var CallbackEnum = {};

    // 拆解IM消息，分发给各自的控制器处理
    var MessageDistributor = function (msg) {
        var messages = msg['__m'];
        $.each(messages, function (index, message) {
            var callback = CallbackEnum[message.cmd];
            if (callback) {
                callback(message.body,message.cmd);
            }
        });
    }

    MessageDistributor.register = function (cmd, callback, override) {
        cmd = $.isArray(cmd) ? cmd : $.makeArray(cmd);
        $.each(cmd, function (i, item) {
            var oCallback = CallbackEnum[item];
            if (override || !oCallback) {
                CallbackEnum[item] = callback;
            }
        });
    }

    return MessageDistributor;
});