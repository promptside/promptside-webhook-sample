//
// Requires
//

const gulp = require('gulp');

const chmod = require('gulp-chmod');
const shell = require('gulp-shell');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const util = require('gulp-util');


//
// Constants
//

const RELEASE_MODE = 'production' in util.env;
const TS_INPUTS = ['src/**/*.ts'];
const DEST = 'dist';
const SOURCEMAPS = 'sourcemaps';


//
// Definitions
//

/**
 * Holds TypeScript compiler state for gulp-typescript.
 */
var tsProject = ts.createProject('tsconfig.json');


//
// Tasks
//

gulp.task('ts', function () {
    var tsResult = gulp.src(TS_INPUTS)
        .pipe(RELEASE_MODE ? util.noop() : sourcemaps.init())
        .pipe(tsProject());
    return tsResult.js
        .pipe(RELEASE_MODE ? util.noop() : sourcemaps.write(SOURCEMAPS))
        .pipe(chmod(0o755))
        .pipe(gulp.dest(DEST));
});

gulp.task('watch', ['ts'], function () {
    gulp.watch(TS_INPUTS, ['ts']);
});

gulp.task('clean', shell.task([
    'rm -Rf '+DEST
]));

gulp.task('default', ['ts']);
