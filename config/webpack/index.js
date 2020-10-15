const { resolve } = require('path')
const BuildStatusPlugin = require('../../src/BuildStatusPlugin')

module.exports = {
  devtool: 'inline-source-map',
  entry: resolve(__dirname, '../../src/index.js'),
  output: {
    path:       resolve(__dirname, '../../dist'),
    filename: 'app.js',
    publicPath: '/',
  },
  plugins: [
    new BuildStatusPlugin(),
  ],
  target: 'node'
}
