'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const test = require('ava').default

const DSStore = require('../')

const GENERATED_COLOR_SHA256 = '8df681c341464ee89409056b62c892e2fd9f45f03ac9e35a6e681a3b743ff963'

test('writes appdmg Finder metadata as stable DS_Store bytes', async (t) => {
  const filePath = await createTempPath(t)
  const store = createSampleStore()

  await store.write(filePath)

  const buf = await fs.readFile(filePath)
  const entries = readEntries(buf)

  t.is(buf.length, 15364)
  t.is(buf.readUInt32BE(76), 5)
  t.is(sha256(buf), GENERATED_COLOR_SHA256)
  t.deepEqual(entries.map((entry) => [entry.filename, entry.structureId, entry.dataType]), [
    ['.', 'bwsp', 'blob'],
    ['.', 'icvp', 'blob'],
    ['.', 'vSrn', 'long'],
    ['Applications', 'Iloc', 'blob'],
    ['My App.app', 'Iloc', 'blob']
  ])

  const appIcon = entries.find((entry) => entry.filename === 'My App.app')
  t.is(appIcon.blob.readUInt32BE(0), 16)
  t.is(appIcon.blob.readUInt32BE(4), 140)
  t.is(appIcon.blob.readUInt32BE(8), 120)
  t.deepEqual(appIcon.blob.subarray(12, 16), Buffer.from('ffffff00', 'hex'))
})

test('write keeps the callback API for existing callers', async (t) => {
  const filePath = await createTempPath(t)
  const store = createSampleStore()

  const callbackFinished = new Promise((resolve, reject) => {
    const result = store.write(filePath, (err) => {
      if (err) {
        reject(err)
        return
      }

      resolve(result)
    })

    t.is(result, undefined)
  })

  await callbackFinished
  await eventually(async () => {
    t.is((await fs.stat(filePath)).isFile(), true)
  })
})

test('background image aliases can be written with explicit non-Darwin volume metadata', async (t) => {
  const tmpDir = await createTempDir(t)
  const backgroundPath = path.join(tmpDir, 'background.png')
  const storePath = path.join(tmpDir, '.DS_Store')

  await fs.writeFile(backgroundPath, Buffer.from('not a real png'))

  const store = new DSStore()
  store.setIconSize(96)
  store.setWindowPos(20, 30)
  store.setWindowSize(400, 300)
  store.setBackgroundPath(backgroundPath, { volumeName: 'Test Volume' })

  await store.write(storePath)

  const entries = readEntries(await fs.readFile(storePath))
  const viewOptions = entries.find((entry) => entry.filename === '.' && entry.structureId === 'icvp')

  t.truthy(viewOptions)
  t.is(viewOptions.blob.subarray(4, 12).toString('ascii'), 'bplist00')
})

function createSampleStore () {
  const store = new DSStore()

  store.setIconSize(128)
  store.setWindowPos(100, 120)
  store.setWindowSize(640, 480)
  store.setIconPos('My App.app', 140, 120)
  store.setIconPos('Applications', 420, 120)
  store.setBackgroundColor(1, 0.5, 0)
  store.vSrn(1)

  return store
}

async function createTempDir (t) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-store-'))

  t.teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  return tmpDir
}

async function createTempPath (t) {
  return path.join(await createTempDir(t), '.DS_Store')
}

function readEntries (buf) {
  const count = buf.readUInt32BE(4104)
  const entries = []
  let offset = 4108

  for (let i = 0; i < count; i += 1) {
    const filenameLength = buf.readUInt32BE(offset)
    offset += 4

    const filename = readUtf16BE(buf.subarray(offset, offset + (filenameLength * 2)))
    offset += filenameLength * 2

    const structureId = buf.subarray(offset, offset + 4).toString('ascii')
    offset += 4

    const dataType = buf.subarray(offset, offset + 4).toString('ascii')
    offset += 4

    let blob
    if (dataType === 'blob') {
      const blobLength = buf.readUInt32BE(offset)
      blob = buf.subarray(offset, offset + 4 + blobLength)
      offset += 4 + blobLength
    } else if (dataType === 'long') {
      blob = buf.subarray(offset, offset + 4)
      offset += 4
    } else {
      throw new Error('Unsupported test data type: ' + dataType)
    }

    entries.push({ filename, structureId, dataType, blob })
  }

  return entries
}

function readUtf16BE (buf) {
  const littleEndian = Buffer.from(buf)

  for (let i = 0; i < littleEndian.length; i += 2) {
    const value = littleEndian[i]
    littleEndian[i] = littleEndian[i + 1]
    littleEndian[i + 1] = value
  }

  return littleEndian.toString('ucs2')
}

function sha256 (buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function eventually (assertion) {
  let lastError

  for (let i = 0; i < 20; i += 1) {
    try {
      await assertion()
      return
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  throw lastError
}
