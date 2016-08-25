($ => {
    let socket;

    window.JSVIEW['sync'] = {
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
                } else {
                    $qrcode.hide();
                    $('#btnNewCode', context).show()
                    clearInterval(hnd);
                    socket.close();
                }
            };
        },
        destroy: (context) => {
            socket.close();
        }
    }
})(jQuery);
