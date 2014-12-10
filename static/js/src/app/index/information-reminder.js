/**
 * Description: IM消息分发器
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../lib/util/base');
    var defaultText = document.title;
    var InformationPool = [];

    var InformationReminder =Base.extend({
        attrs:{
          unreadCount:null,
          mode:null
        },
        _onChangeUnreadCount: function() {
            this.display();
        },
        _onChangeMode: function() {
            this.display();
        },
        push: function (obj) {
            var index = getIndex(InformationPool, obj.id);
            if (index != -1) {
                InformationPool.splice(index, 1);
            }
            InformationPool.push(obj);
            this.display();
        },
        del: function (id) {
            var index = getIndex(InformationPool, id);
            if (index != -1) {
                InformationPool.splice(index, 1);
            }
            this.display();
        },
        clear: function () {
            InformationPool.length = 0;
            this.display();
        },
        display: function () {
            var text;
            var len = InformationPool.length;
            var mode = this.get('mode') || 1;
            if (mode == 1) { //当前标签页
                if (len && this.get('unreadCount')) {
                    text = InformationPool[len - 1].text;
                    stopScroll();
                    document.title = text;
                    titleScroll(text);
                } else {
                    text = defaultText;
                    stopScroll();
                    document.title=text;
                }
            } else if (mode == 2) { //非当前标签页
                if (len && this.get('unreadCount')) {
                    text = '【共' + this.get('unreadCount') + '条未读消息】';
                    stopScroll();
                    document.title = text;
                    titleScroll(text);
                } else {
                    text = defaultText;
                    stopScroll();
                    document.title = text;
                }
            }
               /* if (len) {
                    text = '【共' + this.get('unreadCount') + '条未读消息】' + InformationPool[len - 1].text;//'【共'+len+'条未读消息】'+InformationPool[len - 1].text
                } else {
                    text = defaultText;
                }*/
            //$('title').html(text);
            //titleScroll(text, 1000)
            //$('title').html(text);
            //document.title = text;
        }
    });

    function getIndex(arr, id) {
        var ret = -1;
        $.each(arr, function(index, obj) {
            if (ret === -1 && obj.id == id) {
                ret = index;
            }
        });
        return ret;
    }
    var loopScroll;
    function titleScroll(titleString){

        var titleLength = titleString.length;
        var titleString = titleString;
        var index = 0;
        loopScroll = setInterval(function() {
            var doc_title = titleString.substring(index,titleLength);
            document.title = doc_title;
            if (index < titleLength - 1) {
                index++;
            } else {
                index = 0;
            }
        }, 500);
    }
    function stopScroll() {
        clearInterval(loopScroll);
    }

    return new InformationReminder();
});