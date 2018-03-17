
const BuildStatusPlugin = require('../../src/BuildStatusPlugin')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new BuildStatusPlugin(),
  ],
  target: 'node'
}
