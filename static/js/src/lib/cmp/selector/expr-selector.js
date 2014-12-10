/**
 * @fileoverview 表情选择器
 * @author chengbapi<chengabpi@gmail.com>
 */
define(function(require, exports, module) {
    var $ = require('$');
    var Overlay = require('../overlay');
    var Selector = require('./selector');
    var Tabs = require('../switchable/tabs');
    var Selection = require('../../util/dom/selection');
    var Inputor = require('../../util/dom/inputor');

    /**
     * @name ExpressionSelector
     * @class 表情选择器
     * @constructor
     * @extends Overlay
     * @requires jQuery
     * @requires Selector
     * @requires Tabs
     * @param {Object} config 组件配置
     * @property {Object} config.align 定位元素和参数
     * @property {String|Function} config.optionTemplate 渲染DOM的string或模板
     * @property {Array.<group>} config.data 分组数据源
     * @property {Function} config.transport 输出所选表情
     * @see Selector
     * @example
     *  expr = new ExpressionSelector({
     *    target: DOM,
     *    element: DOM
     *  });
     *
     *  expr.addGroup({
     *    name: XX,
     *    data: data,
     *    transport: func,
     *    optionTemplate: func
     *  });
     *
     *  expr.render();
     */
    var ExpressionSelector = Overlay.extend({
        attrs: {
            element: null,
            target: null,
            cursor: null,

            // 是否开启动画效果，目前只提供淡入淡出效果
            animation: true,
            // 动画显示速度
            speed: 300,

            optionTemplate: function(data){ return "<div title=" + data.title + "></div>";  },
            transport: function(option) {
                var output;
                if (option.type === '默认') {
                  output = "[" + option.title + "]";
                } else if (option.type === "符号表情") {
                  output = "<" + option.title + ">";
                }
                var sel = this.get('sel');
                var cursor = this.get('cursor') || [0, 0];
                sel.insertText(output, cursor, true);
            }
        },
        setup: function() {
            ExpressionSelector.superclass.setup.call(this);
            this._initDOM();

            this._blurHide($('.face-btn'));
        },
        _initDOM: function() {
            var element = this.get('element');
            var triggers = $("<div>").addClass('expr-tabs');
            var panels = $("<div>").addClass('expr-panels');

            element.append(triggers).append(panels);
        },
        _onChangeTarget: function(nTarget) {
            var self = this;
            var sel = Selection(nTarget);
            this.set('sel', sel);

            Inputor(nTarget, function() {
                var cursor = sel.cursor();
                if (cursor[0] !== undefined) {
                    self.set('cursor', cursor);
                }
            }, {
                keep: true,
                silentBlur: true,
                timer: 20
            });
        },
        addGroup: function(options) {
            // add type to option
            this._addType(options);
            this._addTab(options);
            this._addSelector(options);
            return this;
        },
        _addType: function(options) {
            $.each(options.data, function(index, option) {
                option.type = options.name;
            });
        },
        _addTab: function(options) {
            var element = this.get('element');
            var triggers = $('.expr-tabs', element);
            var panels = $('.expr-panels', element);

            var name = options.name;

            triggers.append($("<div>").addClass('expr-tab').html(name));
            panels.append($("<div>").addClass('expr-panel ' + options.className));
            panels.children().hide().first().show();
            panels.children().hide().first().show();
        },
        _addSelector: function(options) {
            var self = this;
            var element = this.get('element');
            var panels = $('.expr-panels', element);

            var data = options.data;

            var Export = options.transport || this.get('transport');
            var optionTemplate = options.optionTemplate || this.get('optionTemplate');
            var onSelect = function(target, option, seleted, isMultiSelect) {
                this.get('Export').call(self, option);
                this.get('selected').length = 0;
                !isMultiSelect && self.hide();
            };

            new Selector({
                number: 1,
                optionClassName: 'expr-option',
                options: data,
                element: panels.children().last(),
                optionTemplate: optionTemplate,
                onSelect: onSelect,
                Export: Export
            });
        },
        _setupTabs: function() {
            var element = this.get('element');
//            var triggers = $("<div>").addClass('expr-tabs');

            new Tabs({
                element: element,
                triggers: '.expr-tabs .expr-tab',
                panels: '.expr-panels .expr-panel',
                activeTriggerClass: 'active',
                triggerType: 'click'
            });

        },
        render: function() {
            this._setupTabs();
            Overlay.prototype.render.call(this);
        },
        show: function() {
            var animation = this.get('animation');
            if(animation) {
                this.get('element').fadeIn(this.get('speed'));
                this.set('visible', true, {silent: true});
            } else {
                Overlay.prototype.show.call(this);
            }
        },
        hide: function() {
            var animation = this.get('animation');
            if(animation) {
                this.get('element').fadeOut(this.get('speed'));
                this.set('visible', false, {silent: true});
            } else {
                Overlay.prototype.hide.call(this);
            }
        }
    });

    module.exports = ExpressionSelector;

    // helper

});

