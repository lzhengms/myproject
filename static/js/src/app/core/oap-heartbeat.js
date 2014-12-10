/**
 * Description: 心跳请求（保证PHPSESSID有效）
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Ajax = require('./ajax');
    var Cookie = require('../../lib/util/bom/cookie');
    var JSON = require('../../lib/util/json');
    var IMInteraction = require('./im-interaction');

    // 心跳请求
    var heartBeatRequest = function() {
        Ajax({
            url: '/_oap/passport/check',
            method: 'POST',
            data: {
                'uap_sid': Cookie.get('PHPSESSID'),
                'clientinfo': {}
            }
        }).fail(function() {
            IMInteraction.trigger('clearCookie');
            IMInteraction.trigger('error', '登录已失效，请重新登录');
            IMInteraction.trigger('redirect', window.Global.url + 'login');
        });
    }

    // 用于测试
    window.hb = heartBeatRequest;

    return {
        start: function() {
            setInterval(function() {
                heartBeatRequest();
            }, 10 * 60 * 1000);
        }
    };
});
