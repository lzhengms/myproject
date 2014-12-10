/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var User = require('../../core/models/User');
    var RecentContactList = require('../../core/models/RecentContactList');
    var IMInteraction = require('../../core/im-interaction');
    var Xstring = require('../../../lib/util/string');


    User._constructor.implement({
        visualize: function () {
            this.initVisionAttr();
            this.bindListener();
        },
        initVisionAttr: function () {
            this.set('DOM', []);
            this.set('targetWindow', null);
        },
        bindListener: function () {
            var self = this;
            this.on('sending-message', function (message) {
            });
            this.on('send-message', function (message) {
                var messageContainer = self.get('messageContainer');
                if (messageContainer) {
                    messageContainer.appendMessages([message]);
                }
                RecentContactList.touch(this);
            });
            this.on('receive-message', function (message) {
                var messageContainer = self.get('messageContainer');
                var unreadCache;
                if (self.get('chatting')) {
                    // 1.1 正在聊天的情况（chat-window）
                    // 推送到chat-window
                    messageContainer.appendMessages([message]);
                    // 发送确认消息
                    if (self.get('isPsp')) {
                        //确认公众号消息
                        self.confirmPspMessage([message]);
                    } else {
                        //确认用户消息
                        self.confirmMessage([message]);
                    }

                }
                else {
                    // 1.2 不在聊天的情况（DOM）
                    unreadCache = this.get('unreadCache');
                    if (message.get('type') == 101) {
                        //erp下单,统一个单据不提醒多次，如果是未读的，只是一次
                        var popMsg = this._erpUnreadAndHistory(message, unreadCache);
                        if (popMsg) {
                            self.confirmMessage([popMsg]);//确认这条消息
                            unreadCache.splice(Global.indexOf(unreadCache, popMsg), 1,message);
                            return;
                        } else {
                            unreadCache.push(message);
                        }
                    } else {
                        unreadCache.push(message);
                    }

                    this.set('unreadCount', unreadCache.length);

                    var callback = function (username) {
                        IMInteraction.trigger('unread-message', {
                            id: 'user' + self.get('uid'),
                            text: '【新消息】来自' + username
                        });
                    }
                    if (!self.get('isPsp')) {
                        // 1.3 显示在标题上
                        self.checkUserName({
                            username: self.get('username')
                        }, callback, callback);
                    }

                }
                self.set('multpid', message.get('multpid'));
                RecentContactList.touch(self);
            });
            this.on('get-history', function (messages, total) {
                self.get('targetWindow').renderHistory(messages, total);
            });
        },
        // 增加关联的DOM元素
        addDOM: function (dom) {
            var DOM = this.get('DOM');
            var oDOM = $(User.tpl.render(this.getPlainObject()));
            DOM.push(oDOM);
            return oDOM;
        },
        // 批量处理关联的DOM元素
        handleDOM: function (func) {
            // 遍历处理相关DOM
            var DOM = this.get('DOM');
            $.each(DOM, function (index, dom) {
                dom && func.call(this, dom);
            });
        },
        _onChangeSignature: function (nSignature) {
            this.handleDOM(function (dom) {
                dom.find('[data-role=signature]').text(nSignature).attr('title', Xstring.revertQuote(nSignature));
            });
        },
        _onChangeUsername: function (nUsername) {
            this.handleDOM(function (dom) {
                dom.find('[data-role=username]').text(nUsername);
            });
        },
        _onChangeLastMessage: function (nLastMessage) {
            this.handleDOM(function (dom) {
                dom.find('[data-role=last-message]').html(nLastMessage.getBriefContent());
            });
        },
        // 用户成为当前聊天对象或不再是聊天对象

        _onChangeChatting: function (nStatus) {
            var messageContainer = this.get('messageContainer');
            var self = this;
            if (nStatus) {
                // 成为当前聊天对象
                var unreadCache = self.get('unreadCache');
                var historyCache = self.get('historyCache');

                // DOM增加当前对象
                this.handleDOM(function (dom) {
                    dom.addClass('active');
                    if (self.get('birthdayToday')) {
                        dom.addClass('active-birthday');
                    }
                });

                // 推送未读消息
                if (unreadCache.length || historyCache.length) {
                    if (!this.get('bg-running')) {
                        messageContainer.appendMessages(historyCache);
                    } else {
                        messageContainer.appendMessages(unreadCache);
                    }
                }

                messageContainer.show();

                // 清除未读缓存,未读数清零
                self.checkoutUnread();

                IMInteraction.trigger('read-message', 'user' + self.get('uid'));
            } else {
                // 不在是当前聊天对象
                this.handleDOM(function (dom) {
                    dom.removeClass('active').removeClass('active-birthday');
                });

                messageContainer.hide();
            }
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
        _onChangeLastContactTime: function (nLastContactTime, oLastContactTime) {
            if (nLastContactTime < oLastContactTime) {
                return this.set('lastContactTime', oLastContactTime, { silent: true });
            }
            this.updateLastContactTime();
        },
        // 公共接口用于最近联系人更新时间
        updateLastContactTime: function () {
            var nLastContactTime = this.get('lastContactTime');
            RecentContactList.touch(this);
            this.handleDOM(function (dom) {
                dom.find('[data-role=contact-time]').text(Global.helper.cuteContactTime(nLastContactTime));
            });
        },
        _erpUnreadAndHistory: function (message, caches) {
            //erp下单,统一个单据不提醒多次，如果是未读的，只是一次
            var task = Global.getErpMatches(message.get('content'));
            var arr = [];
            if (task) {
                arr = $.grep(caches, function (item, i) {
                        return item.get('type') == 101 && item.get('content').indexOf(task.taskid) !== -1
                    }
                );
            }
            return arr.length > 0 ? arr[0] : false;
        }
    });

    User.tpl = require('../tpl/user');
});