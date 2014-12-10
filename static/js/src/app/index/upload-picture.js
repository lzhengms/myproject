/**
 * Description: 图片上传控件
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Upload = require('../../lib/util/dom/upload/upload');
    var ErrorDialog = require('./cmp/error-dialog');

    return function (params) {
        var u = new Upload({
            url: params.url,
            swf: window.Global.url + 'static/public/swf/swfupload.swf',
            node: params.node,
            accept: params.accept,
            type: params.type,
            maxSize: params.maxSize || '2MB', // 文件大小限制
            maxCount: -1, // 文件数量限制，-1不限制
            multi: true, // 是否允许多文件上传
            max: 3,
            fileName: 'upfile',
            data: {},

            height: 80,
            chunk: params.chunk||false,
            perMaxSize: params.perMaxSize||'',
            perMinSize: params.perMinSize || '300KB',
            bytesPerChunk: params.bytesPerChunk ||'1MB',//1MB CHUNK SIZE
            md5:params.md5||false
        }).on('overSizeLimit',function (size, file) { // 超过大小限制
                ErrorDialog.hide();
                ErrorDialog.set('content', '超过限制大小(' + size + ')').show();
            }).on('zeroSize',function (file) { // 空文件
                ErrorDialog.hide();
                ErrorDialog.set('content', '空文件').show();
            }).on('overCountLimit',function (limit) { // 超过数量限制
                ErrorDialog.hide();
                ErrorDialog.set('content', '文件数量超过限制').show();
            }).on('notAllowType',function (file) { // 不允许文件类型
                ErrorDialog.hide();
                ErrorDialog.set('content', '文件类型错误').show();
            }).on('successAdd',function (file) { // 成功加入队列

            }).on('errorAdd',function (file, files) { // 加入队列失败
                ErrorDialog.hide();
                ErrorDialog.set('content', '加入队列失败').show();
            }).on('progress',function (file, loaded, total) { // 上传进度
                /*
                 var per = parseInt(loaded * 100 / total, 10);
                 var dom = picContainer.find('.index-' + file.index);
                 dom.find('.progress .num span').html(per);
                 dom.find('.progress .loaded').width(per + '%');
                 */
            }).on('error',function (file, data, result) { // 文件上传失败时或者被终止时触发，引起的可能性有：上传地址不存在/主动终止
                ErrorDialog.hide();
                var errorMessage = data.message ? data.message : (data.msg ? data.msg : '');
                ErrorDialog.set('content', errorMessage ? '上传失败,原因是:' + errorMessage : '上传失败').show();
            }).on('finish',function (file) {

            }).on('complete', function (file) {
                u.reset();
            });

        return u;
    };
});
