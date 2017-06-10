#!/usr/bin/env node

/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const path = require('path');
const fs = require('fs');

const program = require('commander');
const download = require('download');

const tnote = require('../');
const utils = require('../lib/utils');
const logger = require('../lib/logger');

const readFile = utils.promise.promisify(fs.readFile);
const dbg = utils.dbg(__filename);
const defaults = {
  // Strings to be consistent with what commander returns.
  width: '80',
  // Each 10 minutes.
  social: '600',
};

// TODO: Add fortune (and other providers) (optional) support in the cover/at the end.

dbg('Starting the CLI ...');

program
  .version(tnote.version)
  .usage('[options] [slides]\n\t"slides": path or URI to the slides markdown file')
  .option('-n, --notes', 'show also the speaker notes')
  .option('-k, --keys', 'show key shortcuts')
  .option(
    '-w, --width <width>',
    `set the width in px, use 0 for 100% [${defaults.width}]`,
    // We prefer custom error reporting.
    // parseInt,
    null,
    // To keep compatibility with node < v8
    // eslint-disable-next-line comma-dangle
    defaults.width
  )
  .option(
    '-s, --social <interval>',
    `set the time to re-calculate social network metrics, use 0 for disable [${defaults.social}]`,
    null,
    // eslint-disable-next-line comma-dangle
    defaults.social
  )
  .parse(process.argv);


dbg('Checking the parameters ...', program);

// TODO: Move to the lib?
if (program.keys) {
  logger.json(tnote.shortcuts);
  process.exit();
}

// By default we want width limit.
const opts = {
  reflowText: true,
  notes: program.notes || false,
};

if (program.width) {
  try {
    opts.width = parseInt(program.width, 10);
    if (opts.width === 0) { opts.reflowText = false; }
  } catch (err) {
    logger.error('The "width" parameter should be an integer, ommitted');
    process.exit(1);
  }
}

if (program.social) {
  try {
    opts.social = parseInt(program.social, 10);
  } catch (err) {
    logger.error('The "social" parameter should be an integer, ommitted');
    process.exit(1);
  }
} else {
  opts.social = parseInt(defaults.social, 10);
}

let getSlides = readFile;
let pathSlides = path.resolve(__dirname, '../example/demo.md');
if (!utils.isEmpty(program.args)) {
  if (program.args[0].match(/^http(s)?:/)) {
    dbg('Remote slides passed');
    getSlides = download;
    pathSlides = program.args[0];
  } else {
    pathSlides = path.resolve(process.cwd(), program.args[0]);
  }
}

dbg(`${logger.emoji('mag')} Getting the slides: ${pathSlides}, opts`, opts);

// TODO: Use an iterator for slides (in case of huge presentations)
getSlides(pathSlides, { encoding: 'utf8' })
.then((slides) => {
  logger.info(`\n${logger.emoji('computer')} Starting the show ...`);

  try {
    logger.time();
    tnote.start(slides, opts);
  } catch (err) {
    logger.error('During the show');
    logger.error(err);
    process.exit(1);
  }
})
.catch((err) => {
  logger.error(`Reading the slides file: ${pathSlides}`, err);
  process.exit(1);
});
