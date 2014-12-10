/**
 * @description 公众号消息解析
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-3-5
 */
define(function (require, exports, module) {
    var $ = require('$');
    require('jPlayer');
    var Audio = require('../../lib/util/dom/audio/audio');
    var Action = require('../../lib/util/dom/action');
    var jEmoji = require('../../lib/ex/util/emoji');
    var FancyConfirmBox = require('../index/cmp/fancy-confirm-box');
    var Tpl = {
        video: require('../index/tpl/video'),
        multipleImgs: require('../index/tpl/mutiple-imgs'),
        videoDialog: require('../index/tpl/dialog/video-dialog')
    };

    var audio = require('../../lib/util/dom/audio/audio');
    var emojiRes = require('./expr-source/emoji');
    var smileyRes = require('./expr-source/smiley');
    var yinghunRes = require('./expr-source/yinghun');


    var PARSE_MESSAGE = /<time>(.*)<\/time><type>(.*)<\/type>(?:<body.*?>)(.*)(?:<\/body>)/;

    var SPAN_TAG = /(<span>)?(<\/span>)?/g,
        MOOD_TAG = /<mood.*?>(.*)<\/mood>/g,
        NUM_TAG = /<s(\d+)\s*\/>/g;

    var IMG_TAG = /<img\s*src="\s*(.*)\s*"\s*(?:alt="\s*(.*)\s*")?\s*\/>/g,
        SRC_TAG = /\s*sfsp:\/\/\s*/;
    var AUDIO_TAG = /<audio\s*src="(.*?)"\s*(?:dura="(.*?)")?\s*\/>/g;
    var VIDEO_TAG = /<video\s*src="(.*?)"\s*(?:dura="(.*?)")?\s*(?:img="(.*?)")?\s*\/>/g;
    var MEDIA_TAG = /<multimedia.*?><title>(.*)<\/title>\s*(.*?)\s*(?:<summary>(.*))?(?:<\/summary>)?(?:<summary\s*\/>)?<\/multimedia>/g;
    var MULTIPLE_IMG_TAG = /<item\s*href="(.*?)"><title>(.*?)<\/title><picurl>(.*?)<\/picurl><summary>(.*?)<\/summary><\/item>/g,
        SID_TAG = /\{sid\}/g;

//解析公众号消息（用户处理接收消息）

    var config = {
        'static-prefix': window.Global.url + 'static/public/themes/default/images/smile/static/',
        'custom-prefix': window.Global.oaUrl + 'sfs/ops/down.php?k='
        //外网生产环境
        //'custom-prefix': 'http://imnd.99.com/sfs/ops/down.php?k='
    }

    function parseSrc(src) {
        if (SRC_TAG.test(src)) {
            src = src.replace(SRC_TAG, function () {
                return Global.pspImgUrl;
            });
        }
        return src;
    }

    function smileParse(key) {
        return  "<img src='" + config['static-prefix'] + key + ".gif'</img>";
    }

    function imgParse(src, alt, brief) {
        if (brief) {
            return '[图片]';
        }
        src = parseSrc(src).replace(SID_TAG, Global.sid);
        alt = alt ? alt : '';
        return '<img data-role="loading-pic" src="/webchat/static/public/themes/default/images/pic-loading.gif" data-src="' + src + '" class="custom" alt="' + alt + '" data-action="display-pic"  />';
    }

    function emojiParse(unified) {
        var support = false;
        var title = '';
        $.each(emojiRes, function (index, emoji) {
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

    function audioParse(params) {
        if (params.brief) {
            return '[音频]';
        }
        params.resource = params.resource.replace(SID_TAG, Global.sid);
        return '<div class="psp-audio" data-action="audio-player" data-src="' + params.resource + '" id="' + cid('audio') + '"></div>' + params.duration + '"';
    }

    function videoParse(params) {
        if (params.brief) {
            return '[视频]';
        }
        params.resource = params.resource.replace(SID_TAG, Global.sid);
        return Tpl.video.render(params);
    }

    function multipleImgsParse(arr) {
        return Tpl.multipleImgs.render({list: arr});
    }

    var _cid = 0;

    function cid(type) {
        return type + (_cid++);
    }


    function parse(message, brief) {
        var ret;
        var messageType = 'type-plain'; // plain image audio
        var message = message || '';
        var matches;
        if (matches = message.match(PARSE_MESSAGE)) {
            switch (+matches[2]) {
                case 1:
                    //解析公众号表情文字(smile表情和英魂之刃的表情)
                    ret = matches[3].replace(MOOD_TAG,function (match, $1, $2, index, input) {
                        return $1.replace(NUM_TAG, function (input, $$1) {
                            return smileParse($$1);
                        });
                    }).replace(SPAN_TAG, '').replace(IMG_TAG, function (match, src) {
                            return imgParse(src);
                        });
                    // 解析emoji
                    var map = jEmoji.EMOJI_MAP;
                    var re;
                    for (var key in map) {
                        if (map.hasOwnProperty(key)) {
                            re = new RegExp(key, 'g');
                            ret = ret.replace(re, function (match, index, input) {
                                var unified = map[match][5][1];
                                return emojiParse(unified);
                            });
                        }
                    }
                    break;
                case 2:
                    //解析图片消息
                    matches[3] = matches[3].replace(/\\"/g, '"');
                    ret = matches[3].replace(IMG_TAG, function (match, $1, $2) {
                        return imgParse($1, $2, brief);
                    });
                    break;
                case 3:
                    //解析音频
                    ret = matches[3].replace(AUDIO_TAG, function (match, resource, $2) {
                        var params = {
                            resource: resource,
                            brief: brief,
                            title: '',
                            summary: '',
                            duration: $2
                        };
                        return audioParse(params);
                    });
                    break;
                case 4:
                    //解析视频
                    ret = matches[3].replace(VIDEO_TAG, function (match, resource, dura, img) {
                        var params = {
                            resource: resource,
                            dura: dura,
                            img: img,
                            brief: brief,
                            title: '',
                            summary: ''
                        };
                        return videoParse(params);
                    });
                    break;
                case 5:
                    //解析多图文消息
                    if (brief) {
                        return '[多图文]';
                    }
                    var contents = [];
                    matches[3].replace(MULTIPLE_IMG_TAG, function (match, title_href, title, picurl, summary) {
                        contents.push({title_href: title_href.replace(SID_TAG, Global.sid), title: title, picurl: picurl.replace(SID_TAG, Global.sid), summary: summary});
                    });
                    return {render: true, str: multipleImgsParse(contents)};
                    break;
                case 7:
                    //解析视频消息（含有摘要）
                    var s = '';
                    AUDIO_TAG.lastIndex=0;
                    VIDEO_TAG.lastIndex=0;
                    ret = matches[3].replace(MEDIA_TAG, function (match, title, content, summary) {
                        if (AUDIO_TAG.test(content)) {
                            s = content.replace(AUDIO_TAG, function (matchAutido, resource, $2) {
                                var params = {
                                    resource: resource,
                                    brief: brief,
                                    title: title,
                                    summary: summary
                                };
                                return audioParse(params);
                            });
                        }
                        else if (VIDEO_TAG.test(content)) {
                            s = content.replace(VIDEO_TAG, function (matchVideo, resource, dura, img) {
                                var params = {
                                    resource: resource,
                                    dura: dura,
                                    img: img,
                                    brief: brief,
                                    title: title,
                                    summary: summary
                                };
                                return videoParse(params);
                            });
                        }
                        return s;
                    });
                    break;
                default:
                    ret = matches[3];
                    break;

            }
        } else {
            ret = message;
        }


        ret = '<div class="' + messageType + '">' + ret + '</div>';
        return ret;

    }

    var instance;

    function setInstance(id, src) {
        if (instance && (instance.get('src') === src) && (instance.get('id') === id)) {
            return instance;
        }
        if (!instance) {
            instance = new Audio({
                swf: '/static/public/swf/audiojs.swf',
                src: src,
                preload: true,
                autoplay: false
            });
        } else {
            instance.load(src);
        }
        instance.on('pause ended',function () {
            $('#' + id).removeClass('psp-audio-playing').addClass('psp-audio');
        }).on('play', function () {
                $('[data-action="audio-player"]').removeClass('psp-audio-playing').addClass('psp-audio');
                $('#' + id).removeClass('psp-audio').addClass('psp-audio-playing');
            });
        return instance;
    }

    var dialog;

    function setDialog() {
        if (!dialog) {
            dialog = new FancyConfirmBox({width: 766, height: 480});
            dialog.after('hide',function(){
                $("#jquery_jplayer_1").jPlayer("destroy");
            })
        }
        return dialog;
    }

    Action.listen({
        'audio-player': function (e, node, key) {
            var src = $(this).data('src');
            var id = $(this).attr('id');
            instance = setInstance(id, src);
            instance.set('id', id);
            if (instance.status !== 1) {
                instance.play();
            } else {
                instance.end();
            }
        },
        'video-player': function (e, node, key) {
            if (instance) {
                instance.end();
            }
            var title = $(this).siblings('.video-title').text();
            var videoSrc = $(this).data('src');
            var imgSrc = $(this).data('img-src');
            var duration = $(this).data('dura');
            dialog = setDialog();
            dialog.set('height', '475');
            dialog.set('width', '666');
            dialog.set('className', 'video-player-box');
            dialog.set('title', title);
            dialog.set('content', Tpl.videoDialog.render()).show();
            $("#jquery_jplayer_1").jPlayer("destroy");
            $("#jquery_jplayer_1").jPlayer({
                ready: function () {
                    $("#jquery_jplayer_1").jPlayer("setMedia", {
                        title: title,
                        m4v: videoSrc,
                        flv: videoSrc,
                        poster: imgSrc,
                        smoothPlayBar: true,
                        duration: duration
                    });
                },
                supplied: "flv,m4v",
                solution: "flash",
                swfPath: "static/public/swf",
                smoothPlayBar: true,
                keyEnabled: true,
                size: {
                    width: "640",
                    height: "360",
                    cssClass: "jp-video-360p"
                },
                remainingDuration: false,
                toggleDuration: true
            });
        }
    });

    //解析公众号消息（用户处理接收消息）

    //格式化公众号消息（用于处理发送出去的消息）


    var SMILE_REG = /(?:\[(.+?)\])+/g;
    var SINGLE_SMILE_REG = /\[(.+?)\]/g;
    var SPLIT_REG = /<mood.*?<\/mood>/g;

    var EMOJI_REG = /<(.*?)>/g;


    function mood(key) {
        return '<mood type=\\"s\\">' + key + '</mood>';
    }

    function mood_s(key) {
        return  '<s' + key + ' />';
    }

    function spanText(key) {
        return '<span>' + key + '</span>';
    }

    function format(text, type) {
        //默认是文本消息
        type = type || 1;
        if (!type || type === 1) {
            /*文本消息解析
             *文本消息，包括表情(smiley,emoji,yinghun),web上只能发送smiley和emoji，不能发送英魂
             *解析文本为<span>text</span>
             *解析“smiley”表情,例如:[微笑]表情为<mood type="s"><s1037 /><s1030 /></mood>
             *解析“英魂”表情,例如:<微笑>表情为<mood type="s"><s1037 /><s1030 /></mood>目前web不能发英魂表情
             *解析emoji表情为文本<span></span>
             */
            text = text.replace(EMOJI_REG,function (matche, $1, index, input) {
                var spanTxt = '';
                $.each(emojiRes, function (i, item) {
                    if (item.title == $1) {
                        var unified = item.unified;
                        var map = jEmoji.EMOJI_MAP;
                        for (var key in map) {
                            if (map.hasOwnProperty(key)) {
                                if (map[key][5][1] == unified) {
                                    spanTxt = key;
                                }
                            }
                        }
                        spanTxt = spanText(spanTxt);
                        return;
                    }
                });
                return spanTxt;
            }).replace(SINGLE_SMILE_REG, function (matche, $1, index, input) {
                    //matche取到[西瓜][西瓜][西瓜]
                    var str = matche.replace(SINGLE_SMILE_REG, function (matche1, $$1, index, input) {
                        var temp = '';
                        $.each(smileyRes, function (i, item) {
                            if (item.title == $$1) {
                                temp = mood_s(item.id);
                                return;
                            }
                        });
                        return temp;
                    });
                    return mood(str);
                });
            //过滤文本数组
            var arr = text.split(SPLIT_REG);
            arr = $.grep(arr, function (item, index) {
                if (item) {
                    return item;
                }
            });
            //过滤出空的
            var arr = text.split(SPLIT_REG);
            arr = $.grep(arr, function (item, index) {
                if (item) {
                    return item;
                }
            });
            //替换文本<span>text</span>
            $.each(arr, function (i, item) {
                var regex = new RegExp(item, 'g');
                text = text.replace(regex, function (match) {
                    return spanText(match);
                })
            });

        }
        else if (type === 2) {
            //图片消息
            text = '<img src=\\"' + config['custom-prefix'] + text + '\\"/>';
        }
        var startStr = '<msg><time>' + new Date().getTime().toString().slice(0, -3) + '</time><type>' + type + '</type><body fmt=\\"0\\">';
        var endStr = '</body></msg>';
        return startStr + text + endStr;
    }

    //格式化公众号消息（用于处理发送出去的消息）

    exports.parse = parse;
    exports.format = format;

});