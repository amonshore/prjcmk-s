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
                // TODO: uscire dallo stato di edit (oppure eseguire la ricerca tra le release)
            });
            // gestisco le azioni attraverso gli attributi data-action e data-action-params
            $('[data-action]', $comicsList).click(event => performAction(sid, event));
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
            socket.close();
        }
    });

    function performAction(sid, event) {
        event.stopPropagation();
        event.preventDefault();

        const action = event.target.attributes['data-action'].value;
        const params = (event.target.attributes['data-action-params'].value || '').split(',');
        if (actions[action]) {
            actions[action](sid, ...params);
        } else {
            console.error(`action ${action} not found`);
        }
    }

    const actions = {
        /**
         * Inizio la fase di editing del comics.
         */
        edit: function(sid, cid) {
            toastr.info(cid);
            $('#modal1').openModal();
            // entro nello stato di edit (la lista comics viene nascosta)
            $('.synccomics').addClass('editmode');
            // TODO: carico il dettalgio
            //$('.comics-detail')
            // TODO: carico l'elenco delle release
            //$('.release-list')
            // inizializzo materialize
            $('.comics-detail select').material_select();
        }
    }
})(jQuery);
