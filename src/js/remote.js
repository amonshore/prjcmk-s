($ => {
    window.JSVIEW['remote'] = {
        ready: (context) => {
            $('button[data-action]', context).click(e => {
                e.stopPropagation();
                e.preventDefault();

                const action = e.target.attributes['data-action'].value;
                const title = e.target.attributes['data-confirm-title'].value;
                const message = e.target.attributes['data-confirm-message'].value;

                swal({
                        title: title,
                        text: message,
                        showCancelButton: true
                    },
                    confirm => {
                        if (confirm) {
                            $.get('/remote/' + action).then(() => {
                                // ritardo il refresh altrimenti rischio che il comando non sia stato ancora eseguito
                                setTimeout(() => { document.location.reload(true); }, 500);
                            }).fail((jqXHR, textStatus, errorThrown) => {
                                swal({ title: 'Load processes', text: textStatus + ': ' + errorThrown, type: 'error' });
                            });
                        }
                    });
            });
        }
    }
})(jQuery);
