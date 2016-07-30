'use strict';

;
(function ($) {
    $(function () {
        $.get('/v1/comics').then(function (data) {
            $('.comics').text(JSON.stringify(data, null, 2));
        }).fail(function (e) {
            $('.comics').text(JSON.stringify(e, null, 2));
        });
    });
})(jQuery);