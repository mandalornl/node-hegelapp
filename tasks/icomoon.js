/**
 * Example config.
 *
 * grunt.initConfig({
 * 	icomoon: {
 * 		options: {
 * 			files: [__dirname + '/public/assets/icomoon/style.css'],
 * 			dest: __dirname + '/sass/_icomoon.scss'
 * 			}
 * 	},
 * 	watch: {
 * 		icomoon: {
 * 			files: ['public/assets/icomoon/*.css'],
 * 			tasks: ['icomoon']
 * 		}
 * 	}
 * });
 *
 * Note: You have to manually add the destination file to your main sass file. And run the task before sass compiles.
 */

var css = require('css');

module.exports = function(grunt)
{
	grunt.registerTask('icomoon', 'Gather icomoon icons and assign to Sass variables', function()
	{
		var options = this.options();
		var output = '';

		options.files.filter(function(path)
		{
			if (!grunt.file.exists(path))
			{
				grunt.log.warn('File \'' + path + '\' not found. Skipping...');
				return false;
			}

			return true;
		}).forEach(function(path)
		{
			var c = css.parse(grunt.file.read(path));
			c.stylesheet.rules.forEach(function(rule)
			{
				if (rule.type === 'rule')
				{
					var matches = rule.selectors[0].match(/^\.((?:.+)?icon)-([^:]+):before$/);
					if (matches && matches[1] && matches[2])
					{
						output += '$' + matches[1] + '-' + matches[2] + ': ' + rule.declarations[0].value + ';\n';
					}
				}
			});
		});

		if (!output)
		{
			grunt.log.writeln('No icons found. Done!');
			return;
		}

		// create dir
		if (!grunt.file.exists(options.dest))
		{
			grunt.file.mkdir(options.dest.replace(/\/[^\/]+\.scss$/, ''));
		}

		grunt.file.write(options.dest, output);
		grunt.log.writeln('File \'' + options.dest + '\' created. Done!');
	});
};