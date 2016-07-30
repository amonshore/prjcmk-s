;
($ => {
    $(function() {
        $.get('/v1/comics').then(data => {
            $('.comics').text(JSON.stringify(data, null, 2));
        }).fail(e => {
            $('.comics').text(JSON.stringify(e, null, 2));
        });
    });
})(jQuery);
