/**
 * Description: 表情选择组件
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var ExpressionSelector = require('../../lib/cmp/selector/expr-selector');
    var EmojiResource = require('../core/expr-source/emoji');
    var SmileyResource = require('../core/expr-source/smiley');

    // 初始化表情组件
    var exprSelector = new ExpressionSelector({
        element: $('#expr-selector'),
        align: {
            selfXY: ['110px', '-270px'],
            baseElement: null,
            baseXY: ['50%', 0]
        }
    }).addGroup({
            name: '默认',
            className: 'default-face',
            data: SmileyResource
        }).addGroup({
            name: '符号表情',
            className: 'emoji-face',
            data: EmojiResource
        });
    exprSelector.render();

    return exprSelector;
});