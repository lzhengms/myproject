/**
 * Description: 最近联系人
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../../lib/util/base');

    var RecentContactList = Base.extend({
        attrs: {
            size: 15,
            Pool: []
        },
        initialize: function (config) {
            RecentContactList.superclass.initialize.call(this, config);
            this.startInterval();
        },
        // 将obj添加到最近联系人，若以存在则置顶
        touch: function (obj) {
            if (!obj.get('lastContactTime')) {
                return;
            }

            var DOM = this.get('DOM');
            var Pool = this.get('Pool');
            var size = this.get('size');
            var index = $.inArray(obj, Pool);
            var oDOM;

            if (index === -1) {
                /*
                 if (Pool.length >= size) {
                 // 删除超出的第十五个
                 Pool.pop();
                 DOM.children().last().remove();
                 }
                 */
                // 创建新的DOM
                oDOM = obj.addDOM();
            } else {
                obj = Pool.splice(index, 1)[0];
                oDOM = DOM.children().eq(index).remove();
            }

            var contactTime = obj.get('lastContactTime');

            var rank = (function (cT) {
                for (var i = 0; i < Pool.length; i++) {
                    if (cT > Pool[i].get('lastContactTime')) {
                        return i;
                    }
                }
                return i;
            })(contactTime);
            Pool.splice(rank, 0, obj);
            if (rank === 0) {
                DOM.prepend(oDOM);
            } else {
                oDOM.insertAfter(DOM.children().eq(rank - 1));
            }
        },
        // 移除最近联系记录
        remove: function (obj) {
            var DOM = this.get('DOM');
            var Pool = this.get('Pool');
            var index = $.inArray(obj, Pool);
            if (index !== -1) {
                Pool.splice(index, 1);
                DOM.children().eq(index).remove();
            }
        },
        // 开启 每分钟更新最近聊天时间
        startInterval: function () {
            var self = this;
            setInterval(function () {
                self.refreshTime();
            }, 60 * 1000);
        },
        // 更新最近聊天时间
        refreshTime: function () {
            var Pool = this.get('Pool');
            $.each(Pool, function (index, obj) {
                obj.updateLastContactTime();
            });
        }

    });

    // 返回唯一单例
    module.exports = new RecentContactList();
});