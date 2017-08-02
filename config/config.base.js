const path = require('path');

module.exports = {
  entry: path.resolve('index.js'),
  output: {
    path: path.resolve('dist'),
    filename: 'app.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['jsx', 'js'],
  },
};
