'use strict'

const assert = require('node:assert')

exports.sizes = function (max, sizes) {
  assert(Array.isArray(sizes))

  const sum = sizes.reduce(function (p, c) {
    return p + c
  }, 0)

  assert(sum > max)

  const ejecta = []
  const bcount = Math.ceil(sum / max)
  const target = sum / bcount

  while (true) {
    let n = 0
    let bsum = 0

    while (n < sizes.length && bsum < target && (bsum + sizes[n]) < max) {
      bsum += sizes[n]
      n += 1
    }

    if (n >= sizes.length) {
      break
    }

    ejecta.push(n)
    n += 1
  }

  return ejecta
}
