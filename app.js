var fs = require('fs');
var url = require('url');
var childProcess = require('child_process');

var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var ejs = require('ejs');

var api = require('./app/middleware/api');
var proxy = require('./app/telnet/server');

var app = express();
app.config = require('./config/config');
app.cmd = require('./config/cmd');

app.use(compression({}));
app.use(favicon(__dirname + '/public/favicon.ico'));

app.set('views', __dirname + '/app/view');
app.set('view engine', 'ejs');
app.set('view cache', app.config.viewCache);
app.engine('ejs', function(template, locals, callback)
{
	ejs.renderFile(template, locals, {
		rmWhitespace: true,
		cache: app.config.ejsCache
	}, function(err, html)
	{
		callback(err, (html || '').replace(/\r\n|\r|\n/g, ''));
	});
});

/**
 * Initialize app.
 * @param {string} gitHash
 */
var init = function(gitHash)
{
	app.config.gitHash = gitHash;

	app.locals.env = app.config.env;
	app.locals.resourceRoot = gitHash + '/';

	if (app.config.env === 'dev')
	{
		app.locals.liveReloadPort = app.config.liveReloadPort;
		app.locals.resources = require('./app/resources');
	}
	else
	{
		app.locals.resources = {
			css: ['combined/combined.css'],
			js: ['combined/combined.js']
		};
	}

	app.use('/' + gitHash, express.static(__dirname + '/public', {
		maxAge: 3600 * 24 * 1000 * 14,
		setHeaders: function(res, path, stat)
		{
			res.setHeader('Access-Control-Allow-Origin', '*');
		}
	}));

	app.use('/api', api(app));

	app.get('/', function(req, res)
	{
		res.locals.basedir = url.format({
			protocol: req.protocol,
			host: req.get('host'),
			pathname: '/'
		});
		res.render('index');
	});

	app.use(function(req, res)
	{
		res.status(500).send('Server error');
	});

	// start telnet proxy server
	proxy(app.config, function(err)
	{
		if (err)
		{
			return console.error(err);
		}

		// start express server
		app.listen({
			host: app.config.host,
			port: app.config.port
		}, function()
		{
			console.log('App listening on: %d', this.address().port);
		});
	});
};

if (process.env.GIT_HASH)
{
	init(process.env.GIT_HASH);
}
else
{
	if (app.config.env === 'dev')
	{
		init('xQN04i26sn');
	}
	else
	{
		childProcess.exec('git rev-parse --short HEAD', function(err, stdout)
		{
			if (err)
			{
				return console.error(err);
			}

			init(stdout.toString().trim());
		});
	}
}
