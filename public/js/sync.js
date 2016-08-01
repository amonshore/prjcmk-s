'use strict';

(function ($) {
    var code = location.origin + '/v1/sync?sid=' + $('#qrcode').attr('data-sid');
    $('#qrcode').attr('title', code).qrcode({
        width: 256,
        height: 256,
        text: code
    });
})(jQuery);