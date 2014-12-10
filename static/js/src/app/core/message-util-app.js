/**
 * @description 应用消息的解析
 * @author zhengms <lzhengms@gmail.com>
 * @date 14-3-5
 */
define(function (require, exports, module) {
    var $ = require('$');
    var Tpl = {
        erp: require('../index/tpl/message-erp')
    };

    var ERP_TASK = /(?:<\?xml.*\?>\s*)(?:<body.*>\s*)(?:<app(?:\s*)business=")(.*)(?:">)(?:\s*)(?:<taskid>)(.*)(?:<\/taskid>\s*)(?:<tasktitle>)(.*)(?:<\/tasktitle>\s*)(?:<tasktime>)(.*)(?:<\/tasktime>\s*)(?:<msg\s*(?:level="(\d+)?")?>)(.*)(?:<\/msg>\s*)(?:<projectid>)(.*)(?:<\/projectid>\s*)(?:<projectname>)?([^<\/projectname>|<projectname>].*)?(?:<\/projectname>\s*)?(?:<projectname\/>)?(?:<type>)(.*)(?:<\/type>\s*)(?:<status>)(.*)(?:<\/status>\s*)<\/app>\s*<\/body>/;


    function getErpMatches(message) {
        var matches;
        var task = null;
        if (matches = message.match(ERP_TASK)) {
            //ERP应用消息
            task = {appid: 101};
            task.business = matches[1];
            task.taskid = matches[2];
            task.tasktitle = matches[3];
            //   task.tasktime = Global.helper.cuteMessageTime.getDate(matches[4], 'yyyy-MM-dd HH:mm');
            task.tasktime = matches[4];
            task.level = matches[5];
            task.msg = matches[6];
            task.projectid = matches[7];
            task.projectname = matches[8] || '无';
            task.type = matches[9];
            task.status = getStatus(matches[10])(matches[9]);
            task.statusCode=matches[10];
        }
        return task;
    }

    function parse(message, brief) {
        var ret;
        var messageType = 'type-plain'; // plain image audio
        var message = message || '';

        var task = getErpMatches(message);
        if (task) {
            if (brief) {
                ret = 'ERP下单:' + task.tasktitle;
            }
            else {
                ret = Tpl.erp.render(task);
                return {
                    msg: '<div class="' + messageType + '">' + ret + '</div>',
                    'erp-task': 1
                };
            }
        }
        else {
            ret = message;
        }
        ret = '<div class="' + messageType + '">' + ret + '</div>';
        return ret;
    }

    var TYPE = [
        {0: '下单方', STATUS: {0: '待结单', 1: '已结单', 2: '已返工', 3: '详情', 4: '延单审批', 5: '已接受延单', 6: '已拒绝延单'}},
        {1: '接单方', STATUS: {0: '待接单', 1: '已接单', 2: '已拒单', 3: '详情', 4: '延单待审批', 5: '已延单', 6: '拒绝延单'}},
        {2: '抄送', STATUS: {}}
    ];

    function getStatus(status) {
        return function (type) {
            var item = $.grep(TYPE,function (item) {
                for (var key in item) {
                    if (key == type) {
                        return item;
                    }
                }

            });
            return item[0].STATUS[status];
        }
    }

    Global.getStatus = getStatus;
    Global.getErpMatches=getErpMatches;

    exports.parse = parse;

});