'use strict'

const test = require('ava').default

const Entry = require('../lib/entry')

test('constructs icon location records', (t) => {
  const entry = Entry.construct('My App.app', 'Iloc', { x: 140, y: 120 })

  t.is(entry.filename, 'My App.app')
  t.is(entry.structureId, 'Iloc')
  t.is(entry.length(), entry.buffer.length)

  const filenameLength = entry.buffer.readUInt32BE(0)
  const recordOffset = 4 + (filenameLength * 2)

  t.is(entry.buffer.subarray(recordOffset, recordOffset + 4).toString('ascii'), 'Iloc')
  t.is(entry.buffer.subarray(recordOffset + 4, recordOffset + 8).toString('ascii'), 'blob')
  t.is(entry.buffer.readUInt32BE(recordOffset + 8), 16)
  t.is(entry.buffer.readUInt32BE(recordOffset + 12), 140)
  t.is(entry.buffer.readUInt32BE(recordOffset + 16), 120)
})

test('wraps binary plist records as Finder blobs', (t) => {
  const entry = Entry.construct('.', 'bwsp', {
    x: 100,
    y: 120,
    width: 640,
    height: 502
  })

  const blobOffset = 4 + (entry.filename.length * 2) + 8
  const blobLength = entry.buffer.readUInt32BE(blobOffset)

  t.is(entry.buffer.subarray(blobOffset + 4, blobOffset + 12).toString('ascii'), 'bplist00')
  t.is(blobLength, entry.buffer.length - blobOffset - 4)
})

test('fails early for missing required record options', (t) => {
  const err = t.throws(() => Entry.construct('.', 'vSrn', {}), { instanceOf: TypeError })

  t.is(err.message, 'Missing option: value')
})
