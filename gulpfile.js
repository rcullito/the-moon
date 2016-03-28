var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var gulp = require('gulp');

gulp.task('lint', function() {
  return gulp.src('./routes/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});
