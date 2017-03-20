;(function($, window, document, undefined)
{
	var app = window.app || {};

	/**
	 * Show toastr message.
	 * @param {string} message
	 * @param {string} method
	 * @param {{}} [options]
	 */
	app.toastr = function(message, method, options)
	{
		if (window.toastr === undefined)
		{
			return;
		}

		if (toastr[method] === undefined)
		{
			return console.log('Invalid Toastr method \'' + method + '\'');
		}

		options = $.extend({}, {
			preventDuplicates: true,
			closeButton: true
		}, options);

		toastr.options = options;
		toastr[method](message);
	};
})(jQuery, window, document);