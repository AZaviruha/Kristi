var gulp       = require('gulp');
var join       = require('path').join;
var rimraf     = require('rimraf');
var babel      = require('gulp-babel');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');
// var literate   = require('gulp-literate2');

var PATH = {
	src  : 'src/',
	dest : 'build/'
};


gulp.task('clear', function (next) {
	rimraf(PATH.dest, next);
});


gulp.task('build', function () {
	var src = join(PATH.src, 'index.js');

	return browserify(src, {
			debug: true,
			standalone: 'Kristi'
		})
		.transform('babelify', {
			presets: ['es2015', 'stage-0'],
			plugins: ['transform-es2015-modules-commonjs']
		})
		.bundle()
		.on('error', function(err) {
			console.error(err);
			this.emit('end');
		})
		.pipe(source('Kristi.js'))
		.pipe(buffer())
		// .pipe(uglify())
		.pipe(gulp.dest(join(PATH.dest)));
});


//==================================================================//

gulp.task('watch', ['build'], function() {
	gulp.watch(join(PATH.src, '**/*.js'),   ['build']);
});

gulp.task('default', ['build']);
