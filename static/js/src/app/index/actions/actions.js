/**
 * Description: 绑定全局事件
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var action = require('../../../lib/util/dom/action');
    var CuteDate = require('../../../lib/util/date').format;

    var Ajax = require('../../core/ajax');
    var User = require('../../core/models/User');
    var Group = require('../../core/models/Group');
    var MessageUtil = require('../../core/message-util');
    var InformationReminder = require('../information-reminder');
    var GroupList = require('../../core/models/GroupList');

    var AppBoxTpl = require('../tpl/dialog/app-box-dialog');
    var ChatWindow = require('../chat-window');

    var UploadPicture = require('../upload-picture');
    var ErrorDialog = require('../cmp/error-dialog');
    var FancyConfirmBox = require('../cmp/fancy-confirm-box');
    var UserInfoDialogTpl = require('../tpl/dialog/user-info-dialog');
    var GroupInfoDialogTpl = require('../tpl/dialog/group-info-dialog');
    var DiscussionInfoDialogTpl = require('../tpl/dialog/discussion-info-dialog');
    var Xstring = require('../../../lib/util/string');
    var JSON = require('../../../lib/util/json');

    action.listen({
        // DropDown
        'dropdown': {
            is: function () {
                var menu = $("#nav-dropdown-menu");
                if (menu.is(':visible')) {
                    $("#nav-dropdown-menu").fadeOut(300);
                } else {
                    $("#nav-dropdown-menu").fadeIn(300);
                }
            },
            not: function () {
                $("#nav-dropdown-menu").fadeOut(300);
            }
        },
        // 全部已阅
        'checkout-all': function () {
            $.each(User.UserPool, function (index, user) {
                user.checkoutUnread();
            });
            $.each(Group.GroupPool, function (index, group) {
                group.checkoutUnread();
            });
            InformationReminder.clear();
        },
        'open-app-box': (function () {
            var AppBox = new FancyConfirmBox({
                title: '应用盒子',
                width: 590,
                height: 460,
                hasMask: {
                    hideOnClick: true
                }
            }).render();
            return function (e, target) {
                var self = this;
                var REG_SID = /\{SID\}/g;
                var REG_UID = /\{UID\}/g;
                var now = new Date();
                var curtime = CuteDate(now, 'yyyy-MM-dd%20HH:mm:ss');

                Ajax({
                    url: '/_oap/app/unitmenu',
                    method: 'GET'
                }).done(function (data) {
                        // filter
                        data = $.grep(data, function (app, index) {
                            return app.url && (app.url != '#') && app.display != -1;
                        });
                        // replace uid sid #curtime#
                        data = $.map(data, function (app, index) {
                            app.url = app.url.replace(REG_SID, Global.sid);
                            app.url = app.url.replace(REG_UID, Global.uid);
                            app.url = app.url.replace("#curtime#", curtime);

                            return app;
                        });
                        AppBox.set('content', AppBoxTpl.render({appList: data}));
                        AppBox.show();
                    });
            }
        })(),
        'logout': function () {
            //Cookie.del('Aid', 'OAPSID', 'PHPSESSID');
            window.resetCookie = false;  //用户自行退出，关闭重置cookie开关
            sendLogoutMessage();
            location.href = window.Global.url + 'login/logout';
        },
        'user-info': (function () {
//            var loading = false;
            var UserInfoFancyConfirmBox = new FancyConfirmBox({
                title: '用户资料',
                width: 'auto',
                height: 'auto',
                hasMask: {
                    hideOnClick: false
                },
                effect: function (ele) {
                    ele.fadeIn(300);
                }
            }).render();
            UserInfoFancyConfirmBox.element.on('click', '.talk-to-btn', function () {
                UserInfoFancyConfirmBox.hide();
            });
            function editSignature(e) {
                var who = getWho($(e.target));
                var target = $(e.target);
                var inputer = target, nSignVal = inputer.val();
                var $edit = target.closest('.signature-edit');

                if (nSignVal.length > 128) {
                    ErrorDialog.set('content', '个人签名不能超过128位字符').show();
                } else if (nSignVal !== who.get('signature')) {
                    who.updateSign(nSignVal).done(function () {
                        who.set('signature', nSignVal);
                        $edit.prev().text(nSignVal);
                    });
                }
                $edit.hide().prev().show();
            }

            var i = 0;
            UserInfoFancyConfirmBox.element.on('keydown', 'input', function (e) {
                if (e.keyCode === 13) {
                    i++;
                    editSignature(e);
                }
            });
            UserInfoFancyConfirmBox.element.on('blur', 'input', function (e) {
                if (i <= 0) {
                    editSignature(e);
                }

            });
            return function (e, target) {
                /* if (loading) {
                 return;
                 }*/
                var who = getWho(target);
                who.set('wrap', target);
                var obj = $.extend({}, who.getPlainObject());
                // loading = true;
                Ajax({
                    url: '/_oap/user/info',
                    method: 'GET',
                    data: {
                        uid: who.get('uid')
                    }
                }).done(function (data) {
                        // loading = false;
                        obj = $.extend(obj, {
                            username: data.username,
                            department: data.depts[0].deptname,
                            signature: Xstring.code(data.signature),
                            joinYear: '',
                            lSavePoint: '',
                            position: ''
                        });

                        UserInfoFancyConfirmBox.set('content', UserInfoDialogTpl.render(obj));

                        // 通过erp反代加载用户信息
                        Ajax({
                            url: '/ERP/ajax/a0_frmajaxfor91u.aspx?action=PersonInfo&uid=' + window.Global.uid,
                            //url:'http://91jk.99.com/ajax/a0_frmajaxfor91u.aspx?action=PersonInfo&uid=' + window.Global.uid,
                            method: 'GET'
                        }).done(function (data) {
                                var data = JSON.parse(data);
                                $('#userPosition').text(data.sGwName);
                                $('#userJoinYear').text(data.joinYear);
                                $('#userSavePoint').text(data.lSavePoint);
                            });

                        who.set('signature', data.signature);


                        UserInfoFancyConfirmBox.show();

                        // 头像上传组件
                        /*  var picParams = {
                         url: window.Global.oaUrl + 'api/face/upload',
                         node: '#upload-user-avatar',
                         accept: 'image*/
                        /*',
                         type: '*.jpg; *.jpeg;'
                         };
                         var u = UploadPicture(picParams);
                         u.on('success',function (file, data) { // 上传成功
                         if (data.code == 200) {
                         // reload user faceimg
                         var face40 = $('#face40');
                         face40.attr('src', face40.attr('src') + '&r=' + (+new Date()));
                         var face100 = $('#face100');
                         face100.attr('src', face100.attr('src') + '&r=' + (+new Date()));
                         } else {
                         ErrorDialog.set('content', data.msg).show();
                         }
                         }).on('successAdd', function (file) {
                         u.set('data', {filesize: file.size, photo: file});
                         u.upload();
                         });*/

                    }).fail(function () {
                        // loading = false;
                        ErrorDialog.set('content', '找不到该用户或已离职').show();
                    });
            }
        })(),
        'group-info': (function () {
            var loading = false;
            var GroupInfoFancyConfirmBox = new FancyConfirmBox({
                title: '群资料',
                width: '500',
                height: 'auto',
                hasMask: {
                    hideOnClick: true
                }
            }).render();
            GroupInfoFancyConfirmBox.element.on('click', '.talk-to-btn', function () {
                GroupInfoFancyConfirmBox.hide();
            });
            return function (e, target) {
                if (loading) {
                    return;
                }
                var length = $(target).closest('[data-role="group-search"]').length;
                var self = this;
                var who = getWho(target);
                who.set('wrap', target);
                var obj = $.extend({}, who.getPlainObject());
                loading = true;
                Ajax({
                    url: '/_oap/group/info',
                    method: 'GET',
                    data: {
                        gid: who.get('gid')
                    }
                }).done(function (data) {
                        loading = false;
                        obj = $.extend(obj, {
                            creatorid: data.creatorid,
                            notice: MessageUtil.parseLink(data.notice) || '&nbsp;',
                            intro: MessageUtil.parseLink(data.introduction) || '&nbsp;',
                            type: GroupList.getCategoryName(data.category),
                            groupname: data.gname,
                            'group_search': length > 0 ? true : false
                        });
                        Ajax({
                            url: '/_oap/user/info',
                            method: 'GET',
                            data: {
                                uid: data.creatorid
                            }
                        }).done(function (data) {
                                obj = $.extend(obj, {
                                    creator: data.username
                                });
                                GroupInfoFancyConfirmBox.set('content', GroupInfoDialogTpl.render(obj));
                                GroupInfoFancyConfirmBox.show();
                            }).on('not-found', function () {
                                obj = $.extend(obj, {
                                    creator: '用户不存在 '
                                });
                                GroupInfoFancyConfirmBox.set('content', GroupInfoDialogTpl.render(obj));
                                GroupInfoFancyConfirmBox.show();
                            });
                    }).fail(function () {
                        loading = false;
                    });
            }
        })(),
        'discussion-info': (function () {
            var loading = false;
            var DiscussionInfoFancyConfirmBox = new FancyConfirmBox({
                title: '讨论组资料',
                width: '500',
                height: 'auto',
                hasMask: {
                    hideOnClick: true
                }
            }).render();
            DiscussionInfoFancyConfirmBox.element.on('click', '.talk-to-btn', function () {
                DiscussionInfoFancyConfirmBox.hide();
            });
            return function (e, target) {
                if (loading) {
                    return;
                }
                var who = getWho(target);
                who.set('wrap', target);
                loading = true;
                Ajax({
                    url: '/_oap/discussion/info',
                    method: 'GET',
                    data: {
                        gid: who.get('gid')
                    }
                }).done(function (data) {
                        loading = false;
                        var result = $.extend(data, {
                            notice: MessageUtil.parseLink(data.notice) || '&nbsp;'
                        });
                        DiscussionInfoFancyConfirmBox.set('content', DiscussionInfoDialogTpl.render(result));
                        DiscussionInfoFancyConfirmBox.show();
                    }).fail(function () {
                        loading = false;
                        var result = {
                            gid: '',
                            gname: '讨论组不存在',
                            notice: '&nbsp;'
                        };
                        DiscussionInfoFancyConfirmBox.set('content', DiscussionInfoDialogTpl.render(result));
                        DiscussionInfoFancyConfirmBox.show();
                    });
            }
        })(),
        // 编辑用户信息-个性签名
        'signature-edit': function (e, target) {
            var signVal = target.text(), inputer = target.next();
            target.hide();
            inputer.show().find(':text').val(signVal).focus().select();
        },
        // 开启与target的聊天
        'talk-to': function (e, target) {
            var scrollFlag = true;
            var who = getWho(target),
                $vernier = $('#vernier-panel').find('.vernier'),
                wrap = who.get('wrap') ? who.get('wrap').closest('[data-type]') : target.closest('[data-type]');
            var offset = 21;
            var thisObj = this.closest('[data-action="talk-to"]'),
                thisBody = $('.body');
            thisObj.addClass('active');

            ChatWindow.set('target', who);
            who.set('wrap', null);

            function getScreenPosition(object) {
                var position = {};
                position.x = object.getBoundingClientRect().left;
                position.y = object.getBoundingClientRect().top;
                return position;
            }

            function wrapScroll() {
                var height = thisObj.height(),
                    selfScreenY = getScreenPosition(thisObj.get(0)).y,
                    bodyScreenY = getScreenPosition(thisBody.get(0)).y,
                    bodyHeight = thisBody.height(),
                    top = selfScreenY - bodyScreenY;//top = wrap.position().top;
                if (top + height / 2 < 0) {
                    $vernier.css({top: 0});
                    $vernier.hide();
                } else if (bodyHeight - top - height / 2 < 0) {
                    $vernier.css({top: bodyHeight});
                    $vernier.hide();
                } else {
                    $vernier.show();
                    $vernier.css({top: top + height / 2 - offset});
                }
            }

            $('.body').on('scroll', function() {
                if (scrollFlag) {
                    setTimeout(function() {
                        wrapScroll();
                        scrollFlag = true;
                    }, 200);
                    scrollFlag = false;
                }
            });
            setTimeout(function () {
                wrapScroll();
            }, 0);
        }
    });

    // 获得对象
    function getWho(target) {
        var wrap = target.closest('[data-type]');
        var type = wrap.data('type');

        var who;
        switch (type) {
            case 'user':
                who = new User({
                    uid: wrap.data('uid')
                });
                if(who.get('isPsp')){
                    //公众号不能上传文件，不要上传文件的按钮
                    who.set('chatFile', false);
                }else{
                    who.set('chatFile', true);
                }
                break;
            case 'group':
                var gid = wrap.data('gid'), msgGroup = window.Global.msgGroup;
                if (gid == msgGroup.get('gid')) {
                    who = msgGroup;
                } else {
                    who = new Group({
                        gid: wrap.data('gid')
                    });
                    who.set('chatFile', false);
                }
                break;
            case 'discussion':
                who = new Group({
                    gid: wrap.data('gid')
                });
                who.set('chatFile', false);
                break;
            default :
                break;
        }
        return who;
    }

    function sendLogoutMessage() {
        return Ajax({
            url: '/_im/logout',
            method: 'POST',
            async: false,
            data: {
                cmd: 9
            }
        });
    }

    window.onbeforeunload = function () {
        return '关闭浏览器聊天内容将会丢失！';
    };
    window.onunload = function () {
        sendLogoutMessage();
    }

});
