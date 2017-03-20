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
			clients.forEach(function(client)
			{
				client.write('[Proxy] - Connection timeout');
				client.end();
			});
		});

		// an error occurred, notify clients and disconnect
		connection.on('error', function(err)
		{
			clients.forEach(function(client)
			{
				client.write(err);
				client.end();
			});
		});

		// connection ended, notify clients and disconnect
		connection.on('end', function()
		{
			clients.forEach(function(client)
			{
				client.write('[Proxy] - Connection ended');
				client.end();
			});
		});

		// send data response to clients
		connection.on('data', function(data)
		{
			var client = queue.shift();
			if (!client)
			{
				// rc8 was used, update all connected clients
				clients.forEach(function(client)
				{
					console.log('[Proxy] - Data send to %s', client.name);
					client.write(data.toString().replace(/\r\n|\r|\n/, ''));
				});
				return;
			}

			console.log('[Proxy] - Data send to %s', client.name);
			client.write(data.toString().replace(/\r\n|\r|\n/, ''));
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
				console.log(err);

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
			port: config.port + 1
		}, function()
		{
			console.log('Proxy listening on: %d', this.address().port);

			callback(null);
		});
	});
};

