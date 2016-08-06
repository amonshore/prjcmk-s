($ => {
    // oggetto che andra' a contenere i riferimeti ai JS di tutte le pagine
    window.JSVIEW = {
        // "page_name": {
        //     "ready": function(context) {}
        // }
    };
    
    /**
     * Carica la pagina specificata da "page"
     *
     * @param      {string}   page    nome della pagina da caricare
     */
    function loadPage(page) {
        const $pageBody = $('.page-body');
        $pageBody.load('/' + page,
            (responseText, textStatus, jqXHR) => {
                if (textStatus === 'success') {
                    $pageBody.attr('data-page', page);
                    // lancio lo script della pagina caicata
                    window.JSVIEW[page] && window.JSVIEW[page].ready($pageBody);
                } else {
                    swal('Page not found');
                }
            });
    }

    $(() => {
        // pagina di default
        const defaultPage = 'sync';
        // evento scatenato al cambio della parte hash
        window.onhashchange = (() => {
            loadPage(location.hash.substr(1) || defaultPage);
        });
        // se non ci sono pagine specificate nell'hash, carico una pagina di default
        loadPage(location.hash.substr(1) || defaultPage);
    });
})(jQuery);
