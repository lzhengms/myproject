/**
 * Description: 验证身份并登录IM
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Ajax = require('./ajax');
    var IMAjax = require('./im-ajax');
    var MessageDistributor= require('./message-distributor');
    var Interaction = require('./im-interaction');
    var Browser = require('../../lib/util/bom/browser').is;

    MessageDistributor.register(36864, function(data) {
        if (data.res_code === 406) {
            Interaction.trigger('error', '登录操作太过频繁,请稍候再试!');
        }
        if (data.res_code === 505) {
            Interaction.trigger('error', '版本不支持!');
        }
        if (data.res_code === 200) {
            Global.user.set('multpid', data.ownmulptid);
            Global.user.set('multdesc', "web91u online from tool.");
        }
    });

    MessageDistributor.register(33, function(data) {
        window.resetCookie = false;  //被强制下线，关闭重置cookie开关
        Interaction.trigger('clearCookie');
        Interaction.trigger('error', '你被其他登录点强制下线，请重新登录');
        Interaction.trigger('redirect', window.Global.url + 'login/logout');
    });

    return {
        getAid: function() {
            return Ajax({
                url: '/_im/check',
                method: 'POST',
                data: {
                    cmd: 117,
                    body: {
                        sid: window.Global.sid,
                        uid: window.Global.uid
                    }
                }
            }).done(function(data) {
                // 不是IM消息自行解析
                data = data['__m'][0];
                if (data.aid) {
                    window.Global.aid = data.aid;
                } else {
                    Interaction.trigger('error', data.errorinfo);
                }
            });
        },
        sayHello: function() {
            IMAjax({
                cmd: 119
            });
            return Ajax({
                url: '/_im/m',
                method: 'POST',
                data: {
                    cmd: 36864,
                    body: {
                        status: 1,
                        status_desc: "",
                        multpid: 1,  //是否单点，1=多点 0=单点（赶走所有其他多点）
                        multpdesc: "171|" + Browser + "|||V" + Global.version,
                        keepalive:0,
                        unit_id:Global.unitId
                    }
                }
            });
        }
    };
});
