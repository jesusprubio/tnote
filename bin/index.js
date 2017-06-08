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

const tnote = require('../');
const utils = require('../lib/utils');
const logger = require('../lib/logger');

const readFile = utils.promise.promisify(fs.readFile);
const dbg = utils.dbg(__filename);
const defaults = {
  // strings to be consistent with what commander returns.
  width: '80',
};

dbg('Starting the CLI ...');

program
  .version(tnote.version)
  .usage('[options] [filePath]')
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
  .parse(process.argv);


dbg('Checking the parameters ...', program);

// TODO: Move to the lib?
if (program.keys) {
  logger.json(tnote.shortcuts);
  process.exit();
}

let pathSlides = path.resolve(__dirname, '../example/demo.md');
if (!utils.isEmpty(program.args)) {
  pathSlides = path.resolve(process.cwd(), program.args[0]);
}

// By default we want width limit.
const opts = { reflowText: true, notes: program.notes || false };

if (program.width) {
  let width;

  try {
    width = parseInt(program.width, 10);
  } catch (err) {
    logger.error('The "width" parameter should be an integer, ommitted');
    process.exit(1);
  }

  opts.width = width;
  if (width === 0) { opts.reflowText = false; }
}

dbg(`${logger.emoji('mag')} Reading the slides: ${pathSlides}, opts`, opts);
// TODO: Use an iterator for slides (in case of huge presentations)
readFile(pathSlides, { encoding: 'utf8' })
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
