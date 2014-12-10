/**
 * Description: 消息
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../../lib/util/base');

    var Message = Base.extend({
        attrs: {
            from: null,     // 消息发送方(user, group)
            to: null,       // 消息接收方(user, group)
            owner: null,    // 是否是自己发的消息
            content: null,  // 消息原始内容(91u通用)
            time: null,     // 消息发送时间
            mid: null,      // 消息ID
            error: false,   // 是否发送错误
            multpid: null
        },
        initialize: function(config) {
            Message.superclass.initialize.call(this, config);
            this.setOwner();
            this.setSupport();
        },
        setOwner: function() {
            var owner = false;
            if (!!this.get('from')) {
                owner = window.Global.uid == this.get('from').get('uid') ? 'my' : 'others';
            }
            this.set('owner', owner);
        }
    });

    // 发送消息的缓冲区（有可能发送失败）
    Message.Buffer = [];

    module.exports = Message;
});