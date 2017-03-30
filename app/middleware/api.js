var router = require('express').Router();
var Client = require('../proxy/client');

module.exports = function(app)
{
	var client = Client(app);

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

	router.get('/statuses', function(req, res)
	{
		client.call([
			app.cmd.power.status,
			app.cmd.mute.status,
			app.cmd.volume.status,
			app.cmd.input.status
			//app.cmd.reset.status
		], function(err, statuses)
		{
			res.json({
				err: err,
				data: statuses || {}
			});
		});
	});

	router.get('/preset/:index', function(req, res)
	{
		try
		{
			client.call(app.presets[req.params.index].cmds, function(err, statuses)
			{
				res.json({
					err: err,
					data: statuses || {}
				});
			});
		}
		catch (err)
		{
			res.json({
				err: 'Preset not found'
			});
		}
	});

	router.get('/:type/:method/:value?', function(req, res)
	{
		try
		{
			client.call(getCommand(
				req.params.type,
				req.params.method,
				req.params.value
			), function(err, data)
			{
				res.json({
					err: err,
					data: data
				});
			});
		}
		catch (err)
		{
			res.json({
				err: 'Command not found'
			});
		}
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