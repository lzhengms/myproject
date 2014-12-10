/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var $ = require('$');
    var List = require('../../core/models/List');
    var Action = require('../../../lib/util/dom/action');

    List.implement({
        visualize: function() {
            this.initDOM();
        },
        initDOM: function() {
            var html = this.constructor.tpl.render(this.get('data'));

            this.set('DOM', $(html));
            this.get('DOM').data('model', this);

            this.get('container').append(this.get('DOM'));
        },
        toggle: function() {
            // 子类各自实现
            var DOM = this.get('DOM');
            DOM.toggleClass('active');
        }
    });

    // 注册toggle事件
    Action.listen({
        'toggle-list': function(e, target) {
            var list = target.closest('[data-role=list]');
            var model = list.data('model');

            model.toggle();
        }
    });
});