'use strict';

(function ($) {
    var processRowTemplate = $('#processRowTemplate').html();
    loadProcesses();

    /**
     * Carica i processi "forever" e gestisce le azioni su di essi.
     */
    function loadProcesses() {
        $.getJSON('/remote/list').then(function (data) {
            $('.process-list>tbody').find('tr').remove().end().append(data.map(function (process) {
                return Mustache.render(processRowTemplate, process);
            })).find('a[data-action]').click(function (e) {
                e.stopPropagation();
                e.preventDefault();

                var pid = e.target.attributes['data-pid'].value;
                var action = e.target.attributes['data-action'].value;

                swal({
                    title: 'Confirm',
                    text: action.capitalize() + ' process with pid ' + pid + '?',
                    showCancelButton: true
                }, function (confirm) {
                    if (confirm) {
                        $.get('/remote/' + action + '?pid=' + pid).then(function () {
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
        }).fail(function (jqXHR, textStatus, errorThrown) {
            swal({ title: 'Load processes', text: textStatus + ': ' + errorThrown, type: 'error' });
        });
    }
})(jQuery);