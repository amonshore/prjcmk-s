($ => {
    const comicsTemplate = $('#comicsTemplate').html();

    $(() => {
        $('.btnload').click(() => {
            loadComics();
        });
        loadComics();
    });

    /**
     * Carica la lista dei comics.
     */
    function loadComics() {
        $('.comics-list .comics').remove();
        $.get('/v1/comics').then(data => {
            $('.comics-list').append(data.map(comics => Mustache.render(comicsTemplate, comics)));
        }).fail((jqXHR, textStatus, errorThrown) => {
            swal({title: 'Load comics', text: textStatus + ': ' + errorThrown, type: 'error'});
        });
    }
})(jQuery);
