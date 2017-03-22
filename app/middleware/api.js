var router = require('express').Router();
var client = require('../proxy/client');

module.exports = function(app)
{
	var connection = client(app);

	/**
	 * Get command. Throw error when no proper command was found.
	 * @param {string} type
	 * @param {string} method
	 * @param {Number} [value]
	 * @returns {string}
	 * @throws
	 */
	var getCommand = function(type, method, value)
	{
		if (!app.cmd[type] || !app.cmd[type][method])
		{
			throw 'Command \'/api/' + type + '/' + method + '\' not found';
		}

		if (value)
		{
			if (method !== 'set')
			{
				throw 'Use \'set\' command to update value. Ex: \'/api/' + type + '/set/:value';
			}

			if (isNaN(value))
			{
				throw 'Value has to be of type Number, ' + (typeof value) + ' given';
			}

			return app.cmd[type][method].replace('<int>', Number(value));
		}

		return app.cmd[type][method];
	};

	router.get('/:type/:method/:value?', function(req, res)
	{
		try
		{
			var cmd = getCommand(
				req.params.type,
				req.params.method,
				req.params.value
			);
		}
		catch (err)
		{
			return res.json({
				err: err.toString()
			});
		}

		connection.call(cmd, function(err, data)
		{
			res.json({
				err: err,
				data: data || null
			});
		});
	});

	router.get('/statuses', function(req, res)
	{
		connection.call([
			app.cmd.power.status,
			app.cmd.mute.status,
			app.cmd.volume.status,
			app.cmd.input.status
			//app.cmd.reset.status
		], function(err, statuses)
		{
			res.json({
				err: err,
				data: statuses || null
			});
		});
	});

	router.get('/', function(req, res)
	{
		res.json({
			err: null,
			data: null
		});
	});

	return router;
};
