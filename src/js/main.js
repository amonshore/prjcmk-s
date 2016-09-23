($ => {
    // oggetto che andra' a contenere i riferimeti ai JS di tutte le pagine
    const views = {
        // "page_name": {
        //     "ready": function(context) {},
        //     "destroy": function(context) {}
        // }
        // sul contesto (context) possono essere registarti i seguenti eventi:
        // - searchbox:search
    };
    // oggetto globale 
    window.JSVIEW = {
        define: function(name, handler) {
            views[name] = handler;
        }
    }

    /**
     * Carica la pagina specificata da "page"
     *
     * @param      {string}   page    nome della pagina da caricare
     */
    function loadPage(page) {
        console.log('loadPage', page);
        const $pageBody = $('.page-body');
        const $searchbox = $('.searchbox');
        const lastPageId = $pageBody.attr('data-page-id');
        $pageBody.load('/' + page,
            (responseText, textStatus, jqXHR) => {
                if (textStatus === 'success') {
                    // chiave dello script da eseguire
                    const pageId = $pageBody.find('.page').attr('data-page-id');
                    const pageTitle = $pageBody.find('.page').attr('data-page-title');
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
        const keyups = Rx.Observable.merge(
                Rx.Observable.fromEvent(searchEl, 'keyup'),
                Rx.Observable.fromEvent(searchEl, 'blur'))
            .map(e => e.target.value.trim().toUpperCase())
            .filter(text => text.length === 0 || text.length >= minLength)
            .debounce(timeout) //se non cambia piu' niente per 500ms prosegue
            .distinctUntilChanged(); //esclude gli eventi diversi
        const rxSearchForce = Rx.Observable.fromEvent(searchEl, 'rx-search-force')
            .map(e => e.target.value.trim())
            .debounce(timeout); //se non cambia piu' niente per 500ms prosegue
        const rxSearchForceNow = Rx.Observable.fromEvent(searchEl, 'rx-search-force-now')
            .map(e => e.target.value.trim());
        //
        Rx.Observable.merge(keyups, rxSearchForce, rxSearchForceNow)
            .subscribe(cb);
    }

    $(() => {
        // pagina di default
        const defaultPage = 'sync';
        const loadPageFromHash = (hash) => {
            const tokens = /^#!(.*)/.exec(hash);
            if (tokens) {
                loadPage(tokens[1] || defaultPage);
            }
        };
        // evento scatenato al cambio della parte hash
        window.onhashchange = (() => {
            loadPageFromHash(location.hash);
        });
        // inizializzo la barra di ricerca
        initSearchBox($('.searchbox input'), 3, 500, (term) => {
            $('.page-body').trigger('searchbox:search', term);
        });
        // se non ci sono pagine specificate nell'hash, carico una pagina di default
        loadPageFromHash(location.hash || '#!' + defaultPage);
    });
})(jQuery);
