'use strict';

(function ($) {
    var defaultPage = 'sync';

    /**
     * Carica la pagina specificata da "page"
     *
     * @param      {string}   page    nome della pagina da caricare
     */
    function loadPage(page) {
        $('.page-body').load('/' + page, function (responseText, textStatus, jqXHR) {
            if (textStatus === 'success') {
                $('.page-body').attr('data-page', page);
                // sono costretto a caricare il file js in un secondo momento
                // visto che se uso il tag <script> nella pagina html viene caricato in modalita' sincrona
                $.getScript('/js/' + page.replace('/', '_') + '.js').fail(function () {
                    swal('Script not found');
                });
            } else {
                swal('Page not found');
            }
        });
    }

    $(function () {
        // evento scatenato al cambio della parte hash
        window.onhashchange = function () {
            loadPage(location.hash.substr(1) || defaultPage);
        };
        // se non ci sono pagine specificate nell'hash, carico una pagina di default
        loadPage(location.hash.substr(1) || defaultPage);
    });
})(jQuery);