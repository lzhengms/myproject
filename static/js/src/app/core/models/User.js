/**
 * Description: 用户
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Ajax = require('../ajax');
    var IMAjax = require('../im-ajax');
    var MessageDistributor = require('../message-distributor');
    var UserMessage = require('./UserMessage');
    var ChatObject = require('./ChatObject');
    var Xstring = require('../../../lib/util/string');
    // 所有user的缓存
    var UserPool = {};
    // 所有生日用户的缓存
    var birthdayPool = {};
    // 明天、后天、三天后生日用户的缓存
    var commingBirthdayPool = {};

    var _User = ChatObject.extend({
        attrs: {
            uid: {
                getter: function (val) {
                    // uid为字符串，和服务端统一
                    return val + '';
                }
            },
            type: 'user',
            username: null,
            birthdayToday: false,
            birthdayAnotherday: false,
            days: 0,
            signature: ''//个人签名
        },
        initialize: function (config, silent) {
            config = this.normalizeConfig(config);
            _User.superclass.initialize.call(this, config);
            this.initBindAttr(config);
            UserPool[config.uid] = this;
            silent || (this.get('isPsp') ? '' : this.checkUserName(config));
        },

        normalizeConfig: function (config) {
            return {
                uid: config.uid,
                username: config.username ? config.username :
                    (birthdayPool[config.uid] ? birthdayPool[config.uid].username :
                        (commingBirthdayPool[config.uid] ? commingBirthdayPool[config.uid].username : '')),
                signature: config.signature || '',
                unread: this.get('unreadCount'),
                birthdayToday: birthdayPool[config.uid] ? birthdayPool[config.uid].flag : false,
                birthdayAnotherday: commingBirthdayPool[config.uid] ? commingBirthdayPool[config.uid].flag : false,
                days: commingBirthdayPool[config.uid] ? commingBirthdayPool[config.uid].days : 0,
                lastContactTime: config.lastContactTime,
                isPsp: config.isPsp || false,
                group_type: config.group_type || 40//(40是公众号)
            }
        },
        // 根据uid获得username
        checkUserName: (function () {
            var requestPool = {};

            return function (config, syncCallback, asyncCallback, time) {
                var self = this;
                var uid = this.get('uid');
                var time = time || 0;
                var requestNameAjax;
                //syncCallback && syncCallback(config.username || this.get('uid'));
                if (!config.username) {

                    if (requestPool[uid] && asyncCallback) {
                        return;
                    }

                    if (asyncCallback) {
                        requestPool[uid] = true;
                    }

                    requestNameAjax = Ajax({
                        url: '/_oap/user/info',
                        method: 'GET',
                        data: {
                            uid: uid
                        }
                    });
                    requestNameAjax.done(function (data) {
                        self.set('username', data.username);
                        asyncCallback && asyncCallback(data.username);
                    }).fail(function () {
                            requestPool[uid] = false;
                            if (time > 5) {
                                //self.set('username', '无法识别的用户');
                                //asyncCallback && asyncCallback('无法识别的用户');
                            } else {
                                self.checkUserName({
                                    username: self.get('username')
                                }, null, asyncCallback, time + 1);
                            }
                            ;
                        });
                } else {
                    syncCallback && syncCallback(config.username);
                }
            };
        })(),
        // 更新用户的资料（username或lastContactTime）
        update: function (user) {
            var self = this;
            _update(['username', 'lastContactTime', 'isPsp', 'group_type', 'signature']);

            function _update(keys) {
                $.each(keys, function (index, key) {
                    user[key] && self.set(key, user[key]);
                });
            }
        },
        // 更新用户签名
        updateSign: function (nSignature) {
            var self = this;
            return Ajax({
                url: '/_oap/user/modi',
                method: 'POST',
                data: {
                    uid: self.get('uid'),
                    signature: nSignature
                }
            });
        },
        sendMessage: function (message, _fileObj) {
            var self = this;
            var msg = new UserMessage({
                from: window.Global.user,
                to: this,
                content: _fileObj ? _fileObj : message,
                type: _fileObj ? -1 : 0,
                node: null
            });
            msg.set('time', new Date().getTime().toString().substr(0, 10));
            var data = _fileObj ? {
                cmd: 20480,
                body: {
                    uid: this.get('uid'),
                    multpid: self.get('multpid') || '',
                    filemsg_type: 1007,
                    method: 3,
                    msg: _fileObj
                }
            } : {
                cmd: 32,
                body: {
                    msg_type: 0,
                    uid: this.get('uid'),
                    msg: message
                }
            };
            Ajax({
                url: '/_im/m',
                method: 'POST',
                data: data
            }).on('offline',function () {
                    var dom = msg.get('node');
                    self.reSendMessage(dom);
                }).on('disconnect',function () {
                    var dom = msg.get('node');
                    self.reSendMessage(dom);
                }).on('timeout', function () {
                    var dom = msg.get('node');
                    self.reSendMessage(dom);
                });
            // 先不压入缓存，放在缓冲区里
            // 待反馈成功当作收到消息，放入历史缓存
            // UserMessage.Buffer.push(msg);

            this.trigger('sending-message', msg);
            this.trigger('send-message', msg);
            this.cacheMessage(msg);
        },
        reSendMessage: function (dom) {
            var len = dom.length;
            $(dom[len - 1]).find('.content').append('<div class="error" data-action="reSendMessage" title="无网络，发送失败，点击重发"></div>')
        },
        // 获得user对象字面量用于模板渲染
        getPlainObject: function () {
            var lastMessage = this.get('lastMessage');
            var lastMessageContent = (lastMessage && lastMessage.getBriefContent()) || '';
            return {
                uid: this.get('uid'),
                status: this.get('status'),
                username: this.get('username'),
                signature: (this.get('signature') && Xstring.code(this.get('signature'))) || '',
                signatureTitle: (this.get('signature') && Xstring.codeQuote((this.get('signature')))) || '',
                unreadCount: this.get('unreadCount'),
                lastContactTime: this.get('lastContactTime'),
                birthdayToday: this.get('birthdayToday'),
                birthdayAnotherday: this.get('birthdayAnotherday'),
                days: this.get('days'),
                lastMessageContent: lastMessageContent,
                isPsp: this.get('isPsp'),
                group_type: this.get('group_type')

            };
        },
        // 查看更多消息  暂时没有接口
        /*
         requestPreviousMessages: function() {
         Ajax({
         root: 'oap',
         url: 'im/query',
         method: 'GET',
         data: {
         fid: this.get('uid'),
         size: 100
         }
         }).done(function(data) {
         var messages = $.map(data.data, function(message, index) {
         var from, to;
         if (message.flag) {
         from = message.uh;
         to = message.ul;
         } else {
         from = message.ul;
         to = message.uh;
         }
         return new UserMessage({
         from: User.get(from),
         to: User.get(to),
         content: message.msg,
         time: message.time
         });
         });
         targetWindow.prependMessages(messages);
         });
         },
         */
        // 查看历史消息
        requestHistory: function (formalDate, startAt) {
            var self = this;
            Ajax({
                url: '/_oap/im/query',
                method: 'GET',
                data: {
                    fid: this.get('uid'),
                    start: startAt,
                    size: 20,
                    time: formalDate + ''
                }
            }).done(function (data) {
                    var messages = $.map(data.data, function (message, index) {
                        var from, to;
                        if (message.flag) {
                            from = message.uh;
                            to = message.ul;
                        } else {
                            from = message.ul;
                            to = message.uh;
                        }
                        return new UserMessage({
                            from: User.get(from),
                            to: User.get(to),
                            content: message.msg,
                            time: message.time,
                            mid: message.msgid
                        }, true);
                    });
                    self.trigger('get-history', messages, +data.total);
                });
        },
        // 查看后发送确认收到消息的请求
        confirmMessage: function (messages) {
            var self = this;
            // 发送确认消息
            $.each(messages, function (index, message) {
                // 自己的消息不用确认
                if (message.get('from') != window.Global.user) {
                    IMAjax({
                        cmd: 36877,
                        body: {
                            uid: self.get('uid'),
                            multpid: message.get('multpid'),
                            msg_id: message.get('mid')
                        }
                    });
                    IMAjax({
                        cmd: 30030,
                        body: {
                            msg_id: message.get('mid')
                        }
                    });
                }
            });
        }
    });

    // 暴露的用户构造函数
    // 当用户存在时只返回缓存里的user不再新建
    function User(args, silent) {
        var user = User.get(args.uid);
        if (user) {
            // 更新User状态(可能user只有uid)
            user.update(args);
            return user;
        } else {
            return new _User(args, silent);
        }
    }

    // 加载当天生日用户
    User.getBirthdayUser = function () {
        Ajax({
            url: '/api/birthday/birthuserlist',
            method: 'GET'
        }).done(function (data) {
                var birthUsers, leng;
                if (data.code == 200 && (birthUsers = data.birth_users) && (leng = birthUsers.length)) {
                    for (var i = 0; i < leng; i++) {
                        birthdayPool[birthUsers[i].uid] = {
                            flag: true,
                            username: birthUsers[i].username
                        };
                    }
                }
            });
    }

    //加载明天、后天、三天后生日用户
    User.getCommingBirthdayUser = function () {
        Ajax({
            url: '/api/birthday/birthremindlist',
            method: 'GET'
        }).done(function (data) {
                function getThisDate(str) {
                    return str.substr(0, 4) + '/' + str.substr(4, 2) + '/' + str.substr(6, 2);
                }

                function getToday() {
                    var date = new Date(),
                        year = date.getFullYear(),
                        month = date.getMonth() + 1,
                        day = date.getDate();
                    return year + '/' + month + '/' + day;
                }

                var birthUsers,
                    len,
                    birthday,
                    today = new Date(getToday()),
                    drop = 24 * 3600 * 1000,
                    count = 0;
                if (data.code == 200 && (birthUsers = data.remind_users) && (len = birthUsers.length)) {
                    for (var i = 0; i < len; i++) {
                        birthday = new Date(getThisDate(birthUsers[i].birthday));
                        count = birthday - today;
                        if (count > 0 && count <= drop * 3) {
                            commingBirthdayPool[birthUsers[i].uid] = {
                                flag: true,
                                days: count / drop,
                                username: birthUsers[i].username
                            }
                        }
                    }
                }
            });
    }


    User.get = function (uid) {
        return UserPool[uid];
    };


    User._constructor = _User;

    User.UserPool = UserPool;


    var MSG_TYPE = ['101'];
//        '101':['ERP_TASK','FLOWER','LOTTERY_PRIZE','LOTTERY_TIME','ICON_DISPLAY','CHINA_PARTNER']

    // 发送消息反馈
    MessageDistributor.register(32, function (data) {
        /*
         var message, user;
         if (data.res_code == 200) {
         while(Message.Buffer.length) {
         //message = Message.Buffer.shift();
         message = Message.Buffer.pop();
         //message.set('time', data.time);
         message.set('time', new Date().getTime().toString().substr(0, 10));
         user = message.get('to');
         user.receiveMessage(message);
         }
         }
         // 几乎不会发生
         if (data.res_code === 404) {
         // 发送失败
         user = message.get('to');

         message = Message.Buffer.shift();
         message.set('time', new Date().getTime().toString().substr(0, 10));
         message.set('error', true);
         getPlainObject
         user.receiveMessage(message);
         }
         */
    });

    // 收到新用户消息
    MessageDistributor.register(31, function (data) {
        // 暂时屏蔽系统消息
        var user = null;
        if (data.uid != 0) {
            user = new User({
                uid: data.uid
            });
            var msg = new UserMessage({
                from: user,
                to: window.Global.user,
                content: data.msg,
                time: data.time,
                mid: data.ackid,
                type: data.msg_type,
                multpid: data.multpid,
                is119: data.is119
            }, true);
            if (msg && msg.get('support')) {
                user.trigger('receive-message', msg);
                if (msg.get('type') == 101) {
                    //erp下单,统一个单据不提醒多次，如果是未读的，只是一次
                    var historyCache = user.get('historyCache');
                    var popMsg = user._erpUnreadAndHistory(msg, historyCache);
                    if (popMsg) {
                        historyCache.splice(Global.indexOf(historyCache, popMsg), 1, msg);
                        return;
                    }
                    else {
                        //下面做的是为了不触发lastmessage,因为单据的状态有很多种，一个单据多个状态不触发多条未读，直接修改原来的单据消息状态
                        var task = Global.getErpMatches(msg.get('content'));
                        if (task&&task.taskid) {
                            var messageContainer = user.get('messageContainer');
                            if (!messageContainer) {
                                user.cacheMessage(msg);
                            }
                            else
                            {
                                var dom=messageContainer.get('DOM').find('[data-task-id=' + task.taskid + ']').closest('[class$=-message]');
                                var len=dom.length;
                               /* var childs=messageContainer.get('DOM').children();
                                var length=childs.length;*/

                                if(len===0){
                                    user.cacheMessage(msg);
                                }/*else{
                                    var index=childs.indexOf(dom);

                                    user.set('lastMessage', msg);
                                }
*/
                            }
                        }
                    }
                }
                else {
                    user.cacheMessage(msg);
                }

            }
        }
    });

    // 收到自己在其他端发送的消息
    MessageDistributor.register(36868, function (data) {
        var user = new User({
            uid: data.ruid
        });

        var msg = new UserMessage({
            from: window.Global.user,
            to: user,
            content: data.msg,
            time: data.time,
            mid: data.ackid,
            multpid: data.multpid,
            is119: data.is119
        }, true);

        if (msg) {
            user.cacheMessage(msg);
            user.trigger('send-message', msg);
        }
    });

    // 收到离线文件消息
    MessageDistributor.register(20481, function (data) {
        var user = new User({
            uid: data.uid
        });

        // 屏蔽离线文件夹
        if ((data.filemsg_type == 1007 || data.filemsg_type == 1008) && data.msg.filetype != 4) {
            var msg = new UserMessage({
                from: user,
                to: window.Global.user,
                content: data.msg,
                time: data.time,
                mid: data.msg_id,
                type: -1,
                multpid: data.multpid,
                is119: data.is119
            }, true);

            if (msg && msg.get('support')) {
                user.trigger('receive-message', msg);
                user.cacheMessage(msg);
            }
        }

        /*// 屏蔽离线文件夹
         if (data.filemsg_type == 1008 && data.msg.filetype != 4) {
         var msg = new UserMessage({
         from: window.Global.user,
         to: user,
         content: data.msg,
         time: data.time,
         mid: data.msg_id,
         type: -1,
         multpid: data.multpid
         }, true);
         if (msg) {

         user.cacheMessage(msg);
         user.trigger('send-message', msg);
         }
         }*/
    });

    //接受离线消息
    MessageDistributor.register(119, function (data) {
        var len = data.mults.count,
            data = data.mults.data;
        messages = {__m: []};
        for (var i = 0; i < len; i++) {
            data[i].msgcmd.body.ackid = data[i].msg_id;
            data[i].msgcmd.body.msg_id = data[i].msg_id;
            data[i].msgcmd.body.is119 = 119;  //此消息是119发送的
            messages['__m'].push(data[i].msgcmd);
        }
        MessageDistributor(messages);
    });


    setTimeout(function () {
        // 注册一个自己
        window.Global.user = new User({
            uid: window.Global.uid,
            username: window.Global.username
        });
    }, 0);

    return User;
});
