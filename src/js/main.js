($ => {
    /**
     * Carica la pagina specificata da "name", se vuoto viene usato la parte hash dell'url
     *
     * @param      {string}   name    nome della pagina da caricare
     * @return     {boolean}  true se c'e' una pagina da caricare, false
     *                        altrimenti
     */
    function loadPage(name) {
        const page = name || location.hash.substr(1);
        if (page) {
            $('.page-body').load('/' + page + '.html',
                (responseText, textStatus, jqXHR) => {
                    if (textStatus === 'success') {
                        $('.page-body').attr('data-page', page);
                        // sono costretto a caricare il file js in un secondo momento
                        // visto che se uso il tag <script> nella pagina html viene caricato in modalita' sincrona
                        $.getScript('/js/' + page + '.js').fail(() => {
                            swal('Script not found');
                        });
                    } else {
                        swal('Page not found');
                    }
                });
            return true;
        } else {
            return false;
        }
    }

    // evento scatenato al cambio della parte hash
    window.onhashchange = () => { loadPage(); }
    // document ready, se non ci sono pagine specificate nell'hash, carico una pagina di default
    $(() => {
        if (!loadPage()) {
            loadPage('initsync');
        }
    });
})(jQuery);
