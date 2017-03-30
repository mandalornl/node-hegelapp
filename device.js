var net = require('net');
var cmd = require('./config/cmd');

/**
 * @type {net.Socket[]}
 */
var clients = [];

/**
 * @type {{
 * 	power: {on, off, toggle, status},
 * 	volume: {up, down, set, status},
 * 	mute: {on, off, toggle, status},
 * 	input: {set, status},
 * 	reset: {set, stop, status}
 * }}
 */
var device = (function()
{
	/**
	 * @type {number}
	 */
	var power = 1;

	/**
	 * @type {number}
	 */
	var volume = 20;

	/**
	 * @type {number}
	 */
	var mute = 0;

	/**
	 * @type {number}
	 */
	var input = 4;

	/**
	 * @type {number|string}
	 */
	var reset = 2;

	return {
		power: {
			on: function()
			{
				return power = 1;
			},

			off: function()
			{
				return power = 0;
			},

			toggle: function()
			{
				return (power = Number(power) === 1 ? 0 : 1);
			},

			status: function()
			{
				return power;
			}
		},
		volume: {
			up: function()
			{
				return (volume = Math.min(volume + 1, 100));
			},

			down: function()
			{
				return (volume = Math.max(volume - 1, 0));
			},

			set: function(value)
			{
				value = Number(value);
				if (value >= 0 && value <= 100)
				{
					return (volume = value);
				}

				return volume;
			},

			status: function()
			{
				return volume;
			}
		},
		mute: {
			on: function()
			{
				return mute = 1;
			},

			off: function()
			{
				return mute = 0;
			},

			toggle: function()
			{
				return (mute = Number(mute) === 1 ? 0 : 1);
			},

			status: function()
			{
				return mute;
			}
		},
		input: {
			set: function(value)
			{
				value = Number(value);
				if (value >= 1 && value <= 9)
				{
					return (input = value);
				}

				return input;
			},

			status: function()
			{
				return input;
			}
		},
		reset: {
			set: function(value)
			{
				value = Number(value);
				if (value >= 1 && value <= 255)
				{
					return (reset = value);
				}

				return reset;
			},

			stop: function()
			{
				return reset = '~';
			},

			status: function()
			{
				return reset;
			}
		}
	};
})();

net.createServer(function(socket)
{
	socket.name = socket.remoteAddress + ':' + socket.remotePort;
	console.log('[Device] - %s connected', socket.name);

	clients.push(socket);

	// send data to telnet connection
	socket.on('data', function(buffer)
	{
		var data = buffer.toString().replace(/\r\n|\r|\n/, '');
		switch (data)
		{
			case cmd.power.on:
				return socket.write('-p.' + device.power.on() + '\r');
			case cmd.power.off:
				device.volume.set(20);
				device.input.set(4);
				device.mute.off();
				device.reset.set(2);
				return socket.write('-p.' + device.power.off() + '\r');
			case cmd.power.toggle:
				return socket.write('-p.' + device.power.toggle() + '\r');
			case cmd.power.status:
				return socket.write('-p.' + device.power.status() + '\r');

			case cmd.mute.on:
				return socket.write('-m.' + device.mute.on() + '\r');
			case cmd.mute.off:
				return socket.write('-m.' + device.mute.off() + '\r');
			case cmd.mute.toggle:
				return socket.write('-m.' + device.mute.toggle() + '\r');
			case cmd.mute.status:
				return socket.write('-m.' + device.mute.status() + '\r');

			case cmd.volume.up:
				device.mute.off();
				return socket.write('-v.' + device.volume.up() + '\r');
			case cmd.volume.down:
				device.mute.off();
				return socket.write('-v.' + device.volume.down() + '\r');
			case cmd.volume.status:
				return socket.write('-v.' + device.volume.status() + '\r');

			case cmd.input.status:
				return socket.write('-i.' + device.input.status() + '\r');

			case cmd.reset.stop:
				return socket.write('-r.' + device.reset.stop() + '\r');
			case cmd.reset.status:
				return socket.write('-r.' + device.reset.status() + '\r');
		}

		switch (true)
		{
			case /^-v.\d+$/.test(data):
				device.mute.off();
				var volume = data.replace(/[^\d]+/, '');
				return socket.write('-v.' + device.volume.set(volume) + '\r');

			case /^-i.\d+$/.test(data):
				var input = data.replace(/[^\d]+/, '');
				return socket.write('-i.' + device.input.set(input) + '\r');

			case /^-r.\d+$/.test(data):
				var reset = data.replace(/[^\d]+/, '');
				return socket.write('-r.' + device.reset.set(reset) + '\r');
		}

		socket.write('-e.1\r');
	});

	socket.on('error', function(err)
	{
		console.error(err);

		socket.end();
	});

	// remove client from list when it leaves
	socket.on('end', function()
	{
		console.log('[Device] - %s disconnected', socket.name);

		clients.splice(clients.indexOf(socket), 1);
	});

	// only 1 client can connect at a time, this mimics the behavior of the Röst
	if (clients.length > 1)
	{
		socket.emit('error', new Error('ECONNREFUSED'));
	}
}).listen({
	host: '0.0.0.0',
	port: 50001
}, function()
{
	console.log('Device listening on: %s', this.address().port);
});