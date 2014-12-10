/**
 * Description: 好友列表
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var List = require('./List');
    var User = require('./User');
    var Ajax = require('../ajax');

    var pageSize = 20;

    // 继承自List类
    var FriendList = List.extend({
        attrs: {
            total: null,
            loaded: false,
            pos: 0,
            friends: [],
            psp: '0000'//公众号id
        },
        // 请求好友列表
        requestMembers: function () {
            var d = $.Deferred();

            var self = this, jqXHR;
            var listid = this.get('listid');
            var pos = this.get('pos');
            var friends = this.get('friends');
            var pspid = this.get('psp');


            _requestMembers();

            function _requestMembers() {

                jqXHR =
                    listid === pspid ? (Ajax({
                        url: '/pspapi/91u/psp/sublist',
                        method: 'GET',
                        data: {
                            sid: Global.sid,
                            type: 0,
                            size: pageSize,
                            start: self.get('pos') * pageSize
                        }
                    })) : (Ajax({
                        url: '/_oap/friend/listmember',
                        method: 'GET',
                        data: {
                            tagid: listid,
                            getfollow: '1',
                            size: pageSize,
                            pos: self.get('pos')
                        }
                    }));
                jqXHR.done(function (data) {
                    if (listid === pspid) {
                        $.each(data.psp, function (i, user) {
                            user=User.getPspObject(user);
                            friends.push(new User(user));
                        });
                    } else {
                        $.each(data.tags.friends, function (i, user) {
                            friends.push(new User(user));
                        });
                    }

                    if (!self.get('total')) {
                        self.set('total', data.total);
                    }

                    self.set('pos', ++pos);

                    if (pos * pageSize >= data.total) {
                        self.set('loaded', true);
                        d.resolve();
                    } else {
                        _requestMembers();
                    }
                });
            }


            return d.promise();
        }
    });

    module.exports = FriendList;
});
