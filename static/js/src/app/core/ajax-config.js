/**
 * Description: Ajax项目配置
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Ajax = require('./ajax');
    var MessageDistributor = require('./message-distributor');
    var Cookie = require('../../lib/util/bom/cookie');
    var Verify = require('./verify');
    var IMInteraction = require('./im-interaction');
    var JSON = require('../../lib/util/json');
    var IMLongPolling = require('./im-long-polling');

    var Group = require('./models/Group');
    var ErrorDialog = require('../index/cmp/error-dialog');

    Ajax.setConfig({
        isVerified: function () {
            return Cookie.get('PHPSESSID') == Global.sid;
        }
    });
    Ajax.setConfig({
        defaultCallback: function () {

        }

    });

    Ajax.setConfig(/^\/_oap\//, {
        normalizeOptions: function (options) {
            options.timeout = options.timeout || 30 * 1000;
            options.dataType = options.dataType || 'json';

            if (!options._parsed) {
                options.url = Global.oapUrl + options.url.slice(6);
                options._parsed = true;
            }
            if (options.method === 'POST') {
                options.data=JSON.stringify(options.data);
            }
            return options;
        },
        defaultCallback: function () {
            var self = this;
            // OAP 401 Unauthorized
            this.on('not-allowed',function (data) {
                IMInteraction.trigger('clearCookie');
                IMInteraction.trigger('error', '登录已失效，请重新登录');
                IMInteraction.trigger('redirect', window.Global.url + 'login');
            }).on('server-error',function () {
                    //ErrorDialog.set('content', '服务器发生错误').show();
                }).on('unVerified', function () {
                    IMInteraction.trigger('clearCookie');
                    IMInteraction.trigger('error', '登录已失效，请重新登录');
                    IMInteraction.trigger('redirect', window.Global.url + 'login');
                }).on('disconnect',function(){
                    ErrorDialog.set('title','提示');
                    ErrorDialog.set('content','网络不给力，请检查是否断网!').show();
                });
        }
    });


    Ajax.setConfig(/^\/_im\//, {
        normalizeOptions: function (options) {
            if (options.data) {
                // fix IE8 JSON bug
                var s = JSON.stringify(options.data).replace(/\\\\'/g, "\\\'");
                eval("var k = '" + s + "';");
                options.data = k;
            }
            options.headers = {
                'Aid': Global.aid
            };

            // 如果是IM请求统一由MessageDistributor管理回调
            // 标识IM请求IMRequest
            if (options.url === '/_im/m') {
                this.set('isIMRequest', true);
            }

            if (!options._parsed) {
                options.url = Global.imUrl + options.url.slice(5);
                options._parsed = true;
            }

            options.timeout = options.timeout || 30 * 1000;
            options.dataType = options.dataType || 'json';

            return options;
        },
        defaultCallback: function () {
            var self = this;
            // IM消息
            this.on('unVerified', function () {
                IMInteraction.trigger('clearCookie');
                IMInteraction.trigger('error', '登录已失效，请重新登录');
                IMInteraction.trigger('redirect', window.Global.url + 'login');
            });

            if (this.get('isIMRequest')) {
                // 成功则交予消息分发器
                this.on('done', function (data) {
                    MessageDistributor(data);
                });
                // IM 403 Unauthorized
                this.on('no-permission', function (data) {
                    Verify.getAid().done(function () {
                        Verify.sayHello().done(function () {
                            // 再次发送请求
                            self.resend();
                            IMLongPolling.resend();
                            Group.signAllIn();
                        });
                    });
                });
            }
        }
    });

});
