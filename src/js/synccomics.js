($ => {
    let socket;

    JSVIEW.define('synccomics', {
        ready: (context) => {
            const $comicsList = $('.comics-list');
            const sid = $comicsList.attr('data-sid');
        	// registro l'evento per la ricerca
            context.on('searchbox:search', (event, term) => {
            	if (term) {
					const arrTerms = term.split(/\s/);
            		const termCount = arrTerms.length;
					const rg = new RegExp('(' + term.replace(/\s/g, '|') + ')', 'gi');
					$('>.comics', $comicsList).hide()
						.filter((index, el) => {
							// tutti i termini della ricerca devono essere trovati
							const matches = el.attributes['data-search'].value.match(rg);
							return (matches && (_.difference(arrTerms, matches).length === 0));
						})
						.show();
            	} else {
            		$('.comics-list>.comics').show();
            	}
            });
            // creo un web socket e invio un messaggio al server per indicare che sono in attesa della sincronizzazione
            socket = new WebSocket('ws://' + location.host + '/sync/wsh/' + sid);
            socket.onopen = (event) => {
                
            };
            socket.onerror = (error) => {
                console.log(error);
            };
            socket.onmessage = (event) => {
                // TODO: gestire messaggi in arrivo
                const msg = JSON.parse(event.data);
                // if (msg.message === 'sync timeout') {
                //     socket.close();
                // }
                toastr.success(msg.message);
            };
        },
        destroy: (context) => {
            socket.send(JSON.stringify({ "message": "stop sync" }));
            socket.close();
        }
    });
})(jQuery);
