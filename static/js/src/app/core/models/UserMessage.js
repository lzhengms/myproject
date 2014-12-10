/**
 * Description: 消息
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Message = require('./Message');
    var MessageUtil = require('../message-util');
    var MessageUtilApp = require('../message-util-app');
    var MessageUtilPsp = require('../message-util-psp');

    var _UserMessage = Message.extend({
        setSupport: function () {
            var type = this.get('type');
            var supportEnum = {
                '-1': true,     // 离线文件
                '0': true,      // 普通聊天
                '1': false,      // 加好友验证通过
                '3': false,      // 加好友被拒绝
                '4': false,      // 被别人加为好友
                '10': false,     // 加密的普通聊天
                '11': false,     // 消息回执
                '65': false,     // 加好友验证请求
                '100': false,    // 应用JSON消息
                '101': true,    // 应用XML消息(erp的应用消息)
                '103': false,    // 正在输入的通知
                '195': true,    // 自动回复消息
                '196': true,    // 抖动窗口
                '200': false,    // ORG的JSON消息(不记离线)
                '201': false     // 应用XML消息（不记离线）
            };
            this.set('support', !type || supportEnum[type]);
        },
        // 获得简短版的消息（用于最近一条消息的解析）
        getBriefContent: function () {
            var user = this.get('from');
            var username = user.get('username');
            var type = this.get('type');
            var content = this.get('content');
            if (type == -1) {
                var Enum = ['', '', '文件消息', '语音消息', '离线文件夹'];
                var filetype = content.filetype;
                return '[' + Enum[filetype] + ']';
            }
            if (type == 0 || !type) {
                return MessageUtil.parse(this.get('content'), true);
            }
            if (type == 196) {
                return username + '发送了一个窗口抖动';
            }
            if (type == 195) {
                return '[自动回复]' + content;
            } else if (type == 101) {
                return MessageUtilApp.parse(this.get('content'), true);
            } else if (type == 'psp') {
                //公众号消息解析
                return MessageUtilPsp.parse(content, true);
            }
            /*
             if (type == 100 || type == 101) {
             // 其他消息不解析
             return '[应用消息]';
             }
             */
        },
        // 获得完整版的消息
        render: function () {
            var user = this.get('from');
            var username = user.get('username');
            var type = this.get('type');
            var content = this.get('content');
            var parsedMessage;
            if (type == -1) {
                // 离线文件
                var Enum = ['', '', '离线文件', '语音消息', '离线文件夹'];
                var filename = content.filename;
                var filekey = content.filekey;
                var filetype = content.filetype;
                var fileowner = content.fileowner;
                var result = content.result;  //对方接收了文件
                var fileinfo = content.fileinfo;  //文件信息（选填，音频时长 单位 毫秒)
                var src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + fileowner + '&k=' + filekey;
                if (filetype == 3) {
                    var duration = (fileinfo < 200) ? fileinfo : Math.ceil(fileinfo / 1000) + '\"';
                    parsedMessage = '<div class="type-audio"><a target="_blank" href="' + src + '" title="' + filename + '"><div class="audio"></div></a>'+duration+'</div>';
                } else {
                    if (result) {
                        parsedMessage = '接收了文件:' + '<a target="_blank" href="' + src + '">' + filename + '</a>';
                    } else {
                        parsedMessage = '发送了一个文件:' + '<a target="_blank" href="' + src + '">' + filename + '</a>';
                    }
                }
            } else if (type == 0 || !type) {
                // 普通消息
                parsedMessage = MessageUtil.parse(content);
            } else if (type == 196) {
                // 抖动窗口
                parsedMessage = '发送了一个窗口抖动';
            } else if (type == 195) {
                parsedMessage = '[自动回复]' + content;
            } else if (type == 101) {
                parsedMessage = MessageUtilApp.parse(content);
            } else if (type == 'psp') {
                //公众号消息解析
                parsedMessage = MessageUtilPsp.parse(content);
                if (parsedMessage && typeof parsedMessage == 'object') {
                    if (parsedMessage.render) {
                        return parsedMessage.str;
                    }
                }
            }

            // 能解析的message
            if (parsedMessage) {
             return UserMessage.tpl.render({
                    uid: user.get('uid'),
                    username: username,
                    owner: this.get('owner'),
                    time: this.get('time'),
                    error: this.get('error') ? 'error-message' : '',
                    content: typeof parsedMessage == 'string' ? parsedMessage : parsedMessage.msg,
                    erp_task: typeof parsedMessage == 'string' ? '' : parsedMessage['erp-task'],
                    isPsp: user.get('isPsp') || false
                });

            }
        }
    });

    window.uPool = {};
    window._umids = [];

    function UserMessage(config, silent) {
        var mid = config.mid;

        if (!silent) {
            if (mid) {
                if (window.uPool[mid]) {
                    window._umids.push(mid);
                    return null;
                } else {
                    window.uPool[mid] = true;
                }
            }
        }
        return new _UserMessage(config);
    }

    module.exports = UserMessage;
});
