var net = require('net');

module.exports = function(config, callback)
{
	var initial = true;

	var timeoutId;
	var timeoutDelay = 10000;

	/**
	 * Establish connection to device and create proxy server.
	 */
	var connect = function()
	{
		timeoutId = null;

		// socket list
		var sockets = [];

		// socket queue
		var queue = [];

		// create proxy server
		var server = net.createServer(function(socket)
		{
			socket.name = socket.remoteAddress + ':' + socket.remotePort;
			console.log('[Proxy] - %s connected', socket.name);

			// add client to clients list
			sockets.push(socket);

			// send data to device connection
			socket.on('data', function(data)
			{
				client.write(data + '\r', function()
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

				sockets.splice(sockets.indexOf(socket), 1);
			});
		});

		// create device connection
		var client = net.connect({
			host: config.device.host,
			port: config.device.port
		}, function()
		{
			console.log('[Device] - Connected to %s:%s', this.remoteAddress, this.remotePort);

			server.listen({
				host: config.host,
				port: Number(config.port) + 1
			}, function()
			{
				console.log('[Proxy] - Listening on: %d', this.address().port);

				if (initial)
				{
					initial = false;

					callback(null);
				}
			});
		});

		client.on('error', function(err)
		{
			console.error('[Device] - %s', err.toString());

			// notify and disconnect socket(s)
			sockets.forEach(function(socket)
			{
				socket.write('-e.500', function()
				{
					socket.end();
				});
			});

			// skip, already trying to reconnect
			if (timeoutId !== null)
			{
				return;
			}

			// gracefully close proxy server
			server.close(function()
			{
				console.log('[Device] - Trying to reconnect in %d seconds...', timeoutDelay / 1000);

				// try to reconnect
				timeoutId = setTimeout(connect, timeoutDelay);
			});
		});

		// a timeout occurred
		client.on('timeout', function()
		{
			console.log('[Device] - Connection timeout');

			// notify and disconnect socket(s)
			sockets.forEach(function(socket)
			{
				socket.write('-e.504', function()
				{
					socket.end();
				});
			});
		});

		// connection ended
		client.on('end', function()
		{
			console.log('[Device] - Connection ended');

			// notify and disconnect socket(s)
			sockets.forEach(function(socket)
			{
				socket.write('-e.503', function()
				{
					socket.end();
				});
			});

			// skip, already trying to reconnect
			if (timeoutId !== null)
			{
				return;
			}

			// gracefully close proxy server
			server.close(function()
			{
				console.log('[Device] - Trying to reconnect in %d seconds...', timeoutDelay / 1000);

				// try to reconnect
				timeoutId = setTimeout(connect, timeoutDelay);
			});
		});

		// send data response to socket(s)
		client.on('data', function(buffer)
		{
			// normalize data
			var data = buffer.toString().replace(/\r\n|\r|\n/, '');

			var socket = queue.shift();
			if (!socket)
			{
				// device was used, update all connected sockets
				sockets.forEach(function(socket)
				{
					socket.write(data, function()
					{
						console.log('[Proxy] - Data \'%s\' send to %s', data, socket.name);
					});
				});
				return;
			}

			socket.write(data);
		});
	};

	connect();
};