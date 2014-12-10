/**
 * @description 查找添加群模块的分页组件
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-8-27
 */
define(function (require, exports, module) {
    var $ = require('$');
    var pagination = require('../../../lib/cmp/pagination/pagination');
    var ajax = require('../../core/ajax');

    var Page = pagination.extend({
        attrs: {
            ajaxConfig: null,
            template: '<div><a href="###" data-action="prev"></a><span class="current-page" data-role="current-page">1</span><a href="###" data-action="next"></a></div>',
            init: true,
            url: null,
            method: null,
            data: null,
            key: null
        },
        ajax: function () {
            var self = this;
            var config = this.get('ajaxConfig') || {};

            config.url = config.url ? config.url : this.get('url');
            config.method = config.method ? config.method : this.get('method');
            config.data = config.data ? config.data : this.get('data');

            config.data[this.get('pageName')] = (this.get('current') - 1) * this.get('size');
            config.data[this.get('sizeName')] = this.get('size');
            ajax(config).done(function (data) {
                self.set('total', data.total);
                self.reflow();
                self.get('success') && self.get('success').call(self, self.get('current'), data);

            }).fail(function (jqXHR) {
                    switch (jqXHR.status) {
                        case 404:
                            self.set('total', 0);
                            self.reflow();
                            self.trigger('not-found');
                            break;
                    }
                });
            return this;

        },
        view: function () {
            this.ajax();
        },
        resume: function () {
            this.set('init', true);
            this.set('current', 1);
        },
        _onRenderTotal: function (val, prev) {

        },
        _onRenderCurrent: function () {
            if (!this.get('init')) {
                this.view();
            }
        },
        _onRenderData: function () {
            if (!this.get('init')) {
                this.view();
            }
        }
    });


    module.exports = Page;
});