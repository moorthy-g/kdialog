module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		uglify: {
			options: {
				banner: "/*** <%= pkg.title %>"+" v<%= pkg.version %>\n"+
						"<%= pkg.description %>\n"+
						"email: <%= pkg.author.email %> ***/\n"
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
			production: {
				options: {
					cleancss: true
				},
				files: {	
						"style/kdialog.css" : "style/kdialog.less"
				 	}
			 }
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');

	//default task
	grunt.registerTask("default", ["uglify", "less"]);
	grunt.registerTask("lessc", ["less"]);
}