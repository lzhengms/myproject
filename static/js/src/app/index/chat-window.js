/**
 * Description: 聊天窗口
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../lib/util/base');
    var Action = require('../../lib/util/dom/action');
    var Scroll = require('../../lib/util/dom/scroll');

    var Ajax = require('../core/ajax');
    var IMAjax = require('../core/im-ajax');
    var MessageDistributor = require('../core/message-distributor');
    var MessageUtil = require('../core/message-util');
    var MessageUtilPsp = require('../core/message-util-psp');

    var Emotion = require('./emotion');
    var HistoryPagination = require('./cmp/history-pagination');
    var HistoryCalendar = require('./cmp/history-calendar');
    var ErrorDialog = require('./cmp/error-dialog');
    var DisplayPicDialog = require('./cmp/display-pic-dialog');
    var TimeIntervalTpl = require('./tpl/time-interval');

    var UploadPicture = require('./upload-picture');
    var PicLoader = require('./pic-loader');

    var MessageFileProgressTpl = require('./tpl/message-file-progress');
    var MessageImgProgressTpl = require('./tpl/message-img-progress');
    var RecentContactList = require('../core/models/RecentContactList');
    var JSON = require('../../lib/util/json');
    var Browser = require('../../lib/util/bom/browser');

    // 子菜单的枚举
    var statusEnum = ['chat-room', 'notice-room', 'history', 'group-share', 'group-notice-room', 'group-info', 'discussion-info'];

    var ChatWindow = Base.extend({
        attrs: {
            target: null,
            status: null,

            DOM: $("#chat-window"),
            'history-container': null,
            'notice-container': null,
            'group-notice-container': null,

            containerCount: 10,
            containers: [],

            targets: []
        },
        initialize: function (config) {
            ChatWindow.superclass.initialize.call(this, config);
            this.initContainers();
            this.initComposition();
        },
        initContainers: function () {
            var container, containerDOM;
            var DOM = this.get('DOM').find('.chat-room .body');
            var containers = this.get('containers');

            for (var i = 0; i < this.get('containerCount'); i++) {
                containerDOM = $('<div class="messages-container" data-role="messages"></div>');
                DOM.append(containerDOM);
                container = new MessageContainer({
                    DOM: containerDOM
                });
                containers.push(container);
            }

            this.set('notice-container', new MessageContainer({ DOM: $("#notice-container") }));
            this.set('history-container', new MessageContainer({ DOM: $("#history-container") }));
            this.set('group-notice-container', new MessageContainer({ DOM: $("#group-notice") }));
        },
        // 载入要聊天的对象(user, group, discussion)
        loadTarget: function (target) {
            var type = target.get('type');
            var DOM = this.get('DOM');

            this.type = type;

            DOM.removeClass('type-user type-group type-discussion');
            DOM.find('.head').removeClass('birthday');
            if (type === 'user') {
                this.name = target.get('username');
                this.uid = target.get('uid');
                // 查询聊天对象的在线状态
                if (target.get('isPsp')) {
                    //公众号不需要在线离线状态
                    ChatWindowSingleton.get('DOM').find('[data-role=status]').text('');
                } else {
                    this.requestStatus();
                }

                DOM.addClass('type-user');

                if (target.get('birthdayToday')) {
                    DOM.find('.head').addClass('birthday');
                }
            } else if (type === 'group') {
                this.name = target.get('gname');
                this.gid = target.get('gid');
                if (!target.get('signed')) {
                    this.hide();
                    ErrorDialog.set('content', '您不是该群成员').show();
                    return;
                }
                DOM.addClass('type-group');
            } else if (type === 'discussion') {
                this.name = target.get('gname');
                this.gid = target.get('gid');
                if (!target.get('signed')) {
                    this.hide();
                    ErrorDialog.set('content', '您不是该讨论组成员').show();
                    return;
                }
                DOM.addClass('type-discussion');
            }
            DOM.find('.head .name').text(this.name);
            this.show();

            target.set('targetWindow', this);
            return true;
        },
        show: function () {
            $("#main-content").addClass('chatting');
            this.get('DOM').addClass('show').show();
        },
        hide: function () {
            $("#main-content").removeClass('chatting');
            this.get('DOM').hide().removeClass('show');
        },
        // 初始化组件
        initComposition: function () {
            var self = this;

            // 初始化分页组件
            var paginationDOM = $("#history-pagination");
            HistoryPagination.set('element', paginationDOM);
            HistoryPagination.requestHistory = function (current) {
                var formalDate = HistoryCalendar.get('formalDate');
                self && self.get('target') && self.get('target').requestHistory(formalDate, current * this.get('pageSize'));
            };

            // 初始化日历组件
            var calendarDOM = $("#history-calendar");
            HistoryCalendar.set('trigger', calendarDOM);

            // 图片上传组件
            var picParams = {
                url: window.Global.oaUrl + 'sfs/ops/upload_rest.php?client=web91u',
                //外网生产环境
                // url: 'http://imnd.99.com/sfs/ops/upload_rest.php?client=web91u',
                node: '#upload-pic',
                accept: 'image/*',
                type: '*.jpg; *.jpeg; *.gif; *.png; *.bmp',
                maxSize: '2MB'
            };
            var u = UploadPicture(picParams);
            var imgTargets = [];

            function fileItem(targets, file) {
                var currentFileObject = $.grep(targets, function (item, index) {
                    if (item.index === file.index) {
                        return item;
                    }
                });
                return currentFileObject[0];
            }

            u.on('progress',function (file, loaded, total) { // 上传进度
                var currentFileObject = fileItem(imgTargets, file);
                var per = parseInt(loaded * 100 / total, 10);
                var dom = currentFileObject.messageContainer.find('.img-index-' + file.index);
                if (isNaN(per)) {
                    ErrorDialog.set('content', '网络已断开，上传失败').show();
                    dom.remove();
                } else {
                    if (per < 100) {
                        dom.find('.num').html(per + '%');
                        dom.find('.bar').width(per + '%');
                    } else {
                        dom.find('.num').html(99 + '%');
                        dom.find('.bar').width(99 + '%');
                    }
                }
            }).on('success',function (file, data) { // 上传成功
                    var currentFileObject = fileItem(imgTargets, file);
                    var dom = currentFileObject.messageContainer.find('.img-index-' + file.index);
                    dom.remove();

                    if (data.fkey) {
                        if (currentFileObject.target.get('isPsp')) {
                            self.sendMessage(data.fkey, currentFileObject.target, null, true, 2);
                        } else {
                            var content = MessageUtil.format(data.fkey, 'PHOTO');
                            self.sendMessage(content, currentFileObject.target);
                        }
                        imgTargets.splice(indexOf(imgTargets, currentFileObject), 1);
                    }


                }).on('successAdd',function (file) {
                    var file_target_info = {index: file.index, target: self.get('target'),
                        messageContainer: self.get('target').get('messageContainer').get('DOM')};
                    imgTargets.push(file_target_info);
                    var progressData = {
                        index: file.index,
                        uid: Global.user.get('uid')
                    }
                    var progress = MessageImgProgressTpl.render(progressData);
                    if (file_target_info.messageContainer) {
                        var body = file_target_info.messageContainer.closest('.body');
                        file_target_info.messageContainer.append(progress);
                        setTimeout(function () {
                            Scroll.to(body, 'bottom');
                        }, 10);
                    }
                    u.upload();
                }).on('error', function (file, data, result) { // 文件上传失败时或者被终止时触发，引起的可能性有：上传地址不存在/主动终止
                    var currentFileObject = fileItem(imgTargets, file);
                    var dom = currentFileObject.messageContainer.find('.img-index-' + file.index);
                    dom.remove();
                });

            /************浏览器能力检测，支持fileReader功能的可以分段******/
            var uploadFileMaxSize = '2MB';
            var md5 = false;
            var chunk = false;
            try {
                new FileReader();
                uploadFileMaxSize = '200MB';
                md5 = true;
                chunk = true;
            } catch (e) {
                uploadFileMaxSize = '2MB';
                md5 = false;
                chunk = false;
            }
            /*****************以上为FileReader对象检测***************/

            //用户之间文件上传组件
            var fileParams = {
                //外网生产环境
                // url:'http://imnd.99.com/v2/sfs/api/ofs/upload',
                url: window.Global.oaUrl + 'v2/sfs/api/ofs/upload',
                node: '#upload-file',
                accept: '*/*',
                type: '*',
                maxSize: uploadFileMaxSize,//IE下只允许2MB,因为ie9和ie9以下使用flash的，ie10+不支持readAsBinaryString
                perMaxSize: '2MB',//服务端每次允许的最大上传的大小2MB
                perMinSize: '300KB',
                chunk: chunk,
                md5: md5,
                bytesPerChunk: '1MB'
            };

            var ufile = UploadPicture(fileParams);
            var fileTargets = [];
            ufile.on('progress',function (file, loaded, total) { // 上传进度
                var currentFileObject = fileItem(fileTargets, file);
                var per = parseInt(loaded * 100 / total, 10);
                var dom = currentFileObject.messageContainer.find('.file-index-' + file.index);
                if (isNaN(per)) {
                    ErrorDialog.set('content', '网络已断开，上传失败').show();
                    dom.remove();
                } else {
                    if (per < 100) {
                        dom.find('.num').html(per + '%');
                        dom.find('.bar').width(per + '%');
                    } else {
                        dom.find('.num').html(99 + '%');
                        dom.find('.bar').width(99 + '%');
                    }
                }

            }).on('success',function (file, data) {
                    var currentFileObject = fileItem(fileTargets, file);
                    var dom = currentFileObject.messageContainer.find('.file-index-' + file.index);
                    dom.remove();
                    if (data.fkey) {
                        var fileObject = {
                            sid: Global.sid,
                            filetype: 2,
                            compression: 0,
                            filename: file.name,
                            filesize: '' + file.size,
                            filehash: '',
                            fileowner: Global.uid,
                            filekey: data.fkey,                  //离线文件key
                            fileinfo: '',
                            compresssize: '' + file.size
                        };
                        var content = MessageUtil.format(fileObject, 'OFFLINE-FILE');
                        self.sendMessage(content, currentFileObject.target, fileObject);
                        fileTargets.splice(indexOf(fileTargets, currentFileObject), 1);
                    }
                }).on('successAdd',function (file) {
                    var file_target_info = {index: file.index, target: self.get('target'),
                        messageContainer: self.get('target').get('messageContainer').get('DOM')};
                    fileTargets.push(file_target_info);
                    var progressData = {
                        index: file.index,
                        uid: Global.user.get('uid')
                    };
                    var progress = MessageFileProgressTpl.render(progressData);

                    if (file_target_info.messageContainer) {
                        var body = file_target_info.messageContainer.closest('.body');
                        file_target_info.messageContainer.append(progress);
                        setTimeout(function () {
                            Scroll.to(body, 'bottom');
                        }, 10);
                    }
                    ufile.upload();

                }).on('error',function (file, data, result) { // 文件上传失败时或者被终止时触发，引起的可能性有：上传地址不存在/主动终止
                    var currentFileObject = fileItem(fileTargets, file);
                    var dom = currentFileObject.messageContainer.find('.file-index-' + file.index);
                    dom.remove();
                }).on('initData',function (file, preData) {
                    if (file.size > 2 * 1024 * 1024 && fileParams.md5) {
                        this.set('md5', true);
                    } else {
                        this.set('md5', false);
                    }
                    preData.filesize = file.size;
                    preData.flag = 0;
                    preData.ticket = '';
                    preData.md5 = '';
                }).on('xhrLoad', function (file, data, preData) {
                    preData.ticket = data.ticket;
                    if (data.fkey) {
                        //有fkey表示已经上传过了
                        file.uploadCompleted = true;
                    }
                })
                .on('chunkData',function (preData) {
                    preData.flag = 1;
                }).on('lastSlice',function (preData) {
                    preData.flag = 0;
                }).on('firstSlice',function (preData) {
                    preData.flag = 1;
                }).on('deleteData',function (file, data) {
                    if (file.totalPices === 1) {
                        //不切块的时候，只要传这些就可以了
                        delete data['flag'];
                        delete data['md5'];
                        delete data['ticket'];
                        delete data['offset'];
                        delete data['filesize'];
                    }
                }).on('serverCheck', function (result, serverCheck) {
                    if (result.code === 409) {
                        serverCheck.flag = false;
                    }
                });

            //群组共享文件上传组件
            var shareFileParams = {
                //外网生产环境
                // url:'http://imnd.99.com/v2/group/api/file/upload?gid=&category=',
                url: window.Global.oaUrl + 'v2/group/api/file/upload?gid=&category=',
                node: '#upload-share-file',
                accept: '*/*',
                type: '*',
                maxSize: '2MB',
                data: {

                }
            };
            self.usharefile = UploadPicture(shareFileParams);
            self.usharefile.on('successAdd',function (file) {
                self.usharefile.currentTarget = self.get('target');
                self.usharefile.set('data', {
                    gid: self.usharefile.get('gid'),
                    category: self.usharefile.get('category'),
                    filesize: file.size,
                    filename: file.name
                });
                self.usharefile.upload();
            }).on('success',function (file, data) {
                    if (+data.code === 409) {
                        ErrorDialog.hide();
                        ErrorDialog.set('content', '文件名冲突').show();
                    }
                }).on('error',function (file, data, result) {
//                    flash上传走这边
                    if (+result === 409) {
                        ErrorDialog.hide();
                        ErrorDialog.set('content', '文件名冲突').show();
                    }
                }).on('complete', function () {
                    self.usharefile.currentTarget.showGroupShare();
                });

        },
        // 聊天对象是user时获取在线情况
        requestStatus: function () {
            if (this.type === 'user') {
                IMAjax({
                    cmd: 39,
                    body: {
                        mults: {
                            count: 1,
                            data: [
                                {uid: this.uid + ''}
                            ]
                        }
                    }
                });
            }
        },
        // 将发送消息的任务发于target处理,flag为true表示要格式化消息,type
        sendMessage: function (message, _target, _fileObj, flag, type) {
            var target = _target || this.get('target');

            if (target.get('isPsp')) {
                if (flag) {
                    message = MessageUtilPsp.format(message, type);
                }
                target.sendPspMessage(message, _fileObj);
            } else {
                if (flag) {
                    message = MessageUtil.format(message);
                }
                target.sendMessage(message, _fileObj);
            }
        },
        // 重置聊天窗口
        reset: function () {
            this.set('status', null);
        },
        //重置messagecontainer
        resetMessageContainer: function (oTarget) {
            var containers = this.get('containers');
            var freeContainer = oTarget.get('messageContainer');
            var index = indexOf(containers, freeContainer);
            if (index !== -1) {
                containers[index].free();
            }
            oTarget.set('chatting', 0);
            oTarget.set('messageContainer', null);
            oTarget.set('bg-running', false);
            oTarget.set('draft', '');
            oTarget = null;
            return index !== -1 ? containers[index] : null;
        },
        //重置当前聊天
        resetTarget: function (oTarget) {
            var targets = this.get('targets');
            var indexOfNTarget = indexOf(targets, oTarget);
            if (indexOfNTarget !== -1) {
                //移除旧的聊天对象
                targets.splice(indexOfNTarget, 1);
            }
            //隐藏聊天窗口
            if (oTarget.get('chatting')) {
                this.set('target', null);
                this.hide();
            }
            //重置这个被移除的聊天对象的messagecontainer
            this.resetMessageContainer(oTarget);


        },
        requestPreviousMessages: function () {
            this.get('target').requestPreviousMessages();
        },
        renderHistory: function (messages, total) {
            var container = this.get('history-container');
            var wrap = container.get('DOM').closest('.body');
            container.empty();
            if (messages.length === 0) {
                var date = HistoryCalendar.get('output')[0].value,
                    isAfer = date ? '之后的' : '';

                container.get('DOM').append('<div class="no-history">没有 <strong>' + date + '</strong>' + ' ' + isAfer + '聊天记录</div>');
            }
            container.appendMessages(messages, true, true);
            HistoryPagination.set('total', total);
            setTimeout(function () {
                Scroll.to(wrap, 'top');
            }, 10);
            //PicLoader.load(container, false);
        },
        /*
         notifyMessages: function(name) {
         document.title = '【新消息】来自' + name;
         },
         */
        getMessageContainer: function () {
            var containers = this.get('containers');
            var targets = this.get('targets');
            var leng = targets.length, len = containers.length, sTarget;
            if (leng > len) {
                sTarget = targets.shift();
                var container = this.resetMessageContainer(sTarget);
                return  container.set('available', false);
            } else {
                for (var i = 0; i < len; i++) {
                    if (containers[i].get('available')) {
                        containers[i].set('available', false);
                        return containers[i];
                    }
                }
            }
        },
        _onChangeTarget: function (nTarget, oTarget) {
            // 切换到原始状态
            this.reset();
            //nTarget为null（重置当前聊天对象）
            if (!nTarget) return;

            // 公告，暂时特殊处理
            if (nTarget.get('type') == 'notice') {
                this.show();
                var noticeContainer = this.get('notice-container');
                nTarget.set('targetWindow', this);
                nTarget.set('messageContainer', this.get('notice-container'));
                nTarget.set('chatting', 1);
                this.set('currentMessageContainer', noticeContainer);
                oTarget && oTarget.set('chatting', 0) && oTarget.set('bg-running', true);
                // 切换面板到公告
                this.set('status', 'notice-room');
                return;
            }

            // 群系统消息，暂时特殊处理
            if (nTarget.get('type') == 'group-notice') {
                this.show();
                var groupNoticeContainer = this.get('group-notice-container');
                nTarget.set('targetWindow', this);
                nTarget.set('messageContainer', this.get('group-notice-container'));
                nTarget.set('chatting', 1);
                this.set('currentMessageContainer', groupNoticeContainer);
                oTarget && oTarget.set('chatting', 0) && oTarget.set('bg-running', true);
                // 切换面板到群系统消息
                this.set('status', 'group-notice-room');
                return;
            }

            if (nTarget.get('gid')) {
                this.usharefile.set('url', window.Global.oaUrl + 'v2/group/api/file/upload?gid=' + nTarget.get('gid') + '&category=' + nTarget.get('category'));
                this.usharefile.set('gid', nTarget.get('gid'));
                this.usharefile.set('category', nTarget.get('category'));
            }

            // 根据类型渲染window
            if (this.loadTarget(nTarget)) {
                // 通知聊天对象更新状态
                var sTarget, cMessageContainer;
                var targets = this.get('targets');
                var indexOfNTarget = indexOf(targets, nTarget);
                var len = targets.length;
                if (len > 0) {
                    targets[len - 1].set('chatFile', null, {silent: true});
                }
                if (indexOfNTarget !== -1) {
                    targets.splice(indexOfNTarget, 1);
                    targets.push(nTarget);
                    cMessageContainer = nTarget.get('messageContainer');
                } else {
                    targets.push(nTarget);
                    cMessageContainer = this.getMessageContainer();
                    nTarget.set('messageContainer', cMessageContainer);
                }
                nTarget.set('chatting', 1);
                this.set('currentMessageContainer', cMessageContainer);
                oTarget && oTarget.set('chatting', 0) && oTarget.set('bg-running', true);

                // 保存和还原草稿
                var messageInput = $("#message-content");
                var content = messageInput.val();

                oTarget && oTarget.set('draft', content);
                messageInput.val(nTarget.get('draft'));

                // 切换面板到聊天室
                this.set('status', 'chat-room');
            } else {
                oTarget && oTarget.set('chatting', 0) && oTarget.set('bg-running', true);
            }
        },
        _onChangeCurrentMessageContainer: function (nContainer) {
            var containers = this.get('containers');
            $.each(containers, function (index, container) {
                container.hide();
            });

            nContainer.show();
        },
        // 切换子菜单
        _onChangeStatus: function (nStatus, oStatus) {
            var self = this,
                DOM,
                index;

            var historyContainer = $("#history-container");
            if (nStatus) {
                DOM = this.get('DOM');
                index = $.inArray(nStatus, statusEnum);
                DOM.children().hide().eq(index).show();
            }

            switch (nStatus) {
                case 'chat-room':
                    var delay = self.get('targets').length <= 1 ? 500 : 300;
                    setTimeout(function () {
                        $("#message-content").focus();
                    }, delay);
                    break;
                case 'notice-room':
                case 'group-notice-room':
                    break;
                case 'history':
                    historyContainer.empty();
                    HistoryCalendar.set('date', new Date());
                    /*setTimeout(function () {
                     HistoryCalendar.set('date', new Date());
                     }, 10);*/
                    HistoryCalendar.get('trigger').val('');
                    HistoryPagination.set('total', null);
                    break;
                case 'group-share':
                    self.get('target').showGroupShare();
                    break;
                case 'group-info':
                    self.get('target').showGroupInfo();
                    break;
                case 'discussion-info':
                    self.get('target').showDiscussionInfo();
                    break;
            }

        }
    });

    var MessageContainer = Base.extend({
        attrs: {
            // 用于合并时间轴
            timeInterval: 60, // 超过60s增加一个时间轴
            earliestTime: null,
            latestTime: null,
            available: true,
            DOM: null
        },
        free: function () {
            this.empty();
            this.set('earliestTime', null);
            this.set('latestTime', null);
            this.set('available', true);
        },
        empty: function () {
            this.get('DOM').empty();
        },
        show: function () {
            this.get('DOM').show();
        },
        hide: function () {
            this.get('DOM').hide();
        },
        refreshUsername: function (uid, username) {
            var DOM = this.get('DOM');

            DOM.find('.others-message').each(function (index, dom) {
                var $dom = $(dom);
                if ($dom.data('uid') == uid) {
                    $dom.find('.username').text(username);
                }
            });
        },
        refreshGroupNoticeUsername: function (uid, username) {
            var DOM = this.get('DOM');

            DOM.find('.group-notice').each(function (index, dom) {
                var $dom = $(dom);
                if ($dom.data('uid') == uid) {
                    $dom.find('.username').text(username);
                }
            });
        },
        _pendMessages: function (type, messages, noTimeline, noScroll, container) {
            var self = this;
            var container = container || this.get('DOM');
            var wrap = container.closest('.body');
            var html = '';
            var dom;

            if (type === 'prepend') {
                messages = messages.reverse();
            }
            $.each(messages, function (index, message) {
                //html += self._pendMessage(type, message, noTimeline, noScroll);
                obj = self._pendMessage(type, message, noTimeline, noScroll);
                dom = $(obj.whole);
                if (message.get('type') == 101) {
                    //erp下单，如果在pc端接单，需要处理网页上的接单操作
                    var task = Global.getErpMatches(message.get('content'));
                    if (task) {
                        var taskid = task.taskid;
                        var existedDom = container.find('[data-task-id="' + taskid + '"]').closest('.others-message');
                        if (existedDom.length > 0) {
                            dom = $(obj.messageCT);
                            existedDom.replaceWith(dom);
                        } else {
                            container[type](dom);
                            setTimeout(function () {
                                Scroll.to(wrap, type === 'append' ? 'bottom' : 'top');
                            }, 10);
                        }
                    }
                }
                else {
                    message.set('node', dom);
                    container[type](dom);
                    setTimeout(function () {
                        Scroll.to(wrap, type === 'append' ? 'bottom' : 'top');
                    }, 10);
                }

            });

            PicLoader.load(container, noScroll);
        },
        _pendMessage: function (type, message, noTimeline, noScroll) {
            var ret = '';
            var timeInterval = this.get('timeInterval');

            var boundaryTimeType;
            if (type === 'append') {
                boundaryTimeType = 'latestTime';
            } else {
                boundaryTimeType = 'earliestTime';
            }
            var boundaryTime = this.get(boundaryTimeType);

            if (!noTimeline && Math.abs(+(message.get('time')) - boundaryTime) > timeInterval) {
                ret += TimeIntervalTpl.render({
                    time: message.get('time')
                });
            }
            this.set(boundaryTimeType, message.get('time'));
            var msgCnt = message.render();
            msgObj = {whole: ret + msgCnt, boundary: ret, messageCT: msgCnt};
            return msgObj;
        },
        appendMessages: function (messages, noTimeline, noScroll, container) {
            this._pendMessages('append', messages, noTimeline, noScroll, container);
        },
        prependMessages: function (messages, noTimeline, noScroll, container) {
            this._pendMessages('prepend', messages, noTimeline, noScroll, container);
        }
    });


    var ChatWindowSingleton = new ChatWindow();

    $('#message-content').on('keypress', function (e) {
        if (e.which === 13) {
            submitMessage();
            return false;
        }
    });

    // 实现输入框动态改变高度效果
    (function () {

        var getBoxSize = function (el, cssName) {
            return el.currentStyle ? el.currentStyle[cssName] : window.getComputedStyle(el, null)[cssName];
        };
        var setBoxSize = function (el, cssName, value) {
            el.style[cssName] = value;
        };
        var maxRows = 5,    // 输入框最多支持的行数
            height = 15,    // 每一行高度
            diff = 20,      // 差值(padding:10px)
            inputerWidth,
            inputerHeight,
            computedHeight,
            cloneInputerScrollHeight,
            cloneInputerWidth,
            maxInputerHeight = height * maxRows,
            maxScrollHeight = maxInputerHeight + diff;

        // 输入框
        var inputer = document.getElementById('message-content');
        // 拷贝输入框
        var cloneInputer = inputer.parentNode.appendChild(inputer.cloneNode(true));
        cloneInputer.id = "message-content-clone";
        cloneInputer.className = "content-clone";
        cloneInputerWidth = getBoxSize(cloneInputer, 'width');

        var changeInputerHeight = function () {
            cloneInputer.value = inputer.value;
            // 确保两个输入框宽度一致
            inputerWidth = getBoxSize(inputer, 'width');
            if (inputerWidth != cloneInputerWidth) {
                setBoxSize(cloneInputer, 'width', inputerWidth);
                cloneInputerWidth = inputerWidth;
            }
            inputerHeight = inputer.clientHeight;
            cloneInputerScrollHeight = cloneInputer.scrollHeight;
            if (inputerHeight != cloneInputerScrollHeight) {
                computedHeight = cloneInputerScrollHeight < maxScrollHeight ? cloneInputerScrollHeight - diff : maxInputerHeight;
                //inputer.style.height=computedHeight + 'px';
                var body = $('#chat-window').find('.body');
                var bodyBottom = 54 + computedHeight - 15;
                setBoxSize(inputer, 'height', computedHeight + 'px');
                body.css('bottom', bodyBottom + 'px');
            }
        };
        //*监听输入框
        var inputvalue = inputer.value,
            intervaltime;
        inputer.onfocus = function () {
            intervaltime = setInterval(function () {
                if (inputvalue !== inputer.value) {
                    inputvalue = inputer.value;
                    changeInputerHeight();
                }
            }, 500);
        };
        inputer.onblur = function () {
            clearInterval(intervaltime);
        };
        inputer.onkeydown = inputer.onkeyup = inputer.onchange = function () {
            changeInputerHeight();
        };
    })();

    Action.listen({
        'go-back': function (e, target) {
            ChatWindowSingleton.set('status', 'chat-room');
        },
        'see-history': function () {
            ChatWindowSingleton.set('status', 'history');
        },
        'see-group-share': function () {
            ChatWindowSingleton.set('status', 'group-share');
        },
        'see-group-info': function () {
            ChatWindowSingleton.set('status', 'group-info');
        },
        'see-discussion-info': function () {
            ChatWindowSingleton.set('status', 'discussion-info');
        },
        'see-previous-messages': function () {
            ChatWindowSingleton.requestPreviousMessages();
        },
        'show-notice': function (e, target) {
            target.hide();
            target.next().show();
        },
        'hide-notice': function (e, target) {
            target.hide();
            target.prev().show();
            return true;
        },
        'insert-expr': (function () {
            Emotion.set('target', $('#message-content'));
            return function (e, target) {
                if (Emotion.get('visible')) {
                    Emotion.hide();
                } else {
                    Emotion.set('align', {
                        selfXY: [0, '100%'],
                        baseElement: target,
                        baseXY: [0, '-15']
                    }).show();
                }
            };
        })(),
        'submit-message': function () {
            submitMessage();
        },
        'display-pic': function (e, target) {
            var imgSrc = $(target)[0].src;
            DisplayPicDialog.set('src', imgSrc);
        },
        'del-share': function (e, node) {
            var target = $(e.target);
            var fid = target.data('fid');
            ChatWindowSingleton.get('target').removeGroupShare(fid);
        },
        'erp-op': function (e, node) {
            var url = $(e.target).data('url');
            Ajax({
                url: url,
                method: 'GET',
                data: {}
            }).done(function (data) {
                    var data = JSON.parse(data);
                    if (data.status === 200) {

                    }
                    else {
                        ErrorDialog.set('content', data.msg).show();
                    }

                }).fail(function (jqXHR, textStatus) {
                    ErrorDialog.set('content', textStatus).show();
                });
        },
        'reSendMessage': function () {
            var dom = this.closest('.my-message'),
                preDom = dom.prev(),
                nextDom = dom.next();
            var message = dom.find('.content').find('.message-content').find('.type-plain').html();
            if (nextDom.attr('class') !== dom.attr('class')) {
                if (preDom.attr('class') === 'time-interval') {
                    preDom.remove();
                }
            }
            dom.remove();
            submitMessage(message);

        }


    });


    function submitMessage(content) {
        var messageInput = $("#message-content");
        var content = content ? content : messageInput.val();
        var count;
        var message;
        var snippet;
        //content = content.replace(/^(\s*)(.*)(\s*)$/, '$2');
        if (content.length === 0) {
            return;
        }
        count = Math.ceil(content.length / 500);

        for (var i = 0; i < count; i++) {
            snippet = content.slice(i * 500, (i + 1) * 500);
            //  message = MessageUtil.format(snippet);
            //  ChatWindowSingleton.sendMessage(message);
            ChatWindowSingleton.sendMessage(snippet, '', '', true);
        }
        // ChatWindowSingleton.sendMessage(content, '', '', true);
        messageInput.val('');
        messageInput.focus();
    }

    // 获取好友状态
    MessageDistributor.register(39, function (body) {
        var status, data, uid;
        var statusEnum = ['离线', '在线', '离开', '隐身', '请勿打扰'];
        if (body.res_code === 200) {
            if (!body.mults.data) {
                return;
            }
            data = body.mults.data[0];
            status = statusEnum[data.status];
            uid = data.uid;
            if (ChatWindowSingleton.uid == uid && status) {
                ChatWindowSingleton.get('DOM').find('[data-role=status]').text('(' + status + ')');
            }
        }
    });

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
    Global.indexOf = indexOf;

    // Singleton
    return ChatWindowSingleton;
});