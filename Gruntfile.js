module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		uglify: {
			options: {
				banner: "/*** <%= pkg.title %>"+" v<%= pkg.version %>\n"+
						"<%= pkg.description %>\n"+
						"repo => <%= pkg.repository.url %>\n"+
						"email => <%= pkg.author.email %> ***/\n"
			},
			minified: {
				options: {
					compress: {
						drop_console: true
					}
				},
				files: {
					"dist/<%= pkg.name %>.min.js" : "js/kdialog.js"
				}
			}
		},
		less: {
			dev: {
				options: {
					cleancss: false
				},
				files: {
					"style/kdialog.css" : "style/kdialog.less"
			 	}
			},
			prod: {
				options: {
					cleancss: true
				},
				files: {
					"dist/kdialog.css" : "style/kdialog.less"
			 	}
			}
		},
		autoprefixer: {
			options: {
				browsers: ['chrome > 10', 'firefox > 10', 'ie > 7', 'android > 2', 'ios > 5' ]
			},
			dev : {
			    src: 'style/kdialog.css'
			},
			prod : {
			    src: 'dist/kdialog.css'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-autoprefixer');

	//default task
	grunt.registerTask("default", ["uglify", "less", "autoprefixer"]);
	grunt.registerTask("lessc", ["less"]);
}