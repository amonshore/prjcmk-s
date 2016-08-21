($ => {
    window.JSVIEW['synccomics'] = {
        ready: (context) => {
        	// registro l'evento per la ricerca
            context.on('searchbox:search', (event, term) => {
            	if (term) {
					const arrTerms = term.split(/\s/);
            		const termCount = arrTerms.length;
					const rg = new RegExp('(' + term.replace(/\s/g, '|') + ')', 'gi');
					$('.comics-list>.comics').hide()
						.filter((index, el) => {
							// tutti i termini della ricerca devono essere trovati
							const matches = el.attributes['data-search'].value.match(rg);
							return (matches && (_.difference(arrTerms, matches).length === 0));
						})
						.show();
            	} else {
            		$('.comics-list>.comics').show();
            	}
            });
        }
    }
})(jQuery);
