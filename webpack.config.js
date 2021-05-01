const path = require('path');

module.exports = {
  entry: './src/js/debug.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'out.js',
  },
};