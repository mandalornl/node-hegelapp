var fs = require('fs');
var _ = require('lodash');
var env = process.env.NODE_ENV || 'development';

var config = {
	global: {
		env: env,
		host: '0.0.0.0',
		port: process.env.PORT,

		liveReloadPort: null,

		jsVars: {
			updateInterval: 5000
		},

		device: {
			host: '0.0.0.0',
			port: 50001
		}
	},

	development: {
		port: 3000,

		liveReloadPort: 43921,

		viewCache: false,
		ejsCache: false
	},

	production: {
		viewCache: true,
		ejsCache: true
	}
};

var localCfg = {};
try
{
	var filename = __dirname + '/localcfg.js';
	fs.accessSync(filename);
	localCfg = require(filename);
}
catch (err)
{
	console.log('No local config found.');
}

module.exports = _.merge({}, config.global, config[env], localCfg);