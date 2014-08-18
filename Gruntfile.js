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
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

	//default task
	grunt.registerTask("default", ["uglify"]);
}