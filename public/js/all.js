'use strict';

(function ($) {
    // oggetto che andra' a contenere i riferimeti ai JS di tutte le pagine
    var views = {
        // "page_name": {
        //     "ready": function(context) {},
        //     "destroy": function(context) {}
        // }
        // sul contesto (context) possono essere registarti i seguenti eventi:
        // - searchbox:search
    };
    // oggetto globale 
    window.JSVIEW = {
        define: function define(name, handler) {
            views[name] = handler;
        }
    };

    /**
     * Carica la pagina specificata da "page"
     *
     * @param      {string}   page    nome della pagina da caricare
     */
    function loadPage(page) {
        console.log('loadPage', page);
        var $pageBody = $('.page-body');
        var $searchbox = $('.searchbox');
        var lastPageId = $pageBody.attr('data-page-id');
        $pageBody.load('/' + page, function (responseText, textStatus, jqXHR) {
            if (textStatus === 'success') {
                // chiave dello script da eseguire
                var pageId = $pageBody.find('.page').attr('data-page-id');
                var pageTitle = $pageBody.find('.page').attr('data-page-title');
                if (!pageId) {
                    $searchbox.hide();
                    $pageBody.empty();
                    swal({ title: 'Page id not found', text: 'The page script can not be executed', type: 'error' });
                } else {
                    // scarico la pagina corrente                    
                    lastPageId && views[lastPageId] && (views[lastPageId].destroy || $.noop)($pageBody);
                    // mostro o nascondo la barra di ricerca in base alla classe .with-searchbox
                    $searchbox.toggle(!!$pageBody.find('.page.with-searchbox').length);
                    //
                    $('nav .page-title').html(pageTitle);
                    // elimino gli eventi legati al contesto
                    $pageBody.off('searchbox:search');
                    // lancio lo script della pagina caricata
                    $pageBody.attr('data-page-id', pageId);
                    views[pageId] && (views[pageId].ready || $.noop)($pageBody);
                }
            } else {
                $searchbox.hide();
                $pageBody.empty();
                swal({ title: 'Page not found', text: page, type: 'error' });
            }
        });
    }

    /**
     * Inizializza la barra di ricerca.
     * Al cambiamento del valore di ricerca viene eseguito cb(<termine ricerca>)
     *
     * @param      {Element}    searchEl   l'elemento HTML
     * @param      {number}     minLength  numero minimo di caratteri per scatenare la ricerca
     * @param      {number}     timeout    quanto tempo (in ms) deve passare prima di scatenare la ricerca (debounce)
     * @param      {Function}   cb         { term: termine della ricerca }
     */
    function initSearchBox(searchEl, minLength, timeout, cb) {
        // eventi sulla casella di ricerca (tasto premuto e perdita focus)
        var keyups = Rx.Observable.merge(Rx.Observable.fromEvent(searchEl, 'keyup'), Rx.Observable.fromEvent(searchEl, 'blur')).map(function (e) {
            return e.target.value.trim().toUpperCase();
        }).filter(function (text) {
            return text.length === 0 || text.length >= minLength;
        }).debounce(timeout) //se non cambia piu' niente per 500ms prosegue
        .distinctUntilChanged(); //esclude gli eventi diversi
        var rxSearchForce = Rx.Observable.fromEvent(searchEl, 'rx-search-force').map(function (e) {
            return e.target.value.trim();
        }).debounce(timeout); //se non cambia piu' niente per 500ms prosegue
        var rxSearchForceNow = Rx.Observable.fromEvent(searchEl, 'rx-search-force-now').map(function (e) {
            return e.target.value.trim();
        });
        //
        Rx.Observable.merge(keyups, rxSearchForce, rxSearchForceNow).subscribe(cb);
    }

    $(function () {
        // pagina di default
        var defaultPage = 'sync';
        var loadPageFromHash = function loadPageFromHash(hash) {
            var tokens = /^#!(.*)/.exec(hash);
            if (tokens) {
                loadPage(tokens[1] || defaultPage);
            }
        };
        // evento scatenato al cambio della parte hash
        window.onhashchange = function () {
            loadPageFromHash(location.hash);
        };
        // inizializzo la barra di ricerca
        initSearchBox($('.searchbox input'), 3, 500, function (term) {
            $('.page-body').trigger('searchbox:search', term);
        });
        // se non ci sono pagine specificate nell'hash, carico una pagina di default
        loadPageFromHash(location.hash || '#!' + defaultPage);
    });
})(jQuery);
'use strict';

(function ($) {
    JSVIEW.define('remote', {
        ready: function ready(context) {
            $('[data-action]', context).click(function (e) {
                e.stopPropagation();
                e.preventDefault();

                var action = e.target.attributes['data-action'].value;
                var title = e.target.attributes['data-confirm-title'].value;
                var message = e.target.attributes['data-confirm-message'].value;

                swal({
                    title: title,
                    text: message,
                    showCancelButton: true
                }, function (confirm) {
                    if (confirm) {
                        $.get('/remote/' + action).then(function () {
                            // ritardo il refresh altrimenti rischio che il comando non sia stato ancora eseguito
                            setTimeout(function () {
                                document.location.reload(true);
                            }, 500);
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            swal({ title: 'Load processes', text: textStatus + ': ' + errorThrown, type: 'error' });
                        });
                    }
                });
            });
        }
    });
})(jQuery);
'use strict';

(function ($) {
    var socket = void 0;

    JSVIEW.define('sync', {
        ready: function ready(context) {
            var $qrcode = $('#qrcode', context);
            var sid = $qrcode.attr('data-sid');
            // renderizzo il sid passato con la pagina
            $qrcode.qrcode({
                width: 256,
                height: 256,
                text: sid
            });
            // pulsante per reload pagina
            $('#btnNewCode', context).click(function (e) {
                document.location.reload();
            });
            // creo un web socket e invio un messaggio al server per indicare che sono in attesa della sincronizzazione
            socket = new WebSocket('ws://' + location.host + '/sync/wsh/' + sid);
            socket.onopen = function (event) {
                socket.send(JSON.stringify({ "message": "wait for sync" }));
            };
            socket.onerror = function (error) {
                console.log(error);
            };
            socket.onmessage = function (event) {
                // TODO: gestire messaggi in arrivo
                var msg = JSON.parse(event.data);
                if (msg.message === 'sync timeout') {
                    $qrcode.hide();
                    $('#btnNewCode', context).show();
                    socket.close();
                } else if (msg.message === 'sync start') {
                    location.href = '#!sync/comics/' + sid;
                }
            };
        },
        destroy: function destroy(context) {
            socket.close();
        }
    });
})(jQuery);
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function ($) {
    var socket = void 0;

    JSVIEW.define('synccomics', {
        ready: function ready(context) {
            var $comicsList = $('.comics-list');
            var sid = $comicsList.attr('data-sid');
            // registro l'evento per la ricerca
            context.on('searchbox:search', function (event, term) {
                if (term) {
                    (function () {
                        var arrTerms = term.split(/\s/);
                        var termCount = arrTerms.length;
                        var rg = new RegExp('(' + term.replace(/\s/g, '|') + ')', 'gi');
                        $('>.comics', $comicsList).hide().filter(function (index, el) {
                            // tutti i termini della ricerca devono essere trovati
                            var matches = el.attributes['data-search'].value.match(rg);
                            return matches && _.difference(arrTerms, matches).length === 0;
                        }).show();
                    })();
                } else {
                    $('.comics-list>.comics').show();
                }
            });
            // gestisco le azioni attraverso gli attributi data-action e data-action-params
            $('[data-action]', $comicsList).click(function (event) {
                return performAction(sid, event);
            });
            // creo un web socket e invio un messaggio al server per indicare che sono in attesa della sincronizzazione
            socket = new WebSocket('ws://' + location.host + '/sync/wsh/' + sid);
            socket.onopen = function (event) {
                //
            };
            socket.onerror = function (error) {
                console.error(error);
            };
            socket.onmessage = function (event) {
                // TODO: gestire messaggi in arrivo
                var msg = JSON.parse(event.data);
                // if (msg.message === 'sync timeout') {
                //     socket.close();
                // }
                toastr.success(msg.message);
            };
        },
        destroy: function destroy(context) {
            socket.close();
        }
    });

    function performAction(sid, event) {
        event.stopPropagation();
        event.preventDefault();

        var action = event.currentTarget.attributes['data-action'].value;
        var params = (event.currentTarget.attributes['data-action-params'].value || '').split(',');
        if (actions[action]) {
            actions[action].apply(actions, [sid].concat(_toConsumableArray(params)));
        } else {
            console.error('action ' + action + ' not found');
        }
    }

    var actions = {
        /**
         * Inizio la fase di editing del comics.
         */
        edit: function edit(sid, cid) {
            var $modal = $('#modalDetail');
            $('.modal-content', $modal).load('/sync/comics/' + sid + '/detail/' + cid, function (responseText, textStatus, jqXHR) {
                if (textStatus === 'success') {
                    // inizializzo materialize
                    $('select', $modal).material_select();
                    // applico la classe "active" a tutte le label degli input con valore
                    //  per evitare che la label si sovrapponga al contenuto del campo
                    $('.input-field input[value!=""]', $modal).siblings('label').addClass('active');
                    // apro la finestra modale
                    $modal.openModal();
                } else {
                    toastr.error('err loading detail');
                }
            });
            // entro nello stato di edit (la lista comics viene nascosta)
            $('.synccomics').addClass('editmode');
            // TODO: carico il dettalgio
            //$('.comics-detail')
            // TODO: carico l'elenco delle release
            //$('.release-list')
        }
    };
})(jQuery);
'use strict';

(function ($) {
    var fomratters = {
        'datetime': function datetime(value) {
            return moment(+value).format('YYYY-MM-DD HH:mm:ss');
        },
        'status': function status(value) {
            return fomratters[value] || value;
        },
        '0': 'NO_SYNC',
        '1': 'SYNCED',
        '3': 'DATA_RECEIVED'
    };

    JSVIEW.define('synclist', {
        ready: function ready(context) {
            $('[data-format]', context).each(function (index, el) {
                el.innerHTML = fomratters[el.attributes['data-format'].value](el.innerText);
            });

            $('a[data-action]', context).click(function (e) {
                e.stopPropagation();
                e.preventDefault();

                var action = e.target.attributes['data-action'].value;
                var sid = e.target.attributes['data-sid'].value;

                swal({
                    title: action.capitalize() + ' ' + sid + '?',
                    showCancelButton: true,
                    closeOnConfirm: true
                }, function (confirm) {
                    if (confirm) {
                        setTimeout(function () {
                            if (action === 'sync') {
                                // TODO aprie un WebSocket per simulare l'app
                            } else if (action === 'expire') {
                                $.post('/sync/change/' + sid, { 'lastSync': Date.now() - 30000 }).then(function () {
                                    location.reload();
                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                    swal({ title: 'Expire', text: textStatus + ': ' + errorThrown, type: 'error' });
                                });
                            } else if (action === 'remove') {
                                $.post('/sync/remove/' + sid).then(function () {
                                    location.reload();
                                }).fail(function (jqXHR, textStatus, errorThrown) {
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
"use strict";

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

//http://stackoverflow.com/a/27406756
$.fn.ensureVisible = function () {
	$(this).each(function () {
		$(this)[0].scrollIntoView();
	});
};