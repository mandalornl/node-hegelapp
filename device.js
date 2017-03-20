var net = require('net');
var cmd = require('./config/cmd');

var clients = [];

var device = {
	power: (function()
	{
		var power = 1;
		return {
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
				return (power = power === 1 ? 0 : 1);
			},

			status: function()
			{
				return power;
			}
		};
	})(),
	volume: (function()
	{
		var volume = 20;
		return  {
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
		};
	})(),
	mute: (function()
	{
		var mute = 0;
		return {
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
				return (mute = mute === 1 ? 0 : 1);
			},

			status: function()
			{
				return mute;
			}
		};
	})(),
	input: (function()
	{
		var input = 4;
		return {
			set: function(value)
			{
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
		};
	})(),

	reset: (function()
	{
		var reset = 2;
		return {
			set: function(value)
			{
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
		};
	})()
};

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
				return socket.write('-v.' + device.volume.up() + '\r');
			case cmd.volume.down:
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
		console.log(err);

		socket.end();
	});

	// remove client from list when it leaves
	socket.on('end', function()
	{
		console.log('[Device] - %s disconnected', socket.name);

		clients.splice(clients.indexOf(socket), 1);
	});
}).listen({
	host: '0.0.0.0',
	port: 50001
}, function()
{
	console.log('Device listening on: %s', this.address().port);
});