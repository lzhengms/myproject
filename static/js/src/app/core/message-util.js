/**
 * Description: 消息解析工具
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    // 　测试 测试 &<img>*257:0:00*258:3:9f29b2f61e261beea0404c2ee5c79ff8.gif*259:6:8e81695b7764d8a26128856f9c8e1152<img>&&<fmt>4026531840：7：72:8388608:华文细黑<fmt>&
    var $ = require('$');
    var jEmoji = require('../../lib/ex/util/emoji');

    var staticResource = require('./expr-source/smiley');
    var emojiResource = require('./expr-source/emoji');
    var yinghunResource=require('./expr-source/yinghun');
    var JSON = require('../../lib/util/json');
    var Scroll = require('../../lib/util/dom/scroll');

    var config = {
        'static-prefix': window.Global.url + 'static/public/themes/default/images/smile/static/',
        'clip-prefix': window.Global.oaUrl + 'sfs/ops/down.php?k=',
        'custom-prefix': window.Global.oaUrl + 'sfs/ops/down.php?k='
        //外网生产环境
        //'clip-prefix': 'http://imnd.99.com/sfs/ops/down.php?k=',
        // 'custom-prefix': 'http://imnd.99.com/sfs/ops/down.php?k='

    };

    var PARSE_MESSAGE_INTO_GROUP_RE = /([\s\S]*)&<img>(.*)<img>&(&<fmt>(.*)<fmt>&)?/,
        PARSE_MESSAGE_INTO_GROUP_RE_ = /([\s\S]*)()&<fmt>(.*)<fmt>&/,
        PARSE_AUDIO_MESSAGE = /(?:&<audio>)([^:]*):([^:]*):([^:]*):([^:]*):([^:]*)(?:<audio>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        PARSE_VEDIO_MESSAGE = /(?:&<video>)([^:]*):([^:]*):([^:]*):([^:]*):([^:]*)(?:<video>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        PARSE_OFFLINEFILE_MESSAGE = /(?:&<offlinefile>)([^:]*):([^:]*):([^:]*):([^:]*)(?:<offlinefile>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        PARSE_OFFLINEDIR_MESSAGE = /(?:&<offlinedir>)([^:]*):([^:]*):([^:]*):([^:]*)(?:<offlinedir>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        PARSE_DIRECTORY_MESSAGE = /(?:&<directory>)([^:]*):([^:]*)(?:<directory>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        PARSE_FILE_MESSAGE = /(?:&<file>)([^:]*):([^:]*)(?:<file>&)((?:&<fmt>)(.*)(?:<fmt>&))?/,
        IMG_SPLITOR_RE = /\*/,
        PARSE_IMG = /(\d+):(-?\d+):(.*)/,
        //EMAIL_OR_LINK_RE = /(\w+((-w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+)|([a-zA-z]+:\/\/)?([\w-]+\.)+\S+/g,
        EMAIL_OR_LINK_RE =  /(\w+((-w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+)|(http|ftp|https):\/\/([\w-]+\.)+\S+/ig,
        EMAIL_RE = /\w+((-w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+/,
        //LINK_RE = /([a-zA-z]+:\/\/)?([\w-]+\.)+[A-Za-z-]+(\/\S+)?/g,
        LINK_RE = /(http|ftp|https):\/\/([\w-]+\.)+\S+/ig,
        NOTICE_RE = /([\s\S]*?)(?:DB30DF15-01F5-4464-B701-3026D7A24581)([\s\S]*)/;

    var IMG_TYPE_ENUM = {
        '259': 'clip',      //截图
        '257': 'static',    //固定表情
        '256': 'custom'     //自定义
    };

    var CLASS_ENUM = {
        'clip': 'clip',      //截图
        'static': 'emotion emotion-static',    //固定表情
        'custom': 'custom'     //自定义
    };

    var ESCAPER_ENUM = {
        '<': '&lt;',
        '>': '&gt;'
    };


    // brief for parsing last message
    var parse = function (message, brief) {
        var ret;
        var messageType = 'type-plain'; // plain image audio
        if (typeof message == "object") {
            return;
        }
        var message = message || '';
        var matches;
        if (matches = message.match(PARSE_AUDIO_MESSAGE)) {
            // 音频消息
            if (matches) {
                messageType = 'type-audio';
                if (brief) {
                    ret = '[语音消息]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    var filekey = matches[3];
                    var owner = matches[4];
                    var duration = matches[5];
                    ret = audioTemplate(owner, filekey, filename);
                }
            }
        } else if ((matches = message.match(PARSE_VEDIO_MESSAGE))) {
            // 视频消息
            if (matches) {
                //messageType = 'type-video';
                if (brief) {
                    ret = '[视频消息]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    var filekey = matches[3];
                    var owner = matches[4];
                    var duration = matches[5];
                    ret = videoTemplate(owner, filekey, filename);
                }
            }
        } else if ((matches = message.match(PARSE_OFFLINEFILE_MESSAGE))) {
            // 离线文件消息
            if (matches) {
                //messageType = 'type-video';
                if (brief) {
                    ret = '[离线文件]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    var filekey = matches[3];
                    var owner = matches[4];
                    ret = offlineFileTemplate(owner, filekey, filename);
                }
            }
        } else if ((matches = message.match(PARSE_OFFLINEDIR_MESSAGE))) {
            // 离线文件目录消息
            if (matches) {
                //messageType = 'type-video';
                if (brief) {
                    ret = '[离线文件目录]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    var filekey = matches[3];
                    var owner = matches[4];
                    ret = offlineDirTemplate(owner, filekey, filename);
                }
            }
        } else if ((matches = message.match(PARSE_DIRECTORY_MESSAGE))) {
            // 目录消息
            if (matches) {
                //messageType = 'type-video';
                if (brief) {
                    ret = '[目录]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    var filekey = null;
                    var owner = null;
                    ret = directoryTemplate(owner, filekey, filename);
                }
            }
        } else if ((matches = message.match(PARSE_FILE_MESSAGE))) {
            // 文件消息
            if (matches) {
                //messageType = 'type-video';
                if (brief) {
                    ret = '[文件消息]';
                } else {
                    var filename = matches[1];
                    var filesize = matches[2];
                    ret = fileTemplate(filename);
                }
            }
        } else if ((matches = message.match(PARSE_MESSAGE_INTO_GROUP_RE)) || (matches = message.match(PARSE_MESSAGE_INTO_GROUP_RE_))) {
            // 普通消息
            // 1.分组
            var lastPos = 0;
            var text = matches[1];
            var imgs = matches[2];
            var textArr = [];
            var res = [];

            text = text.replace(/\\'/g, "'");
            text = text.replace(/\\"/g, '"');
            text = text.replace(/\\\\/g, '\\');


            // 2.解析表情、自定义图片、截图
            imgs = imgs.split(IMG_SPLITOR_RE);
            // IE8 split BUG
            if (!imgs[0].length) {
                imgs = imgs.slice(1);
            }
            var body = $('#chat-window').find('.body');
            $.each(imgs, function (index, img) {
                var matches = img.match(PARSE_IMG);
                var type = matches[1],
                    pos = matches[2],
                    key = matches[3];

                if (IMG_TYPE_ENUM[type] === 'custom') {
                    messageType = 'type-image';
                }

                var src = parseSrc(type, key);

                imgs[index] = imageTemplate(src, IMG_TYPE_ENUM[type], brief,key);
                if($(imgs[index]).attr('src')) {
                    $(imgs[index])[0].onload = function(){
                        setTimeout(function () {
                            Scroll.to(body, 'bottom');
                        }, 10);
                    };
                }


                textArr[index] = text.slice(lastPos, pos);
                lastPos = +pos + 1;  //普通图片有1个长度...
            });
            textArr.push(text.slice(lastPos));
            imgs.push('');

            $.each(textArr, function (index, text) {
                // 3.转义和换行符
                for (var p in ESCAPER_ENUM) {
                    if (ESCAPER_ENUM.hasOwnProperty(p)) {
                        var reg = new RegExp(p, 'g');
                        text = text.replace(reg, ESCAPER_ENUM[p]);
                    }
                }

                // 4.解析URL和EMAIL
                if (!brief) {
                    text = text.replace(EMAIL_OR_LINK_RE, function () {
                        if (arguments[1]) {
                            // 邮箱
                            return emailTemplate(arguments[0]);
                        } else {
                            return _parseLink(arguments[0], arguments[7]);
                        }
                    });
                }
                text = text.replace(/\r/g, '<br>');

                // 5.解析emoji
                var map = jEmoji.EMOJI_MAP;
                var re;
                for (var key in map) {
                    if (map.hasOwnProperty(key)) {
                        re = new RegExp(key, 'g');
                        text = text.replace(re, function (match) {
                            var unified = map[match][5][1];
                            return emojiTemplate(unified, emojiResource);
                        });
                    }
                }

                // 加入到最后的结果
                res.push(text);
                res.push(imgs[index]);
            });

            ret = res.join('');
        }else {
            ret = message;
        }
        ret = '<div class="' + messageType + '">' + ret + '</div>';
        return ret;
    };

    function parseSrc(type, key) {
        type = IMG_TYPE_ENUM[type];
        switch (type) {
            case 'clip':
                return config['clip-prefix'] + key;
            case 'static':
                key = getStaticSrcByID(key);
                return config['static-prefix'] + key + '.gif';
            case 'custom':
                return config['custom-prefix'] + key;
        }

    }

    // 公告消息解析
    function parseNotice(message) {
        var ret = {title: '', content: ''};
        var content = JSON.parse(message)['content'];
        var matches = content.match(NOTICE_RE);
        if(matches) {
            ret.title = matches[1];
            ret.content = matches[2];
        }
        return ret;
    }

    function getStaticSrcByID(id) {
        return id;
    }

    function imageTemplate(src, type, brief,key) {
        var classname = CLASS_ENUM[type];
        if (classname === 'custom' || classname === 'clip') {
            if (brief) {
                return '[图片]';
            }
            return '<img data-role="loading-pic" src="/webchat/static/public/themes/default/images/pic-loading.gif" data-src="' + src + '" class="' + classname + '" data-action="display-pic" />';
        }
        if(brief&&key>=1120&&key<=1135){
            var item='';
            $.each(yinghunResource,function(index,u){
                if(u.id===key){
                    item='[' +u.title+']';
                    return false;
                }
            });
            return item;
        }
        return '<img src="' + src + '" class="' + classname + '" />';



    }

    function emojiTemplate(unified, emojiResource) {
        var support = false;
        var title = '';
        $.each(emojiResource, function (index, emoji) {
            if (emoji.unified === unified) {
                support = true;
                title = emoji.title;
            }
        });
        if (!support) {
            unified = 'U+E336';
            title = '?';
        }
        return '<img class="emotion emoji-emotion" title="' + title + '" src="' + window.Global.url + 'static/public/themes/default/images/smile/emoji/' + unified + '.png"/>';
    }

    function linkTemplate(_href, href) {
        return '<a target="_blank" href="' + href + '">' + _href + '</a>';
    }

    function emailTemplate(src) {
        return '<a href="mailto:' + src + '">' + src + '</a>';
    }

    function audioTemplate(uid, key, name) {
        var src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + uid + '&k=' + key;
        return '<a target="_blank" href="' + src + '" title="' + name + '"><div class="audio"></div></a>';
    }

    function videoTemplate(uid, key, name) {
        var src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + uid + '&k=' + key;
        return '[视频]<a target="_blank" href="' + src + '" title="' + name + '">' + name + '</a>';
    }

    function offlineFileTemplate(uid, key, name) {
        var src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + uid + '&k=' + key;
        return '[离线文件]<a target="_blank" href="' + src + '" title="' + name + '">' + name + '</a>';
    }

    function offlineDirTemplate(uid, key, name) {
        var src = window.Global.oaUrl + 'sfs/ofs/down.php?uid=' + uid + '&k=' + key;
        return '[离线文件目录]<a target="_blank" href="' + src + '" title="' + name + '">' + name + '</a>';
    }

    function directoryTemplate(uid, key, name) {
        return '[目录]';
    }

    function fileTemplate(name) {
        return '[文件消息]' + name;
    }

    //---------------------------FORMAT---------------------------------------
    var PARSE_STATIC_RE = /\[([^\]]*)\]/g;
    var PARSE_EMOJI_RE = /<([^\>]*)>/g;
    var MESSAGE_TYPE = ['PHOTO', 'OFFLINE-FILE'];
    var isObject = function (val) {
        return  {}.toString.call(val) === '[object Object]';
    };

    var format = function (text, type) {
        if (type === MESSAGE_TYPE[0]) {
            return ' &<img>*256:0:' + text + '<img>&&<fmt>4278190079:67108864:10:0:宋体<fmt>&';
        } else if (type === MESSAGE_TYPE[1]) {
            var filename = '', filesize = '', filekey = '', owner = '';
            if (isObject(text)) {
                filename = text.filename;
                filesize = text.filesize;
                filekey = text.filekey;
                owner = text.fileowner;
            }
            return '&<offlinefile>'+filename+':'+filesize+':'+filekey+':'+owner+'<offlinefile>&';
        } else {
            var imgs = '';


            // 解析EMOJI
            text = text.replace(PARSE_EMOJI_RE, function (match, title, index) {
                var code;
                var unified;
                var support = false;
                var map = jEmoji.EMOJI_MAP;
                $.each(emojiResource, function (index, emoji) {
                    if (emoji.title === title) {
                        support = true;
                        unified = emoji.unified;
                    }
                });
                if (support) {
                    $.each(map, function (key, arr) {
                        if (arr[5][1] === unified && !code) {
                            code = key;
                        }
                    });
                    return code;
                } else {
                    return match;
                }
            });

            var offset = 0;

            text = text.replace(/\n/g, function () {
                //offset += 1;
                return '\r';
            });

            // 解析STATIC
            text = text.replace(PARSE_STATIC_RE, function (match, title, index) {
                var id;
                var support = false;

                $.each(staticResource, function (i, static) {
                    if (static.title === title) {
                        support = true;
                        id = static.id;
                    }
                });

                if (support) {
                    imgs = imgs + '*257:' + (index - offset) + ':' + id;
                    offset += (title.length + 1);
                    return ' ';
                } else {
                    return match;
                }
            });

            text = text.replace(/\\/g, '\\\\');
            text = text.replace(/"/g, '\\\"');
            text = text.replace(/'/g, "\\\'");

            return text + '&<img>' + imgs + '<img>&&<fmt>4278190079:67108864:10:0:宋体<fmt>&';
        }
    };

    var _parseLink = function (link, protocol) {
        var href = link;
        var _href = href;
        if (!protocol) {
            href = 'http://' + href;
        }

        return linkTemplate(_href, href);
    };

    var parseLink = function (content) {
        if(content === null || content === '') {
            return null;
        }
        return content.replace(LINK_RE, function (match, protocol) {
            return _parseLink(match, protocol);
        });
    };

    exports.parse = parse;
    exports.parseNotice = parseNotice;
    exports.format = format;
    exports.parseLink = parseLink;
});
