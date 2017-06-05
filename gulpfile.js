const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const rsync = require('gulp-rsync');
const sequence = require('run-sequence');
const zip = require('gulp-zip');
const pages = require('gulp-gh-pages');
const livereload = require('gulp-livereload');
const server = require('gulp-server-livereload');

gulp.task('prepare', () => {

	const shower = gulp.src([
			'**',
			'!docs{,/**}',
			'!node_modules{,/**}',
			'!prepared{,/**}',
			'!CONTRIBUTING.md',
			'!LICENSE.md',
			'!README.md',
			'!gulpfile.js',
			'!package.json',
			'!package-lock.json',
		])
		.pipe(replace(
			/(<link rel="stylesheet" href=")(node_modules\/shower-)([^\/]*)\/(.*\.css">)/g,
			'$1shower/themes/$3/$4', { skipBinary: true }
		))
		.pipe(replace(
			/(<script src=")(node_modules\/shower-core\/)(shower.min.js"><\/script>)/g,
			'$1shower/$3', { skipBinary: true }
		));

	const core = gulp.src([
			'shower.min.js'
		], {
			cwd: 'node_modules/shower-core'
		})
		.pipe(rename( (path) => {
			path.dirname = 'shower/' + path.dirname;
		}));

	const lokijs = gulp.src([
			'lokijs.min.js'
		], {
			cwd: 'node_modules/lokijs/build'
		})
		.pipe(rename( (path) => {
			path.dirname = 'lokijs/' + path.dirname;
		}));

	const material = gulp.src([
			'**', '!package.json'
		], {
			cwd: 'node_modules/shower-material'
		})
		.pipe(rename( (path) => {
			path.dirname = 'shower/themes/material/' + path.dirname;
		}))

	const ribbon = gulp.src([
			'**', '!package.json'
		], {
			cwd: 'node_modules/shower-ribbon'
		})
		.pipe(rename( (path) => {
			path.dirname = 'shower/themes/ribbon/' + path.dirname;
		}));

	const themes = merge(material, ribbon)
		.pipe(replace(
			/(<script src=")(\/shower-core\/)(shower.min.js"><\/script>)/,
			'$1../../$3', { skipBinary: true }
		));

	return merge(shower, core, themes, lokijs)
		.pipe(gulp.dest('prepared'))
		.pipe(livereload());

});

gulp.task('zip', () => {
	return gulp.src('prepared/**')
		.pipe(zip('archive.zip'))
		.pipe(gulp.dest('.'));
});

gulp.task('upload', () => {
	return gulp.src('prepared/**')
		.pipe(pages())
});

gulp.task('archive', (callback) => {
	sequence(
		'prepare',
		'zip',
		'clean', callback
	)
});

gulp.task('publish', (callback) => {
	sequence(
		'prepare',
		'upload',
		'clean', callback
	)
});

gulp.task('clean', () => {
	return del('prepared/**');
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('index.html', ['prepare']);
});

gulp.task('serve', ['watch'], function(){
	 return gulp.src('./prepared')
				.pipe(server({
					livereload: true,
					directoryListing: false,
					open: true
				}));
});

gulp.task('default', ['prepare']);
