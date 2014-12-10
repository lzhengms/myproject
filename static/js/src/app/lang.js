/**
 * 站点多语言规范包，目前语言包括
 *     cn: 简体中文，这个添加数据源时候无须写，key就是简体中文
 *     tw: 繁体中文
 *     en: 英文
 * 添加数据源
 *     请按结构修改data
 * 使用
 *     设置语言 .setLang('tw') 默认cn
 *     获取项   .get('谢谢') 获取对应语言的内容
 *     强制语言获取项 .get('谢谢', 'tw') 若默认语言是cn，某一项想用繁体，可以这么设置。若指定语言无内容，返回默认语言
 *     增加/修改项 .set('谢谢', {en: 'Thank you', tw: ''})
 *
 *
 * User: caolvchong@gmail.com
 * Date: 11/14/13
 * Time: 11:03 AM
 */
define(function(require, exports, module) {
    var $ = require('$');
    var cookie = require('../lib/util/bom/cookie');

    var defaultLang = cookie.get('language');
    if(!defaultLang) {
        cookie.set('language', defaultLang = 'cn');
    }

    // 数据源
    var data = {
        '谢谢': {
            en: 'Thank you',
            tw: '謝謝'
        },
        '请稍候': {
            en: 'Please wait',
            tw: '請稍候'
        }
    };

    for(var key in data) { // 设置简体中文
        data[key].cn = key;
    }

    module.exports = {
        setLang: function(lang) {
            cookie.set('language', defaultLang = lang);
        },
        get: function(key, lang) {
            lang = lang || defaultLang;
            return data[key][lang] || key;
        },
        set: function(key, item) {
            data[key] = $.extend(data[key], item);
        }
    };
});