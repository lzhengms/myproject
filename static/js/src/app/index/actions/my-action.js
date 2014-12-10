/**
 * @description 查找添加群模块
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-8-27
 */
define(function (require, exports, module) {
    var $ = require('$');
    var action = require('../../../lib/util/dom/action');

    var placeHolder = require('../../../lib/util/dom/placeholder');
    var groupSearch = require('../cmp/group-search');

    var FancyConfirmBox = require('../cmp/fancy-confirm-box');

    var tpl = require('../tpl/group-search-static');


    action.listen({
        'search-add-group': (function () {
            var that = new FancyConfirmBox({
                title: '查找群',
                width: 860,
                height: null,
                content: tpl.render({gname: '', gcount: 0}),
                onHide: function () {
                    this.$('.group-search-bar').hide();
                },
                onModify: function (gname, gcount) {
                    var list = this.$('.group-search-result-txt').find('span');
                    list.eq(0).text(gname);
                    list.eq(1).text(gcount);
                    this.$('.group-search-bar').show();
                },
                onShowError: function () {
                    this.$('.group-empty-tip').css('visibility', 'visible');
                },
                onHideError: function () {
                    this.$('.group-empty-tip').css('visibility', 'hidden');
                },
                onInit: function () {
                    this.$('.group-search-input').val('');
                }

            }).render();

            var groupSearchCmp = new groupSearch(
                {
                    triggers: ['[data-role="join-group"]', '[data-role="group-search-del"]', '[data-role="submit-btn"]'],
                    containerObj: that,
                    container: '.group-search-result-container'
                }
            ).render();

            placeHolder.render();

            return function (e, target) {
                that.show().trigger('init');
                groupSearchCmp.trigger('del');
            }
        })()
    });


});