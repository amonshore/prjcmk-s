var gulp = require('gulp');
var jsList = [
    'bower_components/jquery/dist/jquery.min.js'
];

gulp.task('prepare', function() {
    jsList.forEach(f => {
        gulp.src(f).pipe(gulp.dest('public/js'));
    })
});
