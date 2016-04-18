var gulp       = require('gulp');
var join       = require('path').join;
var rimraf     = require('rimraf');
var babel      = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var uglify     = require('gulp-uglify');
var literify   = require('literify');

var production = process.argv.indexOf('--production') !== -1;

var PATH = {
	src  : 'src/',
	dest : 'build/'
};


gulp.task('clear', function (next) {
	rimraf(PATH.dest, next);
});


gulp.task('build', ['clear'], function () {
	var src = join(PATH.src, 'index.md');

	return bundle(src, 'Kristi', 'Kristi.min.js')
		.pipe(uglify())
		.pipe(gulp.dest(join(PATH.dest)));
});


function bundle(src, globalName, fileName) {
	return browserify(src, {
			debug: true,
			extensions: ['.js', '.json', '.md'],
			standalone: globalName
		})
		.transform(literify)
		.transform('babelify', {
			extensions: ['.js', '.json', '.md'],
			presets: ['es2015', 'stage-0'],
			plugins: ['transform-es2015-modules-commonjs']
		})
		.bundle()
		.on('error', function(err) {
			console.log('----------------------------------');
			console.error(err);
			console.log('----------------------------------');

			this.emit('end');
		})
		.pipe(source(fileName))
		.pipe(buffer());
}


//==================================================================//

gulp.task('watch', ['build'], function() {
	gulp.watch(join(PATH.src, '**/*.md'),   ['build']);
});

gulp.task('default', ['build']);
