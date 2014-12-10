/**
 * Description: 群组&&讨论组列表
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var List = require('./List');
    var Group = require('./Group');

    var GroupList = List.extend({});

    // 枚举三种群类型&&讨论组
    //  "category":1, //=1工作群 =2个人群 =3娱乐群, 三级分类编号（8位整数）
    GroupList.listEnum = [
        { category: 1, 'listname': '工作群'},
        { category: 2, 'listname': '个人群'},
        { category: 3, 'listname': '娱乐群'},
        { category: 101, 'listname': '讨论组'}
    ];

    // 初始化群和讨论组类型
    GroupList.initGroup = function() {
        var container = $('.groups.category-panel');
        $.each(GroupList.listEnum, function(index, list) {
            new GroupList({
                container: container,
                data: list
            });
        });
    };

    // 将组放入对应的组类型里
    GroupList.sortGroup = function(data) {
        var container = $('.groups.category-panel');
        $.each(data, function(i, group) {
            var cw = container.find('[data-category=' + group.category + ']');
            var c = cw.find('[data-role=list-content]');
            var countDOM = cw.find('[data-role=count]');
            var count = countDOM.data('count') || 0;
            countDOM.data('count', ++count);
            countDOM.html('[' + count +']');
            var g = new Group(group);
            // 该接口返回的都是普通群 type：0
            g.set('groupType', 0);
            g.signIn();
            c.append(g.addDOM());
        });
    };

    // 将讨论组放入对应的组类型里
    GroupList.sortDiscussion = function(data) {
        var container = $('.groups.category-panel');
        $.each(data, function(i, disc) {
            var category =  101;// 讨论组列表数据无category
            var cw = container.find('[data-category=' + category + ']');
            var c = cw.find('[data-role=list-content]');
            var countDOM = cw.find('[data-role=count]');
            var count = countDOM.data('count') || 0;
            countDOM.data('count', ++count);
            countDOM.html('[' + count +']');
            var g = new Group(disc);
            g.set('type', 'discussion');
            g.set('groupType', 2);
            g.signIn();
            c.append(g.addDOM());
        });
    };

    GroupList.getCategoryName = function(category) {
        var ret;
        $.each(GroupList.listEnum, function(index, list) {
            if (list.category == category) {
                ret = list.listname;
                return false;
            }
        });
        return ret;
    };

    module.exports = GroupList;

});