/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const keypress = require('keypress');
const cheerio = require('cheerio');
const rp = require('request-promise-native');

const utils = require('./lib/utils');
const logger = require('./lib/logger');
const version = require('./package.json').version;


const eventName = 'keypress';
const dbg = utils.dbg(__filename);
const uriBase = 'https://twitter.com/';
let author;
let followers;


// TODO: Move keys setup to a config file.
const shortcuts = {
  quit: ['ESC', 'q'],
  reset: 'r',
  next: ['right', 'n', 'return', 'space'],
  prev: ['left', 'backspace'],
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
    } else if (line && utils.isString(line)) {
      if (line.match(/^Author:/g)) {
        author = line.slice(8).trim();
        dbg(`Author found: ${author}`);
      }
      if (line.match(/^Note(s)?:/g)) {
        dbg(`Note found: ${line}`);
        notesStarted = true;
        // "join" in case of: "Notes: whatever :otherthing""
        notes = `${notes}${line.split(':').slice(1).join(':').trim()}\n`;
      } else {
        data = `${data}\n${line}\n`;
      }
    }
  });

  logger.clear();
  logger.regular(marked(data));

  if (withNotes && !utils.isEmpty(notes)) {
    logger.bold('\nnotes\n'.toUpperCase());
    logger.regular(marked(notes));
  }
}


function getFollowers(username) {
  return new Promise((resolve, reject) => {
    const options = {
      uri: uriBase + username,
      transform: body => cheerio.load(body),
    };

    rp(options)
    .then(ch => resolve(ch('.ProfileNav-value')[2].attribs['data-count']))
    .catch(err => reject(err));
  });
}


function printSocial(exit) {
  getFollowers(author)
  .then((total) => {
    logger.regular(`\nfollowers: ${total} (${followers})`);
    const rate = Math.round((total - followers) * (100 / followers));
    let ratePrint = rate;

    if (ratePrint > 0) { ratePrint = `+${rate}`; }

    let emoticon = 'disappointed';

    // TODO: Sentiment analisys with a hashtag (parsed from the cover)
    // Local server: https://www.npmjs.com/package/sentiment
    // Twitter: https://www.npmjs.com/package/twitter-sentiment

    // TODO: Refactor this to abstract a cfg file.
    if (rate > 1000) {
      emoticon = 'hear_no_evil';
    } else if (rate > 500) {
      emoticon = 'speak_no_evil';
    } else if (rate > 200) {
      emoticon = 'rocket';
    } else if (rate > 100) {
      emoticon = 'heart_eyes';
    } else if (rate > 75) {
      emoticon = 'innocent';
    } else if (rate > 50) {
      emoticon = 'kissing_heart';
    } else if (rate > 25) {
      emoticon = 'sunglasses';
    } else if (rate > 10) {
      emoticon = 'stuck_out_tongue"';
    } else if (rate > 5) {
      emoticon = 'wink';
    } else if (rate > 0) {
      emoticon = 'smile';
    }

    logger.info(`rate: ${ratePrint}% ${logger.emoji(emoticon)}`);

    if (exit) { process.exit(0); }
  })
  .catch((err) => {
    logger.error('Getting followers', err);
    if (exit) { process.exit(0); }
  });
}


module.exports.version = version;


module.exports.shortcuts = shortcuts;


// "slides" is a string.
module.exports.start = (slidesAll, opts = {}) => {
  dbg('Show started');

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
  printSlide(slides[index], opts.notes);

  dbg('Getting user social info (init) ...');
  if (author && opts.social) {
    getFollowers(author)
    .then((total) => {
      followers = total;
      logger.info(`\nfollowers: ${total}`);
    })
    .catch(err => logger.error('Getting Twitter followers', err));
  }

  // Each 10 minutes by default.
  let socialPrinter;
  if (opts.social) {
    socialPrinter = setInterval(printSocial, opts.social * 1000);
  }

  process.stdin.on(eventName, (ch, key) => {
    // To allow ctrl+c.
    if (key && key.ctrl && key.name === 'c') {
      process.stdin.pause();
      clearInterval(socialPrinter);
    }

    // We're only interested in keys.
    if (key && key.name) {
      if (utils.includes(shortcuts.quit, key.name)) {
        logger.bold('Presentation stopped');
        logger.timeEnd();
        clearInterval(socialPrinter);
        process.exit(0);
      } else {
        if (utils.includes(shortcuts.next, key.name)) {
          dbg('Next slide requested');
          index += 1;

          if (!slides[index]) {
            clearInterval(socialPrinter);
            logger.bold(`\n${logger.emoji('wave')} Done, see you!\n`);
            logger.timeEnd();

            if (followers) {
              // dbg('Getting user info (end) ...');
              printSocial(true);
            } else {
              process.exit(0);
            }
          }
        } else if (utils.includes(shortcuts.prev, key.name)) {
          dbg('Previous slides requested');

          // We don't want less than 0 (cover).
          if (index > 0) { index -= 1; }
        } else if (key.name === shortcuts.reset) {
          dbg('Presentation reset requested');
          index = 0;
        }

        // To cover the case of the last poing (once the end info has been printed).
        if (slides[index]) {
          dbg(`Showing requested slide: ${index}`);
          printSlide(slides[index], opts.notes);
        }
      }
    }
  });

  dbg('Starting key capture');
  process.stdin.setRawMode(true);
  process.stdin.resume();
};
