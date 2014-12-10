/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var $ = require('$');

    var FriendList = require('../../core/models/FriendList');
    var GroupList = require('../../core/models/GroupList');
    var UserMessage = require('../../core/models/UserMessage');
    var GroupMessage = require('../../core/models/GroupMessage');
    var RecentContactList = require('../../core/models/RecentContactList');

    RecentContactList.set('DOM', $('.contacts.category-panel'));

    FriendList.tpl =  require('../tpl/friend-list');
    GroupList.tpl = require('../tpl/group-list');
    UserMessage.tpl = require('../tpl/message');
    GroupMessage.tpl = require('../tpl/message');
    GroupMessage.noticeTpl = require('../tpl/message-notice');
});