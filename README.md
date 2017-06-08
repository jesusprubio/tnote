# tnote

[![Build Status](https://travis.org/jesusprubio/tnote.svg?branch=master)](https://travis.org/jesusprubio/tnote)

:spiral_note_pad: [KISS](https://en.wikipedia.org/wiki/KISS_principle) presentations in the terminal :zap:

[![asciicast](https://asciinema.org/a/123964.png)](https://asciinema.org/a/123964)

## Markdown

We use the same syntax that [reveal.js](http://lab.hakim.se/reveal-js) and [reveal-md](https://github.com/webpro/reveal-md). You can check [the demo example](./example/demo.md).

## Install

:eyes: Install the last [Node.js](https://nodejs.org/download) stable version and then:

```sh
npm i -g tnote
```

### Android

- Install [Termux](https://play.google.com/store/apps/details?id=com.termux).
- Upgrade the system and install Node:

```sh
apt update && apt upgrade
apt install nodejs
npm i -g tnote
```

## Use

:rocket: The `--help` output and a quick example:

```sh
  Usage: tnote [options] <filePath>

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -n, --notes          show also the speaker notes
    -k, --keys           show key shortcuts
    -w, --width <width>  set the width in px, use 0 for 100% [80]
```

```sh
# Run the demo.
tnote

# Start a presentation.
tnote slides.md
```

## Contributing

:sunglasses: If you'd like to help please check [this](https://github.com/IBMResearch/backend-development-guide).
