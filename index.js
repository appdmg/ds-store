'use strict'

const assert = require('node:assert')
const util = require('node:util')
const alias = require('@appdmg/macos-alias')

const Entry = require('./lib/entry')
const DSStore = require('./lib/ds-store')

function Helper () {
  this.file = new DSStore()
  this.opts = {
    window: { x: 100, y: 100 }
  }
}

Helper.prototype.setBackgroundPath = function (path, options) {
  this.opts.backgroundPath = path
  this.opts.backgroundAliasOptions = options
}

Helper.prototype.setBackgroundColor = function (red, green, blue) {
  this.opts.backgroundColor = [red, green, blue]
}

Helper.prototype.setIconSize = function (size) {
  this.opts.iconSize = size
}

Helper.prototype.setIconPos = function (name, x, y) {
  this.file.push(Entry.construct(name, 'Iloc', { x: x, y: y }))
}

Helper.prototype.setWindowPos = function (x, y) {
  this.opts.window.x = x
  this.opts.window.y = y
}

Helper.prototype.setWindowSize = function (w, h) {
  this.opts.window.width = w
  this.opts.window.height = h + 22
}

Helper.prototype.vSrn = function (value) {
  assert(value === 0 || value === 1)
  this.file.push(Entry.construct('.', 'vSrn', { value: value }))
}

Helper.prototype.write = function (path, cb) {
  const promise = writeHelper(this, path)

  if (typeof cb === 'function') {
    promise.then(function () {
      cb(null)
    }, cb)
    return
  }

  return promise
}

async function writeHelper (helper, path) {
  let rawAlias
  let colorComponents

  if (helper.opts.backgroundPath) {
    rawAlias = alias.create(helper.opts.backgroundPath, helper.opts.backgroundAliasOptions || {})
  }

  if (helper.opts.backgroundColor) {
    colorComponents = helper.opts.backgroundColor
  }

  helper.file.push(Entry.construct('.', 'bwsp', helper.opts.window))
  helper.file.push(Entry.construct('.', 'icvp', { iconSize: helper.opts.iconSize, rawAlias: rawAlias, colorComponents: colorComponents }))

  await helper.file.write(path)
}

/* Backwards compatibility */
Helper.prototype.setBackground = util.deprecate(
  Helper.prototype.setBackgroundPath,
  'setBackground is deprecated, please use setBackgroundPath'
)

module.exports = exports = Helper
