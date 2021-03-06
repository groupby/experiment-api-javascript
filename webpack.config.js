const webpack     = require('webpack');
const packageJson = require('./package.json');

module.exports = {
  entry:   ['./lib/index.js'],
  output:  {
    filename: `${packageJson.name}-${packageJson.version}.js`
  },
  module:  {
    loaders: [
      {
        test:    /\.js$/,
        exclude: /node_modules/,
        loader:  'babel-loader'
      },
      {
        test:   /\.json$/,
        loader: 'json'
      }
    ]
  },
  plugins: [
    new webpack.optimize.DedupePlugin()
  ]
};