'use strict';

(function ($) {
    $('.page-body[data-page="remote"] button[data-action]').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        var action = e.target.attributes['data-action'].value;

        swal({
            title: action.capitalize() + ' current process?',
            text: 'This may take a few seconds.',
            showCancelButton: true
        }, function (confirm) {
            if (confirm) {
                $.get('/remote/' + action).then(function () {
                    // ritardo il refresh altrimenti rischio che il comando non sia stato ancora eseguito
                    setTimeout(function () {
                        document.location.reload(true);
                    }, 500);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    swal({ title: 'Load processes', text: textStatus + ': ' + errorThrown, type: 'error' });
                });
            }
        });
    });
})(jQuery);