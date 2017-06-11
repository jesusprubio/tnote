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
const keypress = require('keypress');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

const Tnote = require('../');
const utils = require('../lib/utils');
const logger = require('../lib/logger');
const cfg = require('./cfg');

const readFile = utils.promise.promisify(fs.readFile);
const dbg = utils.dbg(__filename);
const defaults = {
  // Strings to be consistent with what commander returns.
  width: 80,
  // Each 10 minutes.
  social: 600,
};
const eventName = 'keypress';

// Make `process.stdin` begin emitting "keypress" events.
keypress(process.stdin);


function printSlide(slide, withNotes) {
  logger.clear();
  logger.regular(marked(slide.data));

  if (withNotes && slide.notes && !utils.isEmpty(slide.notes)) {
    logger.bold('\nnotes\n'.toUpperCase());
    logger.regular(marked(slide.notes));
  }
}


function printSocial(metrics) {
  let msg = `\nfollowers: ${metrics.followers}`;

  if (metrics.followersInit) { msg = `${msg} (${metrics.followersInit})`; }
  logger.regular(msg);

  if (!metrics.rate) { return; }

  let emoticon = 'disappointed';
  let ratePrint;

  if (metrics.rate > 0) {
    ratePrint = `+${metrics.rate}`;
  } else {
    ratePrint = metrics.rate.toString();
  }

  // TODO: Refactor this to abstract in a cfg file.
  if (metrics.rate > 1000) {
    emoticon = 'hear_no_evil';
  } else if (metrics.rate > 500) {
    emoticon = 'speak_no_evil';
  } else if (metrics.rate > 200) {
    emoticon = 'rocket';
  } else if (metrics.rate > 100) {
    emoticon = 'heart_eyes';
  } else if (metrics.rate > 75) {
    emoticon = 'innocent';
  } else if (metrics.rate > 50) {
    emoticon = 'kissing_heart';
  } else if (metrics.rate > 25) {
    emoticon = 'sunglasses';
  } else if (metrics.rate > 10) {
    emoticon = 'stuck_out_tongue"';
  } else if (metrics.rate > 5) {
    emoticon = 'wink';
  } else if (metrics.rate > 0) {
    emoticon = 'smile';
  }

  logger.info(`rate: ${ratePrint}% ${logger.emoji(emoticon)}`);
}

const show = new Tnote();
dbg('Starting the CLI ...');
program
  .version(show.version)
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
    'set the time to re-calculate social network metrics' +
    ` (in seconds), use 0 for disable [${defaults.social}]`,
    null,
    // eslint-disable-next-line comma-dangle
    defaults.social
  )
  .parse(process.argv);


dbg('Checking the parameters ...', program);

if (program.keys) {
  logger.json(cfg.shortcuts);
  process.exit();
}

// By default we want width limit.
let reflowText = true;
let width = defaults.width;

if (program.width) {
  try {
    width = parseInt(program.width, 10);
    if (width === 0) { reflowText = false; }
  } catch (err) {
    logger.error('The "width" parameter should be an integer, ommitted');
    process.exit(1);
  }
}

// https://github.com/chjj/marked#options-1
marked.setOptions({
  // https://github.com/mikaelbr/marked-terminal#options
  renderer: new TerminalRenderer({ width, reflowText }),
});

let social = defaults.social;

if (program.social) {
  try {
    social = parseInt(program.social, 10);
  } catch (err) {
    logger.error('The "social" parameter should be an integer, ommitted');
    process.exit(1);
  }
}

const socialInit = social;
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

logger.regular(`${logger.emoji('mag')} Getting the slides: ${pathSlides}`);

let notes = program.notes || false;
let socialPrinter;
// Sometimes we need a reprint.
let contentLast;

function socialEnable() {
  // To print them in the cover after the init.
  show.metrics()
  .then(metrics => printSocial(metrics))
  .catch(err => logger.error('Getting metrics (init)', err));

  socialPrinter = setInterval(
    () => {
      // We need another check because the user can it in run time.
      if (social) {
        show.metrics()
        .then(metrics => printSocial(metrics))
        .catch(err => logger.error('Getting metrics (interval)', err));
      }
    },
    // eslint-disable-next-line comma-dangle
    social * 1000
  );
}

// TODO: Use an iterator for slides (in case of huge presentations)
getSlides(pathSlides, { encoding: 'utf8' })
.then((slidesContent) => {
  logger.regular(`\n${logger.emoji('computer')} Starting the show ...`);

  try {
    logger.time();
    // Printing the cover.
    contentLast = show.start(slidesContent);
    printSlide(contentLast, notes);

    // Social metrics interval print.
    // We need this promise to finish because the author is parsed from the cover.
    if (social) { socialEnable(); }
  } catch (err) {
    logger.error('Starting the show');
    logger.error(err);
    process.exit(1);
  }
})
.catch((err) => {
  logger.error(`Reading the slides file: ${pathSlides}`, err);
  process.exit(1);
});


let stopping = false;

// Key capture.
process.stdin.on(eventName, (ch, key) => {
  // To allow ctrl+c.
  if (key && key.ctrl && key.name === 'c') {
    process.stdin.pause();
    clearInterval(socialPrinter);
  }

  // We're only interested in keys.
  if (key && key.name) {
    if (utils.includes(cfg.shortcuts.quit, key.name)) {
      logger.bold('Presentation stopped');
      logger.timeEnd();
      clearInterval(socialPrinter);
      process.exit();
    }

    let contentNext;
    // TODO: Abstract this, too much ifs.
    if (utils.includes(cfg.shortcuts.next, key.name)) {
      dbg('Next slide requested');
      contentNext = show.next();

      if (!contentNext && !stopping) {
        stopping = true;
        clearInterval(socialPrinter);
        logger.bold(`\n${logger.emoji('wave')} Done, see you!\n`);
        logger.timeEnd();

        if (social) {
          dbg('Getting metrics (end) ...');
          show.metrics()
          .then((metrics) => {
            printSocial(metrics);
            process.exit();
          })
          .catch((err) => {
            logger.error('Getting metrics (end)', err);
            process.exit();
          });
        } else {
          process.exit();
        }
      }
    } else if (utils.includes(cfg.shortcuts.prev, key.name)) {
      dbg('Previous slides requested');
      contentNext = show.prev();
    } else if (key.name === cfg.shortcuts.reset) {
      dbg('Presentation reset requested');
      contentNext = show.reset();
    } else if (key.name === cfg.shortcuts.notes) {
      dbg('Notes enable/disable requested');
      contentNext = contentLast;
      notes = !notes;
    } else if (key.name === cfg.shortcuts.social) {
      dbg('Social metrics enable/disable requested');

      if (social) {
        social = 0;
        clearInterval(socialPrinter);
      } else {
        social = socialInit;
        socialEnable();
      }
    }

    // To cover the case of the last poing (once the end info has been printed).
    if (contentNext) {
      contentLast = contentNext;
      dbg('Showing requested slide');
      printSlide(contentNext, notes);
    }
  }
});

dbg('Starting key capture');
process.stdin.setRawMode(true);
process.stdin.resume();
