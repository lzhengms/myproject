/**
 * Description: 群组
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
        var $ = require('$');
        var ModelController = require('./ModelController');
        var IMInteraction = require('../im-interaction');

        var ChatObject = ModelController.extend({
            attrs: {
                chatting: 0, /* 0:非当前聊天对象 1：当前聊天对象*/
                chatFile: null, /*false：不显示上传文件的按钮（用户聊天窗口才显示，群聊天窗口不显示）  true：显示上传文件的按钮*/

                lastContactTime: null,
                lastMessage: null,

                // unreadCache没有上限
                // 打开聊天窗口后清空
                unreadCache: [],
                unreadCount: 0,

                // historyCache始终存在，只保留20条
                historyCache: [],
                historyCacheLength: 500
            },
            initBindAttr: function (config) {
                bindAttr(this, config);
            },
            // 接受或成功发送消息
            cacheMessage: function (message) {
                this.cacheHistory(message);
                this.set('lastContactTime', message.get('time'));
                this.set('lastMessage', message);
                if (message.get('is119')) {
                    var historyCache = this.get('historyCache');
                    this.set('lastMessage', historyCache[historyCache.length -1]);
                }
            },
            // 加入到历史记录中
            cacheHistory: function (msg) {
                var historyCache = this.get('historyCache');
                var length = historyCache.length;
                var maxLength = this.get('historyCacheLength');
                if (length + 1 > maxLength) {
                    historyCache.shift();
                }
                if (msg.get('is119')) {
                    historyCache.unshift(msg);
                } else {
                    historyCache.push(msg);
                }
            },
            // 获得对象字面量用于模板渲染
            getPlainObject: function () {
            },
            // 查看未读消息
            checkoutUnread: function () {
                var self=this;
                var unreadCache = this.get('unreadCache');
                //65360的消息（被邀请加入群的消息）
                var specialCache = [];
                specialCache = $.grep(unreadCache,function (item, index, arr) {
                    return item.get('cmd') && item.get('cmd') === 65360;
                });
                //普通消息
                var noramlCache = [];
                noramlCache = $.grep(unreadCache,function (item, index, arr) {
                    return indexOf(specialCache,item) === -1;
                });
                function confirm() {
                    self.confirmSpecialMessage&&self.confirmSpecialMessage(specialCache);
                    self.confirmMessage(noramlCache);
                }

                this.get('isPsp') ? this.confirmPspMessage(unreadCache) : confirm();

                unreadCache.length = 0;
                var triggerMsg = this.get('uid') ? 'user' + this.get('uid') :
                                (this.get('gid') ? 'group' + this.get('gid') : '');
                IMInteraction.trigger('read-message', triggerMsg);
                this.set('unreadCount', 0);
            },
            _onChangeUnreadCount: function (nUnreadCount) {
                var unreadTip = nUnreadCount > 99 ? '99+' : nUnreadCount;
                this.handleDOM(function (dom) {
                    var unreadDOM = dom.find('[data-role=unread-tip]');
                    if (nUnreadCount > 0) {
                        unreadDOM.text(unreadTip).show();
                    } else {
                        unreadDOM.hide();
                    }
                });
            },
            _onChangeChatFile: function () {
                if (this.get('chatFile')) {
                    $('#upload-file-wrap').show();
                    $('#message-content').removeClass('normal');
                } else {
                    $('#upload-file-wrap').hide();
                    $('#message-content').addClass('normal');
                }

            },
            // 公共接口用于最近联系人更新时间
            updateLastContactTime: function () {
                var nLastContactTime = this.get('lastContactTime');
                this.handleDOM(function (dom) {
                    dom.find('[data-role=contact-time]').text(Global.helper.cuteContactTime(nLastContactTime));
                });
            }
        });

        //初始化绑定属性
        function bindAttr(host, attrs) {
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr) && attr === 'lastContactTime') {
                    var m = '_onChange' + ucfirst(attr);
                    var val = host.get(attr);
                    if (val) {
                        if (host[m]) {
                            host[m](val, undefined, attr);
                        }
                    }
                }


            }
        }

        /**
         * 将首字母转大写
         */
        function ucfirst(str) {
            return str.charAt(0).toUpperCase() + str.substring(1);
        }
        var indexOf = Array.prototype.indexOf ? function (arr, item) {
            return arr.indexOf(item);
        } : function (arr, item) {
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === item) {
                    return i;
                }
            }
            return -1;
        }

        return ChatObject;
    }

)
;
