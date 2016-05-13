var gulp       = require('gulp');
var join       = require('path').join;
var rimraf     = require('rimraf');
var babel      = require('gulp-babel');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');
var literate   = require('gulp-literate2');

var PATH = {
	src  : 'src/',
	dest : 'build/'
};


gulp.task('clear', function (next) {
	rimraf(PATH.dest, next);
});


gulp.task('build-min', ['build-commonjs'], function () {
	var src = join(PATH.dest, 'Kristi.js');

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
		.pipe(source('Kristi.min.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(join(PATH.dest)));
});


gulp.task('build-commonjs', ['clear'], function () {
	var src = join(PATH.src, 'index.md');

	return gulp.src(src)
		.pipe(literate())
		.pipe(babel({
			presets: ['es2015', 'stage-0'],
			plugins: ['transform-es2015-modules-commonjs']
		}))
		.pipe(rename('Kristi.js'))
		.pipe(gulp.dest(PATH.dest));
});


//==================================================================//

gulp.task('watch', ['build-min'], function() {
	gulp.watch(join(PATH.src, '**/*.md'),   ['build-min']);
});

gulp.task('default', ['build-min']);
