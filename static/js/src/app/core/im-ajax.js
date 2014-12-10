/**
 * Description: IM-Ajax封装，避免出现同时发出多个请求
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Ajax = require('./ajax');

    var timer = null;
    var requestBody = [];

    var IMAjax = function(data, config) {
        // config = { cmd: 123, body: {} };
        requestBody.push(data);

        if (!timer) {
            timer = setTimeout(sendRequest, 50, config);
        } else {
            clearTimeout(timer);
            timer = setTimeout(sendRequest, 50, config);
        }

    };



    function sendRequest(config) {
        var ajax = Ajax({
            url: '/_im/m',
            method: 'POST',
            data: {
                __m: requestBody
            }
        });

        config && config.done && ajax.done(config.done);

        requestBody.length = 0;
    }

    return IMAjax;
});
