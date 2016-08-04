'use strict';

(function ($) {
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
        var $pageBody = $('.page-body');
        $pageBody.load('/' + page, function (responseText, textStatus, jqXHR) {
            if (textStatus === 'success') {
                $pageBody.attr('data-page', page);
                // lancio lo script della pagina caicata
                window.JSVIEW[page] && window.JSVIEW[page].ready($pageBody);
            } else {
                swal('Page not found');
            }
        });
    }

    $(function () {
        // pagina di default
        var defaultPage = 'sync';
        // evento scatenato al cambio della parte hash
        window.onhashchange = function () {
            loadPage(location.hash.substr(1) || defaultPage);
        };
        // se non ci sono pagine specificate nell'hash, carico una pagina di default
        loadPage(location.hash.substr(1) || defaultPage);
    });
})(jQuery);
'use strict';

(function ($) {
    window.JSVIEW['remote'] = {
        ready: function ready(context) {
            $('button[data-action]', context).click(function (e) {
                e.stopPropagation();
                e.preventDefault();

                var action = e.target.attributes['data-action'].value;

                swal({
                    title: action.capitalize() + ' current process?',
                    text: 'This may take a few seconds.',
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
    };
})(jQuery);
'use strict';

(function ($) {
    window.JSVIEW['sync'] = {
        ready: function ready(context) {
            var code = location.origin + '/v1/sync?sid=' + $('#qrcode', context).attr('data-sid');
            $('#qrcode', context).attr('title', code).qrcode({
                width: 256,
                height: 256,
                text: code
            });
        }
    };
})(jQuery);
'use strict';

(function ($) {
    window.JSVIEW['sync/list'] = {
        ready: function ready(context) {
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
                                $.post('/sync/' + sid).then(function () {
                                    location.reload();
                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                    swal({ title: 'Sync', text: textStatus + ': ' + errorThrown, type: 'error' });
                                });
                            }
                        }, 100);
                    }
                });
            });
        }
    };
})(jQuery);
"use strict";

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
};