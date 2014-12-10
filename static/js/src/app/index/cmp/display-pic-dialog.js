/**
 * Description: 图片展示弹出框
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Dialog = require('../../../lib/cmp/dialog/dialog');
    var ImageHelper = require('../../../lib/util/dom/image');
    var DisplayPicDialog = new Dialog({
        title: null,
        width: 'auto',
        height: 'auto',
        className: 'display-pic',
        hasMask: {
            value: true,
            hideOnClick: true
        },
        loadingTip: '<div class="loading-tip">正在加载...</div>',
        content: '<img />',
        src: null,
        onChangeSrc: function(src) {
            if (src === null) {
                return;
            }

            var self = this;

            self.$('img').replaceWith(this.get('loadingTip'));
            self.show();

            ImageHelper.load({
                url: src,
                ready: function() {
                    var img = this;
                    ImageHelper.zoom({
                        node: $(img),
                        maxWidth: 1024,
                        maxHeight: 768,
                        overflow: false,
                        callback: function(width, height) {
                            img.width = width;
                            img.height = height;
                            $(img).css({ width: width, height: height });
                        }
                    });
                },
                load: function() {
                    var img = this;
                    self.hide();
                    self.$('.loading-tip').replaceWith(img);
                    self.show();
                }
            });
        }
    });

    DisplayPicDialog.after('hide', function() {
        this.set('src', null);
    });

    DisplayPicDialog.render();
    return DisplayPicDialog;
});