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
			
			dev: {
				files: [{
					expand: true,
					cwd: 'sass',
					src: ['**/*.scss'],
					dest: 'public/css',
					ext: '.css',
					extDot: 'last'
				}]
			},

			prod: {
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
				tasks: ['sass:dev'],
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
				tasks: ['express:dev'],
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
				script: 'app.js'
			},

			dev: {},

			prod: {
				options: {
					NODE_ENV: 'prod'
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
			dist: {
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
				keepSpecialComments: false,
				relativeTo: 'public/combined'
			},
			
			dist: {
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
	
	grunt.registerTask('default', ['bower', 'icomoon', 'sass:dev', 'express:dev', 'watch']);
	grunt.registerTask('prod', ['bower', 'sass:prod', 'uglify', 'cssmin', 'express:prod']);
};