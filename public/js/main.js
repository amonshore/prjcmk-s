'use strict';

(function ($) {
    var comicsTemplate = $('#comicsTemplate').html();

    $(function () {
        $('.btnload').click(function () {
            loadComics();
        });
        loadComics();
    });

    /**
     * Carica la lista dei comics.
     */
    function loadComics() {
        $('.comics-list .comics').remove();
        $.get('/v1/comics').then(function (data) {
            $('.comics-list').append(data.map(function (comics) {
                return Mustache.render(comicsTemplate, comics);
            }));
        }).fail(function (jqXHR, textStatus, errorThrown) {
            swal({ title: 'Load comics', text: textStatus + ': ' + errorThrown, type: 'error' });
        });
    }
})(jQuery);