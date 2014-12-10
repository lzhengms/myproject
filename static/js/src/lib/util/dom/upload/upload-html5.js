/**
 * User: caolvchong@gmail.com
 * Date: 9/16/13
 * Time: 1:38 PM
 */
define(function (require, exports, module) {
    var $ = require('$');
    var Base = require('../../base');
    var DragUpload = require('./upload-draggable');
    var Md5 = require('../../encry/md5_new');

    var helper = {
        unit: function (str) {
            var s = $.trim(str.replace(/\d+/, '')).toUpperCase();
            var d = $.trim(str.replace(/\D+/g, ''));
            var a = ['B', 'KB', 'MB', 'GB', 'TB'];
            var n = 0;
            for (var i = 0, len = a.length; i < len; i++) {
                if (s === a[i]) {
                    n = i;
                    break;
            }
            }
            return d * Math.pow(1024, n);
        },
        search: function (index, arr) {
            for (var i = 0, f; f = arr[i]; i++) {
                if (+index === +f.index) {
                    return i;
                }
            }
            return -1;
        },
        del: function (index, arr) {
            var i = helper.search(index, arr);
            if (i !== -1) {
                return arr.splice(i, 1)[0];
            }
        }
    };

    var isSupportHTML5Upload = DragUpload.isSupportHTML5Upload;

    var Upload = Base.extend({
        attrs: {
            url: '', // 上传地址，必须配置
            node: '', // 触发的节点
            type: '*', // 可允许上传类型
            maxSize: '5MB', // 文件大小限制
            maxCount: -1, // 文件数量限制，-1不限制
            multi: true, // 是否允许多文件上传
            disabled: false, // 是否禁用
            draggable: true, // 是否可拖拽上传
            container: document.body, // 接受拖拽上传的容器

            fileName: 'Filedata', // 该参数设置了POST信息中上传文件的name值
            data: {}, // 每个文件上传的时候，其中的值对都会被一同发送到服务端，键值对的值只能是字符串或者数字
            dataType: 'json',
            resultCheck: function () {
            }, // 结果过滤函数，判断服务端返回成功还是失败

            postType: 'form', // 默认form方式上传，还有blob, buffer，非这三个值则认为是DOM上传
            max: 2,// 并发上传数量,
            bytesPerChunk: '1MB',//1MB CHUNK SIZE
            chunk: false,//是否支持分块上传
            md5: false,//是否支持md5秒传
            perMaxSize: '2MB',//服务端每次允许的最大上传的大小2MB
            perMinSize: '0B'//服务端每次允许的最小上传的大小0B(无限制)
        },
        initialize: function () {
            var that = this;
            Upload.superclass.initialize.apply(this, arguments);

            if (this.get('type') !== '*') {
                this.set('type', (function (type) {
                    var arr = type.split(';');
                    for (var i = 0, len = arr.length; i < len; i++) {
                        arr[i] = $.trim(arr[i].toLowerCase());
                    }
                    return arr;
                })(this.get('type')));
            }
            if (this.get('maxSize')) {
                this._maxSize = this.get('maxSize');
                this.set('maxSize', helper.unit(this.get('maxSize')));
            }

            this.fileList = []; // 等待上传的文件队列
            this.successList = []; // 上传成功文件队列
            this.failureList = []; // 上传失败文件队列
            this.xhrList = {}; // 缓存住xhr的队列，用来给abort使用
            this.index = 0; // 文件索引
            this.status = 0; // 上传整体状态标识 0：未开始上传或上传完成，正数：正在上传的文件数量

            this._fixUploadNode();

            if (this.get('draggable')) {
                DragUpload.bind({
                    node: $(this.get('container')).eq(0)[0],
                    dragenter: function (e, files) {
                        that.trigger('dragenter', files);
                    },
                    dragover: function (e, files) {
                        that.trigger('dragover', files);
                    },
                    dragleave: function (e, files) {
                        that.trigger('dragleave', files);
                    },
                    drop: function (e, files) {
                        that.trigger('drop', files);
                    }
                });
            }

            if (this.get('disabled')) {
                this.disable();
            }
        },
        /**
         * 增加文件
         * @param files
         * @return {*}
         */
        add: function (files) {
            this._fixUploadNode();
            if (this.get('disabled') === false) {
                var that = this;
                var arr = files.length ? files : [files];
                var maxCount = this.get('maxCount');
                if (maxCount !== -1 && (files.length + this.successList.length + this.fileList.length + this.status > maxCount)) {
                    this.trigger('overCountLimit', maxCount);
                } else {
                    var type = this.get('type');
                    if (type != '*') { // 过滤扩展名
                        (function (extArr) {
                            var temp = [];
                            for (var i = 0, file; file = arr[i]; i++) {
                                var ext = file.name.split('.');
                                ext = ext[ext.length - 1].toLowerCase();
                                ext = '*.' + ext;
                                file.index = this.index++;
                                if ($.inArray(ext, extArr) !== -1) {
                                    temp.push(file);
                                } else {
                                    file.error = true;
                                    this.trigger('notAllowType', file);
                                    this.trigger('errerAdd', file);
                                }
                            }
                            arr = temp;
                        }).call(this, type);
                    } else {
                        $.each(arr, function (i, file) {
                            file.index = that.index++;
                        });
                    }
                    if (arr !== false) {
                        for (var i = 0, file; file = arr[i]; i++) {
                            var size = file.size;
                            if (size == 0) {
                                file.error = true;
                                this.trigger('zeroSize', file);
                                this.trigger('errerAdd', file);
                            } else if (size > this.get('maxSize')) {
                                file.error = true;
                                this.trigger('overSizeLimit', this._maxSize, file);
                                this.trigger('errerAdd', file);
                            } else {
                                this.fileList.push(file);
                                this.trigger('successAdd', file);
                            }
                        }
                    } else {
                        this.trigger('errorAdd', files);
                    }
                }
            }
            return this;
        },
        remove: function (index) {
            var file = (function () {
                var f1 = helper.del(index, this.fileList);
                var f2 = helper.del(index, this.successList);
                var f3 = helper.del(index, this.failureList);
                return f1 || f2 || f3;
            }).call(this);
            this._abortCore(index);
            this.trigger('remove', file, index);
            return this;
        },
        abort: function (index) {
            index = +index;
            var file = (function () {
                var f1 = helper.del(index, this.fileList);
                var f2 = helper.del(index, this.successList);
                var f3 = helper.del(index, this.failureList);
                return f1 || f2 || f3;
            }).call(this);
            this._abortCore(index);
            this.trigger('abort', file, index);
            return this;
        },
        _abortCore: function (index) {
            index = +index;
            var xhr = this.xhrList[index];
            if (xhr) { // 正在上传
                this.status--;
                xhr.abort();
                delete this.xhrList[index];
                this.upload();
            }
        },
        /**
         *
         * @param file：要分开的文件
         * @param start：每个块的起始位置
         * @param end：每个块的结束位置
         * @returns {*}
         * @private
         */
        _getBlob: function (file, start, end) {
            if (file.webkitSlice) {  //Blob中的方法
                return file.webkitSlice(start, end);
            } else if (file.mozSlice) {
                return file.mozSlice(start, end);
            }
            return file.slice(start, end);
        },
        //对文件进行切块
        _getFileSlices: function (file) {
            var i = 0,
                blob,
                start = 0,
                that = this,
                perMinSize = helper.unit(that.get('perMinSize')),
                end = perMinSize;
            //分块上传
            var BYTES_PER_CHUNK = helper.unit(that.get('bytesPerChunk'));
            var BLOB_SIZE = file.size;
            var overflowSize = (BLOB_SIZE - end) % BYTES_PER_CHUNK;
            var totalPices = (BLOB_SIZE - end) / BYTES_PER_CHUNK + 1;
            //var end = BYTES_PER_CHUNK + overflowSize;
            file.totalPices = Math.floor(totalPices);

            while (start < BLOB_SIZE) {
                blob = that._getBlob(file, start, end);
                blob.start = start;
                blob.end = end;
                file.slices.push(blob);
                start = end;
                end = (end === perMinSize) ? (start + overflowSize + BYTES_PER_CHUNK) : (start + BYTES_PER_CHUNK);
                i++;
            }
        },
        //ajax请求的finish函数
        finish: function (file) {
            var that = this;
            if (file.sliceIndex === file.totalPices || file.error || (that.get('md5') && file.uploadCompleted)) {
                that.status--;
                delete that.xhrList[file.index];
                if (that.fileList.length == 0 && that.status <= 0) {
                    that.trigger('complete', file);
                } else {
                    that.upload();
                }
            }
        },
        //ajax请求，index文件块的索引值
        chunkXhr: function (index, file) {
            var preData = file.preData;
            var that = this;
            var postType = this.get('postType');
            var fileSlice = file.slices[index];
            preData.offset = fileSlice.start || 0;
            var xhr = new XMLHttpRequest();
            if (index === 0) {
                that.xhrList[file.index] = xhr;
            }
            xhr.upload.addEventListener('progress', function (e) {
                that.trigger('progress', file, file.loaded + e.loaded, file.size);
            }, false);
            xhr.onload = function (e) {
                var result = xhr.responseText;
                try {
                    var flag = true;
                    if (that.get('dataType') === 'json') {
                        result = JSON.parse(xhr.responseText);
                    }
                    if ($.isFunction(that.get('resultCheck'))) {
                        flag = that.get('resultCheck')(result) !== false;
                    }
                    var serverCheck = {
                        flag: true
                    };
                    that.trigger('serverCheck', result, serverCheck);
                    if (flag && serverCheck.flag) {
                        file.sliceIndex++;
                        that.trigger('xhrLoad', file, result, preData);
                        if (file.sliceIndex === file.totalPices || (that.get('md5') && file.uploadCompleted)) {
                            //文件分块完全上传完成之后才触发
                            that.trigger('success', file, result);
                            that.successList.push(file);
                        } else {
                            that.trigger('subSuccess', file, result, preData);
                            file.loaded += fileSlice.size;
                            if (file.sliceIndex === 1) {
                                //触发第一块上传完成后的事件
                                that.trigger('firstSlice', preData);
                            }
                            if (file.sliceIndex === file.totalPices - 1) {
                                //处理最后一块
                                //触发最后一块上传前的事件
                                that.trigger('lastSlice', preData);
                            }
                            that.chunkXhr(file.sliceIndex, file);
                        }
                    }
                    else {
                        that.trigger('error', file, result);
                        if (!$.inArray(file, that.failureList)) {
                            that.failureList.push(file);
                        }
                        file.error = true;
                    }
                }
                catch
                    (e) {
                    that.trigger('error', file, e);
                    if (!$.inArray(file, that.failureList)) {
                        that.failureList.push(file);
                    }
                    file.error = true;
                }
                finally {
                    that.trigger('finish', file);
                    that.finish(file);
                }
            }
            ;
            xhr.onerror = function (e) {
                that.trigger('finish', file);
                that.finish(file);
                file.error = true;
            };
            var data = $.extend(true, that.get('data'), preData);
            that.trigger('deleteData', file, data);
            that.set('data', data);
            xhr.open('POST', that.get('url'), true);
            if (postType === 'form') {
                var formData = new FormData();
                (function () {
                    for (var key in that.get('data')) { // 附加表单字段
                        formData.append(key, that.get('data')[key]);
                    }
                }).call(that);
                formData.append(that.get('fileName'), fileSlice, file.name);

                xhr.send(formData);
            } else {
                xhr.setRequestHeader(that.get('fileName'), file.name); // 提供给服务端的file name
                (function () {
                    for (var key in that.get('data')) { // 附加字段
                        xhr.setRequestHeader(key, that.get('data')[key]);
                    }
                }).call(that);
                if (postType === 'blob') {
                    var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
                    var bb = new BlobBuilder(), blob;
                    bb.append(fileSlice);
                    blob = bb.getBlob();
                    xhr.send(blob);
                } else if (postType === 'buffer') {
                    var reader = new FileReader();
                    reader.readAsArrayBuffer(fileSlice);
                    reader.onload = function () {
                        xhr.send(this.result);
                    };
                } else {
                    xhr.send(fileSlice);
                }
            }
        },
        //判断是否需要分块处理
        _chunkOrNoChunk: function (file) {
            var preData = file.preData;
            //以B为单位的（perMaxSize是服务端每次允许上传的最大值）
            var perMaxSize = helper.unit(this.get('perMaxSize')) || this.get('maxSize');
            var that = this;
            //分块
            if (file.size > +perMaxSize && that.get('chunk')) {
                that._getFileSlices(file);
                that.trigger('chunkData', preData);
                that.chunkXhr(0, file);
            }
            //不分块
            else {
                file.totalPices = 1;
                file.slices.push(file);
                that.chunkXhr(0, file);
            }
        },
        /**
         * 上传流程触发事件：
         *     progress(e, file, loaded, total): 进度
         *     success(file, json): 成功上传一个文件
         *     failure(file, json): 失败上传一个文件
         *     error(file, text): 服务端失败
         *     complete(file): 队列中没有待上传的文件，此次上传完成
         * @param params
         * @return {*}
         */
        upload: function () {
            this.status = Math.max(this.status, 0);
            if (this.status < this.get('max')) {
                var file = this.fileList.shift(); // 取队列头的文件上传
                if (file) {
                    this.status++;
                    if (isSupportHTML5Upload) {
                        var that = this, md5 = '';
                        var perMaxSize = helper.unit(this.get('perMaxSize')) || this.get('maxSize');
                        if (that.trigger('uploadStart', file) === false) {
                            that.trigger('error', file, 'refuse');
                            file.error = true;
                            that.finish(file);
                            return;
                        }
                        file.preData = {};
                        file.sliceIndex = 0;
                        file.loaded = 0;
                        file.slices = [];
                        that.trigger('initData', file, file.preData);
                        if (that.get('md5')) {

                            var workerToMain = function() {
                                var start = 0,
                                    blobSize = 50 * 1024,
                                    fileSize = file.size,
                                    end = Math.min(blobSize, fileSize),
                                    blob;
                                var fileContent = '';
                                var buffers;

                                var reader = new FileReader();
                                reader.onload = function(e) {
                                    buffers = new Uint8Array(e.currentTarget.result);
                                    fileContent += String.fromCharCode.apply(null, buffers);
                                    start = end;
                                    if (start < fileSize) {
                                        end = Math.min(start + blobSize, fileSize);
                                        readBlob();
                                    } else {
                                        file.preData.md5 = Md5(fileContent);
                                        fileContent = null;
                                        that._chunkOrNoChunk(file);
                                    }
                                };

                                var readBlob = function () {
                                    blob=that._getBlob(file,start,end);
                                    reader.readAsArrayBuffer(blob);
                                };
                                readBlob();
                            };
                            try {
                                workerToMain();
                            } catch (e) {
                                that.trigger('error', file, 'can\'t upload this file');
                            }
                        } else {
                            that._chunkOrNoChunk(file);
                        }
                        this.upload();
                    }
                }
            }
            return this;
        },
        reset: function () {
            for (var key in this.xhrList) {
                var xhr = this.xhrList[key];
                if (xhr && xhr.abort) {
                    xhr.abort();
                }
                delete this.xhrList[key];
            }
            this.fileList.length = 0;
            this.successList.length = 0; // 上传成功文件队列
            this.failureList.length = 0; // 上传失败文件队列
            this.status = 0; // 上传整体状态标识 0：未开始上传或上传完成，>0：正在上传
            this._fixUploadNode();
            this.set('disabled', false);
            this.trigger('reset');
            return this;
        },
        enable: function () {
            this.set('disabled', false);
            return this;
        },
        disable: function () {
            this.set('disabled', true);
            return this;
        },
        _onChangeDisabled: function (val) {
            var node = this.get('node');
            if (node) {
                node = node.children('input:file');
                if (val) {
                    node.prop('disabled', 'disabled');
                } else {
                    node.removeProp('disabled');
                }
            }
        },
        /**
         * 获取状态，返回值为0上传完成， 1存在未上传完成的文件
         * @return {Number}
         */
        getStatus: function () {
            var status = this.status;
            var result = 0; // 0 上传完成， 1 存在未上传完成的文件
            if (status > 0) { // 正在上传
                result = 1;
            } else {
                if (this.fileList.length > 0) { // 还存在未上传的文件
                    result = 1;
                }
            }
            return result;
        },
        _fixUploadNode: function () {
            var that = this;
            var node = this.get('node');
            if (node) {
                var replaceNode = $('<a class="upload-select-btn" href="javascript:;"><input type="file" ' + (this.get('accept') ? 'accept=' + this.get('accept') : '') + (this.get('multi') ? ' multiple="true"' : '') + ' name="' + this.get('fileName') + '" /></a>');
                $(node).replaceWith(replaceNode);
                this.set('node', replaceNode);
                replaceNode.children('input:file').change(function () {
                    that.add(this.files);
                });
            }
        }
    });


    Upload.preview = function (file, callback) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            callback && callback.call(this, file, this.result)
        };
    };

    Upload.isSupportHTML5Upload = isSupportHTML5Upload;
    Upload.helper = helper;

    return Upload;
});