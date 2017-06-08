/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const keypress = require('keypress');

const utils = require('./lib/utils');
const logger = require('./lib/logger');
const version = require('./package.json').version;


const eventName = 'keypress';
const dbg = utils.dbg(__filename);


// TODO: Move keys setup to a config file.
const shortcuts = {
  quit: ['ESC', 'q'],
  reset: 'r',
  next: ['right', 'n', 'return', 'space'],
  prev: 'left',
};

// TODO: Add PDF support


// Make `process.stdin` begin emitting "keypress" events.
keypress(process.stdin);


function printSlide(content, withNotes) {
  let data = '';
  let notes = '';
  let notesStarted = false;

  const lines = utils.split(content, '\n');

  utils.each(lines, (line) => {
    if (notesStarted) {
      notes = `${notes}\n${line}\n`;
    } else if (line && utils.isString(line) &&
              line[0] && line[0] === 'N' &&
              line[1] && line[1] === 'o' &&
              line[2] && line[2] === 't' &&
              line[3] && line[3] === 'e' &&
              (line[4] && utils.includes([':', 's'], line[4]))) {
      dbg(`Note found: ${line}`);
      notesStarted = true;
      notes = `${notes}${line.slice(6)}\n`;
    } else {
      data = `${data}\n${line}\n`;
    }
  });

  logger.clear();
  logger.regular(marked(data));

  if (withNotes && !utils.isEmpty(notes)) {
    logger.bold('\nnotes\n'.toUpperCase());
    logger.regular(marked(notes));
  }
}


module.exports.version = version;


module.exports.shortcuts = shortcuts;


// "slides" is a string.
module.exports.start = (slidesAll, opts = {}) => {
  dbg('Show started');
  const withNotes = opts.notes || false;

  marked.setOptions({
    // https://github.com/chjj/marked#options-1
    renderer: new TerminalRenderer({
      // https://github.com/mikaelbr/marked-terminal#options
      width: opts.width || 80,
      reflowText: opts.reflowText || false,
      // tab: opts.tab || 3,
    }),
  });
  const slides = slidesAll.split('\n---\n');

  if (!utils.isArray(slides)) {
    logger.error('Can\'t read the slides');
    process.exit(1);
  }

  if (utils.isEmpty(slides)) {
    logger.error('Empty slides');
    process.exit(1);
  }

  dbg('Printing the first slide ...');
  // Presentation position.
  let index = 0;
  printSlide(slides[index], withNotes);

  process.stdin.on(eventName, (ch, key) => {
    // To allow ctrl+c.
    if (key.ctrl && key.name === 'c') { process.stdin.pause(); }

    // We're only interested in keys.
    if (key.name) {
      if (utils.includes(shortcuts.quit, key.name)) {
        logger.bold('Presentation stopped');
        logger.timeEnd();
        process.exit(0);
      } else {
        if (utils.includes(shortcuts.next, key.name)) {
          dbg('Next slide requested');
          index += 1;

          if (!slides[index]) {
            logger.bold(`\n${logger.emoji('wave')} Presentation finished, see you!\n`);
            logger.timeEnd();
            process.exit(0);
          }
        } else if (key.name === shortcuts.prev) {
          dbg('Previous slides requested');

          // We don't want less than 0 (cover).
          if (index > 0) { index -= 1; }
        } else if (key.name === shortcuts.reset) {
          dbg('Presentation reset requested');
          index = 0;
        }
        dbg(`Showing next slide: ${index}`);
        printSlide(slides[index], withNotes);
      }
    }
  });

  dbg('Starting key capture');
  process.stdin.setRawMode(true);
  process.stdin.resume();
};
