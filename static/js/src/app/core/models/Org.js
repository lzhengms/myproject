/**
 * Description: 组织
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Ajax = require('../ajax');
    var User = require('./User');
    var Base = require('../../../lib/util/base');

    var Org = Base.extend({
        attrs: {
            id: null,
            name: null,
            // 树目录复杂用DOM效率低下  600ms vs 900ms
            html: null,
            // 初始化为折叠着的树
            folding: true,
            subOrgs: []
        },
        initialize: function(config) {
            this.normalizeConfig(config);
            Org.superclass.initialize.call(this, config);
            this.parseSubOrgs(config);
            //this.parseHTML(config);
        },
        normalizeConfig: function(config) {
            config.sub = config.sub || [];
            // 深度
            config.depth = config.depth || 1;
        },
        parseSubOrgs: function(config) {
            config.subHTML = '';
            var self = this;
            var subs = config.sub;
            if (subs.length) {
                $.each(subs, function(index, sub) {
                    // 深度+1
                    sub.depth = config.depth + 1;
                    var o = new Org(sub);
                    self.get('subOrgs').push(o);
                    config.subHTML += o.get('html');
                });
            }
            var html = Org.tpl.render(config);
            this.set('html', html);
        }
    });

    return Org;
});
