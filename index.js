var through = require('through2');
var bucklescript = require('bucklescript');
var gutil = require('gulp-util');
var applySourceMap = require('vinyl-sourcemaps-apply');
var path = require('path');
var merge = require('merge');

var PluginError = gutil.PluginError;

module.exports = function (opt) {
  function replaceExtension(path) {
    path = path.replace(/\.bucklescript\.md$/, '.litbucklescript');
    return gutil.replaceExtension(path, '.js');
  }

  function transform(file, enc, cb) {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new PluginError('gulp-bucklescript', 'Streaming not supported'));

    var data;
    var str = file.contents.toString('utf8');
    var dest = replaceExtension(file.path);

    var options = merge({
      bare: false,
      header: false,
      sourceMap: !!file.sourceMap,
      sourceRoot: false,
      literate: /\.(litbucklescript|bucklescript\.md)$/.test(file.path),
      filename: file.path,
      sourceFiles: [file.relative],
      generatedFile: replaceExtension(file.relative)
    }, opt);

    try {
      data = bucklescript.compile(str, options);
    } catch (err) {
      return cb(new PluginError('gulp-bucklescript', err));
    }

    if (data && data.v3SourceMap && file.sourceMap) {
      applySourceMap(file, data.v3SourceMap);
      file.contents = new Buffer(data.js);
    } else {
      file.contents = new Buffer(data);
    }

    file.path = dest;
    cb(null, file);
  }

  return through.obj(transform);
};
