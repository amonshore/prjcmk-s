($ => {
    const INTERVAL = 2000;
    let hnd;

    window.JSVIEW['sync'] = {
        ready: (context) => {
            const $qrcode = $('#qrcode', context);
            const sid = $qrcode.attr('data-sid');
            const timeout = +$qrcode.attr('data-timeout') || 30000;
            let times = timeout / INTERVAL;
            // renderizzo il sid passato con la pagina
            $qrcode
                .qrcode({
                    width: 256,
                    height: 256,
                    text: sid
                });
            // pulsante per reload pagina
            $('#btnNewCode', context).click(e => {
                document.location.reload();
            });
            // controllo se e' avventua una richiesta del sid dall'app
            // scaduto il tempo nascondo il qrcode e mostro pulsante per refresh pagina
            hnd = setInterval(() => {
                $.get('/sync/check/' + sid)
                    .then(data => {
                        if (data.synced) {
                            // carico la pagina per l'editing dei dati
                            document.location.href = '#sync/comics/' + sid;
                        } else if (!--times) {
                            $qrcode.hide();
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
        },
        destroy: (context) => {
            clearInterval(hnd);
        }
    }
})(jQuery);
