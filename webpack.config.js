const path = require('path');

const join = path.join.bind(path, __dirname);

const sources = ['lib', 'test'].map(dir => join(dir));

module.exports = {
  entry: [
    './test/index.js',
  ],
  output: {
    path: join('build'),
    filename: 'spec.js',
    publicPath: '/build/',
  },
  resolve: {
    extensions: ['', '.js', '.scss'],
  },
  externals: {
    chai: 'commonjs chai',
  },
  resolveLoader: {
    alias: {
      'premodules-parse': join('./index.js?parse'),
      'premodules-restore': join('./index.js?restore'),
    },
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: sources,
    }, {
      test: /\.scss/,
      include: sources,
      loaders: [
        'premodules-restore',
        'css?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
        'postcss',
        'sass',
        'premodules-parse',
      ],
    }],
  },
};
