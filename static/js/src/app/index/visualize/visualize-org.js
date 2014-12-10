/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var Org = require('../../core/models/Org');
    var User = require('../../core/models/User');
    var Ajax = require('../../core/ajax');
    var Action = require('../../../lib/util/dom/action');

    Action.listen({
        'toggle-org': function(e, target) {
            target.toggleClass('active');
            if (!target.data('loaded') && target.hasClass('active')) {
                requestDeptUser(target);
            }
        },
        'load-more-dept-user': function(e, target) {
            requestDeptUser(target);
        }
    });

    Org.tpl = require('../tpl/org');

    // 获取某部门下的全部成员
    function requestDeptUser(target) {
        if (target.data('loaded')) {
            return;
        }
        var org = target.closest('[data-role=org]');
        var subUsers = org.children('[data-role=sub-users]');
        var requestMore = org.children('[data-role=request-more]');
        var id = org.data('id');
        var page = org.data('page') || 0;
        Ajax({
            url: '/_oap/unit/deptusers',
            method: 'GET',
            data: {
                deptid: id,
                pos: page * 20,
                size: 20
            }
        }).done(function(data) {
            $.each(data.users, function(index, user) {
                var u = new User(user);
                subUsers.append(u.addDOM());
            });

            target.data('page', ++page);
            if (page * 20 >= data.total) {
                org.data('loaded', true);
                requestMore.hide();
            } else {
                requestMore.show();
            }
            requestDeptUser(target);
        });
    }
});