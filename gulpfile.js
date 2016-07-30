var gulp = require('gulp'),
    debug = require('gulp-debug'),
    watch = require('gulp-watch'),
    babel = require('gulp-babel');

var jsLibs = [
    'bower_components/jquery/dist/jquery.min.js'
];

gulp.task('prepare', () =>
    jsLibs.forEach(f => {
        gulp.src(f)
            .pipe(debug({ title: 'prepare:' }))
            .pipe(gulp.dest('public/js'));
    })
);

gulp.task('watch-html', () => {
    return watch('src/**/*.html', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

gulp.task('watch-css', () => {
    return watch('src/**/*.css', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

gulp.task('watch-js', () => {
    return watch('src/**/*.js', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' })).pipe(babel())
        .pipe(gulp.dest('public'));
});

gulp.task('watch', ['watch-html', 'watch-css', 'watch-js']);
