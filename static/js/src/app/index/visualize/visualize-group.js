/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var Group = require('../../core/models/Group');
    var RecentContactList = require('../../core/models/RecentContactList');
    var IMInteraction = require('../../core/im-interaction');
    var DetectFileType = require('../file-type');
    var ErrorDialog = require('../cmp/error-dialog');
    var Xstring = require('../../../lib/util/string');


    Group._constructor.implement({
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
            this.on('receive-notice', function (message) {
                var messageContainer = self.get('messageContainer');

                if (self.get('chatting')) {
                    messageContainer.appendMessages([message], true);
                    // 发送确认消息
                    self.confirmMessage([message]);
                } else {
                    var unreadCache = self.get('unreadCache');
                    unreadCache.push(message);
                    self.set('unreadCount', unreadCache.length);
                    IMInteraction.trigger('unread-message', {
                        id: 'group' + self.get('gid'),
                        text: '【新消息】来自' + self.get('gname')
                    });
                }
                RecentContactList.touch(this);
            });
            this.on('send-message', function (message) {
                var messageContainer = self.get('messageContainer');
                if (messageContainer) {
                    messageContainer.appendMessages([message]);
                }
                RecentContactList.touch(this);
            });
            this.on('receive-group-sysmsg', function (message, oGroup) {
                var messageContainer = self.get('messageContainer');
                if (self.get('chatting')) {
                    messageContainer.appendMessages([message], true);
                    // 发送确认消息
                    self.confirmMessage([message]);
                } else {

                    var unreadCache = self.get('unreadCache');
                    unreadCache.push(message);
                    self.set('unreadCount', unreadCache.length);
                    IMInteraction.trigger('unread-message', {
                        id: 'group' + self.get('gid'),
                        text: '【新消息】来自' + self.get('gname')
                    });
                }

                //oGroup.remove();
                RecentContactList.touch(window.Global.msgGroup);
                // 如果被解散的群正打开，窗口切换到群系统消息
                if (oGroup.get('chatting')) {
                    setTimeout(function () {
                        var gid = self.get('gid');
                        $('#personnel-panel').find('.group[data-gid="' + gid + '"]').click();
                    }, 200);
                } /*else {
                    if (!self.get('chatting')) {
                        IMInteraction.trigger('unread-message', {
                            id: 'group' + self.get('gid'),
                            text: '【新消息】来自' + self.get('gname')
                        });
                    }
                }*/
                oGroup.remove();
            });
            this.on('receive-group-notice', function (message) {
                var messageContainer = self.get('messageContainer');

                var fromUser = message.get('from');
                var toUser = message.get('to');
                var user = toUser.get('uid') == window.Global.uid ? fromUser : toUser;
                user.checkUserName({
                    username: user.get('username')
                }, function (username) {
                    if (self.get('chatting')) {
                        messageContainer.appendMessages([message], true);
                        // 发送确认消息
                        self.confirmMessage([message]);
                    } else {
                        var unreadCache = self.get('unreadCache');
                        unreadCache.push(message);
                        self.set('unreadCount', unreadCache.length);
                        IMInteraction.trigger('unread-message', {
                            id: 'group' + self.get('gid'),
                            text: '【新消息】来自' + self.get('gname')
                        });
                    }
                    RecentContactList.touch(self);
                }, function () {
                    if (self.get('chatting')) {
                        messageContainer.refreshGroupNoticeUsername(user.get('uid'), user.get('username'));
                    } else {
                        var unreadCache = self.get('unreadCache');
                        unreadCache.push(message);
                        self.set('unreadCount', unreadCache.length);
                        IMInteraction.trigger('unread-message', {
                            id: 'group' + self.get('gid'),
                            text: '【新消息】来自' + self.get('gname')
                        });
                    }
                    RecentContactList.touch(self);
                });
            });
            this.on('receive-message', function (message) {
                var messageContainer = self.get('messageContainer');
                var unreadCache;

                var user = message.get('from');
                user.checkUserName({
                    username: user.get('username')
                }, function (username) {
                    if (self.get('chatting')) {
                        // 1.1 正在聊天的情况（chat-window）
                        // 推送到chat-window
                        messageContainer.appendMessages([message]);
                        // 发送确认消息
                        if (message.cmd && message.get('cmd') === 65360) {
                            self.confirmSpecialMessage([message]);
                        } else {
                            self.confirmMessage([message]);
                        }

                    } else {
                        // 1.2 不在聊天的情况（DOM）
                        unreadCache = self.get('unreadCache');
                        unreadCache.push(message);
                        self.set('unreadCount', unreadCache.length);
                        IMInteraction.trigger('unread-message', {
                            id: 'group' + self.get('gid'),
                            text: '【新消息】来自' + self.get('gname')
                        });
                    }
                    RecentContactList.touch(self);
                }, function () {
                    if (self.get('chatting')) {
                        messageContainer.refreshUsername(user.get('uid'), user.get('username'));
                    } else {
                        unreadCache = self.get('unreadCache');
                        unreadCache.push(message);
                        self.set('unreadCount', unreadCache.length);
                        IMInteraction.trigger('unread-message', {
                            id: 'group' + self.get('gid'),
                            text: '【新消息】来自' + self.get('gname')
                        });
                    }
                    RecentContactList.touch(self);
                });
            });
            this.on('get-history', function (messages, total) {
                /*var count = messages.length || 0;
                $.each(messages, function (index, message) {
                    var user = message.get('from');
                    user.checkUserName({
                        username: user.get('username')
                    }, function (username) {
                        self.get('targetWindow').renderHistory(messages, total);
                    }, function () {
                        var targetWindow = self.get('targetWindow');
                        targetWindow.refreshUsername(user.get('uid'), user.get('username'));
                    });
                });*/
                self.get('targetWindow').renderHistory(messages, total);
            });
        },
        // 增加关联的DOM元素
        addDOM: function (dom) {
            var DOM = this.get('DOM');

            var plainObject = this.getPlainObject();
            plainObject.groupname = Xstring.code(plainObject.groupname);
            var oDOM = $(Group.tpl.render(plainObject));
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
        // 添加群
        add: function () {
            var gid = this.get('gid'), category = this.get('category') || 101;
            var groupList = $("#personnel-panel").find('.group-list[data-category="' + category + '"]');
            if (groupList.find('.group[data-gid="' + gid + '"]').length === 0) {
                groupList.find('[data-role=list-content]').append(this.addDOM());
                var countDOM = groupList.find('[data-role=count]');
                var count = countDOM.data('count') || 0;
                countDOM.data('count', ++count);
                countDOM.html('[' + count + ']');
                this.signIn();
            }
        },
        // 移除群
        remove: function () {
            var gid = this.get('gid');

            // 删除群列表数据
            var groupItem = $("#personnel-panel").find('.group-list').find('.group[data-gid="' + gid + '"]');

            // 更新群分组总数
            var countDOM = groupItem.closest('.group-list').find('[data-role=count]');
            var count = countDOM.data('count') || 0;
            count = count === 0 ? 0 : --count;
            countDOM.data('count', count);
            countDOM.html('[' + count + ']');
            groupItem.remove();
            this.checkoutUnread();
            // 删除最近联系人列表数据
            RecentContactList.remove(this);
            // 删除缓存数据
            delete Group.GroupPool[gid];
        },
        // 获取群信息
        showGroupInfo: function () {
            var targetWindow = this.get('targetWindow');
            var DOM = targetWindow.get('DOM');

            this.getGroupInfo().done(function (data) {
                DOM.find('[data-role=group-notice]').text(data.notice + ' ');
                DOM.find('[data-role=group-intro]').text(data.introduction + ' ');
            }).fail(function () {
                DOM.find('[data-role=group-notice]').text('获取失败');
                DOM.find('[data-role=group-intro]').text('获取失败');
            });
            this.getGroupMember().done(function (data) {
                var html = '';
                $.each(data.data, function (index, user) {
                    html += Group.memberTpl.render(user);
                });
                DOM.find('[data-role=group-members]').html(html);
            }).fail(function () {
                DOM.find('[data-role=group-members]').text('获取失败');
            });
        },
        // 获取群共享
        showGroupShare: function () {
            var targetWindow = this.get('targetWindow');
            var gid = this.get('gid');
            var DOM = targetWindow.get('DOM');

            var wrap = DOM.find('[data-role=group-share-wrap]');
            wrap.html("<div class='no-share-file'>loading...</div>");
            var self = this;
            this.getGroupMember().done(function (memebers) {
                var powers = [];
                var power = false;
                $.each(memebers.data, function (index, user) {
                    if (+user.grade >= 2) {
                        powers.push(+user.uid)
                    }
                });
                if ($.inArray(+Global.uid, powers)!==-1) {
                    power = true;
                }
                self.getGroupShare().done(function (data) {
                    var html = '';
                    if (data.files.length != 0) {
                        $.each(data.files, function (index, file) {
                            var type = DetectFileType(file.name);
                            html += Group.shareTpl.render({
                                type: type,
                                name: file.name,
                                size: file.size,
                                ctime: file.ctime,
                                fid: file.fid,
                                gid: gid,
                                power: power,
                                uid: file.uid
                            });
                        });
                        wrap.html(html);
                    } else {
                        wrap.html("<div class='no-share-file'>没有共享文件</div>");
                    }
                })
            });
        },
        // 获取讨论组信息
        showDiscussionInfo: function () {
            var targetWindow = this.get('targetWindow');
            var DOM = targetWindow.get('DOM');

            this.getDiscussionInfo().done(function (data) {
                DOM.find('[data-role=discussion-notice]').text(data.notice + ' ');
            }).fail(function () {
                DOM.find('[data-role=discussion-notice]').text('获取失败');
            });

            this.getDiscussionMember().done(function (data) {
                var html = '';
                $.each(data.members, function (index, user) {
                    html += Group.discussionMemberTpl.render(user);
                });
                DOM.find('[data-role=discussion-members]').html(html);
            }).fail(function () {
                DOM.find('[data-role=discussion-members]').text('获取失败');
            });
        },
        //删除群共享
        removeGroupShare: function (fid) {
            this.delGroupShare(fid).done(function () {
                var item = $('[data-fid="' + fid + '"]');
                var parent = item.closest('.group-share-file');
                parent.slideUp();
            }).on('no-permission', function () {
                ErrorDialog.set('content', '对不起，您没有权限删除').show();
            });
        },

        _onChangeGroupname: function (nGroupname) {
            this.handleDOM(function (dom) {
                dom.find('[data-role=groupname]').text(nGroupname);
            });
        },
        _onChangeLastMessage: function (nLastMessage) {
            this.handleDOM(function (dom) {
                dom.find('[data-role=last-message]').html(nLastMessage.getBriefContent());
            });
        },
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
                });

                // 推送未读消息
                if (unreadCache.length || historyCache.length) {
                    var noTimeline = self.get('type') == 'notice';
                    if (!this.get('bg-running')) {
                        messageContainer.appendMessages(historyCache, noTimeline);
                    } else {
                        messageContainer.appendMessages(unreadCache, noTimeline);
                    }
                }

                messageContainer.show();

                // 清除未读缓存,未读数清零
                self.checkoutUnread();

                IMInteraction.trigger('read-message', 'group' + self.get('gid'));
            } else {
                // 不在是当前聊天对象
                this.handleDOM(function (dom) {
                    dom.removeClass('active');
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
                return this.set('lastContactTime', oLastContactTime);
            }
            RecentContactList.touch(this);
            this.updateLastContactTime();
        },
        // 公共接口用于最近联系人更新时间
        updateLastContactTime: function () {
            var nLastContactTime = this.get('lastContactTime');
            this.handleDOM(function (dom) {
                dom.find('[data-role=contact-time]').text(Global.helper.cuteContactTime(nLastContactTime));
            });
        }
    });

    Group.tpl = require('../tpl/group');
    Group.memberTpl = require('../tpl/group-member-tpl');
    Group.discussionMemberTpl = require('../tpl/discussion-member-tpl');
    Group.shareTpl = require('../tpl/group-share-tpl');
});