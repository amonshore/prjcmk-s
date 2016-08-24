const gulp = require('gulp'),
    debug = require('gulp-debug'),
    watch = require('gulp-watch'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    gutil = require('gulp-util'),
    ftp = require('gulp-ftp'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    sequence = require('gulp-sequence'),
    del = require('del'),
    conf = require('./gulpconf.json');

const jsLibs = [
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/mustache.js/mustache.min.js',
    'bower_components/rxjs/dist/rx.lite.js',
    'bower_components/sweetalert/dist/sweetalert.min.js',
    'bower_components/jquery-qrcode/jquery.qrcode.min.js',
    'bower_components/moment/min/moment-with-locales.min.js',
    'bower_components/underscore/underscore-min.js'
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
    return del(['public/**/*.html', 'public/**/*.mustache']);
});

/**
 * Pulisce la cartella pubblica realtiva ai file immagine.
 */
gulp.task('clean:img', () => {
    return del(['public/**/*.png', 'public/**/*.jpg', 'public/**/*.bmp']);
});

/**
 * Se un file HTML viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch:html', () => {
    return watch(['src/**/*.html', 'src/**/*.mustache'], { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file immagine viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch:img', () => {
    return watch(['src/**/*.png', 'src/**/*.jpg', 'src/**/*.bmp'], { ignoreInitial: false })
        .pipe(debug({ title: 'changed:' }))
        .pipe(gulp.dest('public'));
});

/**
 * Se un file CSS viene modificato lo capia nella corretta cartella pubblica.
 */
gulp.task('watch:css', () => {
    // return watch('src/**/*.css', { ignoreInitial: false })
    //     .pipe(debug({ title: 'changed:' }))
    //     .pipe(gulp.dest('public'));
    return gulp.watch('src/**/*.css', ['make:css'])
        .on('change', e => {
            gutil.log('changed:', gutil.colors.blue(e.path.split('/').pop()));
        });
});

/**
 * Se un file JS viene modificato, rilancia make:js
 */
gulp.task('watch:js', () => {
    return gulp.watch('src/**/*.js', ['make:js'])
        .on('change', e => {
            gutil.log('changed:', gutil.colors.blue(e.path.split('/').pop()));
        });
});

/**
 * Converte tutti i file JS, li concatena, minifica e copia nella cartella pubblica.
 * Viene copiata anche la mappa del file.
 */
gulp.task('make:js', () => {
    // main.js deve essere il primo file a essere elaborato
    return gulp.src(['src/js/main.js', 'src/**/*.js'])
        // evita che un errore blocchi l'intero processo
        .pipe(plumber())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(babel())
        // concatena i file e copia il risultato
        .pipe(concat('all.js'))
        .pipe(gulp.dest('public/js'))
        // minifica il file e copia
        .pipe(uglify())
        .pipe(rename('all.min.js'))
        // scrive la mappa 
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('public/js'));
});

/**
 * Concatena tutti i file CSS, minifica e copia nella cartella pubblica.
 * Viene copiata anche la mappa del file.
 */
gulp.task('make:css', () => {
    // default.css deve essere il primo file a essere elaborato
    return gulp.src(['src/css/default.css', 'src/**/*.css'])
        // evita che un errore blocchi l'intero processo
        .pipe(plumber())
        .pipe(sourcemaps.init({ loadMaps: true }))
        // concatena i file e copia il risultato
        .pipe(concat('all.css'))
        .pipe(gulp.dest('public/css'))
        // minifica il file e copia
        .pipe(cleanCSS())
        .pipe(rename('all.min.css'))
        // scrive la mappa 
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('public/css'));
});

/**
 * Invia i file al server via FTP.
 */
gulp.task('publish', () => {
    return gulp.src(['app.js', 'conf.json', 'public/**/*', 'controllers/**/*'], { base: '.' })
        .pipe(ftp(conf.ftp))
        .pipe(gutil.noop());
});

gulp.task('clean', ['clean:js', 'clean:css', 'clean:html', 'clean:img']);
gulp.task('prepare', ['prepare:js', 'prepare:css']);
gulp.task('watch', ['watch:html', 'watch:css', 'make:css', 'watch:js', 'make:js', 'watch:img']);

gulp.task('default', sequence('clean', 'prepare', 'watch'));
