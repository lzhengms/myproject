/**
 * @description 查找添加群模块
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-8-27
 */
define(function (require, exports, module) {
    var $ = require('$');
    var ajax = require('../../core/ajax');
    var IMAjax = require('../../core/im-ajax');
    var action = require('../../../lib/util/dom/action');
    var Widget = require('../../../lib/cmp/widget');
    var tpl = require('../tpl/group-search');
    var checkTpl = require('../tpl/group-check');
    var Page = require('./group-search-pagenation');
    var ErrorDialog = require('./error-dialog');
    var FancyConfirmBox = require('./fancy-confirm-box');
    var Xstring = require('../../../lib/util/string');
    var confirmbox = new FancyConfirmBox({
        className: 'join-group-box',
        title: '加入群结果',
        content: '加入群<span style="padding:0 10px">' + '</span>请求已发出，请等待管理员验证',
        buttons: [
            {
                text: '确定',
                className: 'join-group',
                action: 'close'
            }
        ],
        width: 514,
        height: 210
    }).render();
    var memeberRequest = function (gid, gname, msg, joinperm) {
        ajax({
            url: '/api/group/memberrequest',
            method: 'POST',
            data: JSON.stringify({gid: gid})
        }).done(function (data) {
            IMAjax({
                cmd: 65060,
                body: {
                    gid: gid + '',
                    group_type: 0,
                    msg: msg || 'request join'
                }
            });
            if (joinperm === undefined) {
                confirmbox.set('content', '加入群<span style="padding:0 10px">' + gname + '</span>请求已发出，请等待管理员验证').show();
            }

        }).fail(function (jqXHR) {
            ErrorDialog.set('title', '提示');
            switch (+jqXHR.status) {
                case  405:
                    ErrorDialog.set('content', '群权限不允许加入 ').show();
                    break;
                case 409:
                    ErrorDialog.set('content', '群成员个数已经到上限 ').show();
                    break;
                case 403:
                    ErrorDialog.set('content', jqXHR.responseJSON.msg).show();
                    break;
            }
        });
    }
    var groupSearch = Widget.extend({
        attrs: {
            template: tpl.render({init: true, datalist: []}),
            container: null,
            triggers: [],
            triggerType: 'click',
            init: true,
            dataList: [],
            key: null,
            item: '[data-role="group-item"]',
            onSearch: function (target) {
                var that = this.get('containerObj');
                var key = that.$('[data-role="search-input"]').val();
                if ($.trim(key)) {
                    that.trigger('hideError');
                    this.set('key', key);
                    this.set('originKey', key);
                    this.searchRequest();
                } else {
                    this.trigger('empty', target);
                }
            },
            onEmpty: function (target) {
                var that = this.get('containerObj');
                that.trigger('showError');
                setTimeout(function () {
                    that.trigger('hideError');
                }, 500);
            },
            onJoinGroup: function (target) {
                var thisItem = target.closest('.group-search-item');
                var gid = target.data('gid'),
                    gname = target.data('gname'),
                    joinperm = target.data('joinperm'),
                    creatorid = target.data('creatorid'),
                    creatorname = thisItem.find('.group-manager').text();

                var item = {
                    gid: gid,
                    gname: gname,
                    creatorid: creatorid,
                    creatorname: creatorname
                };
                if (joinperm === 0) {
                    this.checkbox.set('content', checkTpl.render(item)).show();
                } else if (joinperm === 1) {
                    memeberRequest(gid, gname, '', joinperm);
                } else if (joinperm === 2) {
                    memeberRequest(gid, gname, '', joinperm);
                }
            },
            onCommon: function (target) {
            },
            onDel: function (target) {
                this.set('init', true);
                this._onRenderDataList();
                this.page.set('data', {key: '', value: ''}, {silent: true});
                this.page.set('init', true);
                this.page.resume();
            }
        },
        setup: function () {
            this._bindEvents();
        },
        render: function () {
            // 让渲染相关属性的初始值生效，并绑定到 change 事件
            if (!this.rendered) {
                this._renderAndBindAttrs();
                this.rendered = true;
            }
            var that = this.get('containerObj');
            var self = this;
            this.page = new Page({
                parentNode: that.$('#pages'),
                pageName: 'start',
                sizeName: 'size',
                size: 18,
                url: '/v2/group/api/group/search',
                method: 'GET',
                data: {key: '', gid: ''},
                success: function (currentpage, data) {
                    this.$('.current-page').text(currentpage);
                    if (data.total > 0) {
                        for (var len = data.data.length - 1; len >= 0; len--) {
                            if (data.data[len].gname) {
                                data.data[len].gname = Xstring.code(data.data[len].gname);
                            }
                        }
                        self._success(data);
                    } else {
                        this.trigger('not-found');
                    }

                }
            }).render().on('not-found', function () {
                    that.trigger('modify', self.get('originKey'), 0);
                    self.set('init', false);
                    self.set('dataList', []);
                    self._onRenderDataList();
                });
            this.page.set('init', false);


            this.checkbox = new FancyConfirmBox({
                className: 'enter-info-box',
                title: '添加群',
                content: '',
                buttons: [
                    {
                        text: '发送',
                        className: 'submit-group-apply',
                        action: 'submit-group-apply'
                    },
                    {
                        text: '取消',
                        className: 'cancel-group-apply',
                        action: 'close'
                    }
                ],
                width: 485,
                height: 332
            })

            return this;
        },
        _bindEvents: function () {
            var self = this;
            var container = this.get('containerParent') ? this.get('containerParent') : $(document);
            var triggers = this.get('triggers');
            var triggerType = this.get('triggerType');
            var defaultTriggers = ['join-group', 'group-search-del', 'submit-btn', 'submit-group-apply'];
            var result;
            while (result = triggers.shift()) {
                container.on(triggerType, result, function (e) {
                    var target = $(e.target);
                    var datarole = target.data('role');
                    if (datarole == defaultTriggers[0]) {
                        self.trigger('joinGroup', target);
                    } else if (datarole == defaultTriggers[1]) {
                        self.trigger('del', target);
                    } else if (datarole == defaultTriggers[2]) {
                        self.trigger('search', target);
                    } else {
                        self.trigger('common', target);
                    }
                });
            }
            var that = this.get('containerObj');
            var $input = that.$('[data-role="search-input"]');
            $input.on('keypress', function (e) {
                if (e.which === 13) {
                    self.trigger('search');
                }
            });


        },
        searchRequest: function () {
            var key = this.get('key');
            this.page.set('init', false);
            this.page.set('data', {key: key, gid: key});
        },
        _success: function (data) {
            var self = this;
            var that = this.get('containerObj');
            var uids = [];
            $.map(data.data, function (item, i) {
                item.gnotice = item.introduction;
                item.notice = Xstring.blength(item.gnotice) <= 50 ? item.gnotice : item.gnotice.substr(0, 32) + '...';
                uids.push(item.creatorid);
                return item;
            });
            that.trigger('modify', this.get('originKey'), data.total);
            this.set('init', false);
            this.set('dataList', data.data);
            self._getUserInfos(uids);
        },
        _getUserInfos: function (uids) {
            var self = this;
            // 去OA接口找用户详细信息
            if (this.usersAjax) {
                this.usersAjax.abort();
            }
            this.usersAjax = ajax({
                url: '/_oap/user/listinfo',
                method: 'GET',
                data: {
                    uid: uids.join(',')
                }
            }).done(function (data) {
                    var obj = self.get('containerObj');
                    var container = obj.$(self.get('container'));
                    var items = container.find(self.get('item'));
                    var result = data.users;
                    $.each(items, function (i, item) {
                        var creatorid = $(item).data('creatorid');
                        $.each(result, function (i, v) {
                            if (v.uid == creatorid) {
                                $(item).find('.group-manager').text(v.username);
                                result.splice(i, 1);
                                return false;
                            }
                        });
                    });
                });
        },
        _onRenderDataList: function () {
            var obj = this.get('containerObj');
            var container = obj.$(this.get('container'));
            var datalist = this.get('dataList');
            var init = this.get('init');
            container.empty();
            container.append(tpl.render({init: init, datalist: datalist}));
            if (init) {
                obj.trigger('hide');
            }
            obj._setPosition();
        },
        _onRenderKey: function () {
            this.page.resume();
        }

    });
    action.listen({
        'submit-group-apply': function() {
            var box = this.closest('.enter-info-box'),
                msg = box.find('textarea.content').val(),
                gname = box.find('.group-name').text(),
                gid = box.find('.group-id').text();
            memeberRequest(gid, gname, msg);
            box.find('.cancel-group-apply').trigger('click');
        }
    });
    module.exports = groupSearch;
});