/**
 * Description: 消息
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Message = require('./Message');
    var MessageUtil = require('../message-util');
    var Xstring = require('../../../lib/util/string');

    // 群系统消息
    var SysMsg = {"10001": true, "10004": true, "10006": true};

    var _GroupMessage = Message.extend({
        initialize: function(config) {
            _GroupMessage.superclass.initialize.call(this, config);
            this.set('sysMsg', SysMsg[this.get('type')] ? true: false);
        },
        setSupport: function() {
            var type = this.get('type');
            var supportEnum = {
                '-1': true,     // 离线文件
                '0': true,      // 普通聊天
                '1': true,      // 文件消息
                '2': true,      // 系统公告
                '3': false,
                '4': true,      // 群文件
                '100': false,    // 应用JSON消息
                '101': false,    // 组织JSON消息
                '102': false,    // 应用XML消息
                '10000': false,
                '10001': true,    // 群被解散
                '10002': false,    // 群被转让
                '10003': false,    // 群资料改变
                '10004': true,    // 用户退出群
                '10005': true,    // 用户被加入
                '10006': true,    // 用户被移出群
                '10007': false,    // 等待审核或确认
                '10008': true,    // 已被审批或确认
                '10009': true,    // 授权改变
                '10010': false
            };
            this.set('support', !type || supportEnum[type]);
        },
        // 获得简短版的消息（用于最近一条消息的解析）
        getBriefContent: function() {
            var user = this.get('from');
            var username = user.get('username');
            var type = this.get('type');
            var content = this.get('content');
            if (type == -1 || type == 1) {
                var Enum = ['', '', '文件消息', '语音消息', '离线文件夹'];
                var filetype = content.filetype;
                return '[' + Enum[filetype] + ']';
            }
            if (type == 4) {
                return '[文件消息]';
            }
            if (type == 2) {
                return MessageUtil.parseNotice(this.get('content')).title;
            }
            if (type == 0 || !type) {
                return MessageUtil.parse(this.get('content'), true);
            }
        },
        render: function () {       // 获得完整版的消息
            var user = this.get('from');
            var group = this.get('group');
            var gid = group && group.get('gid');
            var gname = group ? group.get('gname') : '';
            var uid = user.get('uid');
            var username = user.get('username');
            var type = this.get('type');
            var groupType = group && group.get('groupType');
            var content = this.get('content');
            var reason = this.get('reason');
            var parsedMessage;
            if (groupType === 2) {
                groupType = '讨论组';
            } else {
                groupType = '群';
            }
            if (type == -1 || type == 1) {
                // 离线文件
                var Enum = ['', '', '离线文件', '语音消息', '离线文件夹'];
                var filename = content.filename;
                var filekey = content.filekey;
                var filetype = content.filetype;
                var fileowner = content.fileowner;
                var fileinfo = content.fileinfo;
                var src;
                if (filetype == 3) {
                    var duration = Math.ceil(fileinfo / 1000) + '\"';
                    src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + fileowner + '&k=' + filekey;
                    parsedMessage = '<div class="type-audio"><a target="_blank" href="' + src +'" title="' + filename +'"><div class="audio"></div></a>'+duration+'</div>';
                } else {
                    src = window.Global.oapUrl + 'gshare/down?gid=' + gid + '&fid=' + filekey;
                    parsedMessage = '[' + Enum[filetype] + ']' + '<a target="_blank" href="' + src + '">' + filename + '</a>';
                }
            } else if (type == 0 || !type) {
                // 普通消息
                parsedMessage = MessageUtil.parse(content);
            } else if (type == 4) {
                var filename = content.filename;
                var filekey = content.filekey;
                var fileowner = content.uid;
                var src = window.Global.oapUrl + 'gshare/down?gid=' + gid + '&fid=' + filekey;
                parsedMessage = '上传了一个群共享文件:' + '<a target="_blank" href="' + src + '">' + filename + '</a>';
            } else if (type == 2) {
                // 公告，特殊解析处理
                return GroupMessage.noticeTpl.render({
                    username: username || uid,
                    time: this.get('time'),
                    noticeInfo: MessageUtil.parseNotice(content)
                });
            } else if (type >= 10000) {
                // 群通知消息处理
                return groupNoticeHandler(type, gid, gname, uid, username, this.get('to'), groupType, reason);
            }

            // 能解析的message
            if (parsedMessage) {
                return GroupMessage.tpl.render({
                    uid: uid,
                    username: username || uid,
                    owner: this.get('owner'),
                    time: this.get('time'),
                    error: this.get('error') ? 'error-message' : '',
                    content: parsedMessage,
                    erp_task:'',
                    isPsp: false
                });
            }
        }
    });

    GroupMessage.Buffer = [];

    window.gPool = {};
    window._gmids = [];

    function GroupMessage(config, silent) {
        var mid = config.mid;

        if (!silent) {
            if (mid) {
                if (window.gPool[mid]) {
                    window._gmids.push(mid);
                    return null;
                } else {
                    window.gPool[mid] = true;
                }
            }
        }
        return new _GroupMessage(config);
    }

    // TODO 后面整理成模板文件
    function groupNoticeHandler(type, gid, gname, uid, username, toUser, groupType, reason) {
        var ret = '',
            isOwner = toUser == window.Global.user,
            tid = toUser.get('uid'),
            tname = toUser.get('username'),
            gname = Xstring.code(gname);

        switch(type) {
            case 10001:
                //群被解散
                ret = '<div class="group-system-notice">群 <strong>'+gname+'</strong>('+gid+') 已解散</div>';
                break;
            case 10004:
                //用户退出群
                if(isOwner) {
                    ret = '<div class="group-system-notice"">您已退出'+groupType+' <strong>'+gname+'</strong>('+gid+')</div>';
                } else {
                    ret = '<div class="group-notice" data-uid="'+tid+'"><strong class="username">'+tname+'</strong>('+tid+') 已退出'+groupType+' <strong>'+gname+'</strong>('+gid+')</div>';
                }
                break;
            case 10005:
                //用户被加入群
                if(isOwner) {
                    if (uid === Global.uid) {
                        ret = '<div class="group-notice"><strong>您</strong> 创建了该'+groupType+'</div>';
                    } else {
                        if (uid != 'undefined') {
                            ret = '<div class="group-notice"><strong>'+username+'</strong>('+uid+') 邀请您加入该'+groupType+'</div>';
                        } else {
                            ret = '<div class="group-notice">您已加入该'+groupType+'</div>';
                        }

                    }
                } else {
                    ret = '<div class="group-notice" data-uid="'+tid+'"><strong class="username">'+tname+'</strong>('+tid+') 加入该'+groupType+'</div>';
                }
                break;
            case 10006:
                //用户被移出群
                if(isOwner) {
                    ret = '<div class="group-system-notice">您已被移出群 <strong>'+gname+'</strong>('+gid+')</div>';
                } else {
                    ret = '<div class="group-notice" data-uid="'+tid+'"><strong class="username">'+tname+'</strong>('+tid+') 已被移出群 <strong>'+gname+'</strong>('+gid+')</div>';
                }
                break;
            case 10008:
                //用户权限改变，被改成管理员
                if (reason !== undefined) {
                    ret = '<div class="group-system-notice"><strong>'+gname+'</strong>('+gid+') 拒绝您的入群请求<br>'+
                          '拒绝理由：'+reason+'</div>';
                } else {
                    ret = '<div class="group-notice" data-uid="'+uid+'"><strong>'+gname+'</strong>('+gid+') 的管理员<br><strong class="username">'+username+'</strong>('+uid+')已通过您的加群请求</div>';
                }
                break;
            case 10009:
                //用户的管理权限被改变
                ret = '<div class="group-notice">群 <strong>'+gname+'</strong>('+gid+') 的管理权限发生改变</div>';
                break;
        }
        return ret;
    }

    module.exports = GroupMessage;
});