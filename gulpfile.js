/*eslint no-console: "off" */
const gulp     = require('gulp');
const mocha    = require('gulp-mocha');
const eslint   = require('gulp-eslint');
const istanbul = require('gulp-istanbul');
const gulpIf   = require('gulp-if');

const nodeExternals = require('webpack-node-externals');
const path          = require('path');
const webpack       = require('webpack');
const webpackStream = require('webpack-stream');
const packageJson   = require('./package.json');
const webpackConfig = require('./webpack.config');
// const exec          = require('gulp-exec');

gulp.task('build:minify', () => {
  const minConfig = Object.assign({}, webpackConfig, {
    output:  {filename: `${packageJson.name }-${ packageJson.version }.min.js`},
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  });

  return gulp.src('lib/index.js')
    .pipe(webpackStream(minConfig))
    .pipe(gulp.dest('dist'));
});

gulp.task('build:normal', () => gulp.src('lib/index.js')
  .pipe(webpackStream(webpackConfig))
  .pipe(gulp.dest('dist')));

gulp.task('build:bin', () => gulp.src('lib/index.js')
  .pipe(webpackStream(Object.assign({}, webpackConfig, {
    output:    {
      filename:      'lib.js',
      libraryTarget: 'commonjs2'
    },
    target:    'node',
    externals: [nodeExternals()]
  })))
  .pipe(gulp.dest('bin')));

gulp.task('build', [
  'build:bin',
  'build:normal',
  'build:minify'
]);

const isFixed = (file) => {
  // Has ESLint fixed the file contents?
  return file.eslint != null && file.eslint.fixed;
};

gulp.task('test:dirty', () => {
  return gulp.src('tests/**/*.spec.js')
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('pre-test', () => {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test:coverage', ['pre-test'], () => {
  return gulp.src(['tests/**/*.spec.js'])
    .pipe(mocha({reporter: 'spec'}))
    .once('error', () => {
      console.error('tests failed');
      process.exit(1);
    })
    .pipe(istanbul.writeReports({
      reporters: [
        'text',
        'html',
        'lcov'
      ]
    }))
    .pipe(istanbul.enforceThresholds({
      thresholds: {
        lines:      90,
        branches:   70,
        functions:  95,
        statements: 90
      }
    }))
    .once('error', () => {
      console.error('coverage failed');
      process.exit(1);
    });
});

const lint = () => {
  return gulp.src([
    'lib/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!ui/**'
  ])
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .once('error', () => {
      console.error('lint failed');
      process.exit(1);
    })
    .pipe(gulpIf(isFixed, gulp.dest('.')))
    .once('end', () => {
      process.exit();
    });
};

gulp.task('test:lint', ['test:coverage'], () => {
  return lint();
});

gulp.task('lint', () => {
  return lint();
});

gulp.task('test', ['test:lint']);
