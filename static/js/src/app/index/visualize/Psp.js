/**
 * @description 公众号im消息
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-3-5
 */
define(function (require, exports, module) {
    var $ = require('$');
    var User = require('../../core/models/User');
    var UserMessage = require('../../core/models/UserMessage');
    var IMAjax = require('../../core/im-ajax');
    var Ajax = require('../../core/ajax');
    var MessageDistributor = require('../../core/message-distributor');
    var PersonTab = require('../personnel-tab');
    var RecentContactList = require('../../core/models/RecentContactList');
    var chatWindow=require('../chat-window');

    var ENUM = {
        65393: 65143,
        65394: 65144
    };

    User._constructor.implement({
        //登录公众号
        signIn: function () {
            var self = this;
            IMAjax({
                cmd: 65139,
                body: {
                    gid: self.get('uid'),
                    group_type: self.get('group_type')
                }
            });
        },
        //开始接收公众号
        sayHello: function () {
            var self = this;
            IMAjax({
                cmd: 65141,
                body: {
                    gid: self.get('uid'),
                    group_type: self.get('group_type'),
                    offline_msgs_count: 80,
                    start_msgid: "0"
                }
            });
        },
        //确认公众服务群发消息cmd:65143   确认公众服务个人消息cmd:65144
        confirmPspMessage: function (messages) {
            var self = this;
            $.each(messages, function (i, message) {
                IMAjax({
                    cmd: message.get('cmd'),
                    body: {
                        gid: self.get('uid'),
                        group_type: self.get('group_type'),
                        msg_id: message.get('mid')
                    }
                });
            });
        },
        //回复公众服务消息
        sendPspMessage: function (message, _fileObj) {
            var self = this;
            Ajax({
                url: '/_im/m',
                method: 'POST',
                contentType: 'text/plain',
                data:
                 {
                    cmd: 65142,
                    body: {
                        group_type: self.get('group_type'),
                        gid: this.get('uid'),
                        msg: message
                    }
                }
            });
            var msg = new UserMessage({
                from: window.Global.user,
                to: this,
                content: _fileObj ? _fileObj : message,
                type: _fileObj ? -1 : 'psp'
            });
            // 先不压入缓存，放在缓冲区里
            // 待反馈成功当作收到消息，放入历史缓存
            // UserMessage.Buffer.push(msg);
            msg.set('time', new Date().getTime().toString().substr(0, 10));
            this.trigger('sending-message', msg);
            this.trigger('send-message', msg);
            this.cacheMessage(msg);
        }


    });

    //获取psp的对象
    User.getPspObject = function (user) {
        user.uid = user.pspid;
        user.username = user.name;
        user.isPsp = true;
        user.group_type = 40;
        return user;
    }
    //获取公众号信息
    User.pspInfo = function (pspid) {
        var jqXHR = Ajax({
            url: '/pspapi/91u/psp/info?sid=' + Global.sid + '&pspid=' + pspid,
            method: 'GET'
        });
        return jqXHR;
    }


    //登录公众号
    MessageDistributor.register(65139, function (data) {
        var user;
        if (data.res_code == 200) {
            user = User.get(data.gid);
            user.sayHello();
            user.set('signed', true);
        }
    });

    //开始接收公众号消息
    MessageDistributor.register(65141, function (data) {
        if (data.res_code == 200) {
            user = User.get(data.gid);
            user.set('receving', true);
        }
    });

    //接收公众服务群发消息cmd:65393,公众服务个人消息cmd:65394,收到自己在其他端发送的消息:65397
    MessageDistributor.register([65393, 65394, 65397], function (data, cmd) {
        var user = null;
        if (data.gid != 0) {
            // 可能没有该用户记录

            user = new User({
                uid: data.gid
            });
            $.each(data.mults.data, function (index, message) {
                var msg = new UserMessage({
                    from: cmd===65397?window.Global.user:user,
                    to: cmd===65397?user:window.Global.user,
                    content: message.msg_data,
                    time: message.msg_time,
                    mid: message.msg_id,
                    type: 'psp',
                    cmd: ENUM[cmd]
                }, true);

                if (msg) {
                    if (cmd === 65397) {
                        user.trigger('send-message', msg);
                    } else {
                        user.trigger('receive-message', msg);
                    }
                    user.cacheMessage(msg);
                }
            });
        }

    });

    //接收公众服务订阅通知65395,接收公众服务退订通知65396
    MessageDistributor.register([65395, 65396], function (data, cmd) {
        var pspid = data.gid;
        var panel = $('.category-panels .friends.category-panel');
        var pspPanel = panel.find('[data-listid="0000"]');
        var listName = pspPanel.find('[data-role="list-name"]');
        var listContent = pspPanel.find('[data-role="list-content"]');
        var countReg = /(\d+)/g;
        User.pspInfo(pspid).done(function (user) {
            var user = User.getPspObject(user);
            user = new User(user);
            if (cmd === 65395) {
                //登录公众号
                user.signIn();
                //添加到列表中
                listContent.append(user.addDOM());
            } else if (cmd === 65396) {
                //确认消息
                user.checkoutUnread();
                //移除所有的dom操作
                user.handleDOM(function (dom) {
                    chatWindow.resetTarget(user);
                    var Pool = RecentContactList.get('Pool');
                    var index = $.inArray(user, Pool);
                    if (index !== -1) {
                        Pool.splice(index, 1);
                    }
                    dom.remove();

                });

            }
            //修改公众号的总数
            var text = listName.text();
            text = text.replace(countReg, function (match, $1) {
                if (cmd === 65395) {
                    //加关注
                    return +$1 + 1;
                } else if (cmd === 65396) {
                    //取消关注
                    return +$1 - 1;
                }

            });
            listName.text(text);
        });
    });


});