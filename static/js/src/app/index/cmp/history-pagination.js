/**
 * Description: 历史消息分页
 * Author: chengbapi@gmail.com
 * Date: 14-4-15 11:27
 */

define(function (require, exports, module) {
    var $ = require('$');
    var Action = require('../../../lib/util/dom/action');
    var Widget = require('../../../lib/cmp/widget');

    var HistoryPagination = Widget.extend({
        attrs: {
            element: null,
            current: null,
            pageSize: 20,
            total: null,
            maxPage: null
        },
        reset: function() {
            this.set('current', null);
            this.set('current', 0);
        },
        next: function() {
            var current = this.get('current');
            var maxPage = this.get('maxPage');
            if (current + 1 > maxPage) {
                this.last();
            } else {
                this.set('current', current + 1);
            }
        },
        prev: function() {
            var current = this.get('current');
            var minPage = 0;
            if (current - 1 < minPage) {
                this.first();
            } else {
                this.set('current', current - 1);
            }
        },
        first: function() {
            this.set('current', 0);
        },
        last: function() {
            this.set('current', this.get('maxPage'));
        },
        _onChangeTotal: function(nTotal) {
            var maxPage;
            var current = this.get('current');
            if (nTotal === 0) {
                maxPage = 0;
            } else {
                maxPage = Math.floor((nTotal - 1) / this.get('pageSize'));
            }
            this.set('maxPage', maxPage);
            this.get('element').find('[data-role=total]').text(maxPage + 1);
            this.get('element').find('[data-role=current]').val(current + 1);
        },
        _onChangeCurrent: (function() {
            var elapse = 0;
            var lastTime = 0;
            var lastTimer = null
            var debounceTimer = null;
            return function(current) {
                var self = this;
                if (current === null) {
                    return;
                }
                var now = new Date().getTime();
                if (now - lastTime < 300) {
                    clearTimeout(lastTimer);
                    elapse = 300;
                } else {
                    elapse = 0;
                }
                lastTime = now;
                debounceTimer = setTimeout(function() {
                    self.requestHistory(current);
                }, elapse);

                lastTimer = debounceTimer;

                var maxPage = this.get('maxPage');
                if (maxPage) {
                    this.get('element').find('[data-role=current]').val(current + 1);
                }
            };
        })()
    });

    // bind input event
    $("#chat-window").on('keypress', '.pagination-input', function(e) {
        var maxPage;
        var val = +$(this).val();
        if (e.which === 13 && val) {
            maxPage = HistoryPaginationSingleton.get('maxPage');
            HistoryPaginationSingleton.set('current', val - 1);
        }
    });

    var HistoryPaginationSingleton = new HistoryPagination();

    Action.listen({
        'first-history-page': function() {
            HistoryPaginationSingleton.first();
        },
        'prev-history-page': function() {
            HistoryPaginationSingleton.prev();
        },
        'next-history-page': function() {
            HistoryPaginationSingleton.next();
        },
        'last-history-page': function() {
            HistoryPaginationSingleton.last();
        }

    });

    return HistoryPaginationSingleton;
});