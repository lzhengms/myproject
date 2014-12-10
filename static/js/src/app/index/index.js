/**
 * Description: APP初始化
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Helper = require('./helper');
    var Cookie = require('../../lib/util/bom/cookie');

    var AjaxConfig = require('../core/ajax-config');
    var User = require('../core/models/User');
    var Verify = require('../core/verify');
    var IMLongPolling = require('../core/im-long-polling');
    var OapHeartbeat = require('../core/oap-heartbeat');

    var Visualize = require('./visualize/index');     // 视图相关的绑定
    var IMInteractionConfig = require('./im-interaction-config');

    var PersonnelTab = require('./personnel-tab');
    var ChatWindow = require('./chat-window');
    var Actions = require('./actions/actions');
    var myAction=require('./actions/my-action');
    var InformationReminder = require('./information-reminder');


    Cookie.set('uid', Global.uid, null, { path: '/webchat' });
    // request AID
    Verify.getAid().done(function() {
        Verify.sayHello().done(function() {
            // 获得AID之后才可以进行的im操作
            // 开启长轮询
            IMLongPolling.start();
            // 开启pid心跳轮询
            OapHeartbeat.start();
            // 加载生日用户
            User.getBirthdayUser();
            // 加载明天、后天、三天后生日用户
            User.getCommingBirthdayUser();
            // 加载最近联系人列表、好友、群列表
            PersonnelTab.set('current', 'groups');
            setTimeout(function() {
                PersonnelTab.set('current', 'friends');
                PersonnelTab.set('current', 'contacts');
            }, 500);
            PersonnelTab.set('current', 'contacts');
        });
    });


});