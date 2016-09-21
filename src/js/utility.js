String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

//http://stackoverflow.com/a/27406756
$.fn.ensureVisible = function () { $(this).each(function () { $(this)[0].scrollIntoView(); }); };