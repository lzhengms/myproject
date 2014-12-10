/**
 * User: chengbapi@gmail.com
 * Date: 14-6-9
 * Time: 下午2:18
 */

define(function (require, exports, module) {
    var FriendList = require('../../core/models/FriendList');


    FriendList.implement({
        visualize: function () {
            this.initDOM();
            this.set('listid', this.get('DOM').data('listid'));
        },
        // toggle一组好友
        toggle: function () {
            var self = this;
            var DOM = this.get('DOM');
            var name = DOM.find('[data-role=list-name]');
            var content = DOM.find('[data-role=list-content]');

            var loaded = this.get('loaded');
            if (!loaded) {
                this.requestMembers().done(function () {
                    var friends = self.get('friends');

                    $.each(friends, function (index, friend) {
                        if(friend.get('isPsp')){
                            friend.signIn();
                        }
                       content.append(friend.addDOM());
                    });
                    name.text(name.text() + '[' + self.get('total') + ']');
                });
            } else {
                DOM.toggleClass('active');
            }
        },
        show: function () {
            this.get('DOM').addClass('active');
        },
        hide: function () {
            this.get('DOM').removeClass('active');
        }

    });
});