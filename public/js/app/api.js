;(function($, window, document, undefined)
{
	var app = window.app || {};
	var self = app.api = app.api || {};

	var waitForIt;

	/**
	 * Make api call.
	 * @param {string} path
	 * @param {Function} callback
	 */
	self.get = function(path, callback)
	{
		// prevent hammering
		if (waitForIt)
		{
			return;
		}

		waitForIt = true;

		$.ajax({
			method: 'GET',
			url: 'api/' + path,
			dataType: 'json',

			success: function(res)
			{
				waitForIt = false;

				callback(res.err, res.data);
			},

			error: function(jqXHR, textStatus, errorThrown)
			{
				waitForIt = false;

				callback(jqXHR.responseText);
			}
		});
	};
})(jQuery, window, document);