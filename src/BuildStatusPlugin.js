
const Progress        = require('webpack/lib/ProgressPlugin')
const chalk           = require('chalk')
const log             = require('log-update')
const len             = require('string-length')
const getTerminalSize = require('term-size')
const clearConsole    = require('react-dev-utils/clearConsole')
const parseMessages   = require('react-dev-utils/formatWebpackMessages')

const { min, max, floor, ceil, round } = Math
const format = process.stdout.isTTY

let lastUpdate = Date.now()

const SUCCESS_COLOR = '#57b1e4'
const WARNING_COLOR = '#e27c43'
const ERROR_COLOR   = '#f41658'
const INFO_COLOR    = '#38dabd'
const EMPTY_COLOR   = '#4953cc'

const defaultOptions = {

  updateThreshold: 500,

  colors: {
    build:   [
      SUCCESS_COLOR,
      INFO_COLOR,
      EMPTY_COLOR,
    ],
    success: SUCCESS_COLOR,
    warning: WARNING_COLOR,
    error:   ERROR_COLOR,
    info:    INFO_COLOR,
  },

  icons: {
    success: '\u2600',
    update:  '\u21b3',
    build:   '\u21bb',
  },

  progressBar: {
    visible: true,
    fractions: 40,
    symbols: {
      filled: '\u2588',
      empty:  '\u2588',
      start:  '\u2595',
      end:    '\u258f',
    },
    colors: {
      filled: SUCCESS_COLOR,
      empty:  EMPTY_COLOR,
    }
  }
}


module.exports = class BuildStatusPlugin {


  constructor (options = {}) {
    let icons       = Object.assign({}, defaultOptions.icons,  options.icons)
    let colors      = Object.assign({}, defaultOptions.colors, options.colors)
    let progressBar = Object.assign({}, defaultOptions.progressBar, options.progressBar)
    this.options    = Object.assign({}, defaultOptions, options, { colors, icons, progressBar })
  }

  apply (compiler) {

    const handler = this.handleProgress.bind(this)

    if (compiler.hooks) {
      new Progress(handler).apply(compiler)
      compiler.hooks.invalid.tap('build-status-plugin', this.handleUpdate.bind(this))
      compiler.hooks.done.tap('build-status-plugin', this.onDidFinish.bind(this))
    }
    else {
      compiler.apply(new Progress(handler))
      compiler.plugin('invalid',  this.handleUpdate.bind(this))
      compiler.plugin('done',     this.onDidFinish.bind(this))
    }

    log.clear()
    // clearConsole()
  }


  handleProgress (progress, message) {
    const color       = this.getProperty('colors', 'build')
    const icon        = this.getProperty('icons', 'build')
    const progressBar = this.getProperty('progressBar')
    const value       = progress * 100

    const output      = [
      chalk.hex(color[0])(`${round(value, 1)}%`),
      chalk.hex(color[1])(`${icon} Building`),
      chalk.hex(color[2])(message)
    ]

    if (progressBar.visible)
      output.splice(0, 0, drawProgressBar(progress, progressBar), '')

    this.display(output)
  }


  handleSuccess () {
    lastUpdate = 0
    let color  = this.getProperty('colors', 'success')
    let icon   = this.getProperty('icons', 'success')
    this.display([ inverse(` ${icon} DONE `, color, true) ])
  }


  handleWarnings (messages) {
    lastUpdate = 0
    let color  = this.getProperty('colors', 'warning')
    let rows   = parseMessageOutput(messages, 'warnings')
    this.display(rows.map(row => colored(row, color)))
  }


  handleErrors (messages) {
    lastUpdate = 0
    let color  = this.getProperty('colors', 'error')
    let rows   = parseMessageOutput(messages, 'errors')
    this.display(rows.map(row => colored(row, color)))
  }


  handleUpdate () {
    let color = this.getProperty('colors', 'info')
    let icon  = this.getProperty('icons', 'update')
    this.display([ inverse(` ${icon} UPDATE `, color) ])
    lastUpdate = lastUpdate + 2500
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

    const time            = Date.now()
    const diff            = time - lastUpdate
    const updateThreshold = this.getProperty('updateThreshold')
    if (time - lastUpdate < updateThreshold)
      return

    lastUpdate  = time
    const lines = []
    const { columns: width, rows: height } = getTerminalSize()

    if (chunks.length <= 5)
      for (let text of chunks)
        lines.push(format
          ? getHorizontalPad(text, width) + text
          : text)

    else
      lines.splice(0, 0, ...chunks.map(line => "  " + line))

    const vertical = getVerticalPad(lines, height)
    const output   = join('\n', vertical, lines, vertical)

    draw(output)
  }

}


const drawProgressBar = (current, options) => {
  const o      = options.symbols.filled
  const x      = options.symbols.empty
  const s      = options.symbols.start
  const e      = options.symbols.end
  const colors = options.colors

  const width  = min(options.fractions, getTerminalSize().columns - 4)
  const filled = round(current * width)
  const empty  = width - filled

  const oString = join(arrayOf(filled, o))
  const xString = join(arrayOf(empty, x))

  return [
    colored(s + oString, colors.filled),
    colored(xString + e, colors.empty),
  ].join('')
}


const getHorizontalPad = (line, width) => join(format
  ? arrayOf(max(1, floor(width / 2 - len(line) / 2)), ' ') : [])


const getVerticalPad = (lines, height) => format
  ? arrayOf(max(1, floor(height / 2) - ceil(lines.length / 2)), '') : []


const parseMessageOutput = (messages, type) =>
  parseMessages(messages)[type]
    .reduce((stream, message) => stream.concat(message.split('\n')), [])
    .map(row => row.replace(/^\|\s?(.*)/g, (_, c) => '    ⋮ ' + c))


const join = (...fragments) => {
  const delim = typeof fragments[0] === 'string' ? fragments.shift() : ''
  return fragments
    .reduce((arr, current) => arr.concat(current), [])
    .join(delim)
}


const inverse = (str, col) =>
  chalk.bgHex(col).black(str)


const colored = (str, col) =>
  chalk.hex(col)(str)


const arrayOf = (length, fill) =>
  Array(length).fill(fill)


const draw = (lines) => log(lines)
