const path = require('path');

module.exports = {
  entry: './src/js/core/Main.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'out.js',
  },
};