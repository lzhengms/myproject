/**
 * User: chengbapi@gmail.com
 * Date: 14-4-14
 * Time: 下午2:14
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Action = require('../../lib/util/dom/action');
    var Base = require('../../lib/util/base');
    var PlaceHolder = require('../../lib/util/dom/placeholder');

    var Global = require('./helper');

    var Ajax = require('../core/ajax');
    var IMAjax = require('../core/im-ajax');
    var MessageDistributor = require('../core/message-distributor');
    var User = require('../core/models/User');
    var Group = require('../core/models/Group');
    var RecentContactList = require('../core/models/RecentContactList');
    var FriendList = require('../core/models/FriendList');
    var Org = require('../core/models/Org');
    var GroupList = require('../core/models/GroupList');
    var InformationReminder=require('./information-reminder');

    var indexEnum = ['contacts', 'friends', 'orgs', 'groups'];


    PlaceHolder.render();

    var loadedEnum = {
        'contacts': {
            loaded: null,
            load: function (panel) {
                var self = this;
                IMAjax({
                    cmd: 71,
                    body: {
                        time: '1396344072',//过去的时间
                        count: RecentContactList.get('size') + ""
                    }
                });
                // 最近联系人事件注册(非OAP接口)
                MessageDistributor.register(71, function (body) {
                    var recentUsers, uidArray = [], uids;
                    if (body.res_code === 200) {
                        recentUsers = body.mults.data || [];
                        // 拼接uids
                        $.each(recentUsers, function (index, u) {
                            uidArray.push(u.uid);
                            u.lastContactTime = u.time;
                            new User(u, true);
                        });
                        uids = uidArray.join(',');

                        // 去OA接口找用户详细信息
                        Ajax({
                            url: '/_oap/user/listinfo',
                            method: 'GET',
                            data: {
                                uid: uids
                            }
                        }).done(function (data) {
                                self.loaded = true;
                                $.each(data.users, function (index, user) {
                                    new User(user);
                                    //RecentContactList.touch(u);
                                });
                            });
                        // 打开personnel面板
                        $("#personnel-panel").addClass('show');
                    }
                });
            }
        },
        'friends': {
            loaded: null,
            load: function (panel) {
                var self = this;
                self.loaded = true;
                Ajax({
                    url: '/_oap/friend/list',
                    method: 'GET'
                }).done(function (data) {
                        panel.empty();
                        data = data.data;
                        data.unshift({tagid:'0000',tagname:'我的公众号'});
                        $.each(data, function (i, tag) {
                            new FriendList({
                                data: tag,
                                container: panel
                            }).toggle();
                        });
                    });
            }
        },
        'orgs': {
            loaded: null,
            load: function (panel) {
                var self = this;
                self.loaded = true;
                Ajax({
                    url: '/_oap/unit/depttree',
                    method: 'GET'
                }).done(function (data) {
                        var html = '';
                        $.each(data, function (index, sub) {
                            html += new Org(sub).get('html');
                        });
                        panel.html(html)
                    });
            }
        },
        'groups': {
            loaded: null,
            load: function () {
                var self = this;
                var total;
                var cur = 0;
                self.loaded = true;

                GroupList.initGroup();

                // 单位群登录,用于接收通知公告
                window.Global.unitGroup.signIn();
                window.Global.unitGroup.addDOM();

                // 加载群和讨论组列表
                requestGroupList();
                requestDiscussionList();

                function requestGroupList() {
                    Ajax({
                        url: '/_oap/group/list',
                        method: 'GET',
                        data: {
                            start: cur * 100,
                            size: 100
                        }
                    }).done(function (data) {
                            GroupList.sortGroup(data.data);
                            // 打开personnel面板
                            $("#personnel-panel").addClass('show');

                            cur++;
                            total = data.total;
                            if (cur * 100 >= total) {
                                return;
                            } else {
                                requestGroupList();
                            }
                        });
                }

                function requestDiscussionList() {
                    Ajax({
                        url: '/_oap/discussion/list',
                        method: 'GET'
                    }).done(function (data) {
                            GroupList.sortDiscussion(data.groups);
                            // 打开personnel面板
                            $("#personnel-panel").addClass('show');
                        });
                }
            }
        }
    };

    var tabs = $('.category-tabs');
    var panels = $('.category-panels');

    tabs.on('click', '.category-tab', function (e) {
        var index = $(e.target).index();
        PersonnelTab.set('current', index);
    });

    var PersonnelTab = new Base({
        current: null,
        onChangeCurrent: function (cur, prev) {
            this.set('prev', prev);
            if (cur === null) {
                return;
            }
            var index;
            if (cur === +cur) {
                // cur = 0
                index = cur;
                cur = loadedEnum[indexEnum[index]];
            } else {
                // cur = 'contacts'
                index = $.inArray(cur, indexEnum);
                cur = loadedEnum[cur];
            }

            var tab = tabs.children().eq(index);
            var panel = panels.children().eq(index);

            panels.parent().removeClass('searching');

            tab.addClass('active').siblings().removeClass('active');
            if (panel.hasClass('contacts')) {
                var $active = panel.find('.active');
                if ($active.hasClass('active')) {
                    $active.trigger('click')
                }
            }
            panel.show().siblings().hide();

            // 没加载过
            if (this.get('reloaded')||!cur.loaded) {
                cur.load(panel);
            }
        }
    });

    var searchInput = $('#search-input');
    var searchClose = $('#search-close');
    searchInput.placehoder();

    searchInput.on('keypress', function (e) {
        if (e.which === 13) {
            search();
        }
    });
    searchInput.on('keyup', (function () {
        var _val;
        return function () {
            var val = $(this).val();
            if (val.length !== 0) {
                searchClose.show();
                if (val.length > 50) {
                    $(this).val(_val);
                } else {
                    _val = val;
                }
            } else {
                searchClose.hide();
            }
        }
    })());

    searchClose.on('click', function (e) {
        searchInput.val('');
        searchInput.focus();
        $(this).hide();
        PersonnelTab.set('current', PersonnelTab.get('prev'));
    });

    Action.listen({
        'search': search
    });

    function search() {
        var val = searchInput.val();
        var DOM = $("#search-result");
        var getMoreTip = DOM.find('[data-role=get-more-tip]');
        var notFoundTip = DOM.find('[data-role=not-found-tip]');

        notFoundTip.hide();

        // 切回空面板
        PersonnelTab.set('current', null);

        var total = 0;
        var count = 2;
        var notFoundCallback = function (len) {
            if (len) {
                total += len;
            } else {
                count--;
            }
            if (!count) {
                notFoundTip.show();
            }
            if (total > 100) {
                getMoreTip.show();
            } else {
                getMoreTip.hide();
            }
        }

        // trim
        val = val.replace(/^(\s*)(.*)(\s*)$/, '$2');
        if (val.length === 0) {
            return;
        }

        // 切换到搜索面板
        DOM.parent().addClass('searching');

        DOM.find('.search-user, .search-group').empty();

        Ajax({
            url: '/_oap/search/user',
            method: 'GET',
            data: {
                keyword: val,
                size: 100
            }
        }).done(function (data) {
                var container = DOM.find('.search-user');
                $.each(data.data, function (index, user) {
                    var u = new User(user);
                    container.append(u.addDOM());
                });
                notFoundCallback(data.data.length);
            }).fail(function () {
                notFoundCallback(0);
            });


        var GroupPool = Group.GroupPool;

        var groupCount = 0;
        var container = DOM.find('.search-group');
        $.each(GroupPool, function (gid, group) {
            var gname = group.get('gname');
            if (gname.indexOf(val) != -1) {
                groupCount++;
                container.append(group.addDOM());
            }
        });

        notFoundCallback(groupCount);
    }

    // 最近联系人未读消息提醒
    setInterval(function () {
        var count = 0;
        var DOM = $("#last-contact-unread-tip");

        $.each(RecentContactList.get('Pool'), function (index, target) {
            count += target.get('unreadCount');
        });

        if (count) {
            if (count > 99) {
                count = '99+';
            }
            DOM.show();
        } else {
            DOM.hide();
        }
        InformationReminder.set('unreadCount',count);
        DOM.text(count);
    }, 250);
    window.onfocus = function() {
        InformationReminder.set('mode', 1);
    };
    window.onblur = function() {
        InformationReminder.set('mode', 2);
    };
    return PersonnelTab;
});
