const path = require('path');

module.exports = {
  entry: './src/js/core/Main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'out.js',
  },
};