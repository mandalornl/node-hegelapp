;(function($, window, document, undefined)
{
	var app = window.app || {};

	$(function()
	{
		var $body = $(document.body);

		var $btnPowerOn = $('#btnPowerOn');
		var $btnPowerOff = $('#btnPowerOff');

		var $volume = $('#volume');

		var $btnVolumeMute = $('#btnVolumeMute');
		var $btnVolumeDown = $('#btnVolumeDown');
		var $btnVolumeUp = $('#btnVolumeUp');

		var $btnInputs = $('[id^="btnInput_"]');

		/**
		 * Sync statuses.
		 * @type {{start, stop, running}}
		 */
		var syncStatuses = (function()
		{
			/**
			 * @type {Number|null}
			 */
			var timer = null;

			/**
			 * Update statuses.
			 */
			var update = function()
			{
				$body.addClass('loading');

				app.api.get('statuses', function(err, statuses)
				{
					$body.removeClass('loading immediately');

					if (err || statuses === undefined)
					{
						app.toastr('Connection error', 'error');
						return console.log(err);
					}

					$btnPowerOn.toggleClass('active', !!statuses.p);
					$btnPowerOff.toggleClass('active', !statuses.p);

					$btnVolumeMute.toggleClass('active', !!statuses.m);

					$volume.text(statuses.v);

					$btnInputs.removeClass('active').filter(function()
					{
						return $(this).data('id') === statuses.i;
					}).addClass('active');

					window.clearTimeout(timer);
					timer = window.setTimeout(update, app.global.updateInterval || 1000);
				});
			};

			return {
				/**
				 * Start sync.
				 * @returns {boolean}
				 */
				start: function()
				{
					if (timer === null)
					{
						update();
						return true;
					}

					return false;
				},

				/**
				 * Stop sync.
				 * @returns {boolean}
				 */
				stop: function()
				{
					if (timer !== null)
					{
						window.clearTimeout(timer);
						timer = null;

						return true;
					}

					return false;
				},

				/**
				 * Check whether or not sync is running.
				 * @returns {boolean}
				 */
				running: function()
				{
					return timer !== null;
				}
			};
		})();

		syncStatuses.start();

		$btnPowerOn.on('click', function()
		{
			var $this = $(this);
			if ($this.hasClass('active'))
			{
				return;
			}

			syncStatuses.stop();

			app.api.get('power/on', function(err, status)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$this.toggleClass('active', status);
				$btnPowerOff.toggleClass('active', !status);
			});
		});

		$btnPowerOff.on('click', function()
		{
			var $this = $(this);
			if ($this.hasClass('active'))
			{
				return;
			}

			syncStatuses.stop();

			app.api.get('power/off', function(err, status)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$btnPowerOn.toggleClass('active', !status);
				$this.toggleClass('active', status);
			});
		});

		$btnVolumeMute.on('click', function()
		{
			syncStatuses.stop();

			app.api.get('mute/toggle', function(err, status)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$btnVolumeMute.toggleClass('active', status);
			});
		});

		$btnVolumeDown.on('click', function()
		{
			if (!($volume.text() > 0 && $volume.text() <= 100))
			{
				return;
			}

			syncStatuses.stop();

			app.api.get('volume/down', function(err, volume)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$volume.text(volume);
				$btnVolumeMute.removeClass('active');
			});
		});

		$btnVolumeUp.on('click', function()
		{
			if (!($volume.text() >= 0 && $volume.text() < 100))
			{
				return;
			}

			syncStatuses.stop();

			app.api.get('volume/up', function(err, volume)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$volume.text(volume);
				$btnVolumeMute.removeClass('active');
			});
		});

		$btnInputs.on('click', function()
		{
			var $this = $(this);
			if ($this.hasClass('active'))
			{
				return;
			}

			syncStatuses.stop();

			app.api.get('input/set/' + $this.data('id'), function(err, input)
			{
				syncStatuses.start();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$btnInputs.removeClass('active');
				$this.addClass('active');
			});
		});
	});
})(jQuery, window, document);
