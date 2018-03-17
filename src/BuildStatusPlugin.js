
const Progress = require('webpack/lib/ProgressPlugin')
// const { columns: width, rows: height } = getTerminalSize()

const chalk           = require('chalk')
const log             = require('log-update')
const getTerminalSize = require('term-size')
const clearConsole    = require('react-dev-utils/clearConsole')
const parseMessages   = require('react-dev-utils/formatWebpackMessages')

const defaultOptions = {
  colors: {
    build:   [ '#4f4ced', '#7f56f2', '#4953cc' ],
    success: '#6ee79a',
    warning: '#e27c43',
    error:   '#f41658',
    info:    '#38dabd',
  },
  icons: {
    success: '\u2600',
  }
}

module.exports = class BuildStatusPlugin {


  constructor (options = {}) {
    let icons    = Object.assign({}, defaultOptions.icons,  options.icons)
    let colors   = Object.assign({}, defaultOptions.colors, options.colors)
    this.options = Object.assign({}, options, { colors, icons })
  }

  apply (compiler) {

    const handler = this.handleProgress.bind(this)

    new Progress({ handler }).apply(compiler)

    if (compiler.hooks) {
      compiler.hooks.invalid.tap('build-status-plugin', this.handleUpdate.bind(this))
      compiler.hooks.done.tap('build-status-plugin', this.onDidFinish.bind(this))
    }
    else {
      compiler.plugin('invalid',  this.handleUpdate.bind(this))
      compiler.plugin('done',     this.onDidFinish.bind(this))
    }
    log.clear()
    // clearConsole()
  }


  handleProgress (progress, message) {
    const color = this.getProperty('colors', 'build')
    const value = Math.round(progress * 100, 1)
    const output = [
      chalk.hex(color[0])(`${value}%`),
      chalk.hex(color[1])("\u2698 Building"),
      chalk.hex(color[2])(message)
    ]
    this.display(output)
  }


  handleSuccess () {
    let color = this.getProperty('colors', 'success')
    let icon  = this.getProperty('icons', 'success')
    this.display([ chalk.bgHex(color).black(` ${icon} DONE `) ])
  }


  handleWarnings (messages) {
    let color = this.getProperty('colors', 'warning')
    let rows  = parseMessageOutput(messages, 'warnings')
    this.display(rows.map(row => chalk.hex(color)(row)))
  }


  handleErrors (messages) {
    let color = this.getProperty('colors', 'error')
    let rows  = parseMessageOutput(messages, 'errors')
    this.display(rows.map(row => chalk.hex(color)(row)))
  }


  handleUpdate () {
    let color = this.getProperty('colors', 'info')
    this.display([ chalk.bgHex(color)(" UPDATE ") ])
  }


  onDidFinish (stats) {
    const messages = stats.toJson({}, true)

    if (stats.hasErrors())
      return this.handleErrors(messages)

    if (stats.hasWarnings())
      return this.handleWarnings(messages)

    return this.handleSuccess()
  }


  // TODO
  // eslint-disable-next-line class-methods-use-this
  updateConfig (params) {
    Object.assign(params.options, { stats: 'verbose' })
    return params
  }


  getProperty (...descriptor) {
    let prop = this.options
    while (descriptor.length)
      prop = prop[descriptor.shift()] || {}
    return Object.assign({}, { value: prop }).value
  }

  // eslint-disable-next-line class-methods-use-this
  display (chunks) {
    if (!chunks || !chunks.length)
      return

    const lines = []
    const { columns: width, rows: height } = getTerminalSize()

    if (chunks.length <= 3)
      for (let text of chunks)
        lines.push(getHorizontalPad(text, width) + text)
    else
      lines.splice(0, 0, ...chunks.map(line => "  " + line))

    const vertical = getVerticalPad(lines, height)
    const output   = vertical.concat(lines).concat(vertical).join('\n')

    log(output)
  }

}


const getHorizontalPad = (line, width) => Array(
  Math.max(
    Math.floor(width / 2 - line.replace(/[^\w\d\s]/g, '').length / 2),
    1))
  .fill(' ')
  .join('')


const getVerticalPad = (lines, height) => Array(
  Math.max(
    Math.floor(height / 2) -
    Math.ceil(lines.length / 2),
    1))
  .fill('')


const parseMessageOutput = (messages, type) =>
  parseMessages(messages)[type]
    .reduce((stream, message) => stream.concat(message.split('\n')), [])
    .map(row => row.replace(/^\|\s?(.*)/g, (_, c) => '    ⋮ ' + c))
