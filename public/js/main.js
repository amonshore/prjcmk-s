'use strict';

(function ($) {
    /**
     * Carica la pagina specificata da "name", se vuoto viene usato la parte hash dell'url
     *
     * @param      {string}   name    nome della pagina da caricare
     * @return     {boolean}  true se c'e' una pagina da caricare, false
     *                        altrimenti
     */
    function loadPage(name) {
        var page = name || location.hash.substr(1);
        if (page) {
            $('.page-body').load('/' + page + '.html', function (responseText, textStatus, jqXHR) {
                if (textStatus === 'success') {
                    $.getScript('/js/' + page + '.js');
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
    window.onhashchange = loadPage;
    // document ready
    $(function () {
        if (!loadPage()) {
            //loadPage('initsync');
        }
    });
})(jQuery);