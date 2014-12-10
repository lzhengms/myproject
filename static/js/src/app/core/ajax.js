/**
 * Description: 项目的AJAX模块
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../lib/util/base');


    function Ajax(options) {
        return new _Ajax(options);
    }


    Ajax._config = {};

    // default config
    Ajax.defaultConfig = {
        defaultCallback: function () {
        },
        normalizeOptions: function (options) {
            return options;
        },
        isVerified: function () {
            return true;
        },
        customStatus: function (data, textStatus, jqXHR) {
            this.trigger('done', data, textStatus, jqXHR);
        }
    };

    Ajax.setConfig = function (route, config) {
        if (!config) {
            config = route;
            route = '/';
            route.reg = null;
        } else if (route instanceof RegExp) {
            config.reg = route;
            route = route.source;
        } else {
            config.reg = new RegExp(route);
        }

        if (!Ajax._config[route]) {
            Ajax._config[route] = {};
        }

        $.extend(Ajax._config[route], Ajax.defaultConfig, Ajax._config['/'], config);
    };

    Ajax.parseUrl = function (url) {
        var route;

        $.each(Ajax._config, function (rName, r) {
            if (r.reg && r.reg.test(url)) {
                route = rName;
            }
        });

        route = route || '/';

        return route;
    };

    var _Ajax = Base.extend({
        attrs: {
            ajax: null
        },
        initialize: function (options) {
            _Ajax.superclass.initialize.call(this);

            this.set('options', options);
            this.parseOptions();

            this.sendRequest();
            this.bindDefaultCallback();
        },
        parseOptions: function () {
            var options = this.get('options');
            var route = Ajax.parseUrl(options.url);

            var config = Ajax._config[route];
            if (config.method === 'POST') {
                config.data = JSON.stringify(config.data);
            }
            this.set('config', config);
        },
        // 调用项目相关的AJAX配置
        normalizeOptions: function (options) {
            return this.get('config').normalizeOptions.call(this, options);
        },
        bindDefaultCallback: function () {
            this.get('config').defaultCallback.call(this);
        },
        // 判断操作是否合法
        isVerified: function (options) {
            return this.get('config').isVerified.call(this, options);
        },
        sendRequest: function () {
            var self = this;
            var options = this.normalizeOptions(this.get('options'));

            if (this.isVerified(options)) {

                self.trigger('verified');


                var ajax = $.ajax(options);
                ajax.done(function (data, textStatus, jqXHR) {
                    self.trigger('always', data, textStatus, jqXHR);
                    self.get('config').customStatus.call(self, data, textStatus, jqXHR);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR.readyState === 0) {
                            // 网络中断 或 连接超时
                            if (textStatus === 'timeout') {
                                // 连接超时
                                self.trigger('timeout', jqXHR, textStatus, errorThrown);
                            } else {
                                // 网络中断
                                self.trigger('disconnect', jqXHR, textStatus, errorThrown);
                                self.trigger('always', jqXHR, textStatus, errorThrown);
                                return;
                            }
                        }
                        if (jqXHR.readyState === 4) {
                            var status = jqXHR.status;
                            switch (status) {
                                case 401:
                                    self.trigger('not-allowed', jqXHR, textStatus, errorThrown);
                                    break;
                                case 403:
                                    self.trigger('no-permission', jqXHR, textStatus, errorThrown);
                                    break;
                                case 404:
                                    self.trigger('not-found', jqXHR, textStatus, errorThrown);
                                    break;
                                case 502:
                                    self.trigger('offline');
                                    break;
                                case 12007:
                                    //断网
                                    self.trigger('disconnect');
                                    break;
                            }
                            if (String(status).substring(0, 1) === '5') {
                                self.trigger('server-error', jqXHR, textStatus, errorThrown);
                            }
                        }
                        self.trigger('always', jqXHR, textStatus, errorThrown);
                        self.trigger('fail', jqXHR, textStatus, errorThrown);
                        return self;
                    });
                self.set('ajax', ajax);
            } else {
                self.trigger('unVerified');
            }
        },
        progress: function () {

        },
        promise: function () {
            return this;
        },
        done: function (callback) {
            this.on('done', callback);
            return this;
        },
        fail: function (callback) {
            this.on('fail', callback);
            return this;
        },
        then: function (callback) {
            this.on('always', callback);
            return this;
        },
        abort: function () {
            if (this.get('ajax')) {
                return this.get('ajax').abort();
            }
        },
        resend: function () {
            this.abort();
            this.sendRequest();
        }
    });

    window.ajax = Ajax;
    window.$ = $;
    return Ajax;
});
