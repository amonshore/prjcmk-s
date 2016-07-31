($ => {
	//TODO: recuperare il sid da un attributo di #qrcode (da valorizzare in fase di rendering della pagina lato server)
	$('#qrcode').qrcode({
		width: 256,
		height: 256,
		text: location.origin + '/v1/sync?sid=' + $('#qrcode').attr('data-sid')
	});
})(jQuery);
