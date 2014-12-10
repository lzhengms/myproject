/**
 * Description: 群组
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Ajax = require('../ajax');
    var IMAjax = require('../im-ajax');
    var MessageDistributor = require('../message-distributor');
    var GroupMessage = require('./GroupMessage');
    var User = require('./User');

    var ChatObject = require('./ChatObject');
    // 所有group的缓存
    var GroupPool = {};

    var _Group = ChatObject.extend({
        attrs: {
            signed: false,
            receiving: false,

            type: 'group',
            gid: {
                getter: function(val) {
                    return val + '';
                }
            },
            groupname: null

        },
        initialize: function(config) {
            //config = this.normalizeConfig(config);
            _Group.superclass.initialize.call(this, config);
            GroupPool[config.gid] = this;
           this.initBindAttr();
        },
        normalizeConfig: function(config) {
            return {
                gid: config.gid,
                groupname: config.gname,
                unread: this.get('unreadCount'),
                lastContactTime: config.lastContactTime
            }
        },
        // 登录群
        signIn: function() {
            var self = this;
            IMAjax({
                cmd: 65025,
                body: {
                    gid: self.get('gid'),
                    group_type: self.get('groupType')
                }
            });
        },
        // 开始接受群消息
        sayHello: function() {
            var self = this;
            IMAjax({
                cmd: 65027,
                body: {
                    gid: self.get('gid'),
                    group_type: self.get('groupType'),
                    offline_msgs_count: 80,
                    start_msgid: '0'
                }
            });
        },
        // 更新群的资料（groupname或lastContactTime）
        update: function(group) {
            var self = this;
            _update(['groupname', 'lastContactTime']);

            function _update(keys) {
                $.each(keys, function(index, key) {
                    group[key] && self.set(key, group[key]);
                });
            }
        },
        sendMessage: function(message) {
            Ajax({
                url: '/_im/m',
                method: 'POST',
                data: {
                    cmd: 65088,
                    body: {
                        gid: this.get('gid'),
                        group_type: this.get('groupType'),
                        groupmsg_type_send: 0,
                        //size: 10, //一个随便的值
                        msg: {
                            content: message
                        }
                    }
                }
            });

            var msg = new GroupMessage({
                from: window.Global.user,
                to: this,
                content: message
            }, true);
            // 先不压入缓存，放在缓冲区里
            // 待反馈成功当作收到消息，放入历史缓存
            GroupMessage.Buffer.push(msg);
            this.trigger('sending-message', message);
        },
        // 获得group对象字面量用于模板渲染
        getPlainObject: function() {
            var lastMessage = this.get('lastMessage');
            var lastMessageContent = (lastMessage && lastMessage.getBriefContent()) || '';
            return {
                gid: this.get('gid'),
                status: this.get('status'),
                type: this.get('type'),
                groupname: this.get('gname'),
                groupType: this.get('groupType'),
                unreadCount: this.get('unreadCount'),
                lastContactTime: this.get('lastContactTime'),
                lastMessageContent:lastMessageContent
            };
        },
        // 查看历史消息
        requestHistory: function(formalDate, startAt) {
            var self = this;
            var gid = this.get('gid');
            Ajax({
                url: '/_oap/im/groupchat',
                method: 'GET',
                data: {
                    gid: gid,
                    category: this.get('category'),
                    start: startAt,
                    size: 20,
                    time: formalDate + ''
                }
            }).done(function(data) {
                var messages = [],
                    len = data.data.length;
                var parseMessage = function () {
                    if (len) {
                        $.each(data.data, function(index, message) {
                            if ((message.msgtype == 0 && message.msgdata.content) || message.msgtype == 4) {
                                var user = new User({
                                    uid: message.msgdata.uid
                                });
                                user.checkUserName({
                                    username: user.get('username')
                                }, function (username) {
                                    message =  new GroupMessage({
                                        from: user,
                                        to: window.Global.user,
                                        content: message.msgdata.content || message.msgdata,
                                        type: message.msgtype,
                                        time: message.msgtime,
                                        mid: message.msgid
                                    }, true);
                                    messages.push(message);
                                    if (len === messages.length) {
                                        self.trigger('get-history', messages, +data.total);
                                    }
                                }, function () {
                                    parseMessage();
                                });
                                /*message =  new GroupMessage({
                                 from: user,
                                 to: window.Global.user,
                                 content: message.msgdata.content,
                                 time: message.msgtime,
                                 mid: message.msgid
                                 }, true);
                                 messages.push(message);*/
                            } else {
                                len -= 1;
                                if (len === messages.length) {
                                    self.trigger('get-history', messages, +data.total);
                                }
                            }
                        });
                        if (len === 0) {
                            self.trigger('get-history', messages, +data.total);
                        }
                    } else {
                        self.trigger('get-history', messages, +data.total);
                    }
                };
                parseMessage();

                //self.trigger('get-history', messages, +data.total);
            });
        },
        // 查看后发送确认收到消息的请求
        confirmMessage: function(messages) {
            var self = this;
            // 发送确认消息
            $.each(messages, function(index, message) {
                if (message.get('from') != window.Global.user) {
                    IMAjax({
                        cmd: 65089,
                        body: {
                            gid: self.get('gid'),
                            group_type: self.get('groupType'),
                            msg_id: message.get('mid')
                        }
                    });
                }
            });
        },
        //确认65360的消息
        confirmSpecialMessage:function(messages){
        // 发送确认消息
            $.each(messages, function(index, message) {
                IMAjax({
                    cmd: 36877,
                    body: {
                        uid: message.get('uid'),
                        multpid: message.get('multpid'),
                        msg_id: message.get('mid')
                    }
                });
                //当消息是通过离线消息发出来的，specialMessage有部分走同步，uid需要用自己的id
                IMAjax({
                    cmd: 36877,
                    body: {
                        uid: Global.uid,
                        multpid: message.get('multpid'),
                        msg_id: message.get('mid')
                    }
                });

            });
        },
        // 获取群信息
        getGroupInfo: function() {
            return Ajax({
                url: '/_oap/group/info',
                method: 'GET',
                data: {
                    gid: this.get('gid')
                }
            });
        },
        getGroupMember: function() {
            return Ajax({
                url: '/_oap/group/members',
                method: 'GET',
                data: {
                    gid: this.get('gid')
                }
            });
        },
        // 获取群共享
        getGroupShare: function() {
            return Ajax({
                url: '/_oap/gshare/list',
                method: 'GET',
                data: {
                    gid: this.get('gid')
                }
            });
        },
        //删除群共享
        delGroupShare:function(fid){
            return Ajax({
                url:'/_oap/gshare/remove',
                method:'POST',
                dataType:'text',
                data:{
                    fid:fid,
                    category:this.get('category')
                }
            });
        },

        // 获取讨论组信息
        getDiscussionInfo: function() {
            return Ajax({
                url: '/_oap/discussion/info',
                method: 'GET',
                data: {
                    gid: this.get('gid')
                }
            });
        },

        //获取讨论组成员
        getDiscussionMember: function() {
            return Ajax({
                url: '/_oap/discussion/memberlist',
                method: 'GET',
                data: {
                    gid: this.get('gid')
                }
            });
        }

    });


    function Group(args) {
        var group = Group.get(args.gid);
        if (group) {
            // 更新Group(可能group只有gid)
            group.update(args);
            return group;
        } else {
            return new _Group(args)
        }
    }

    Group.get = function(gid) {
        return GroupPool[gid];
    };

    Group.signAllIn = function() {
        $.each(Group.GroupPool, function(index, group) {
            group.signIn();
        });
    };

    Group._constructor = _Group;

    Group.GroupPool = GroupPool;

    // 登录群
    MessageDistributor.register(65025, function(data) {
        var group;
        if (data.res_code == 200) {
            group = Group.get(data.gid);
            group.set('signed', true);
         // group.set('creatorid',);//创建者
            group.sayHello();
        } else if (data.res_code === 404) {
            // TODO 404处理
        }
    });

    // 开始接受群消息
    MessageDistributor.register(65027, function(data) {
        var group;
        if (data.res_code == 200) {
            group = Group.get(data.gid);
            group.set('receiving', true);
        }
    });

    // 发送消息反馈
    MessageDistributor.register(65088, function(data) {
        var message, group;

        if (data.res_code == 200) {
            while(GroupMessage.Buffer.length) {
                //message = Message.Buffer.shift();
                message = GroupMessage.Buffer.pop();
                message.set('time', new Date().getTime().toString().substr(0, 10));
                group = message.get('to');
                group.cacheMessage(message);
                group.trigger('send-message', message);
            }
        }
        if (data.res_code === 404) {
            // 发送失败
            group = Group.get(data.gid);

            message = GroupMessage.Buffer.shift();
            message.set('time', new Date().getTime().toString().substr(0, 10));
            message.set('error', true);
            group.cacheMessage(message);
            group.trigger('send-message', message);
            group.signIn();
        }
    });

    // 收到群消息
    MessageDistributor.register(65344, function(data) {
        // 可能没有该记录
        var group = new Group({
            gid: data.gid,
            groupType: data.group_type
        });

        $.each(data.mults.data, function(index, message) {
            var user = new User({
                uid: message.msg.uid
            });
            var msg = new GroupMessage({
                from: user,
                to: window.Global.user,
                content: message.msg.content || message.msg || '',
                time: message.time,
                type: message.groupmsg_type_recv,
                mid: message.msg_id,
                group: group,
                cmd:65344
            }, true);

            if(msg && msg.get('support')) {
                if(group === window.Global.unitGroup) {
                    group.trigger('receive-notice', msg);
                    group.cacheMessage(msg);
                } else if (user === Global.user) {
                    group.cacheMessage(msg);
                    group.trigger('send-message', msg);
                } else {
                    group.trigger('receive-message', msg);
                    group.cacheMessage(msg);
                }
            }
        });
    });
    //群系统消息
    MessageDistributor.register(65346, function(data) {
    });
    //群个人私有消息
    MessageDistributor.register(65348, function(data) {
    });
    //群个人私有系统消息
    MessageDistributor.register(65350, function(data) {
    });
    //加入群请求
    MessageDistributor.register(65060, function(data) {
        if (data.res_code !== 200) {//等待验证
            var now = new Date().getTime();
            now = now.toString().slice(0, 10);
            var group = new Group({
                gid: data.gid,
                gname: data.gname || '',
                type: 'group',
                groupType: data.group_type,
                lastContactTime: now
            });
            var user = new User({
                username: '系统'
            })
            var msg = new GroupMessage({
                from: user,
                to: window.Global.user,
                content: '',
                time: now,
                type: 10005,
                mid: '',
                group: group,
                multpid: '',
                uid: '',
                cmd: 65060,
                is119: data.is119
            }, true);
            handlerGroupNoticeMsg(group, msg);
        }/*
        if (data.res_code === 201) {

        } else if (data.res_code === 403) {
            ErrorDialog.set('title', '提示');
            ErrorDialog.set('content', '您已是该群成员，请不要重复添加').show();
        }*/

    });
    // 群通知,例如群解散、转让群（群里面其他人收到）
    MessageDistributor.register(65352, function(data) {
        var group = new Group({
            gid: data.gid,
            groupType: data.group_type
        });

        $.each(data.mults.data, function(index, message) {
            var fromUser = window.Global.user, msgs;
            var toUsers = [];
            if(msgs = message.msg) {
                if(msgs.opuid) {
                    fromUser = new User({
                        uid: msgs.opuid
                    });
                }
                if(msgs.mults && msgs.mults.count) {


                    function getUid(data) {
                        for (var i = 0, len = data.length; i < len; i++) {
                            data[i].uid ? toUsers.push(new User({uid: data[i].uid})) :
                                          getUid(data[i].mults.data);
                        }
                    }
                    getUid(msgs.mults.data);
                }
            }

            if(toUsers.length === 0) {
            //收到消息里没有人的时候就表示自己被删除了或者自己被加入了
                toUsers.push(window.Global.user);
            }

            for(var j = 0; j < toUsers.length; j++) {
                var msg = new GroupMessage({
                    from: fromUser,
                    to: toUsers[j],
                    content: '',
                    time: message.time,
                    type: message.groupmsg_type_recv,
                    mid: '',
                    group: group,
                    cmd:65352
                }, true);

                if(msg && msg.get('support')) {
                    if(msg.get('sysMsg') && (toUsers[j].get('uid')===window.Global.uid)) {
                        //不在群里面了，获取群系统消息
                        window.Global.msgGroup.trigger('receive-group-sysmsg', msg, group);
                        window.Global.msgGroup.cacheMessage(msg);
                    } else {
                        //群内的消息
                        group.trigger('receive-group-notice', msg);
                        group.cacheMessage(msg);
                    }
                }
            }
        });

    });

    // 接收群成员通过im转发给群外人的消息,例如被邀请加入群（被加入的人收到）
    MessageDistributor.register(65360, function(data) {
        var group = new Group({
            gid: data.gid,
            gname: data.gname || '',
            type: data.group_type == 2 ? 'discussion' : 'group',
            groupType: data.group_type,
            lastContactTime: data.time
        });

        var user = new User({
            uid: data.uid
        });
        var msg = new GroupMessage({
            from: user,
            to: window.Global.user,
            content: '',
            time: data.time,
            type: data.groupmsg_type_recv,
            mid: data.ackid,
            group: group,
            multpid: data.multpid,
            uid: data.uid,
            cmd: 65360,
            is119: data.is119
        }, true);

        var reason = data.msg.approval_reason;
        if (data.msg && (data.msg.approval_result === 0)) {
            ajax({
                url: '/v2/group/api/group/search',
                method: 'GET',
                data: {gid: data.gid}
            }).done(function(data){
                group.set('gname', data.data[0].gname);
                msg.set('reason', reason);
                window.Global.msgGroup.trigger('receive-group-sysmsg', msg, group);
                window.Global.msgGroup.cacheMessage(msg);
            });
        } else {
            handlerGroupNoticeMsg(group, msg);
        }
    });

    function handlerGroupNoticeMsg(group, msg) {

        var receiveMessage = function(group) {
            group.trigger('receive-message', msg);
            group.cacheMessage(msg);
            group.add();
        };

        var getInfoFunc = function(group) {
            if (group.get('groupType') == 2) {// 讨论组
                return group.getDiscussionInfo();
            } else if (group.get('groupType') == 0){ // 群组
                return group.getGroupInfo();
            }
        };

        if(!group.get('gname')) {
            getInfoFunc(group).done(function (data) {
                group.set('gname', data.gname);
                group.set('category', data.category);
                receiveMessage(group);
            }).fail(function () {
              //  receiveMessage(group);
            });
        } else {
            receiveMessage(group);
        }
    }

    setTimeout(function () {
        // 注册一个单位群, 用来接收通知公告
        var gid = window.Global.unitId + '-u';
        GroupPool[gid] = window.Global.unitGroup = new Group({
            gid: gid,
            type: 'notice',
            groupType: 20,
            gname: '公告'
        });

        // 用来显示群系统消息
        window.Global.msgGroup = new Group({
            gid: -1,
            type: 'group-notice',
            groupType: -1,
            signed: true,
            gname: '群系统消息'
        });
    }, 0);

    return Group;
});
