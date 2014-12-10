/**
 * Description: 全局方法，用于模板渲染
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Global = window.Global;
    var DateUtil = require('../../lib/util/date');

    Global.helper = {
        DateUtil: DateUtil,
        birthdayBlessings: function (name, days) {
            if (days === 0) {
                return '今天是' + name + '生日，快去表达祝福吧！';
            } else if (days === 1) {
                return '明天是' + name + '生日，快去表达祝福吧！';
            } else if (days === 2) {
                return '后天是' + name + '生日，快去表达祝福吧！';
            } else if (days === 3) {
                return '三天后是' + name + '生日，快去表达祝福吧！';
            }

        },
        cuteTimeline: function (time) {
            time = time + '000';
            time = new Date(+time);
            var yesterday = (function (time) {
                var date = new Date(+time);
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                return date;
            })(time);

            if (time.getTime() > yesterday.getTime()) {
                // 今天的消息，只显示时间，不显示日期
                return DateUtil.format(time, 'HH:mm')
            } else {
                // 显示年份日期时间
                return DateUtil.format(time, 'yyyy-MM-dd HH:mm')
            }

            return time;
        },
        cuteContactTime: function (time) {
            if (!time) return;
            if (typeof time === 'string' && time.length === 10) {
                time = time + '000';
            }

            // TODO now时间改成从服务器取
            var now = new Date();
            var time = new Date(+time);

            var oneMinute = 60 * 1000,
                oneHour = 60 * oneMinute,
                oneDay = 24 * oneHour,
                oneMonth = 30 * oneDay,
                oneYear = 365 * oneDay;
            var elapse = now.getTime() - time.getTime();

            // 刚刚
            if (elapse < oneMinute) {
                return '刚刚'
            }
            // n分钟前
            if (elapse < oneHour) {
                return parseInt(elapse / oneMinute, 10) + '分钟前';
            }
            // n小时前
            if (elapse < oneDay) {
                return parseInt(elapse / oneHour, 10) + '小时前';
            }
            // 3天内
            if (elapse < 3 * oneDay) {
                switch (elapse / oneDay) {
                    case 1:
                        return '昨天';
                    case 2:
                        return '前天';
                }
            }
            // n天前
            if (elapse < oneMonth) {
                return parseInt(elapse / oneDay, 10) + '天前';
            }
            // n月前
            if (elapse < oneYear) {
                if (now.getFullYear() !== time.getFullYear()) {
                    return time.getFullYear() + '年' + (time.getMonth() + 1) + '月' + time.getDate() + '日';
                } else {
                    return  (time.getMonth() + 1) + '月' + time.getDate() + '日';
                }
            }
            // n年前
            if (elapse >= oneYear) {
                return time.getFullYear() + '年' + (time.getMonth() + 1) + '月' + time.getDate() + '日';
            }
        },
        cuteMessageTime: {
            getDate: function (time, pattern) {
                time = time + '000';
                time = new Date(+time);
                return DateUtil.format(time, pattern || 'yyyy-MM-dd');
            },
            getTime: function (time) {
                time = time + '000';
                time = new Date(+time);
                return DateUtil.format(time, 'HH:mm')
            }
        },
        countSize: function (size) {
            var len = Math.floor(size.toString().length / 3);
            var SizeEnum = ['B', 'KB', 'MB', 'GB'];
            var ret = (size / Math.pow(1000, len)).toString();
            var indexOfDot = ret.indexOf('.');

            return (indexOfDot === -1 ? ret : ret.substring(0, indexOfDot + 2)) + SizeEnum[len];
        }
    };

    return Global;
});