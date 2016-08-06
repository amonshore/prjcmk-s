($ => {
    const MAX_TIMES = 15;
    const INTERVAL = 2000;

    window.JSVIEW['sync'] = {
        ready: (context) => {
            const sid = $('#qrcode', context).attr('data-sid');
            const url = location.origin + '/sync/' + sid;
            // renderizzo il sid passato con la pagina
            $('#qrcode', context)
                .attr('title', url)
                .qrcode({
                    width: 256,
                    height: 256,
                    text: url
                });
            // pulsante per reload pagina
            $('#btnNewCode', context).click(e => {
                document.location.reload();
            });
            // controllo se e' avventua una richiesta del sid dall'app
            // scaduto il tempo nascondo il qrcode e mostro pulsante per refresh pagina
            let times = MAX_TIMES;
            const hnd = setInterval(() => {
                $.get('/sync/check/' + sid)
                    .then(data => {
                        if (data.synced) {
                            // TODO caricare prossima pagina
                        } else if (!--times) {
                            $('#qrcode', context).hide();
                            $('#btnNewCode', context).show()
                            clearInterval(hnd);
                        }
                    })
                    .fail((jqXHR, textStatus, errorThrown) => {
                        clearInterval(hnd);
                        swal({ title: 'Sync', text: textStatus + ': ' + errorThrown, type: 'error' }, () => {
                            document.location.reload();
                        });
                    });
            }, INTERVAL);
        }
    }
})(jQuery);
