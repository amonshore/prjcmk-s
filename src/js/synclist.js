($ => {
    const fomratters = {
        'datetime': value => moment(+value).format('YYYY-MM-DD HH:mm:ss'),
        'status': value => fomratters[value] || value,
        '0': 'NO_SYNC',
        '1': 'SYNCED',
        '3': 'DATA_RECEIVED'
    }

    JSVIEW.define('synclist', {
        ready: (context) => {
            $('[data-format]', context).each((index, el) => {
                el.innerHTML = fomratters[el.attributes['data-format'].value](el.innerText);
            });

            $('a[data-action]', context).click(e => {
                e.stopPropagation();
                e.preventDefault();

                const action = e.target.attributes['data-action'].value;
                const sid = e.target.attributes['data-sid'].value;

                swal({
                        title: action.capitalize() + ' ' + sid + '?',
                        showCancelButton: true,
                        closeOnConfirm: true
                    },
                    confirm => {
                        if (confirm) {
                            setTimeout(() => {
                                if (action === 'sync') {
                                    // TODO aprie un WebSocket per simulare l'app
                                } else if (action === 'expire') {
                                    $.post('/sync/change/' + sid, { 'lastSync': Date.now() - 30000 }).then(() => {
                                        location.reload();
                                    }).fail((jqXHR, textStatus, errorThrown) => {
                                        swal({ title: 'Expire', text: textStatus + ': ' + errorThrown, type: 'error' });
                                    });
                                } else if (action === 'remove') {
                                    $.post('/sync/remove/' + sid).then(() => {
                                        location.reload();
                                    }).fail((jqXHR, textStatus, errorThrown) => {
                                        swal({ title: 'Remove', text: textStatus + ': ' + errorThrown, type: 'error' });
                                    });                                    
                                }
                            }, 100);
                        }
                    });
            });
        }
    });
})(jQuery);
