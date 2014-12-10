/**
 * Description: 长轮询获取消息
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Ajax = require('./ajax');
    var Cookie = require('../../lib/util/bom/cookie');
    var IMInteraction = require('./im-interaction');

    var pending = false;

    var IMLongPolling =  {
        start: function() {
            this.ajax = Ajax({
                url: '/_im/m',
                method: 'POST',
                timeout: 120 * 1000
            }).on('timeout', function() {
                IMLongPolling.resend();
            }).on('done', function(data) {
                IMLongPolling.resend();
            }).on('always', function() {
                pending = false;
            });
            pending = true;
        },
        abort: function() {
            // pending = false;
            this.ajax.abort();
        },
        resend: function() {
            this.ajax.resend();
            pending = true;
        }
    };
    var phpsessid = '';
    // window.resetCookie判断是否重置cookie
    /* cookie为空的情况
    *  1、当用户打开登陆页，IE下会将cookie删除，此时重置cookie
    *  2、当用户自己退出时，cookie为空，但需要将重置cookie开关关闭
    *  3、被强制下线情况与2相同
    * */
    window.resetCookie = true; //登陆后开启重置cookie开关
    setInterval(function() {
        if (Cookie.get('PHPSESSID') === '' && window.resetCookie === true) { //将被误删的cookie重新设置
            Cookie.set('PHPSESSID',phpsessid, 1 * 24 * 3600 * 1000,{path: '/'});
        } else if (phpsessid === '') {
            phpsessid = Cookie.get('PHPSESSID');
        } else {
            if (phpsessid !== Cookie.get('PHPSESSID')) {
                IMInteraction.trigger('error', '登录已失效，请重新登录');
                IMInteraction.trigger('redirect', window.Global.url + 'login');
            }
        }

        if (!pending && IMLongPolling.ajax) {
            IMLongPolling.resend();
        }
    }, 3 * 1000);


    return IMLongPolling;
});
