var net = require('net');

module.exports = function(config, callback)
{
	var clients = [];

	// request queue
	var queue = [];

	var connection = net.connect({
		host: config.device.host,
		port: config.device.port
	}, function()
	{
		console.log('[Proxy] - Connected to %s:%s', this.remoteAddress, this.remotePort);

		// a timeout occurred, notify clients and disconnect
		connection.on('timeout', function()
		{
			console.log('[Proxy] - Connection timeout');

			clients.forEach(function(client)
			{
				client.emit('timeout');
			});
		});

		// an error occurred, notify clients and disconnect
		connection.on('error', function(err)
		{
			console.error('[Proxy] - ' + err.toString());

			clients.forEach(function(client)
			{
				client.emit('error', err);
			});
		});

		// connection ended, notify clients and disconnect
		connection.on('end', function()
		{
			console.log('[Proxy] - Connection ended');

			clients.forEach(function(client)
			{
				client.end();
			});
		});

		// send data response to clients
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

		net.createServer(function(socket)
		{
			socket.name = socket.remoteAddress + ':' + socket.remotePort;
			console.log('[Proxy] - %s connected', socket.name);

			// add client to clients list
			clients.push(socket);

			// send data to telnet connection
			socket.on('data', function(data)
			{
				connection.write(data + '\r', function()
				{
					queue.push(socket);
				});
			});

			socket.on('error', function(err)
			{
				console.error(err);

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
	});
};