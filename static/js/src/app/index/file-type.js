/**
 * Description: 获取文件类型
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var FILE_TYPE_ENUM = {
        doc: ['doc', 'docx'],
        xls: ['xls', 'xlsx'],
        ppt: ['ppt', 'pptx'],

        pdf: ['pdf'],
        txt: ['txt'],
        zip: ['zip', 'rar', '7z'],

        movie: ['mp4', 'avi', 'mpeg4', 'wmv', 'mov'],
        music: ['mp3', 'wma'],
        pic: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'psd']
    }

    var GET_FILE_TYPE_REG = /.*\.(\w+)/;
    var DetectFileType = function(filename) {
        var match = filename.match(GET_FILE_TYPE_REG);
        var res = null;

        if (match) {
            var fileType = match[1].toLowerCase();

            $.each(FILE_TYPE_ENUM, function(index, types) {
                if ($.inArray(fileType, types) !== -1) {
                    res = index;
                }
            });
        }

        return res || 'default';
    }

    return DetectFileType;

});