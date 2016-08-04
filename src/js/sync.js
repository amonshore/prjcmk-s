($ => {
    window.JSVIEW['sync'] = {
        ready: (context) => {
            const code = location.origin + '/v1/sync?sid=' + $('#qrcode', context).attr('data-sid');
            $('#qrcode', context)
                .attr('title', code)
                .qrcode({
                    width: 256,
                    height: 256,
                    text: code
                });
        }
    }
})(jQuery);
