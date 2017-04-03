var net = require('net');

module.exports = function(config, callback)
{
	var clients = [];

	// request queue
	var queue = [];

	// connection options
	var options = {
		host: config.device.host,
		port: config.device.port
	};

	var connection = new net.Socket();

	/**
	 * Call when a connection to the device is established.
	 * @param {boolean} [isReconnect = false]
	 * @returns {Function}
	 */
	var onConnect = function(isReconnect)
	{
		isReconnect = isReconnect || false;

		return function()
		{
			// skip proxy server creation on reconnect
			if (isReconnect)
			{
				console.log('[Device] - Reconnected to %s:%s', this.remoteAddress, this.remotePort);
				return;
			}

			console.log('[Device] - Connected to %s:%s', this.remoteAddress, this.remotePort);

			net.createServer(function(socket)
			{
				socket.name = socket.remoteAddress + ':' + socket.remotePort;
				console.log('[Proxy] - %s connected', socket.name);

				// add client to clients list
				clients.push(socket);

				// send data to device connection
				socket.on('data', function(data)
				{
					connection.write(data + '\r', function()
					{
						queue.push(socket);
					});
				});

				socket.on('error', function(err)
				{
					console.error('[Proxy] - %s', err.toString());

					socket.end();
				});

				// remove client from list when it leaves
				socket.on('end', function()
				{
					console.log('[Proxy] - %s disconnected', socket.name);

					clients.splice(clients.indexOf(socket), 1);
				});
			}).listen({
				host: config.host,
				port: Number(config.port) + 1
			}, function()
			{
				console.log('Proxy listening on: %d', this.address().port);

				callback(null);
			});
		};
	};

	// an error occurred
	connection.on('error', function(err)
	{
		console.error('[Device] - %s', err.toString());

		// notify and disconnect client(s)
		clients.forEach(function(client)
		{
			client.write('-e.500', function()
			{
				client.end();
			});
		});

		// try to reconnect to the device on connection failure
		if ([
			'ECONNREFUSED',
			'EHOSTUNREACH',
			'ECONNRESET'
		 ].indexOf(err.code) !== -1)
		{
			console.log('Trying to reconnect to device in 10 seconds...');

			setTimeout(function()
			{
				connection.connect(options, onConnect(true));
			}, 10000);
		}
	});

	// a timeout occurred
	connection.on('timeout', function()
	{
		console.log('[Device] - Connection timeout');

		// notify and disconnect client(s)
		clients.forEach(function(client)
		{
			client.write('-e.504', function()
			{
				client.end();
			});
		});
	});

	// connection ended
	connection.on('end', function()
	{
		console.log('[Device] - Connection ended');

		// notify and disconnect client(s)
		clients.forEach(function(client)
		{
			client.write('-e.503', function()
			{
				client.end();
			});
		});
	});

	// send data response to client(s)
	connection.on('data', function(buffer)
	{
		// normalize data
		var data = buffer.toString().replace(/\r\n|\r|\n/, '');

		var client = queue.shift();
		if (!client)
		{
			// remote was used, update all connected clients
			clients.forEach(function(client)
			{
				console.log('[Proxy] - Data \'%s\' send to %s', data, client.name);
				client.write(data);
			});
			return;
		}

		client.write(data);
	});

	connection.connect(options, onConnect());
};
