var gulp = require('gulp'),
    debug = require('gulp-debug'),
    watch = require('gulp-watch'),
    babel = require('gulp-babel');

var jsLibs = [
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/mustache.js/mustache.min.js',
    'bower_components/rxjs/dist/rx.lite.js',
    'bower_components/sweetalert/dist/sweetalert.min.js'
];
var cssLibs = [
    'bower_components/normalize-css/normalize.css',
    'bower_components/sweetalert/dist/sweetalert.css'
];

/**
 * Copia le librerie js e css nelle corrette cartelle pubbliche.
 */
gulp.task('prepare', () => {
    jsLibs.forEach(f => {
        gulp.src(f)
            .pipe(debug({ title: 'prepare:' }))
            .pipe(gulp.dest('public/js'));
    });
    cssLibs.forEach(f => {
        gulp.src(f)
            .pipe(debug({ title: 'prepare:' }))
            .pipe(gulp.dest('public/css'));
    });
});

/**
 * Se un file HTML viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch-html', () => {
    return watch('src/**/*.html', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file CSS viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch-css', () => {
    return watch('src/**/*.css', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file JS viene modificato, lo traduce con babel, quindi lo capia nella corretta cartella pubblica dopo.
 */
gulp.task('watch-js', () => {
    return watch('src/**/*.js', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(babel())
        .on('error', console.error.bind(console))
        .pipe(gulp.dest('public'));
});

gulp.task('watch', ['watch-html', 'watch-css', 'watch-js']);
