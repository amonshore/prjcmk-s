const gulp = require('gulp'),
    debug = require('gulp-debug'),
    watch = require('gulp-watch'),
    del = require('del'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber');

const jsLibs = [
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/mustache.js/mustache.min.js',
    'bower_components/rxjs/dist/rx.lite.js',
    'bower_components/sweetalert/dist/sweetalert.min.js',
    'bower_components/jquery-qrcode/jquery.qrcode.min.js'
];
const cssLibs = [
    'bower_components/normalize-css/normalize.css',
    'bower_components/sweetalert/dist/sweetalert.css'
];

/**
 * Copia le librerie css nelle corrette cartelle pubbliche.
 */
gulp.task('prepare:js', () => {
    return gulp.src(jsLibs)
        .pipe(debug({ title: 'prepare js:' }))
        .pipe(gulp.dest('public/js'));
});

/**
 * Copia le librerie js nelle corrette cartelle pubbliche.
 */
gulp.task('prepare:css', () => {
    return gulp.src(cssLibs)
        .pipe(debug({ title: 'prepare css:' }))
        .pipe(gulp.dest('public/css'));
});

/**
 * Pulisce la cartella pubblica realtiva ai file js.
 */
gulp.task('clean:js', () => {
    return del('public/js/**/*');
});

/**
 * Pulisce la cartella pubblica realtiva ai file css.
 */
gulp.task('clean:css', () => {
    return del('public/css/**/*');
});

/**
 * Pulisce la cartella pubblica realtiva ai file html.
 */
gulp.task('clean:html', () => {
    return del('public/**/*.html');
});

/**
 * Se un file HTML viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch:html', () => {
    return watch('src/**/*.html', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file CSS viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch:css', () => {
    return watch('src/**/*.css', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file JS viene modificato, lo traduce con babel, quindi lo capia nella corretta cartella pubblica dopo.
 */
gulp.task('watch:js', () => {
    return watch('src/**/*.js', { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(plumber())
        .pipe(babel())
        .on('error', console.error.bind(console))
        .pipe(gulp.dest('public'));
});

gulp.task('watch', ['watch:html', 'watch:css', 'watch:js']);
gulp.task('prepare', ['prepare:js', 'prepare:css']);
gulp.task('clean', ['clean:js', 'clean:css', 'clean:html']);