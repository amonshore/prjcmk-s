'use strict';

(function ($) {
    $('.page-body[data-page="sync/list"] a[data-action]').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        var action = e.target.attributes['data-action'].value;
        var sid = e.target.attributes['data-sid'].value;

        swal({
            title: action.capitalize() + ' ' + sid + '?',
            showCancelButton: true,
            closeOnConfirm: true
        }, function (confirm) {
            if (confirm) {
                setTimeout(function () {
                    if (action === 'sync') {
                        $.post('/sync/' + sid).then(function () {
                            location.reload();
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            swal({ title: 'Sync', text: textStatus + ': ' + errorThrown, type: 'error' });
                        });
                    }
                }, 100);
            }
        });
    });
})(jQuery);