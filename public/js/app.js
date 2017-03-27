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
		var $btnPresets = $('[id^="btnPreset_"]');

		/**
		 * Disable buttons.
		 * @param {boolean} state
		 */
		var disableButtons = function(state)
		{
			$btnVolumeMute.prop('disabled', state);
			$btnVolumeDown.prop('disabled', state);
			$btnVolumeUp.prop('disabled', state);

			$btnInputs.prop('disabled', state);
			$btnPresets.prop('disabled', state);
		};

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
			 * Sync callback.
			 */
			var sync = function()
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

					if (statuses.hasOwnProperty('p'))
					{
						$btnPowerOn.toggleClass('active', !!statuses.p);
						$btnPowerOff.toggleClass('active', !statuses.p);

						disableButtons(!statuses.p);
					}

					if (statuses.hasOwnProperty('m'))
					{
						$btnVolumeMute.toggleClass('active', !!statuses.m);
					}

					if (statuses.hasOwnProperty('v'))
					{
						$volume.text(statuses.v);
					}

					if (statuses.hasOwnProperty('i'))
					{
						$btnInputs.removeClass('active').filter(function()
						{
							return $(this).data('id') === statuses.i;
						}).addClass('active');
					}

					window.clearTimeout(timer);
					timer = window.setTimeout(sync, app.global.updateInterval || 1000);
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
						sync();
						return true;
					}

					return false;
				},

				/**
				 * Pause sync.
				 * @returns {syncStatuses}
				 */
				pause: function()
				{
					window.clearTimeout(timer);
					timer = null;

					return this;
				},

				/**
				 * Resume sync.
				 * @returns {syncStatuses}
				 */
				resume: function()
				{
					window.clearTimeout(timer);
					timer = window.setTimeout(sync, app.global.updateInterval || 1000);

					return this;
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

			syncStatuses.pause();

			app.api.get('power/on', function(err, status)
			{
				syncStatuses.resume();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$this.toggleClass('active', status);
				$btnPowerOff.toggleClass('active', !status);

				disableButtons(false);
			});
		});

		$btnPowerOff.on('click', function()
		{
			var $this = $(this);
			if ($this.hasClass('active'))
			{
				return;
			}

			syncStatuses.pause();

			app.api.get('power/off', function(err, status)
			{
				syncStatuses.resume();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$btnPowerOn.toggleClass('active', status);
				$this.toggleClass('active', !status);

				disableButtons(true);
			});
		});

		$btnVolumeMute.on('click', function()
		{
			syncStatuses.pause();

			app.api.get('mute/toggle', function(err, status)
			{
				syncStatuses.resume();

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

			syncStatuses.pause();

			app.api.get('volume/down', function(err, volume)
			{
				syncStatuses.resume();

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

			syncStatuses.pause();

			app.api.get('volume/up', function(err, volume)
			{
				syncStatuses.resume();

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

			syncStatuses.pause();

			app.api.get('input/set/' + $this.data('id'), function(err, input)
			{
				syncStatuses.resume();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				$btnInputs.removeClass('active');
				$this.addClass('active');
			});
		});

		$btnPresets.on('click', function()
		{
			syncStatuses.pause();

			app.api.get('preset/' + $(this).data('id'), function(err, statuses)
			{
				syncStatuses.resume();

				if (err)
				{
					app.toastr('Connection error', 'error');
					return console.log(err);
				}

				if (statuses.hasOwnProperty('v'))
				{
					$volume.text(statuses.v);
				}

				if (statuses.hasOwnProperty('i'))
				{
					$btnInputs.removeClass('active').filter(function()
					{
						return $(this).data('id') === statuses.i;
					}).addClass('active');
				}

				if (statuses.hasOwnProperty('m'))
				{
					$btnVolumeMute.toggleClass('active', !!statuses.m);
				}

				if (statuses.hasOwnProperty('p'))
				{
					$btnPowerOn.toggleClass('active', !!statuses.p);
					$btnPowerOff.toggleClass('active', !statuses.p);
				}
			});
		});
	});
})(jQuery, window, document);
