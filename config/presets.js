var fs = require('fs');
var _ = require('lodash');
var cmd = require('./cmd');

var presets = [];

try
{
	var data = JSON.parse(fs.readFileSync(__dirname + '/local/presets.json'));
	presets = _.each(data, function(preset)
	{
		var cmds = [];
		_.each(preset.cmds, function(value, key)
		{
			if (!cmd[key])
			{
				return;
			}

			cmds.push(cmd[key].set.replace('<int>', value));
		});

		preset.cmds = cmds;
	});
}
catch (err)
{
	console.log('No presets found');
}

module.exports = presets;