# tnote

[![Build Status](https://travis-ci.org/jesusprubio/tnote.svg?branch=master)](https://travis-ci.org/jesusprubio/tnote)

:ledger: A nodern presentation engine :zap:

Following the [KISS principle](https://en.wikipedia.org/wiki/KISS_principle) we use Markdown as slides syntax and Git for collaboration.

[![asciicast](https://asciinema.org/a/56tuhe0no7yltmn9e0tlj2kr8.png)](https://asciinema.org/a/56tuhe0no7yltmn9e0tlj2kr8)

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

```txt
  Usage: bin [options] [slides]
        "slides": path or URI to the slides markdown file

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -n, --notes              show also the speaker notes
    -k, --keys               show key shortcuts
    -w, --width <width>      set the width in px, use 0 for 100% [80]
    -s, --social <interval>  set the time to re-calculate social network metrics, use 0 for disable [600]
```

```sh
# Run the demo.
tnote

# Start a presentation.
tnote slides.md

# A remote hosted one.
tnote https://raw.githubusercontent.com/jesusprubio/tnote/master/example/demo.md
```

## Contributing

:sunglasses: If you'd like to help please check [this](https://github.com/IBMResearch/backend-development-guide).
