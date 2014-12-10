/**
 * Description: 日期选择器
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var Calendar = require('../../../lib/cmp/calendar/calendar');
    var HistoryPagination = require('./history-pagination');

   var HistoryCalendar= Calendar.extend({
       attrs:{
           trigger: null,
           date:'2014-9-17',
           disabled: {
               date: function (date) {
                   return date.getTime() > new Date().getTime();
               }
           },
           // 改变触发元素
           onChangeTrigger: function (trigger) {
               // 重新绑定trigger
               this.enable();
               this.set('align', {
                   selfXY: [0, '100%'],
                   baseElement: trigger,
                   baseXY: [0, -10]
               });
           },
           // 改变日期
           onChangeDate: function (nDate) {
               var today = new Date();
               today.setHours(0);
               today.setMinutes(0);
               today.setSeconds(0);
               today.setMilliseconds(0);
               if (nDate.getTime() > today.getTime()) {
                   nDate = new Date(0);
               }
               var formalDate = nDate.getTime().toString().substring(0, 10);
               this.set('formalDate', formalDate);
               HistoryPagination.reset();
           }

       },
       renderContainer: function (mode) {
           HistoryCalendar.superclass.renderContainer.call(this,mode);
           this.$('table.widget-calendar-date').addClass('calendar-date-normal');
       }
    });

    return new HistoryCalendar();
})
;