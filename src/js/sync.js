($ => {
    const INTERVAL = 2000;
    let hnd, socket;

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
            // creo un web socket per controllare lo stato del sid
            socket = new WebSocket('ws://' + location.host +'/sync/wsh/' + sid);
            // socket.onopen = (event) => {
            //     console.log(event);
            // };
            socket.onerror = (error) => {
                console.log(error);
            };
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.synced) {
                    // carico la pagina per l'editing dei dati
                    document.location.href = '#sync/comics/' + sid;
                } else if (!--times) {
                    $qrcode.hide();
                    $('#btnNewCode', context).show()
                    clearInterval(hnd);
                    socket.close();
                }
            };
            // // controllo se e' avventua una richiesta del sid dall'app
            // // scaduto il tempo nascondo il qrcode e mostro pulsante per refresh pagina
            // hnd = setInterval(() => {
            //     // la risposta viene controllata nell'evento "onmessage"
            //     socket.send(JSON.stringify({ "type": "check", "sid": sid }));
            // }, INTERVAL);
        },
        destroy: (context) => {
            clearInterval(hnd);
            socket.close();
        }
    }
})(jQuery);
