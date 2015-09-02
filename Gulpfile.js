var gulp = require('gulp');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');
var clean = require('gulp-clean');

gulp.task('test', function() {
    return gulp.src('test/*.js')
        .pipe(mocha());
});

gulp.task('dist', function() {
    return gulp.src(['*.js', '!Gulpfile.js'])
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
    return gulp.src('dist/*.js')
        .pipe(clean());
});