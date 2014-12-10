/**
 * User: caolvchong@gmail.com
 * Date: 11/14/13
 * Time: 2:37 PM
 */
define(function (require, exports, module) {
    var $ = require('$');

    var lang = require('../lang');
    lang.setLang('tw'); // 会写入cookie

    var action = require('../../lib/util/dom/action');
    var ajax = require('../../lib/util/ajax');
    var JSON = require('../../lib/util/json');
    var placeholder = require('../../lib/util/dom/placeholder');
    var Cookie = require('../../lib/util/bom/cookie');
    Cookie.set('PHPSESSID',Cookie.get('PHPSESSID'),- 1 * 24 * 3600 * 1000,{path: '/',domain: '.'+document.domain});


    // 默认用户名
    var username = Cookie.get('uid');
    $('input[name=account]').val(username);

    placeholder.render();

    //更换验证码图片
    var changeImg = function () {
        $('.login-codeimg').attr('src', window.imgCodeUrl + '?r=' + Math.random());
    }
    //按钮loading
    var isSending = function (o) {
        $(o).attr({
            'val': $(o).val(),
            'style': 'background: gray',
            'disabled': 'disabled'
        }).val('加载中...');
    };
    //按钮回复初始化
    var resetting = function (o) {
        $(o).removeAttr('style').attr('disabled', false).val($(o).attr('val'));
    };
    //支持回车
    $('input[name=account], input[name=password],input[name=checkcode]').each(function () {
        $(this).keydown(function (e) {
            if (e.keyCode === 13 || e.keyCode === '13') {
                $('input[name=submit]').trigger('click');
            }
        });
    });
    // 设置密码输入框无法黏贴
    $('input[type=password]').bind('paste', function () {
        var $me = $(this);

        setTimeout(function () {
            $me.val('');
        }, 1);
    });

    action.listen({
        changeImg: function (e, node, key) {
            changeImg();
        },
        login: function (e, node, key) {
            var account = $('input[name=account]');
            var password = $('input[name=password]');
            var imgcode = $('input[name=checkcode]');
            var d = {};

            if (account.val() === '') {
                account.css('border', '2px solid red');
                $('.err-tip').html('用户名不能为空');
                return;
            } else {
                account.css('border', 'none');
            }

            if (password.val() === '') {
                password.css('border', '2px solid red');
                $('.err-tip').html('密码不能为空');
                return;
            } else {
                password.css('border', 'none');
            }

            d.account = account.val();
            if (d.account.indexOf('@') === -1) {
                d.account += '@nd';
            }
            d.password = password.val();
            if ($('.login-checkcode').is(':visible')) {
                if (imgcode.val() === '') {
                    imgcode.css('border', '2px solid red');
                    return;
                } else {
                    imgcode.css('border', 'none');
                    d.imgcode = imgcode.val();
                }
            }

            $.ajax({
                dataType: 'JSON',
                url: Global.loginUrl,
                //url:$('#login_url').val(),
                type: 'POST',
                data: d,
                beforeSend: function () {
                    isSending($('input[name=submit]'));
                },
                success: function (data) {
                    if (data.code == 200) {
                        resetting($('input[name=submit]'));
                         setTimeout(function () {
                             window.location.href = window.URL.replace('https://', 'http://');
                         }, 50);
                    } else {
                        resetting($('input[name=submit]'));
                        if (data.needchkcode === 1 || data.needchkcode === '1') {
                            $('.err-tip').html(data.msg);
                            $('.login-checkcode').show();
                        } else {
                            $('.err-tip').html(data.msg);
                        }
                    }
                }
            });
        }
    });
});