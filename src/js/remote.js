($ => {
    $('.process-list>tbody>tr>td>a[data-action]').click(e => {
        e.stopPropagation();
        e.preventDefault();

        const pid = e.target.attributes['data-pid'].value;
        const action = e.target.attributes['data-action'].value;

        swal({
                title: 'Confirm',
                text: action.capitalize() + ' process with pid ' + pid + '?',
                showCancelButton: true
            },
            confirm => {
                if (confirm) {
                    $.get('/remote/' + action + '?pid=' + pid).then(() => {
                        // ritardo il refresh altrimenti rischio che il comando non sia stato ancora eseguito
                        setTimeout(() => { document.location.reload(true); }, 500);
                    }).fail((jqXHR, textStatus, errorThrown) => {
                        swal({ title: 'Load processes', text: textStatus + ': ' + errorThrown, type: 'error' });
                    });
                }
            });
    });
})(jQuery);
