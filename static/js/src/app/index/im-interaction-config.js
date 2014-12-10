/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var IMInteraction = require('../core/im-interaction');

    var InformationReminder = require('./information-reminder');
    var ErrorDialog = require('./cmp/error-dialog');
    var Cookie = require('../../lib/util/bom/cookie');

    // IM消息交互
    IMInteraction.on('unread-message', function(message) {
        InformationReminder.push(message);
    });

    IMInteraction.on('read-message', function(who) {
        InformationReminder.del(who);
    });

    IMInteraction.on('clearCookie', function() {
        Cookie.set('Aid',Cookie.get('Aid'),- 1 * 24 * 3600 * 1000,{path: '/'});
        Cookie.set('PHPSESSID',Cookie.get('PHPSESSID'),- 1 * 24 * 3600 * 1000,{path: '/'});
        Cookie.set('PHPSESSID',Cookie.get('PHPSESSID'),- 1 * 24 * 3600 * 1000,{path: '/',domain: '.'+document.domain});
    });

    IMInteraction.on('error', function(content) {
        ErrorDialog.set('content', content).show();
    });

    IMInteraction.on('redirect', function(href) {
        window.onbeforeunload = null;
        ErrorDialog.after('hide', function() {
            location.href = href;
        });
    });
});