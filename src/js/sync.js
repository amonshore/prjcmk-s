($ => {
    let socket;

    JSVIEW.define('sync', {
        ready: (context) => {
            const $qrcode = $('#qrcode', context);
            const sid = $qrcode.attr('data-sid');
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
            // creo un web socket e invio un messaggio al server per indicare che sono in attesa della sincronizzazione
            socket = new WebSocket('ws://' + location.host + '/sync/wsh/' + sid);
            socket.onopen = (event) => {
                socket.send(JSON.stringify({ "message": "wait for sync" }));
            };
            socket.onerror = (error) => {
                console.log(error);
            };
            socket.onmessage = (event) => {
                // TODO: gestire messaggi in arrivo
                const msg = JSON.parse(event.data);
                if (msg.message === 'sync timeout') {
                    $qrcode.hide();
                    $('#btnNewCode', context).show()
                    socket.close();
                } else if (msg.message === 'sync start') {
                    location.href = `#!sync/comics/${sid}`;
                }
            };
        },
        destroy: (context) => {
            socket.close();
        }
    });
})(jQuery);
