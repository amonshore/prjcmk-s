($ => {
    window.JSVIEW['sync/list'] = {
        ready: (context) => {
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
                                    $.post('/sync/' + sid).then(() => {
                                        location.reload();
                                    }).fail((jqXHR, textStatus, errorThrown) => {
                                        swal({ title: 'Sync', text: textStatus + ': ' + errorThrown, type: 'error' });
                                    });
                                }
                            }, 100);
                        }
                    });
            });
        }
    }
})(jQuery);
