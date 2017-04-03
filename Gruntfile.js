var config = require('./config/config');
var resources = require('./app/resources');

module.exports = function(grunt)
{
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		sass: {
			options: {
				sourceMap: true,
				outputStyle: 'compressed',
				includePaths: [
					__dirname + '/node_modules/compass-mixins/lib',
					__dirname + '/node_modules/bootstrap-sass/assets/stylesheets'
				]
			},

			development: {
				files: [{
					expand: true,
					cwd: 'sass',
					src: ['**/*.scss'],
					dest: 'public/css',
					ext: '.css',
					extDot: 'last'
				}]
			},

			production: {
				files: [{
					expand: true,
					cwd: 'sass',
					src: ['**/*.scss'],
					dest: 'public/css',
					ext: '.css',
					extDot: 'last'
				}],

				options: {
					sourceMap: false
				}
			}
		},

		icomoon: {
			options: {
				files: [
					__dirname + '/public/assets/icomoon/style.css'
				],
				dest: __dirname + '/sass/_icomoon.scss'
			}
		},

		watch: {
			sass: {
				files: ['sass/**/*.scss'],
				tasks: ['sass:development'],
				options: {
					spawn: true
				}
			},

			icomoon: {
				files: ['public/assets/icomoon/style.css'],
				tasks: ['icomoon']
			},

			css: {
				files: ['public/css/**/*.css'],
				tasks: [],
				options: {
					livereload: config.liveReloadPort
				}
			},

			express: {
				files: [
					'app.js',
					'app/**/*.js',
					'config.js'
				],
				tasks: ['express:development'],
				options: {
					spawn: false,
					livereload: config.liveReloadPort
				}
			},

			views: {
				files: ['app/view/**/*.ejs'],
				options: {
					livereload: config.liveReloadPort
				}
			}
		},

		express: {
			options: {
				script: 'app.js',
				output: '^\[App\] - Listening on: \d+$'
			},

			development: {},

			production: {
				options: {
					node_env: 'production'
				}
			}
		},

		bower: {
			install: {
				options: {
					targetDir: 'public/assets/bower',
					cleanBowerDir: true,
					layout: 'byComponent'
				}
			}
		},

		uglify: {
			production: {
				files: {
					'public/combined/combined.js': resources.js.map(function(resource)
					{
						return __dirname + '/public/' + resource;
					})
				}
			}
		},

		cssmin: {
			options: {
				rebase: true,
				keepSpecialComments: 0,
				relativeTo: 'public/combined'
			},

			production: {
				files: {
					'public/combined/combined.css': resources.css.map(function(resource)
					{
						return __dirname + '/public/' + resource;
					})
				}
			}
		}
	});

	grunt.file.expand({
		filter: 'isFile'
	}, [
		'./tasks/**/*.js'
	]).forEach(function(path)
	{
		grunt.log.writeln('>> loading & registering: ' + path);
		require(path)(grunt);
	});

	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-bower-task');
	grunt.loadNpmTasks('grunt-express-server');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', ['bower', 'icomoon', 'sass:development', 'express:development', 'watch']);
	grunt.registerTask('build', ['bower', 'icomoon', 'sass:production', 'uglify', 'cssmin']);
	grunt.registerTask('development', ['express:development']);
	grunt.registerTask('production', ['express:production']);
};
