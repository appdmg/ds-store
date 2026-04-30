# @appdmg/ds-store

`.DS_Store` creation for appdmg packages.

This package is a CommonJS Node.js 24+ modernization of the original
`ds-store` package used by `node-appdmg`. It keeps the appdmg-facing API while
moving the maintained package under the `@appdmg` npm scope.

## Status

Currently the implementation uses a pre-created `.DS_Store` file
which it then modifies to suit the needs. This places several
limitations and also only allows creating new files from scratch.

## Installation

```sh
npm install @appdmg/ds-store
```

## Usage

```javascript
const DSStore = require('@appdmg/ds-store')

async function main () {
  const file = new DSStore()

  file.setWindowPos(100, 100)
  file.setWindowSize(640, 480)
  file.setIconSize(128)
  file.setIconPos('Example.app', 140, 120)
  file.setIconPos('Applications', 420, 120)

  await file.write('/Volumes/Example/.DS_Store')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
```

## API

### file.setBackgroundPath(path)

Set the background image to file specified by `path`.

On non-Darwin platforms, pass `{ volumeName: 'Volume Name' }` as the second
argument when using background image aliases. The native macOS volume lookup is
not available there.

### file.setBackgroundColor(red, green, blue)

Set the background color to the color specified by three floats between 0 and 1.

### file.setIconSize(size)

Set the size of all icons in the folder to `size`.

### file.setIconPos(name, x, y)

Position a file icon for file named `name` at `x, y`.

### file.setWindowPos(x, y)

Set the Finder window position to `x, y`.

### file.setWindowSize(w, h)

Set the Finder window size to `w, h`.

### file.vSrn(value)

Set the `vSrn` value to either `0` or `1`.

Effect currently unknown.

### file.write(path, cb)

Write the `.DS_Store` information to file at `path`.

`cb` will get called with `err` upon file creation.

### await file.write(path)

Promise-based equivalent of `file.write(path, cb)`.

The callback form remains supported for existing appdmg callers.

## Future

I have started work on a Buddy Allocator and B-Tree implementation,
but there is still lots of work required. Having theese would make
it easy to both read and manipulate files. It also wouldn't require
shipping a `DSStore-clean` file.

## Thanks

A special thanks to Wim Lewis who have written a complete implementation
in perl. His documentation of the file format helped me very much.

http://search.cpan.org/~wiml/Mac-Finder-DSStore/DSStoreFormat.pod
