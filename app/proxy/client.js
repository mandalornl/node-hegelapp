var net = require('net');

module.exports = function(app)
{
	/**
	 * Get value.
	 * @param {string} data
	 * @returns {string|Number}
	 */
	var getValue = function(data)
	{
		if (/^-e.\d+$/.test(data))
		{
			return data;
		}

		if (/^-\w\.\d+$/.test(data))
		{
			var value = data.replace(/[^\d]+/g, '');
			if (!isNaN(value))
			{
				return Number(value);
			}

			return value;
		}

		return data;
	};

	/**
	 * Get type.
	 * @param {string} data
	 * @returns {string}
	 */
	var getType = function(data)
	{
		if (/^-\w\.\d+$/.test(data))
		{
			return data.replace(/[^a-z]+/g, '');
		}

		return data;
	};

	return {
		/**
		 * Make call to proxy server.
		 * @param {string|string[]} data
		 * @param {Function} callback
		 */
		call: function(data, callback)
		{
			var q = 0;
			var queue = [data];

			var error = null;
			var result = '';

			if (Array.isArray(data))
			{
				result = {};
				queue = data;
			}

			var client = net.connect({
				host: app.config.host,
				port: Number(app.config.port) + 1
			}, function()
			{
				console.log('[Client] - Connected to: %s:%s', this.remoteAddress, this.remotePort);

				console.log('[Client] - [%d/%d] - Data request: %s', q + 1, queue.length, queue[q]);
				client.write(queue[q]);
			});

			client.setTimeout(1500);

			client.on('data', function(buffer)
			{
				var data = buffer.toString();
				console.log('[Client] - [%d/%d] - Data response: %s', q + 1, queue.length, data);

				var value = getValue(data);

				if (queue.length > 1)
				{
					var type = getType(data);
					result[type] = value;

					q++;
					if (queue[q])
					{
						console.log('[Client] - [%d/%d] - Data request: %s', q + 1, queue.length, queue[q]);
						client.write(queue[q]);
						return;
					}
				}
				else
				{
					result = value;
				}

				console.log('[Client] - All data received');

				client.end();
			});

			client.on('error', function(err)
			{
				console.error('[Client] - %s', err.toString());

				error = err;

				client.end();
			});

			client.on('timeout', function()
			{
				console.log('[Client] - Connection timeout');

				client.end();
			});

			client.on('end', function()
			{
				console.log('[Client] - Connection ended');

				callback(error, result);
			});
		}
	};
};
