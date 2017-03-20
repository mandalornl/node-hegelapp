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

			var result = '';

			if (Array.isArray(data))
			{
				result = {};
				queue = data;
			}

			var client = net.connect({
				host: app.config.host,
				port: app.config.port + 1
			}, function()
			{
				console.log('[Client] - Connected to: %s:%s', this.remoteAddress, this.remotePort);

				console.log('[Client] - Data request: %s', queue[q]);
				client.write(queue[q]);
			});

			client.on('data', function(buffer)
			{
				var data = buffer.toString();
				console.log('[Client] - Data response: %s', data);

				var value = getValue(data);

				if (queue.length > 1)
				{
					var type = getType(data);
					result[type] = value;

					q++;
					if (queue[q])
					{
						console.log('[Client] - Data request: %s', queue[q]);
						client.write(queue[q]);
						return;
					}
				}
				else
				{
					result = value;
				}

				client.end();

				callback(null, result);
			});

			client.on('end', function()
			{
				console.log('[Client] - Connection ended');
			});

			client.on('error', function(err)
			{
				console.log(err);
				client.end();

				callback(err);
			});
		}
	};
};