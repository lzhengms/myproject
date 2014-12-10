/**
 * Description:
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var ImageHelper = require('../../lib/util/dom/image');
    var Scroll = require('../../lib/util/dom/scroll');

    var PicLoader = {
        load: function(container, noScroll) {
            var loadings = container.find('[data-role=loading-pic]'),maxWidth= 0,maxHeight=0;
            var wrap = $(container).parent();
            $.each(loadings, function(index, pic) {
                if (!$(pic).data('done')) {
                    maxWidth=$(pic).css('max-width')+'';
                    maxHeight=$(pic).css('max-Height')+'';
                    loadImage($(pic).data('src'), pic, container, wrap, noScroll, 0,maxWidth.substring(0,maxWidth.length-2),maxHeight.substring(0,maxHeight.length-2));
                }
            });
        }
    };

    function loadImage(src, pic, container, wrap, noScroll, time,maxWidth,maxHeight) {
        var maxWidth = isNaN(parseFloat(maxWidth)) ? 350 : parseFloat(maxWidth),
            maxHeight = isNaN(parseFloat(maxHeight)) ? 100 : parseFloat(maxHeight);
        if (time < 10) {
            ImageHelper.load({
                url: src,
                ready: function() {

                },
                load: function() {
                    var self = this;
                    $(pic).data('done', true);
                    $(this).data('done', true);

                    var size = ImageHelper.zoom({
                        node: this,
                        width: this.width,
                        height: this.height,
                        maxWidth: maxWidth||350,
                        maxHeight:maxHeight||100,
                        overflow: false
                    });

                    //调整比例失调的图片高宽
                    if (size.width / size.height > 8) {
                        size.width = 120;
                        size.height = 20;
                    } else  if (size.height / size.width > 8) {
                        size.width = 20;
                        size.height = 100;
                    }
                    $(this).width(size.width);
                    $(this).height(size.height);

                    $(this).attr('data-role', $(pic).attr('data-role'));
                    $(this).attr('data-action', $(pic).attr('data-action'));

                    $(this)[0].className = $(pic)[0].className;

                    $(pic).replaceWith($(this));

                    if (!noScroll) {
                        setTimeout(function() {
                            var top = wrap[0].scrollTop;
                            Scroll.to(wrap[0], top + self.height - 21);
                        }, 50)
                    }
                },
                error: function() {
                    setTimeout(function() {
                        loadImage(src, pic, container, wrap, noScroll, time + 1);
                    }, 1000 * (time + 1));
                }
            });
        }
    }

    return PicLoader;;
});